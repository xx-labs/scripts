const { newXXNetworkApp } = require('@zondax/ledger-substrate');
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const { ApiPromise, WsProvider } = require('@polkadot/api');
require('dotenv').config();

const LEDGER = '6WA132Y5Ycgz3cXUt6a6rEhcJ4imhxXAij7x5Gefha5wu83g';
const ALICE = '6a6XHUGV5mu33rX1vn3iivxxUR4hwoUapsuECGyHpPzfaNtt';

/**
 * Connect to a xx network node using websocket
 * @return {Promise} chain api
 */
async function connect() {
    const provider = new WsProvider(process.env.WS_CHAIN);
    const api = await ApiPromise.create({
        provider,
    });
    await api.isReady;
    return api;
}

async function sendAndWait(extrinsic, final) {
    return new Promise((resolve, reject) => {
        // Sign and send the extrinsic using our wallet
        extrinsic.send(({ status }) => {
            if (status.isInBlock) {
                console.log(`Transfer included in block ${status.asInBlock}`);
                if (!final) {
                    resolve();
                }
            }
            if (status.isFinalized && final) {
                console.log(`Transfer finalized in block ${status.asFinalized}`);
                resolve();
            }
        });
    })
}

async function main () {
    const transport = await TransportNodeHid.default.create();

    const app = newXXNetworkApp(transport);

    // Connect to the node
    const api = await connect();

    // Create an extrinsic, transferring 10 units to Alice (with 9 decimals)
    const transfer = api.tx.balances.transfer(ALICE, 10_000000000);

    // Get the current nonce for the sending account
    const nonce = await api.rpc.system.accountNextIndex(LEDGER);

    // Create the signing payload
    // These options are for an immortal extrinsic
    const signPayload = api.registry.createTypeUnsafe('SignerPayload', [
        {
            genesisHash: api.genesisHash,
            blockHash: api.genesisHash,
            runtimeVersion: api.runtimeVersion,
            signedExtensions: api.registry.signedExtensions,
            version: 4,
            specVersion: api.runtimeVersion.specVersion,
            transactionVersion: api.runtimeVersion.transactionVersion,
            nonce: nonce,
            address: LEDGER,
            method: transfer.method,
            blockNumber: 0,
        }
    ]);

    const txData = signPayload.toRaw().data.substring(2);
    const txBlob = Buffer.from(txData, 'hex');

    const signature = await app.sign(0x80000000, 0x80000000, 0x80000000, txBlob);

    // Add signature
    transfer.addSignature(
        LEDGER,
        signature.signature,
        signPayload.toPayload()
    );

    await sendAndWait(transfer, true);
}

main().catch(console.error).finally(() => process.exit());
