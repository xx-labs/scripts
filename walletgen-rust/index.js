const { bip39Generate, generateSleeve, waitReady } = require('@polkadot/wasm-crypto');
const { Keyring } = require('@polkadot/keyring');

async function main() {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 55 });
    await waitReady();

    // generate quantum seed
    const quantum = bip39Generate(24);

    // generate standard seed
    const standard = generateSleeve(quantum);

    const wallet = keyring.addFromMnemonic(standard);
    console.log(`Quantum recovery phrase: ${quantum}`);
    console.log(`Standard recovery phrase: ${standard}`);
    console.log(`SS58 Address: ${wallet.address}`);
    console.log(`Public Key (hex): 0x${Buffer.from(wallet.publicKey).toString('hex')}`);
}

main().catch((err) => console.error(err)).finally(() => process.exit());