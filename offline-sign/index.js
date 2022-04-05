const { Keyring } = require('@polkadot/keyring');
const util = require("@polkadot/util-crypto");
const { u8aToHex } = require("@polkadot/util");
const readline = require('readline');

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
    // Construct the keying, using ss58 format 55, which is registered for xx network
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 55 });

    // Wait for crypto library WASM to load
    await util.cryptoWaitReady();

    // Add Alice to our keyring with a hard-derived path (empty phrase, so uses dev account)
    const alice = keyring.addFromUri('//Alice');

    return askQuestion('Paste data to be signed here\n').then((data) => {
        const signature = alice.sign(data.trim(), { withType: true });
        console.log("Signature");
        console.log(u8aToHex(signature));
    });
}

main().catch(console.error).finally(() => process.exit());
