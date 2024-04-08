import { EnvironmentType, NodeConfigVariant, PaymentStatus, connect, defaultConfig, mnemonicToSeed, nodeInfo, receiveOnchain, receivePayment, sendPayment, paymentByHash, sendSpontaneousPayment } from "@breeztech/react-native-breez-sdk";
import { getItem, setItem } from "./storage";
import { generateMnemonic } from "@dreson4/react-native-quick-bip39";
import { t } from "i18next";
import * as lightningPayReq from 'bolt11';
import * as base64 from 'byte-base64';

const MNEMONIC_STORE = "MNEMONIC_SECURE_STORE"

export const initNodeAndSdk = async (eventHandler: any) => {
    try {
        const useInviteCode = true;

        let seed = <any>[];
        let nodeConfig
        const apiKey = '5481cee312d7c8fe3891bdff8953a1ce57f57790b73e0884a8bfc119f4399bba';

        // const apiKey = 'Yk2YFZixwFZai/af49/A/1W1jtPx28MV6IXH8DIzvG0=';
        if (useInviteCode) {

            // Physical phone invite code
            // const inviteCode = '6FUD-Z8A9';

            // Emulator invite code
            const inviteCode = 'XLT3-8WFJ';

            // Physical phone seed
            // seed = await mnemonicToSeed('spring business health luggage word spin start column pipe giant pink spoon');

            // Emulator seed
            seed = await mnemonicToSeed('large artefact physical panel shed movie inhale sausage sense bundle depart ribbon');

            nodeConfig = {
                type: NodeConfigVariant.GREENLIGHT,
                config: { inviteCode }
            };
            console.log("Using invite code")
        } else {
            let mnemonic = await getItem(MNEMONIC_STORE)
            if (!mnemonic) {
                console.log("No mnemonic found, generating new one");
                mnemonic = generateMnemonic();
                console.log("Generated mnemonic: ", mnemonic);
                await setItem(MNEMONIC_STORE, mnemonic);
            }
            else {
                console.log("Mnemonic found: ", mnemonic);
            }

            seed = await mnemonicToSeed(mnemonic);
            const keys = convertCerts();

            if (keys !== undefined && keys.deviceCert !== undefined && keys.deviceKey !== undefined) {
                const partnerCreds = { deviceCert: keys.deviceCert, deviceKey: keys.deviceKey };
                nodeConfig = {
                    type: NodeConfigVariant.GREENLIGHT,
                    config: { partnerCredentials: partnerCreds }
                };
                console.log("Going with partner credentials")
            }
        }

        console.log("Seed: ", seed);

        if (nodeConfig) {
            const config = await defaultConfig(
                EnvironmentType.PRODUCTION,
                apiKey,
                nodeConfig
            );
            const eventSubscription = await connect(config, seed, eventHandler);
            console.log('Breez Initialized');
            return eventSubscription
        }
        else {
            console.error("No node config found")
        }
    }
    catch (err: any) {
        const errorString = JSON.stringify(err)

        if (errorString.includes("already initialized")) {
            console.log("Breez already initialized.")
            return undefined
        }

        console.error(err);
        return JSON.stringify(err)
    }
}

const convertCerts = () => {
    try {
        const deviceCert =
            Array.from(base64.base64ToBytes('LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNyekNDQWxTZ0F3SUJBZ0lVTkZNb1NUSFhYa0ozWm9ZWEZqcEo1R0c3Vklzd0NnWUlLb1pJemowRUF3SXcKZ1lNeEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUlFd3BEWVd4cFptOXlibWxoTVJZd0ZBWURWUVFIRXcxVApZVzRnUm5KaGJtTnBjMk52TVJRd0VnWURWUVFLRXd0Q2JHOWphM04wY21WaGJURWRNQnNHQTFVRUN4TVVRMlZ5CmRHbG1hV05oZEdWQmRYUm9iM0pwZEhreEVqQVFCZ05WQkFNVENVZE1JQzkxYzJWeWN6QWVGdzB5TkRBeU1qa3gKTVRVNU1EQmFGdzB6TkRBeU1qWXhNVFU1TURCYU1JR29NUXN3Q1FZRFZRUUdFd0pWVXpFVE1CRUdBMVVFQ0JNSwpRMkZzYVdadmNtNXBZVEVXTUJRR0ExVUVCeE1OVTJGdUlFWnlZVzVqYVhOamJ6RVVNQklHQTFVRUNoTUxRbXh2ClkydHpkSEpsWVcweEhUQWJCZ05WQkFzVEZFTmxjblJwWm1sallYUmxRWFYwYUc5eWFYUjVNVGN3TlFZRFZRUUQKRXk1SFRDQXZkWE5sY25NdllXTTNaRFJqTWpVdE5UTmlOUzAwWldFMExUbGhNR0V0T0dVNU5HUmpOR05tWlRaagpNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVyNWpSK0VuL3hDT2xjZlRTYzZJQmIyWjBGUDVBCmdUTGlmSnBnSTNSUnc3T01keGFGTWlpRklNM1pmYVE3dURNUVlvVGVhamhSU0R4SWdpVTNBQTRULzZOL01IMHcKRGdZRFZSMFBBUUgvQkFRREFnR21NQjBHQTFVZEpRUVdNQlFHQ0NzR0FRVUZCd01CQmdnckJnRUZCUWNEQWpBTQpCZ05WSFJNQkFmOEVBakFBTUIwR0ExVWREZ1FXQkJRZU1UdjdaTGZsV1ZnQlJ0c05jSnhjKzZucWF6QWZCZ05WCkhTTUVHREFXZ0JSTkR2Y1hVd3h1azZMRUcxMCtpZzhtQnNNbGxEQUtCZ2dxaGtqT1BRUURBZ05KQURCR0FpRUEKMytMTFRqN0Zzb0Q2OFVMREZjd0ZvclF5cmhuZE50ME1xQk9kQWx1eHBqQUNJUURtdzRWVHVIRGU5VjJnYlp0RQpZdXRiQkVrMFowL0hUZjcxVi9nRFpVMmorZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNpakNDQWpHZ0F3SUJBZ0lVSjA2c3lZQjFUUFJiU21URDRVQ3BUMFBtQStVd0NnWUlLb1pJemowRUF3SXcKZmpFTE1Ba0dBMVVFQmhNQ1ZWTXhFekFSQmdOVkJBZ1RDa05oYkdsbWIzSnVhV0V4RmpBVUJnTlZCQWNURFZOaApiaUJHY21GdVkybHpZMjh4RkRBU0JnTlZCQW9UQzBKc2IyTnJjM1J5WldGdE1SMHdHd1lEVlFRTEV4UkRaWEowCmFXWnBZMkYwWlVGMWRHaHZjbWwwZVRFTk1Bc0dBMVVFQXhNRVIwd2dMekFlRncweU1UQTBNall4TnpFME1EQmEKRncwek1UQTBNalF4TnpFME1EQmFNSUdETVFzd0NRWURWUVFHRXdKVlV6RVRNQkVHQTFVRUNCTUtRMkZzYVdadgpjbTVwWVRFV01CUUdBMVVFQnhNTlUyRnVJRVp5WVc1amFYTmpiekVVTUJJR0ExVUVDaE1MUW14dlkydHpkSEpsCllXMHhIVEFiQmdOVkJBc1RGRU5sY25ScFptbGpZWFJsUVhWMGFHOXlhWFI1TVJJd0VBWURWUVFERXdsSFRDQXYKZFhObGNuTXdXVEFUQmdjcWhrak9QUUlCQmdncWhrak9QUU1CQndOQ0FBVFdsTmkrOVA4WmRSZmFQMVZPT01iOQplK1ZTdWdEeHd2TjQxWlRkcTVhUTF5VFhIeDJmY015b3dvRGFTQ0JnNDRyelBKL1RET3JJSDJXV1dDYUhtSGdUCm80R0dNSUdETUE0R0ExVWREd0VCL3dRRUF3SUJwakFkQmdOVkhTVUVGakFVQmdnckJnRUZCUWNEQVFZSUt3WUIKQlFVSEF3SXdFZ1lEVlIwVEFRSC9CQWd3QmdFQi93SUJBekFkQmdOVkhRNEVGZ1FVVFE3M0YxTU1icE9peEJ0ZApQb29QSmdiREpaUXdId1lEVlIwakJCZ3dGb0FVenFGcjZqdmx4M2JsWnRZYXBjWkhWWXBPS1NNd0NnWUlLb1pJCnpqMEVBd0lEUndBd1JBSWdKdmdKOGVoS3gwVmVuTXlVVC9NUlhsbUNsQVJjMU5wMzkvRmJwNEdJYmQ4Q0lHaGsKTUtWY0RBNWl1UVo3eGhaVTFTOFBPaDFMOXVUMzVVa0U3K3htR05qcgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg=='));
        const deviceKey =
            Array.from(base64.base64ToBytes('LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ2xhMHphcmc4ektzcVhDNWgKYnIzQjVpbUEySkp6aUQ3emo2aVlWUXdzUExlaFJBTkNBQVN2bU5INFNmL0VJNlZ4OU5Kem9nRnZablFVL2tDQgpNdUo4bW1BamRGSERzNHgzRm9VeUtJVWd6ZGw5cER1NE14QmloTjVxT0ZGSVBFaUNKVGNBRGhQLwotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tCg=='));

        return { deviceCert, deviceKey };

    } catch (error: any) {
        console.error('Error converting certificates:', error);
    }
};

export const getBalances = async () => {
    try {
        const nodeStateRes = await nodeInfo();
        console.log("Node state response: ", nodeStateRes);
        const channelBalance = nodeStateRes?.channelsBalanceMsat;
        console.log("Channel balance: ", channelBalance);
        const chainBalance = nodeStateRes?.onchainBalanceMsat;
        console.log("Chain balance: ", chainBalance);
        // addLog({ channelBalance, chainBalance });

        return { channelBalance, chainBalance }
    } catch (err: any) {
        console.error(err);
        return err.message
        // addLog(err.message);
    }
}

export const getNodeId = async () => {
    try {
        const nodeStateRes = await nodeInfo();
        console.log("Node state response: ", nodeStateRes);
        const nodeId = nodeStateRes?.id;
        console.log("Node ID: ", nodeId);

        return nodeId
    } catch (err: any) {
        console.error(err);
        return undefined
    }
}

export const getBTCDepositInfo = async () => {
    try {
        const swapInfo = await receiveOnchain({});
        console.log("Deposit info: ", swapInfo);
        // addLog(swapInfo.bitcoinAddress);
        return { swapInfo }
    } catch (err: any) {
        console.error(err);
        return err.message
        // addLog(err.message);
    }
}

export const getInvoice = async (satsAmount: string) => {
    try {
        const receivePaymentResponse = await receivePayment({
            amountMsat: Number(satsAmount) * 1000,
            description: `Invoice for ${satsAmount} sats`,
        })

        //addLog(receivePaymentResponse.lnInvoice);
        console.log('Invoice:', receivePaymentResponse.lnInvoice)
        return receivePaymentResponse.lnInvoice
    } catch (err: any) {
        console.error(err)
        return "An error occurred while generating the invoice"
        // addLog(err.message);
    }
}

export const payInvoice = async (scannedData: any) => {
    try {
        const bolt11 = scannedData
        // The `amountMsat` param is optional and should only passed if the bolt11 doesn't specify an amount.
        // The amountMsat is required in case an amount is not specified in the bolt11 invoice'.
        // const amountMsat = 3000000
        if (bolt11 !== undefined) {

            const response = await sendPayment({ bolt11 })

            console.log('Payment response:', response)

            return response
        } else {
            console.log('No invoice to pay')
            return 'No invoice to pay'
        }
    } catch (err: any) {
        console.error(err)
        return err.message
    }
}

export const checkStatus = async (hash: string) => {
    try {
        console.log('Checking payment status for hash:', hash)
        const paymentInfo = await paymentByHash(hash)

        console.log('Status:', paymentInfo)

        if (paymentInfo?.status === PaymentStatus.COMPLETE) {
            console.log('Payment Completed');
            return 'Payment Completed';
        }
        else if (paymentInfo?.status === PaymentStatus.FAILED) {
            console.log('Payment failed');
            return ('Payment Failed');
        }
        else if (paymentInfo?.status === PaymentStatus.PENDING) {
            console.log('Payment pending');
            return ('Payment Pending');
        }
        else if (paymentInfo === null) {
            console.log(paymentInfo);

            return ('Payment not Completed');
        }
        else {
            console.log(paymentInfo);
            return ('Payment status unknown');
        }
    }
    catch (err: any) {
        console.error("Error checking payment status:", err)
        console.error(err)
        return String(err.message)
    }
}

export const payInvoiceWithAmount = async (scannedData: any, amount: number) => {

    try {
        const bolt11 = scannedData
        // The `amountMsat` param is optional and should only passed if the bolt11 doesn't specify an amount.
        // The amountMsat is required in case an amount is not specified in the bolt11 invoice'.
        const amountMsat = amount * 1000
        if (bolt11 !== undefined && amountMsat !== undefined) {

            const response = await sendPayment({ bolt11, amountMsat })

            console.log('Payment response:', response)

            return response
        } else {
            console.log('No invoice to pay')
            return 'No invoice to pay'
        }
    } catch (err: any) {
        console.error(err)
        return "Error paying invoice"
    }
}

export const sendSpontaneousPaymentToNode = async (nodeId: string, amount: number) => {
    try {
        const response = await sendSpontaneousPayment({ nodeId, amountMsat: amount * 1000 })

        console.log('Spontaneous payment response:', response)

        return response
    } catch (err: any) {
        console.error(err)
        return err.message
    }
}

export const getBTCPrice = async () => {
    try {
        let btcZarPrice = 0;
        await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=zar')
            .then(response => response.json())
            .then(data => { console.log(data.bitcoin.zar); btcZarPrice = data.bitcoin.zar })
            .catch(error => console.error('Error:', error));

        return btcZarPrice
    } catch (error) {
        console.error('Error fetching btc price:', error);
    }
}

export const getLInvoiceZarAmount = async (lightningInvoice: string) => {
    const btcZarPrice = await getBTCPrice();

    try {
        if (btcZarPrice !== undefined) {
            return (Number(lightningPayReq.decode(lightningInvoice).millisatoshis) / 100000000000 * btcZarPrice).toFixed(2)
        }
        else {
            return undefined
        }
    } catch (error) {
        console.error('Error getting invoice amount:', error);
    }

}

export const getBTCToZarAmount = async (satoshis: number) => {
    const btcZarPrice = await getBTCPrice();

    try {
        if (btcZarPrice !== undefined) {
            return (satoshis / 100000000 * btcZarPrice).toFixed(2)
        }
        else {
            return undefined
        }
    } catch (error) {
        console.error('Error getting zar amount:', error);
    }

}