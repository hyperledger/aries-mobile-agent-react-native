import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import {
    BreezEvent,
    defaultConfig,
    EnvironmentType,
    NodeConfigVariant,
    sendPayment,
    connect,
    mnemonicToSeed,
    nodeInfo,
    receiveOnchain,
    SwapInfo,
    receivePayment,
    LnInvoice,
    GreenlightNodeConfig,
    NodeConfig,
    Config,
    PaymentStatus,

} from "@breeztech/react-native-breez-sdk";
import { theme } from '../theme';
import QRCode from 'react-native-qrcode-svg';
import { generateMnemonic } from '@dreson4/react-native-quick-bip39'
import { getItem, removeItem, setItem } from '../utils/storage';
import { readFile } from 'react-native-fs';
import { Buffer } from 'buffer';
import { ScrollView } from 'react-native-gesture-handler';
import { RNCamera } from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { set } from 'mockdate';
import { getBTCDepositInfo, getBalances, getInvoice, initNodeAndSdk, payInvoice } from '../utils/lightningHelpers';

const LightningWallet = () => {
    //make a state varialbe to store the balance
    const [channelBalance, setChannelBalance] = useState(-1);
    const [chainBalance, setChainBalance] = useState(-1);
    const [depositInfo, setDepositInfo] = useState<SwapInfo | undefined>(undefined);
    const [invoice, setInvoice] = useState<LnInvoice | undefined>(undefined);
    const [scannedData, setScannedData] = useState<string | undefined>(undefined);
    const [scannerActive, setScannerActive] = useState(false);
    const [showInvoiceQR, setShowInvoiceQR] = useState(false);
    const [satsAmount, setSatsAmount] = useState('1000');
    const [invoiceGenLoading, setInvoiceGenLoading] = useState(false);
    const [addressInfoLoading, setAddressInfoLoading] = useState(false);
    const [paymentPending, setPaymentPending] = useState(false);
    const [paymentStatusDesc, setPaymentStatusDesc] = useState('Scan Something First');
    const [logs, setLogs] = useState<string[]>([]);

    const MNEMONIC_STORE = "MNEMONIC_SECURE_STORE"

    const eventHandler = (breezEvent: any) => {
        console.log("event", JSON.stringify(breezEvent))
        // Add the event to the logs
        addLog(JSON.stringify(breezEvent));
    }

    useEffect(() => {
        const eventSubscription = initNodeAndSdk(eventHandler);
    }, []);

    const removeMnemonic = async () => {
        try {
            await removeItem(MNEMONIC_STORE);
        } catch (err: any) {
            console.error(err);
            addLog(err.message);
        }
    }



    const handleGetInvoiceButtonPress = async () => {
        setInvoiceGenLoading(true);
        const invoice = await getInvoice(satsAmount);
        setInvoiceGenLoading(false);
        setShowInvoiceQR(true);

        setInvoice(invoice);
    }

    const handleGetBalancesButtonPress = async () => {
        const balances = await getBalances();
        addLog(balances);
        setChannelBalance(balances?.channelBalance ?? 0);
        setChainBalance(balances?.chainBalance ?? 0);
    }

    const handleGetDepositButtonPress = async () => {
        setAddressInfoLoading(true);
        const depositInfo = await getBTCDepositInfo();
        setAddressInfoLoading(false);

        setDepositInfo(depositInfo?.swapInfo ?? undefined);
    }

    const handlePayInvoiceButtonPress = async () => {
        try {
            setPaymentPending(true);
            const paymentStatus = await payInvoice(scannedData);
            setPaymentPending(false)

            if (paymentStatus.payment.status === PaymentStatus.COMPLETE) {
                console.log('Payment succeeded');
                setPaymentStatusDesc('Payment Successful');
            }
            else if (paymentStatus.payment.status === PaymentStatus.FAILED) {
                console.log('Payment failed');
                setPaymentStatusDesc('Payment Failed');
            }
            else if (paymentStatus.payment.status === PaymentStatus.PENDING) {
                console.log('Payment pending');
                setPaymentStatusDesc('Payment Pending');
            }
            addLog(paymentStatus);
        } catch (err: any) {
            console.error(err);
            addLog(err.message);
        }
    }

    const addLog = (message: any) => {
        const time = `${new Date().toISOString()}: `;
        // Prepend new error messages to keep the newest at the top
        setLogs([time + JSON.stringify(message), ...logs]);
    };

    return (
        <ScrollView>
            <View style={styles.textPadding}>
                <Text style={theme.TextTheme.headerTitle}>Lightning tests</Text>
            </View>

            <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={() => { setScannerActive(true) }}>
                    <Text style={theme.TextTheme.label}>Scan Invoice</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true} // Set to true to allow custom styling to be visible
                visible={scannerActive}
                onRequestClose={() => {
                    setScannerActive(!scannerActive);
                }}
            >
                {/* Wrap the content in a View with a style that sets the background color */}
                <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                    <QRCodeScanner
                        onRead={({ data }) => { setScannedData(data); addLog(JSON.stringify("Scanned: " + data)); setScannerActive(false); setPaymentStatusDesc('Invoice Scanned'); }}
                        reactivate={true}
                        reactivateTimeout={3000}
                        showMarker={true}
                        topContent={
                            <Text style={{ ...theme.TextTheme.label, color: 'white' }}>Scan an Invoice</Text> // Adjust text color as needed
                        }
                        bottomContent={
                            <TouchableOpacity style={{ ...theme.Buttons.primary, marginTop: 20 }} onPress={() => setScannerActive(false)}>
                                <Text style={theme.TextTheme.label}>Close Scanner</Text>
                            </TouchableOpacity>
                        }
                        cameraStyle={{ height: 370, width: 290, alignSelf: 'center', marginTop: 20, borderRadius: 10, overflow: 'hidden', position: 'relative' }}
                    />
                </View>
            </Modal>


            <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={handlePayInvoiceButtonPress}>
                    {paymentPending ? (
                        <ActivityIndicator size="small" color="#FFF" /> // Customize color as needed
                    ) : (
                        <Text style={theme.TextTheme.label}>Pay Invoice ({paymentStatusDesc})</Text>
                    )}
                </TouchableOpacity>
            </View>


            {/* <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={loadAndConvert}>
                    <Text style={theme.TextTheme.label}>Process Keys</Text>
                </TouchableOpacity>
            </View> */}

            <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={removeMnemonic}>
                    <Text style={theme.TextTheme.label}>Remove Mnemonic</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={handleGetBalancesButtonPress}>
                    <Text style={theme.TextTheme.label}>Get Balances</Text>
                </TouchableOpacity>
            </View>

            {/* {channelBalance !== -1 && chainBalance !== -1 && (
                <View style={styles.textPadding}>
                    <Text style={theme.TextTheme.label}>Channel balance: {channelBalance} MSats</Text>
                    <Text style={theme.TextTheme.label}>Chain balance: {chainBalance} MSats</Text>
                </View>
            )} */}

            <View style={styles.buttonPadding}>
                <Text style={theme.TextTheme.label}>Enter amount in sats:</Text>
                <TextInput
                    style={theme.Inputs.textInput}
                    onChangeText={setSatsAmount}
                    value={satsAmount}
                    placeholder="Amount in sats"
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={handleGetInvoiceButtonPress}>
                    {invoiceGenLoading ? (
                        <ActivityIndicator size="small" color="#FFF" /> // Customize color as needed
                    ) : (
                        <Text style={theme.TextTheme.label}>Invoice for {satsAmount} sats</Text>
                    )}

                </TouchableOpacity>
            </View>



            <Modal
                animationType="slide"
                transparent={true} // Set to true to allow custom styling to be visible
                visible={showInvoiceQR}
                onRequestClose={() => {
                    setScannerActive(!showInvoiceQR);
                }}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPressOut={() => setShowInvoiceQR(false)} // Use onPressOut for better handling
                >
                    {invoice !== undefined && (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <QRCode
                                value={invoice.bolt11}
                                size={250}
                            />
                        </View>)}
                </TouchableOpacity>
            </Modal>

            <View style={styles.buttonPadding}>
                <TouchableOpacity style={theme.Buttons.primary} onPress={handleGetDepositButtonPress}>
                    {addressInfoLoading ? (
                        <ActivityIndicator size="small" color="#FFF" /> // Customize color as needed
                    ) : (
                        <Text style={theme.TextTheme.label}>Show BTC Deposit Address</Text>
                    )}

                </TouchableOpacity>
            </View>

            {/* {
                depositInfo !== undefined && (
                    <View style={styles.textPadding}>
                        <Text style={theme.TextTheme.label}>Deposit Address: {depositInfo.bitcoinAddress}</Text>
                        <Text style={theme.TextTheme.label}>Minimum Deposit: {depositInfo.minAllowedDeposit} MSats</Text>
                        <Text style={theme.TextTheme.label}>Maximum Deposit: {depositInfo.maxAllowedDeposit} MSats</Text>
                    </View>
                )
            } */}

            <View style={{ margin: 10 }}>
                {/* Trigger error generation for demonstration */}
                <Text >
                    <Text>Logs</Text>
                </Text>

                <ScrollView style={{ maxHeight: 200, flex: 1 }}>
                    {logs.map((log, index) => (
                        <Text key={index} style={{ backgroundColor: 'grey', color: 'black', padding: 10 }}>
                            {log}
                        </Text>
                    ))}
                </ScrollView>
            </View>

        </ScrollView >
    );
};

const styles = StyleSheet.create({
    buttonPadding: {
        // Adjust the padding as needed
        padding: 10,
    },
    textPadding: {
        // Adjust the padding as needed
        paddingLeft: 15,
    },
    center: {

        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default LightningWallet;
