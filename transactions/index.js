const { ApiPromise, WsProvider } = require('@polkadot/api');
const readline = require('readline');
require('dotenv').config();

const ALICE = '6a6XHUGV5mu33rX1vn3iivxxUR4hwoUapsuECGyHpPzfaNtt';
const BOB = '6YXN1Q6Lx3u8tr2WVr5myb3zNa3pVG5FL3ku8uqckR5RoA21';

/**
 * Connect to an xx network node using websocket
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

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function main () {
    // Connect to the node
    const api = await connect();

    // Create a extrinsic, transferring 1000 units to Bob (with 9 decimals)
    const transfer = api.tx.balances.transfer(BOB, 1000_000000000);

    // Get the current nonce for the sending account
    const nonce = await api.rpc.system.accountNextIndex(ALICE);

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
            address: ALICE,
            method: transfer.method,
            blockNumber: 0,
        }
    ]);

    // Print data to sign
    console.log("Extrinsic payload to be signed");
    console.log(signPayload.toRaw().data);

    const sig = await askQuestion('Paste the signature here\n');

    // Add signature
    transfer.addSignature(
        ALICE,
        sig.trim(),
        signPayload.toPayload()
    );

    await sendAndWait(transfer, true);
}

main().catch(console.error).finally(() => process.exit());
