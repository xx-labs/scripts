# scripts

This repository contains example scripts in JS for xx network basic interactions.

### localnet
This directory includes a makefile and binaries to run a single-node local xx network blockchain in dev mode.

In order to download the binaries, git lfs is used.
Refer to  https://git-lfs.github.com/ in order to install this tool.

You can also compile the chain binary directly from the source [xxchain](https://github.com/xx-labs/xxchain). 

You can run the local network using the Makefile:
 ```
cd localnet
make run
 ```

To stop the network, simply do `make stop`.

#### localnet/generate

The standard substrate dev accounts can be used in the network. Furthermore, there are extra accounts
funded, which can be found in `generate/mnemonics.json`.

New accounts and a new genesis block can be generated running `make generate`. The number of accounts
to generate, and the funds to credit to each can be defined in the makefile variables `accounts` and `funds`.
The default values are `10` accounts with `1000` coins each.

#### localnet/backup

To use the generated accounts, the keyring file found in `backup/backup.json` can be imported into the [explorer](https://explorer.xx.network).

In `backup/index.js` there are some global variables that define the arguments of the backup generation program:
- `accountPrefixName` - accounts will be named with this prefix and followed by its index
- `accountsPassword` - password used to encrypt all the accounts (you can set a list of passwords. size of array needs to match `numAccounts`)
- `filePassword` - password used to encrypt the content of the json file to be uploaded in the explorer
- `backupFile` - name of the generated json file to be uploaded in the explorer

If new accounts are generated as described above, start the network using `make run` and then 
run `make create-backup` to create the new backup file containing those accounts.


### walletgen
This directory contains a script with an example of how to generate an xx network Sleeve wallet.
It uses golang code compiled to WASM to generate the quantum-secure wallet, and
`@polkadot/keyring` to create a standard xx network wallet from the Sleeve's output mnemonic.

### address-validation
This directory contains a script with address validation logic for xx network.
It has examples of valid and invalid xx network addresses,
and valid addresses on other networks, which are invalid in xx network.

### get-transfers
This directory contains a script with logic to detect a transfer starting from a specified address.

In order to run this script, first start the local network as described above.

### transactions + offline-sign
These two directories contain scripts that should be used together.
The scripts demonstrate a way to generate transactions connected to a node, but doing the actual
signing on a separate offline machine.

The transactions script has an example of creating a transfer extrinsic, sending 1000 coins
from Alice to Bob. These 2 accounts are included in the dev network.
The script will output the signing payload to the console and wait for the signature to proceed.

The offline-sing script simply waits for a signing payload to be input into the console, and will
sign it using Alice's wallet. Then it outputs the signature, which can be input into the first script.

In order to run these script, first start the local network as described above.
