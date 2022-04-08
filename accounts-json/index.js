const fs = require('fs');
const { keyring } = require('@polkadot/ui-keyring');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { mnemonicValidate } = require('@polkadot/util-crypto');
const { execSync } = require('child_process');
require('dotenv').config();

/**
 * Global Variables
 */
const numAccounts = 10;
const accountPrefixName = 'account';
const accountsPassword = '12345678';
const filePassword = '1234';
const backupFile = './backup.json';
const bin = './bin/sleevage-mac'; // Change according to your OS

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

/**
 * Create ${numAccounts} account from the same Quantum Wallet
 * and output them to a json file
 * @param {string} mnemonicsFile
 */
function createAccounts(mnemonicsFile) {
  execSync(`${bin} -n ${numAccounts} -o ${mnemonicsFile} -t json`);
}

/**
 * Read list of Standard Mnemonics from sleevage autogenerated json file
 * @param {string} mnemonicsFile
 * @returns {string[]} array of mnemonics
 */
function readFromJSON(mnemonicsFile) {
  const data = JSON.parse(fs.readFileSync(mnemonicsFile, 'utf8'));
  const mnemonics = data.map((element) => element.StandardPhrase);
  return mnemonics;
}

/**
 * Read list of Standard Mnemonics from manual generated text file
 * @param {string} mnemonicsFile
 * @returns {string[]} array of mnemonics
 */
function readFromText(mnemonicsFile) {
  return fs.readFileSync(mnemonicsFile).toString().split('\n');
}

/**
 * Generates json file
 */
async function main() {
  const api = await connect();

  // Initialize Variables
  let mnemonicsFile = './mnemonics.txt';
  let mnemonics = [];

  // If string 'autogenerate' is passed as argument, use sleevage to generate accounts
  const autogenerate = process.argv[2] === 'autogenerate' || false;
  if (autogenerate) {
    mnemonicsFile = './mnemonics.json';
    createAccounts(mnemonicsFile);
    mnemonics = readFromJSON(mnemonicsFile);
  } else {
    mnemonics = readFromText(mnemonicsFile);
  }

  // Check Errors
  if (mnemonics.length === 0 || mnemonics[0] === '') {
    console.error('Error: No mnemonics to read from file ', mnemonicsFile);
    process.exit(1);
  }

  mnemonics.forEach((elem, index) => {
    if (!mnemonicValidate(elem)) {
      console.error(`Error: Invalid mnemonic #${index} - ${elem}`);
      process.exit(1);
    }
  });

  if (Array.isArray(accountsPassword) && accountsPassword.length !== mnemonics.length) {
    console.error(`Error: accountsPassword list size does not match the numAccounts - ${accountsPassword.length} != ${mnemonics.length}`);
    process.exit(1);
  }

  // Load Keyring
  keyring.loadAll({
    genesisHash: api.genesisHash, isDevelopment: false, ss58Format: api.consts.system.ss58Prefix, type: 'sr25519',
  });

  // Add mnemonics
  const accounts = mnemonics.map((element, index) => {
    let password = accountsPassword;
    if (accountsPassword === Array && accountsPassword.length === numAccounts) {
      password = accountsPassword[index];
    }
    const { json } = keyring.addUri(element, password, { name: `${accountPrefixName} ${index + 1}` });
    console.log(json);
    return json.address;
  });
  console.log('\n==> List of Addresses in ./backup.json file: ', accounts.join(', '));

  // Create Backup File
  keyring.backupAccounts(accounts, filePassword)
    .then((exported) => {
      fs.writeFileSync(backupFile, JSON.stringify(exported), { flag: 'w' }, (err) => { console.error(err); });
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => process.exit());
}

main().catch((err) => console.error(err));
