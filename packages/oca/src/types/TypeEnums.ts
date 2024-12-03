export enum CaptureBaseAttributeType {
  Binary = 'Binary',
  Text = 'Text',
  DateTime = 'DateTime',
  Numeric = 'Numeric',
  DateInt = 'DateInt',
}

export enum OverlayType {
  CaptureBase10 = 'spec/capture_base/1.0',
  Meta10 = 'spec/overlays/meta/1.0',
  Label10 = 'spec/overlays/label/1.0',
  Format10 = 'spec/overlays/format/1.0',
  CharacterEncoding10 = 'spec/overlays/character_encoding/1.0',
  Standard10 = 'spec/overlays/standard/1.0',
  Information10 = 'spec/overlays/information/1.0',
  Branding01 = 'aries/overlays/branding/0.1',
  Branding10 = 'aries/overlays/branding/1.0',
  Branding11 = 'aries/overlays/branding/1.1',
}
