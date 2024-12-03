import { IColorPallet } from '../theme'
import { Shade, shadeIsLightOrDark } from './luminance'

export const backgroundColorIfErrorState = (
  ColorPallet: IColorPallet,
  error: boolean,
  predicateError: boolean,
  isProofRevoked: boolean,
  backgroundColor?: string
) => (error || predicateError || isProofRevoked ? ColorPallet.notification.errorBorder : backgroundColor)

export const fontColorWithHighContrast = (
  ColorPallet: IColorPallet,
  error: boolean,
  predicateError: boolean,
  isProofRevoked: boolean,
  backgroundColor?: string,
  proof?: boolean
) => {
  if (proof) {
    return ColorPallet.grayscale.mediumGrey
  }

  const c =
    backgroundColorIfErrorState(ColorPallet, error, predicateError, isProofRevoked, backgroundColor) ??
    ColorPallet.grayscale.lightGrey
  const shade = shadeIsLightOrDark(c)

  return shade == Shade.Light ? ColorPallet.grayscale.darkGrey : ColorPallet.grayscale.lightGrey
}
