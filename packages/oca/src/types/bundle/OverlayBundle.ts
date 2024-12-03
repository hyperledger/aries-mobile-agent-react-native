import { OverlayType } from '..'
import { IBrandingOverlayData, ILegacyBrandingOverlayData, IOverlayBundleData } from '../../interfaces/data'
import { IOverlayBundleAttribute, IOverlayBundleMetadata } from '../../interfaces/overlay'
import OverlayTypeMap from '../OverlayTypeMap'
import BaseOverlay from '../base/BaseOverlay'
import BrandingOverlay from '../branding/BrandingOverlay'
import LegacyBrandingOverlay from '../branding/LegacyBrandingOverlay'
import CaptureBase from '../capture-base/CaptureBase'
import CharacterEncodingOverlay from '../semantic/CharacterEncodingOverlay'
import FormatOverlay from '../semantic/FormatOverlay'
import InformationOverlay from '../semantic/InformationOverlay'
import LabelOverlay from '../semantic/LabelOverlay'
import MetaOverlay from '../semantic/MetaOverlay'
import StandardOverlay from '../semantic/StandardOverlay'

class OverlayBundle {
  credentialDefinitionId!: string
  captureBase!: CaptureBase
  overlays!: BaseOverlay[]
  languages!: string[]
  metadata!: IOverlayBundleMetadata
  attributes!: IOverlayBundleAttribute[]
  flaggedAttributes!: IOverlayBundleAttribute[]

  constructor(credentialDefinitionId: string, bundle: IOverlayBundleData) {
    this.credentialDefinitionId = credentialDefinitionId
    this.captureBase = new CaptureBase(bundle.capture_base)
    this.overlays = bundle.overlays
      .filter((overlay) => !overlay.type.startsWith('aries/overlays/branding/'))
      .map((overlay) => {
        const OverlayClass = (OverlayTypeMap.get(overlay.type) || BaseOverlay) as typeof BaseOverlay
        return new OverlayClass(overlay)
      })
    this.overlays.push(
      ...bundle.overlays
        .filter((overlay) => overlay.type === OverlayType.Branding01)
        .map((overlay) => {
          const OverlayClass = (OverlayTypeMap.get(overlay.type) ||
            LegacyBrandingOverlay) as typeof LegacyBrandingOverlay
          return new OverlayClass(credentialDefinitionId, overlay as ILegacyBrandingOverlayData)
        })
    )
    this.overlays.push(
      ...bundle.overlays
        .filter((overlay) => overlay.type === OverlayType.Branding10 || overlay.type === OverlayType.Branding11)
        .map((overlay) => {
          const OverlayClass = (OverlayTypeMap.get(overlay.type) || BrandingOverlay) as typeof BrandingOverlay
          return new OverlayClass(credentialDefinitionId, overlay as IBrandingOverlayData)
        })
    )
    this.languages = this.#processLanguages()
    this.metadata = this.#processMetadata()
    this.attributes = this.#processOverlayAttributes()
    this.flaggedAttributes = this.attributes.filter((attribute) =>
      this.captureBase.flaggedAttributes.includes(attribute.name)
    )
  }

  get branding(): BrandingOverlay | undefined {
    return (
      this.#overlaysForType<BrandingOverlay>(OverlayType.Branding10)[0] ||
      this.#overlaysForType<BrandingOverlay>(OverlayType.Branding11)[0]
    )
  }

  getAttribute(name: string): IOverlayBundleAttribute | undefined {
    return this.attributes.find((attribute) => attribute.name === name)
  }

  getFlaggedAttribute(name: string): IOverlayBundleAttribute | undefined {
    return this.flaggedAttributes.find((attribute) => attribute.name === name)
  }

  #processMetadata(): IOverlayBundleMetadata {
    const metadata: IOverlayBundleMetadata & {
      credentialHelpText: Record<string, string>
      credentialSupportUrl: Record<string, string>
      issuer: Record<string, string>
      issuerDescription: Record<string, string>
      issuerUrl: Record<string, string>
    } = {
      name: {},
      description: {},
      credentialHelpText: {},
      credentialSupportUrl: {},
      issuer: {},
      issuerDescription: {},
      issuerUrl: {},
    }
    for (const overlay of this.#overlaysForType<MetaOverlay>(OverlayType.Meta10)) {
      const language = overlay.language ?? 'en'
      const { name, description, credentialHelpText, credentialSupportUrl, issuer, issuerDescription, issuerUrl } =
        overlay

      if (name) {
        metadata.name[language] = name
      }
      if (description) {
        metadata.description[language] = description
      }
      if (credentialHelpText) {
        metadata.credentialHelpText[language] = credentialHelpText
      }
      if (credentialSupportUrl) {
        metadata.credentialSupportUrl[language] = credentialSupportUrl
      }
      if (issuer) {
        metadata.issuer[language] = issuer
      }
      if (issuerDescription) {
        metadata.issuerDescription[language] = issuerDescription
      }
      if (issuerUrl) {
        metadata.issuerUrl[language] = issuerUrl
      }
    }
    return metadata
  }

  #processLanguages(): string[] {
    const languages: string[] = []
    for (const overlay of this.#overlaysForType<MetaOverlay>(OverlayType.Meta10)) {
      const language = overlay.language
      if (language && !languages.includes(language)) {
        languages.push(language)
      }
    }
    languages.sort((a, b) => a.localeCompare(b))
    return languages
  }

  #processOverlayAttributes(): IOverlayBundleAttribute[] {
    const attributes: IOverlayBundleAttribute[] = []
    const attributeMap = new Map(Object.entries(this.captureBase.attributes))
    for (const [name, type] of attributeMap) {
      attributes.push({
        name,
        type,
        information: this.#processInformationForAttribute(name),
        label: this.#processLabelForAttribute(name),
        characterEncoding: this.#processCharacterEncodingForAttribute(name),
        standard: this.#processStandardForAttribute(name),
        format: this.#processFormatForAttribute(name),
      })
    }
    return attributes
  }

  #processInformationForAttribute(key: string): Record<string, string> {
    const information: Record<string, string> = {}
    for (const overlay of this.#overlaysForType<InformationOverlay>(OverlayType.Information10)) {
      if (overlay.attributeInformation?.[key]) {
        const language = overlay.language ?? 'en'
        information[language] = overlay.attributeInformation[key]
      }
    }
    return information
  }

  #processLabelForAttribute(key: string): Record<string, string> {
    const label: Record<string, string> = {}
    for (const overlay of this.#overlaysForType<LabelOverlay>(OverlayType.Label10)) {
      if (overlay.attributeLabels?.[key]) {
        const language = overlay.language ?? 'en'
        label[language] = overlay.attributeLabels[key]
      }
    }
    return label
  }

  #processCharacterEncodingForAttribute(key: string): string | undefined {
    for (const overlay of this.#overlaysForType<CharacterEncodingOverlay>(OverlayType.CharacterEncoding10)) {
      if (overlay.attributeCharacterEncoding?.[key]) {
        return overlay.attributeCharacterEncoding[key]
      }
    }
    return
  }

  #processStandardForAttribute(key: string): string | undefined {
    for (const overlay of this.#overlaysForType<StandardOverlay>(OverlayType.Standard10)) {
      if (overlay.attributeStandards?.[key]) {
        return overlay.attributeStandards[key]
      }
    }
    return
  }

  #processFormatForAttribute(key: string): string | undefined {
    for (const overlay of this.#overlaysForType<FormatOverlay>(OverlayType.Format10)) {
      if (overlay.attributeFormats?.[key]) {
        return overlay.attributeFormats[key]
      }
    }
    return
  }

  #overlaysForType<T>(type: string): T[] {
    return this.overlays.filter((overlay) => overlay.type === type) as T[]
  }
}

export default OverlayBundle
