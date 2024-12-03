import BaseOverlay from './base/BaseOverlay'
import BrandingOverlay from './branding/BrandingOverlay'
import LegacyBrandingOverlay from './branding/LegacyBrandingOverlay'
import CharacterEncodingOverlay from './semantic/CharacterEncodingOverlay'
import FormatOverlay from './semantic/FormatOverlay'
import InformationOverlay from './semantic/InformationOverlay'
import LabelOverlay from './semantic/LabelOverlay'
import MetaOverlay from './semantic/MetaOverlay'
import StandardOverlay from './semantic/StandardOverlay'

const OverlayTypeMap: Map<string, typeof BaseOverlay | typeof BrandingOverlay | typeof LegacyBrandingOverlay> = new Map(
  Object.entries({
    'spec/overlays/character_encoding/1.0': CharacterEncodingOverlay,
    'spec/overlays/label/1.0': LabelOverlay,
    'spec/overlays/information/1.0': InformationOverlay,
    'spec/overlays/format/1.0': FormatOverlay,
    'spec/overlays/standard/1.0': StandardOverlay,
    'spec/overlays/meta/1.0': MetaOverlay,
    'aries/overlays/branding/1.1': BrandingOverlay,
    'aries/overlays/branding/1.0': BrandingOverlay,
    'aries/overlays/branding/0.1': LegacyBrandingOverlay,
  })
)

export default OverlayTypeMap
