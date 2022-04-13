const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

const LEDGER = '6WA132Y5Ycgz3cXUt6a6rEhcJ4imhxXAij7x5Gefha5wu83g';
const genesisTemplateFile = './template.json';

/**
 * Read a JSON file
 * @param {string} file
 */
function readJSONFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Save a JSON file
 * @param {json} data
 * @param {string} file
 */
function saveJSONFile(data, file) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2),'utf8')
}

/**
 * Select the sleevage binary to use for account generation
 * according to OS and CPU arch.
 */
function selectSleevageBin() {
  const arch = os.arch();
  const platform = os.platform();
  let bin = null;
  // ARM-32 Linux
  if (arch === 'arm' && platform === 'linux') {
    bin = './bin/sleevage-arm-32bit-linux'
  }
  // ARM-64 Linux
  if (arch === 'arm64' && platform === 'linux') {
    bin = './bin/sleevage-arm-linux'
  }
  // x64 Linux
  if (arch === 'x64' && platform === 'linux') {
    bin = './bin/sleevage-linux'
  }
  // x64 Mac
  if (arch === 'x64' && platform === 'darwin') {
    bin = './bin/sleevage-mac'
  }
  // ARM-64 Mac
  if (arch === 'arm64' && platform === 'darwin') {
    bin = './bin/sleevage-mac-m1'
  }
  // x64 Windows
  if (arch === 'x64' && platform === 'win32') {
    bin = './bin/sleevage-windows.exe'
  }
  return bin;
}

/**
 * Create accounts from the same Quantum Wallet
 * and output them to a json file
 * @param {int} numAccounts
 */
function createAccounts(numAccounts) {
  const bin = selectSleevageBin();
  if (bin === null) {
    console.error('Error: OS/CPU combination not supported by sleevage');
    process.exit(1);
  }
  execSync(`${bin} -n ${numAccounts} -o ./mnemonics.json -t json`);
  return readJSONFile('./mnemonics.json');
}

/**
 * Select the xxchain binary to use
 * according to OS
 */
function selectChainBin() {
  const platform = os.platform();
  let bin = null;
  // Linux
  if (platform === 'linux') {
    bin = '../bin/xxnetwork-chain-linux'
  }
  // Mac
  if (platform === 'darwin') {
    bin = '../bin/xxnetwork-chain-darwin'
  }
  return bin;
}

/**
 * Create genesis block template for dev network
 */
function createGenesisTemplate() {
  const bin = selectChainBin();
  if (bin === null) {
    console.error('Error: OS not supported by xxnetwork-chain');
    process.exit(1);
  }
  execSync(`${bin} build-spec --chain xxnetwork-dev > template.json`);
  return readJSONFile(genesisTemplateFile);
}

/**
 * Create genesis block for dev network
 */
function createGenesis() {
  const bin = selectChainBin();
  if (bin === null) {
    console.error('Error: OS not supported by xxnetwork-chain');
    process.exit(1);
  }
  execSync(`${bin} build-spec --chain=template.json --raw > genesis.json`);
}

/**
 * Generates accounts and genesis block funding them
 */
async function main() {
  // Generate accounts
  const numAccounts = parseInt(process.argv[2]);
  const accounts = createAccounts(numAccounts);

  // Create genesis template
  let template = createGenesisTemplate();

  // Add chain properties
  template.properties = {
    'ss58Format': 55,
    'tokenDecimals': 9,
    'tokenSymbol': 'xx',
  };

  const funds = parseInt(process.argv[3]) * 10**9;

  // Add funds to each address in genesis template
  accounts.forEach((elem) => {
    template.genesis.runtime.balances.balances.push([elem.Address, funds]);
  });

  // Add funds to ledger address
  template.genesis.runtime.balances.balances.push([LEDGER, funds]);

  // Save genesis template
  saveJSONFile(template, genesisTemplateFile);

  // Create genesis block
  createGenesis();
  fs.rmSync(genesisTemplateFile);
}

main().catch((err) => console.error(err));
