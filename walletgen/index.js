// Wallet generation example script

require("./wasm_exec.js");
const fs = require('fs');
const wasmBuffer = fs.readFileSync('wasm/main.wasm');
const {Keyring} = require('@polkadot/keyring');
const util = require("@polkadot/util-crypto");

// Instantiate WASM code
const go = new Go();
WebAssembly.instantiate(wasmBuffer, go.importObject).then(result => {
    // This future never returns
    go.run(result.instance);
});

// There is no way to know when the WASM code is done loading via
// a promise, so we just wait 50ms
setTimeout(() => {
    // Generate a new Sleeve Wallet
    const result = global.newSleeveWallet("");
    if (!result.success) {
        console.log("Error generating wallet: ", result.msg);
        process.exit(1)
    }

    // The Sleeve Wallet output has 2 mnemonics
    // Quantum: should be stored safely as a quantum secure backup of the wallet for future proofing
    // Standard: will be used to create a standard wallet that is currently used in xx network

    // Construct the keying, using ss58 format 55, which is registered for xx network
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 55 });

    // Wait for crypto library WASM to load
    util.cryptoWaitReady().then(() => {
        // Add the wallet to the keyring
        const wallet = keyring.addFromMnemonic(result["mnemonics"]["standard"]);

        // Print the wallet information
        console.log("Address: ", wallet.address);
        console.log(`Public Key: 0x${Buffer.from(wallet.publicKey).toString('hex')}`);
    });
}, 50);
