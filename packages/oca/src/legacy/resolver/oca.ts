import startCase from 'lodash.startcase'

import { defaultBundleLanguage } from '../../constants'
import {
  IBrandingOverlayData,
  ILegacyBrandingOverlayData,
  IMetaOverlayData,
  IOverlayBundleData,
  IOverlayBundleMetadata,
} from '../../interfaces'
import {
  BaseOverlay,
  BrandingOverlay,
  CaptureBase,
  CharacterEncodingOverlay,
  FormatOverlay,
  LabelOverlay,
  LegacyBrandingOverlay,
  MetaOverlay,
  OverlayBundle,
  OverlayType,
} from '../../types'
import { generateColor } from '../../utils/color'
import { parseCredDefFromId } from '../../utils/credential-definition'

import { Field } from './record'

export enum BrandingOverlayType {
  Branding01 = OverlayType.Branding01,
  Branding10 = OverlayType.Branding10,
  Branding11 = OverlayType.Branding11,
}

export interface CredentialOverlay<T> {
  bundle?: OCABundle
  presentationFields?: Field[]
  metaOverlay?: MetaOverlay
  brandingOverlay?: T
}

export interface OCABundleType {
  get captureBase(): CaptureBase
  get metaOverlay(): MetaOverlay | undefined
  get labelOverlay(): LabelOverlay | undefined
  get formatOverlay(): FormatOverlay | undefined
  get characterEncodingOverlay(): CharacterEncodingOverlay | undefined
  get brandingOverlay(): BrandingOverlay | LegacyBrandingOverlay | undefined
  get metadata(): IOverlayBundleMetadata
}

interface LanguageOverlay {
  language: string
}

export type OCABundleResolveParams = {
  identifiers: Identifiers
  language?: string
}

export type OCABundleResolveDefaultParams = {
  identifiers: Identifiers
  meta?: Meta
  language?: string
}

export type OCABundleResolveAllParams = {
  identifiers: Identifiers
  attributes?: Array<Field>
  meta?: Meta
  language?: string
}

export type OCABundleResolvePresentationFieldsParams = {
  identifiers: Identifiers
  attributes: Array<Field>
  language?: string
}

export interface OCABundleResolverType {
  resolve(params: OCABundleResolveParams): Promise<OCABundle | undefined>

  resolveDefaultBundle(params: OCABundleResolveDefaultParams): Promise<OCABundle | undefined>

  presentationFields(params: OCABundleResolvePresentationFieldsParams): Promise<Field[]>

  resolveAllBundles(
    params: OCABundleResolveAllParams
  ): Promise<CredentialOverlay<BaseOverlay | BrandingOverlay | LegacyBrandingOverlay>>

  getBrandingOverlayType(): BrandingOverlayType
}

export interface OCABundleResolverOptions {
  language?: string
  brandingOverlayType?: BrandingOverlayType
}

export interface Identifiers {
  schemaId?: string
  credentialDefinitionId?: string
  templateId?: string
}

export interface Meta {
  alias?: string
  credName?: string
  credConnectionId?: string
}

export class OCABundle implements OCABundleType {
  private bundle: OverlayBundle
  private options: OCABundleResolverOptions

  public constructor(bundle: OverlayBundle, options?: OCABundleResolverOptions) {
    this.bundle = bundle
    this.options = {
      brandingOverlayType: options?.brandingOverlayType ?? BrandingOverlayType.Branding10,
      language: options?.language ?? defaultBundleLanguage,
    }
    // Make bundle overlay type come from options.brandingOverlayType
    this.bundle.overlays.forEach((o) => {
      if (o.type === BrandingOverlayType.Branding10 || o.type === BrandingOverlayType.Branding11) {
        o.type = this.options.brandingOverlayType!
      }
    })
  }

  public get captureBase(): CaptureBase {
    const overlay = this.bundle.captureBase

    if (!overlay) {
      throw new Error('Capture Base must be defined')
    }
    return overlay
  }

  public get characterEncodingOverlay(): CharacterEncodingOverlay | undefined {
    return this.getOverlay<CharacterEncodingOverlay>(OverlayType.CharacterEncoding10)
  }

  public get formatOverlay(): FormatOverlay | undefined {
    return this.getOverlay<FormatOverlay>(OverlayType.Format10)
  }

  public get labelOverlay(): LabelOverlay | undefined {
    return this.getOverlay<LabelOverlay>(OverlayType.Label10, this.options.language)
  }

  public get metaOverlay(): MetaOverlay | undefined {
    return this.getOverlay<MetaOverlay>(OverlayType.Meta10, this.options.language)
  }

  public get brandingOverlay(): BrandingOverlay | LegacyBrandingOverlay | undefined {
    return this.getOverlay(this.options?.brandingOverlayType || BrandingOverlayType.Branding10)
  }

  public buildOverlay(name: string, language: string): MetaOverlay {
    return new MetaOverlay({
      capture_base: '',
      type: OverlayType.Meta10,
      name,
      language,
      description: '',
      credential_help_text: '',
      credential_support_url: '',
      issuer: '',
      issuer_description: '',
      issuer_url: '',
    })
  }

  private getOverlay<T extends BaseOverlay>(type: string, language?: string): T | undefined {
    if (type === OverlayType.CaptureBase10) {
      return this.bundle.captureBase as unknown as T
    }
    if (language !== undefined) {
      // we want to return branding even if there isn't a bundle for a given language
      const overlay = this.bundle.overlays.find(
        (item) =>
          ((item as unknown as LanguageOverlay).language === undefined && item.type === type.toString()) ||
          (item.type === type.toString() && (item as unknown as LanguageOverlay).language === language)
      ) as T | undefined
      if (overlay) {
        return overlay
      }
    }
    return this.bundle.overlays.find((item) => item.type === type.toString()) as T
  }

  public get metadata(): IOverlayBundleMetadata {
    return this.bundle.metadata
  }
}

export class DefaultOCABundleResolver implements OCABundleResolverType {
  protected bundles: Record<string, OverlayBundle | string> = {}
  protected options: OCABundleResolverOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _log?: any

  public constructor(
    bundlesData: Record<string, IOverlayBundleData | string> = {},
    options?: OCABundleResolverOptions
  ) {
    for (const cid in bundlesData) {
      try {
        if (typeof bundlesData[cid] !== 'string') {
          this.bundles[cid] = new OverlayBundle(cid, bundlesData[cid] as IOverlayBundleData)
        } else {
          this.bundles[cid] = bundlesData[cid] as string
        }
      } catch (error) {
        // might get an error trying to parse javascript's default value
        this.log?.error(`Error parsing bundle for ${cid}`, error)
      }
    }

    this.options = {
      brandingOverlayType: options?.brandingOverlayType ?? BrandingOverlayType.Branding10,
      language: options?.language ?? defaultBundleLanguage,
    }
  }

  /**
   * Sets the log value.
   * @param value - The new value for the log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public set log(value: any) {
    this._log = value
  }

  /**
   * Get the log value.
   */
  public get log() {
    return this._log
  }

  public getBrandingOverlayType(): BrandingOverlayType {
    return this.options.brandingOverlayType ?? BrandingOverlayType.Branding10
  }

  private getDefaultBundle(params: OCABundleResolveDefaultParams) {
    if (!params.language) {
      params.language = defaultBundleLanguage
    }

    const metaOverlay: IMetaOverlayData = {
      capture_base: '',
      type: OverlayType.Meta10,
      name: startCase(
        params.meta?.credName ??
          parseCredDefFromId(params.identifiers?.credentialDefinitionId, params.identifiers?.schemaId)
      ),
      issuer: params.meta?.alias || params.meta?.credConnectionId || 'Unknown Contact',
      language: params.language ?? this.options?.language,
      description: '',
      credential_help_text: '',
      credential_support_url: '',
      issuer_description: '',
      issuer_url: '',
    }

    let colorHash = 'default'
    if (metaOverlay?.name) {
      colorHash = metaOverlay.name
    } else if (metaOverlay?.issuer) {
      colorHash = metaOverlay.issuer
    }

    const brandingOverlay01: ILegacyBrandingOverlayData = {
      capture_base: '',
      type: OverlayType.Branding01,
      background_color: generateColor(colorHash),
    }

    const brandingOverlay10: IBrandingOverlayData = {
      capture_base: '',
      type: OverlayType.Branding10,
      primary_background_color: generateColor(colorHash),
    }

    const brandingOverlay11: IBrandingOverlayData = {
      capture_base: '',
      type: OverlayType.Branding11,
      primary_background_color: '#FFFFFF',
      secondary_background_color: generateColor(colorHash),
    }

    let overlayType = brandingOverlay10

    if (this.getBrandingOverlayType() === BrandingOverlayType.Branding11) overlayType = brandingOverlay11

    if (this.getBrandingOverlayType() === BrandingOverlayType.Branding01) overlayType = brandingOverlay01

    const bundle: OverlayBundle = new OverlayBundle(params.identifiers?.credentialDefinitionId as string, {
      capture_base: {
        attributes: {},
        classification: '',
        type: OverlayType.CaptureBase10,
        flagged_attributes: [],
      },
      overlays: [metaOverlay, overlayType],
    })

    return Promise.resolve(
      new OCABundle(bundle, { ...this.options, language: params.language ?? this.options.language })
    )
  }

  public resolveDefaultBundle(params: OCABundleResolveDefaultParams): Promise<OCABundle | undefined> {
    return this.getDefaultBundle(params)
  }

  public resolve(params: OCABundleResolveParams): Promise<OCABundle | undefined> {
    const language = params.language || defaultBundleLanguage
    for (const item of [
      params.identifiers?.credentialDefinitionId,
      params.identifiers?.schemaId,
      params.identifiers?.templateId,
    ]) {
      if (item && this.bundles[item] !== undefined) {
        let bundle = this.bundles[item]
        // if it is a string, it is a reference/alias to another one bundle
        if (typeof bundle === 'string') {
          bundle = this.bundles[bundle]
        }
        return Promise.resolve(
          new OCABundle(bundle as OverlayBundle, { ...this.options, language: language ?? this.options.language })
        )
      }
    }
    return Promise.resolve(undefined)
  }

  public async presentationFields(params: OCABundleResolvePresentationFieldsParams): Promise<Field[]> {
    const bundle = await this.resolve(params)
    let presentationFields = [...params.attributes]
    if (bundle?.captureBase?.attributes) {
      // if the oca branding has the attributes set, only display those attributes
      const bundleFields = Object.keys(bundle.captureBase.attributes)
      presentationFields = presentationFields.filter((item) => item.name && bundleFields.includes(item.name))
      for (let i = 0; i < presentationFields.length; i++) {
        const presentationField = presentationFields[i]
        const key = presentationField.name || ''
        if (bundle.captureBase.attributes[key]) {
          presentationField.label = bundle?.labelOverlay?.attributeLabels[key]
          presentationField.format = bundle?.formatOverlay?.attributeFormats[key]
          presentationField.type = bundle?.captureBase?.attributes?.[key]
          presentationField.encoding = bundle?.characterEncodingOverlay?.attributeCharacterEncoding?.[key]
        }
      }
    }
    return presentationFields
  }

  public async resolveAllBundles(
    params: OCABundleResolveAllParams
  ): Promise<CredentialOverlay<BaseOverlay | BrandingOverlay | LegacyBrandingOverlay>> {
    const [bundle, defaultBundle] = await Promise.all([this.resolve(params), this.resolveDefaultBundle(params)])

    const fields = params.attributes
      ? await this.presentationFields({
          ...params,
          attributes: params.attributes,
        })
      : []

    const overlayBundle = bundle ?? defaultBundle
    const metaOverlay = overlayBundle?.metaOverlay
    const brandingOverlay = overlayBundle?.brandingOverlay

    return { bundle: overlayBundle, presentationFields: fields, metaOverlay, brandingOverlay }
  }
}
