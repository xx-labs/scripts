const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
require('dotenv').config();

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
    return new Promise((reject, resolve) => {
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
    // Connect to the node
    const api = await connect();

    // Create a extrinsic, transferring 1000 units to Bob (with 9 decimals)
    const transfer = api.tx.balances.transfer(BOB, 1000_000000000);

    // Construct the keying, using ss58 format 55, which is registered for xx network
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 55 });

    // Add Alice to our keyring with a hard-derived path (empty phrase, so uses dev account)
    const alice = keyring.addFromUri('//Alice');

    // Sign the transfer extrinsic
    await transfer.signAsync(alice);

    // Send and wait for transfer to be included in a block or finalized
    await sendAndWait(transfer, true);
}

main().catch(console.error).finally(() => process.exit());
