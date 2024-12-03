import { getUnQualifiedDidIndyDid } from '@credo-ts/anoncreds'
import axios from 'axios'
import { CachesDirectoryPath, readFile, writeFile, exists, mkdir, unlink } from 'react-native-fs'

import {
  ocaBundleStorageDirectory,
  ocaCacheDataFileName,
  defaultBundleIndexFileName,
  defaultBundleLanguage,
} from '../../constants'
import { IOverlayBundleData } from '../../interfaces'
import { BaseOverlay, BrandingOverlay, LegacyBrandingOverlay, OverlayBundle } from '../../types'
import { generateColor } from '../../utils'

import { BrandingOverlayType, DefaultOCABundleResolver, Identifiers, OCABundle, OCABundleResolverOptions } from './oca'

export interface RemoteOCABundleResolverOptions extends OCABundleResolverOptions {
  indexFileName?: string
  verifyCacheIntegrity?: boolean
}

type BundleIndexEntry = {
  path: string
  sha256: string
}

type BundleIndex = {
  [key: string]: BundleIndexEntry
}

enum OCABundleQueueEntryOperation {
  Add = 'add',
  Remove = 'remove',
}

type OCABundleQueueEntry = {
  sha256: string
  operation: OCABundleQueueEntryOperation
}

type CacheDataFile = {
  indexFileEtag: string

  updatedAt: Date
}

export class RemoteOCABundleResolver extends DefaultOCABundleResolver {
  protected indexFile: BundleIndex = {}
  private axiosInstance: axios.AxiosInstance
  private cacheDataFileName = ocaCacheDataFileName
  private indexFileName: string
  private _indexFileEtag?: string

  constructor(indexFileBaseUrl: string, options?: RemoteOCABundleResolverOptions) {
    super({}, options)

    this.indexFileName = options?.indexFileName || defaultBundleIndexFileName
    this.axiosInstance = axios.create({
      baseURL: indexFileBaseUrl,
    })
  }

  /**
   * Sets the value of the index file ETag.
   *
   * @param value - The new value for the index file ETag.
   */
  set indexFileEtag(value: string) {
    if (!value) {
      return
    }

    this._indexFileEtag = value
    this.saveCacheData({
      indexFileEtag: value,
      updatedAt: new Date(),
    }).catch((error) => {
      this.log?.error(`Failed to save cache data, ${error}`)
    })
  }

  /**
   * Gets the ETag of the index file.
   *
   * @returns The ETag of the index file, or an empty string if not available.
   */
  get indexFileEtag(): string {
    return this._indexFileEtag || ''
  }

  /**
   * Checks for updates in the OCA (Overlay Capture Architecture) index.
   * If the index file ETag is not available, it loads the cache data and retrieves the ETag from it.
   * Then, it loads the OCA index.
   * @returns A promise that resolves when the update check is complete.
   */
  public async checkForUpdates(): Promise<void> {
    await this.createWorkingDirectoryIfNotExists()

    if (!this.indexFileEtag) {
      this.log?.info('Loading cache data')

      const cacheData = await this.loadCacheData()
      if (cacheData) {
        this.indexFileEtag = cacheData.indexFileEtag
      }
    }

    this.log?.info('Loading OCA index now')
    await this.loadOCAIndex(this.indexFileName)
  }

  /**
   * Loads the cache data from the local storage.
   * @returns A promise that resolves to the cache data file, or undefined if the cache file does not exist or cannot be loaded.
   */
  private loadCacheData = async (): Promise<CacheDataFile | undefined> => {
    const cacheFileExists = await this.checkFileExists(this.cacheDataFileName)
    if (!cacheFileExists) {
      return
    }

    const data = await this.loadFileFromLocalStorage(this.cacheDataFileName)
    if (!data) {
      return
    }

    const cacheData: CacheDataFile = JSON.parse(data)

    return cacheData
  }

  /**
   * Saves the cache data to local storage.
   *
   * @param cacheData - The cache data to be saved.
   * @returns A promise that resolves to a boolean indicating whether the save operation was successful.
   */
  private saveCacheData = async (cacheData: CacheDataFile): Promise<boolean> => {
    const cacheDataAsString = JSON.stringify(cacheData)

    return this.saveFileToLocalStorage(this.cacheDataFileName, cacheDataAsString)
  }

  /**
   * Processes the queue of OCABundleQueueEntry items.
   *
   * @param items - An array of OCABundleQueueEntry items to process.
   * @returns A promise that resolves to an array of processed OCABundleQueueEntry items.
   */
  private processQueue = async (items: Array<OCABundleQueueEntry>): Promise<OCABundleQueueEntry[]> => {
    const processed = Array<OCABundleQueueEntry>()
    const operations = []

    for (const q of items) {
      const hash = q.sha256

      this.log?.info(`Processing op ${q.operation} for ${hash}`)

      switch (q.operation) {
        case OCABundleQueueEntryOperation.Add:
          {
            const path = this.findPathBySha256(hash)
            if (!path) {
              continue
            }
            operations.push(this.fetchOCABundle(path))
          }
          break
        case OCABundleQueueEntryOperation.Remove:
          operations.push(this.removeFileFromLocalStorage(hash))
          break
      }
    }

    try {
      // Check which operations were successful, and remove them from
      // the queue.
      const settled = await Promise.allSettled(operations)
      for (const i in settled) {
        if (settled[i].status === 'fulfilled') {
          processed.push(items[i])
        }
      }

      return Array.from(processed) ?? []
    } catch (error) {
      this.log?.error(`Failed to process some operations, ${error}`)

      return []
    }
  }

  /**
   * Prepares the bundle queue based on the new and old index files.
   * It compares the SHA256 hashes of the files in the new and old index files
   * and determines which files should be removed and which files should be added
   * to the bundle queue.
   *
   * @param newIndexFile - The new bundle index file.
   * @param oldIndexFile - The old bundle index file.
   * @returns An array of `OCABundleQueueEntry` objects representing the files to be removed and added.
   */
  private prepareBundleQueue = (newIndexFile: BundleIndex, oldIndexFile: BundleIndex): Array<OCABundleQueueEntry> => {
    const oldIndexItemHashes = [...new Set(Object.keys(oldIndexFile).map((key) => oldIndexFile[key].sha256))]
    const newIndexItemHashes = [...new Set(Object.keys(newIndexFile).map((key) => newIndexFile[key].sha256))]

    // if the SHA256 is in the old index file but not in
    // the new index file, it should be removed.
    const hashesToRemove = oldIndexItemHashes
      .filter((hash) => !newIndexItemHashes.includes(hash))
      .map((hash) => ({
        sha256: hash,
        operation: OCABundleQueueEntryOperation.Remove,
      }))

    // if the SHA256 is in the new index file but not in
    // the old index file, it should be added.
    const hashesToAdd = newIndexItemHashes
      .filter((hash) => !oldIndexItemHashes.includes(hash))
      .map((hash) => ({
        sha256: hash,
        operation: OCABundleQueueEntryOperation.Add,
      }))

    this.log?.info(`Files to remove ${hashesToRemove.length}, add ${hashesToAdd.length}`)

    return [...hashesToRemove, ...hashesToAdd]
  }

  /**
   * Finds the SHA-256 hash associated with a given path in the index file.
   *
   * @param {string} path - The path to search for in the index file.
   * @returns {string | null} The SHA-256 hash associated with the path if found, or null if not found.
   */
  private findSha256ByPath = (path: string): string | null => {
    for (const key in this.indexFile) {
      if (this.indexFile[key].path === path) {
        return this.indexFile[key].sha256
      }
    }

    return null
  }

  /**
   * Finds the path associated with the given SHA256 hash in the index file.
   *
   * @param sha256 - The SHA256 hash to search for.
   * @returns The path associated with the SHA256 hash, or null if not found.
   */
  private findPathBySha256 = (sha256: string): string | null => {
    for (const key of Object.keys(this.indexFile)) {
      const hash = this.indexFile[key].sha256
      if (hash === sha256) {
        return this.indexFile[key].path
      }
    }

    return null
  }

  /**
   * Returns the file name for the bundle at the specified path.
   *
   * @param path - The path of the bundle.
   * @returns The file name for the bundle, or null if not found.
   */
  private fileNameForBundleAtPath = (path: string): string | null => {
    return this.findSha256ByPath(path)
  }

  /**
   * Returns the file storage path for the remote OCA resolver.
   * The file storage path is the concatenation of the `CachesDirectoryPath` and `ocaBundleStorageDirectory`.
   *
   * @returns The file storage path.
   */
  private fileStoragePath = (): string => {
    return `${CachesDirectoryPath}/${ocaBundleStorageDirectory}`
  }

  /**
   * Checks if a file exists at a specific path in the document directory.
   *
   * @param {string} fileName - The name of the file to check.
   * @returns {Promise<boolean>} A promise that resolves to true if the file exists, or false otherwise.
   * @throws Will throw an error if the existence check fails.
   */
  private checkFileExists = async (fileName: string): Promise<boolean> => {
    const pathToFile = `${this.fileStoragePath()}/${fileName}`

    try {
      const fileExists = await exists(pathToFile)
      this.log?.info(`File ${fileName} ${fileExists ? 'does' : 'does not'} exist at ${pathToFile}`)

      return fileExists
    } catch (error) {
      this.log?.error(`Failed to check existence of ${fileName} at ${pathToFile}`)
    }

    return false
  }

  /**
   * Creates a working directory if it does not already exist.
   *
   * @returns A promise that resolves to a boolean indicating whether the directory was created successfully.
   */
  private createWorkingDirectoryIfNotExists = async (): Promise<boolean> => {
    const workSpace = this.fileStoragePath()
    const pathDoesExist = await exists(workSpace)

    if (!pathDoesExist) {
      try {
        await mkdir(workSpace)
        return true
      } catch (error) {
        this.log?.error(`Failed to create directory ${workSpace}`)
        return false
      }
    }

    return true
  }

  /**
   * Saves a string of data to a file in the local storage.
   *
   * @param {string} fileName - The name of the file to save.
   * @param {string} data - The data to write to the file.
   * @returns {Promise<boolean>} A promise that resolves to true if the file was saved successfully, or false otherwise.
   * @throws Will throw an error if the write operation fails.
   */
  private saveFileToLocalStorage = async (fileName: string, data: string): Promise<boolean> => {
    const pathToFile = `${this.fileStoragePath()}/${fileName}`

    try {
      await writeFile(pathToFile, data, 'utf8')
      this.log?.info(`File ${fileName} saved to ${pathToFile}`)

      return true
    } catch (error) {
      this.log?.error(`Failed to save file ${fileName} to ${pathToFile}, ${error}`)
    }

    return false
  }

  /**
   * Loads a file from local storage.
   *
   * @param fileName - The name of the file to load.
   * @returns A promise that resolves to the contents of the file, or undefined if the file does not exist.
   */
  private loadFileFromLocalStorage = async (fileName: string): Promise<string | undefined> => {
    const pathToFile = `${this.fileStoragePath()}/${fileName}`

    try {
      const fileExists = await this.checkFileExists(fileName)
      if (!fileExists) {
        this.log?.warn(`Missing ${fileName} from ${pathToFile}`)

        return
      }

      const data = await readFile(pathToFile, 'utf8')
      this.log?.info(`File ${fileName} loaded from ${pathToFile}`)

      return data
    } catch (error) {
      this.log?.error(`Failed to load file ${fileName} from ${pathToFile}`)
    }
  }

  /**
   * Removes a file from the local storage.
   *
   * @param fileName - The name of the file to be removed.
   * @returns A promise that resolves to a boolean indicating whether the file was successfully removed.
   */
  private removeFileFromLocalStorage = async (fileName: string): Promise<boolean> => {
    const pathToFile = `${this.fileStoragePath()}/${fileName}`

    try {
      await unlink(pathToFile)
      return true
    } catch (error) {
      this.log?.error(`Failed to unlink file ${fileName} from ${pathToFile}`)
    }

    return false
  }

  /**
   * Fetches an OCA bundle from a remote resource and saves it to local storage.
   * @param path - The path of the remote resource.
   * @returns A promise that resolves to a boolean indicating whether the fetch and save operation was successful.
   */
  private fetchOCABundle = async (path: string): Promise<boolean> => {
    const response = await this.axiosInstance.get(path)
    const { status } = response

    if (status !== 200) {
      this.log?.error(`Failed to fetch remote resource at ${path}`)

      return false
    }

    const fileName = this.fileNameForBundleAtPath(path)
    if (!fileName) {
      this.log?.error(`Failed to determine file name ${fileName} for save`)

      return false
    }

    return this.saveFileToLocalStorage(fileName, JSON.stringify(response.data))
  }

  /**
   * Loads the OCA index from a remote location and processes it.
   * If the remote resource is not available, it falls back to the cached index file.
   * If the index file has not changed, it uses the existing data.
   * If the index file has changed, it refreshes the index file and the bundles.
   *
   * @param filePath - The path to the remote OCA index file.
   * @returns A Promise that resolves when the index file and bundles have been processed.
   * @throws If there is an error fetching or processing the OCA index.
   */
  private loadOCAIndex = async (filePath: string) => {
    try {
      const response = await this.axiosInstance.get(filePath)
      const { status } = response
      const { etag } = response.headers

      if (status !== 200) {
        this.log?.error(`Failed to fetch remote resource at ${filePath}`)
        // failed to fetch, use the cached index file
        // if available
        const data = await this.loadFileFromLocalStorage(filePath)
        if (data) {
          this.log?.info(`Using index file ${filePath} from cache`)
          this.indexFile = JSON.parse(data)
        }

        return
      }

      if (etag && etag === this.indexFileEtag) {
        this.log?.info(`Index file ${filePath} has not changed, etag ${etag}`)
        // etag is the same, no need to refresh
        this.indexFile = response.data

        const fetchMissingFiles = true
        const status = await this.verifyCacheIntegrity(fetchMissingFiles)
        if (!status) {
          this.log?.error(`Cache integrity broken, unable to re-fetch missing files`)
        }

        return
      }

      // etag is different, we need to refresh the
      // index file and the bundles.
      const items = this.prepareBundleQueue(response.data, this.indexFile)
      this.indexFile = response.data
      this.indexFileEtag = etag

      const processed = await this.processQueue(items)
      if (processed.length !== items.length) {
        this.log?.info(`Processed ${processed.length} items, expected ${items.length}`)
      }

      await this.saveFileToLocalStorage(filePath, JSON.stringify(this.indexFile))
    } catch (error) {
      this.log?.error(`Failed to fetch OCA index ${filePath}`)
    }
  }

  /**
   * Loads the OCABundle from the specified path.
   *
   * @param path - The path of the OCABundle.
   * @returns A promise that resolves to an array of IOverlayBundleData.
   */
  private loadOCABundle = async (path: string): Promise<IOverlayBundleData[]> => {
    // check if the file exists in the local storage
    // if it does, load it from there.
    const fileName = this.fileNameForBundleAtPath(path)
    if (!fileName) {
      this.log?.error(`Failed to determine file name ${fileName} for save`)
      return []
    }

    const cachedData = await this.loadFileFromLocalStorage(fileName)
    if (cachedData) {
      return JSON.parse(cachedData)
    }

    return []
  }

  /**
   * Finds a matching identifier in the index file based on the provided identifiers.
   * The order of the identifiers matters if more than one candidate exists in the index file.
   *
   * @param identifiers - The identifiers to match against the index file.
   * @returns The matching identifier, or undefined if no match is found.
   */
  private matchBundleIndexEntry = (identifiers: Identifiers): string | undefined => {
    const { schemaId, credentialDefinitionId, templateId } = identifiers
    // also check unqualified schema and cred def id's if qualified versions exist
    const unqualifiedSchemaId = schemaId?.startsWith('did:indy:') ? getUnQualifiedDidIndyDid(schemaId) : undefined
    const unqualifiedCredDefId = credentialDefinitionId?.startsWith('did:indy:')
      ? getUnQualifiedDidIndyDid(credentialDefinitionId)
      : undefined

    // If more than one candidate identifier exists in the index file then
    // order matters here.
    const candidates = [schemaId, unqualifiedSchemaId, credentialDefinitionId, unqualifiedCredDefId, templateId].filter(
      (value) => value !== undefined && value !== null && value !== ''
    )

    if (candidates.length === 0) {
      return undefined
    }

    const keys = Object.keys(this.indexFile)
    const identifier = candidates.find((c) => keys.includes(c!))

    return identifier
  }

  /**
   * Resolves the OCABundle based on the given parameters.
   * @param params - The parameters for resolving the OCABundle.
   * @param params.identifiers - The identifiers used to match the OCABundle.
   * @param params.language - The language of the OCABundle (optional).
   * @returns A Promise that resolves to the OCABundle or undefined.
   */
  public async resolve(params: {
    identifiers: Identifiers
    language?: string | undefined
  }): Promise<OCABundle | undefined> {
    const language = params.language || defaultBundleLanguage
    const identifier = this.matchBundleIndexEntry(params.identifiers)

    if (!identifier || !(identifier in this.bundles || identifier in this.indexFile)) {
      return Promise.resolve(undefined)
    }

    if (identifier in this.bundles) {
      return Promise.resolve(
        new OCABundle(this.bundles[identifier] as OverlayBundle, {
          ...this.options,
          language: language ?? this.options.language,
        })
      )
    }

    const bundlePath = this.indexFile[identifier]?.path

    if (!bundlePath) {
      return Promise.resolve(undefined)
    }

    try {
      const bundleData: IOverlayBundleData[] = await this.loadOCABundle(bundlePath)
      const overlayBundle = new OverlayBundle(params.identifiers.credentialDefinitionId ?? '', bundleData[0])
      const overlay = overlayBundle.overlays.find(
        (overlay) =>
          overlay.type === BrandingOverlayType.Branding01 ||
          overlay.type === BrandingOverlayType.Branding10 ||
          overlay.type === BrandingOverlayType.Branding11
      )

      if (!overlay) {
        overlayBundle.overlays.push(
          ...this.getFallbackBrandingOverlays(overlayBundle.credentialDefinitionId, overlayBundle.captureBase.digest)
        )
      }

      this.bundles[identifier] = overlayBundle

      return new OCABundle(overlayBundle, {
        ...this.options,
        language: language ?? this.options.language,
      })
    } catch (error) {
      // probably couldn't parse the overlay bundle.
      return Promise.resolve(undefined)
    }
  }

  /**
   * Retrieves the fallback branding overlays for a given credential definition ID and capture base.
   * @param credentialDefinitionId - The ID of the credential definition.
   * @param captureBase - The capture base for the overlays.
   * @returns An array of fallback branding overlays.
   */
  private getFallbackBrandingOverlays(credentialDefinitionId: string, captureBase: string): BaseOverlay[] {
    const legacyBrandingOverlay: LegacyBrandingOverlay = new LegacyBrandingOverlay(credentialDefinitionId, {
      capture_base: captureBase,
      type: BrandingOverlayType.Branding01,
      background_color: generateColor(credentialDefinitionId),
    })

    const brandingOverlay10: BrandingOverlay = new BrandingOverlay(credentialDefinitionId, {
      capture_base: captureBase,
      type: BrandingOverlayType.Branding10,
      primary_background_color: generateColor(credentialDefinitionId),
    })

    const brandingOverlay11: BrandingOverlay = new BrandingOverlay(credentialDefinitionId, {
      capture_base: captureBase,
      type: BrandingOverlayType.Branding11,
      primary_background_color: '#FFFFFF',
      secondary_background_color: generateColor(credentialDefinitionId),
    })

    return [legacyBrandingOverlay, brandingOverlay10, brandingOverlay11]
  }

  private async verifyCacheIntegrity(fetchMissing: boolean = false): Promise<boolean> {
    const indexItemHashes = [...new Set(Object.keys(this.indexFile).map((key) => this.indexFile[key].sha256))]
    const queue = []

    this.log?.info(`Checking bundle cache integrity`)

    for (const hash of indexItemHashes) {
      const fileName = this.fileNameForBundleAtPath(this.findPathBySha256(hash)!)
      if (!fileName) {
        continue
      }

      const fileExists = await this.checkFileExists(fileName)
      if (!fileExists) {
        this.log?.warn(`File ${fileName} does not exist, re-fetching`)
        queue.push({
          sha256: hash,
          operation: OCABundleQueueEntryOperation.Add,
        })
      }
    }

    if (queue.length === 0) {
      this.log?.info(`Cache integrity verified`)

      return true
    }

    if (queue.length > 0 && !fetchMissing) {
      this.log?.info(`Missing ${queue.length} files, cache broken`)

      return false
    }

    const processed = await this.processQueue(queue)

    if (processed.length !== queue.length) {
      this.log?.error(`Processed ${processed.length} items, expected ${queue.length}`)

      return false
    }

    this.log?.info(`Cache was broken, now fixed`)

    return true
  }
}
