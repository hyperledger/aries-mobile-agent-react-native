import React, { useCallback, useEffect, useState } from 'react'
import { Camera, Code, useCameraDevice, useCameraFormat, useCodeScanner } from 'react-native-vision-camera'
import { useOrientationChange } from "react-native-orientation-locker";
import { StyleSheet, Vibration, View } from 'react-native';
import { QrCodeScanError } from '../../types/error';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../constants';


interface Props {
    handleCodeScan: (value: string) => Promise<void>
    error?: QrCodeScanError | null
    enableCameraOnError?: boolean
    torchActive?: boolean
}
const ScanCamera: React.FC<Props> = ({ handleCodeScan, error, enableCameraOnError, torchActive }) => {
    const [orientation, setOrientation] = useState("PORTRAIT")
    const [cameraActive, setCameraActive] = useState(true)
    const orientationDegrees: { [key: string]: string } = { "PORTRAIT": "0deg", "LANDSCAPE-LEFT": "270deg", "PORTRAIT-UPSIDEDOWN": "180deg", "LANDSCAPE-RIGHT": "90deg" }
    const invalidQrCodes = new Set<string>()
    const device = useCameraDevice('back')

    const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH
    const format = useCameraFormat(device, [
        { fps: 60 },
        { videoAspectRatio: screenAspectRatio },
        { videoResolution: 'max' },
        { photoAspectRatio: screenAspectRatio },
        { photoResolution: 'max' },
    ])
    useOrientationChange((orientationType) => { setOrientation(orientationType) })

    const onCodeScanned = useCallback((codes: Code[]) => {
        const value = codes[0].value
        if (!value || invalidQrCodes.has(value)) {
            return
        }

        if (error?.data === value) {
            invalidQrCodes.add(value)
            if (enableCameraOnError) {
                return setCameraActive(true)
            }
        }

        if (cameraActive) {
            Vibration.vibrate()
            handleCodeScan(value)
            return setCameraActive(false)
        }
    }, [])

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: onCodeScanned,
    })
    return (
        <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: orientationDegrees[orientation] ?? "0deg" }] }]}>
            {device && (
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    torch={torchActive ? 'on' : 'off'}
                    isActive={cameraActive}
                    codeScanner={codeScanner}
                    format={format}
                />
            )}
        </View>
    )
}

export default ScanCamera