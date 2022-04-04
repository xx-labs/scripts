# scripts

This repository contains example scripts in JS for xx network basic interactions.

### localnet
This directory includes a makefile and binaries to run a single-node local xx network blockchain in dev mode.

In order to download the binaries, git lfs is used.
Refer to  https://git-lfs.github.com/ in order to install this tool.

You can run the local network using the Makefile:
 ```
cd localnet
make run
 ```

To stop the network, simply do `make stop`.

### walletgen
This directory contains a script with an example of how to generate an xx network Sleeve wallet.
It uses golang code compile to WASM to generate the quantum-secure wallet, and
`@polkadot/keyring` to create a standard xx network wallet from the Sleeve's output mnemonic.

### address-validation
This directory contains a script with address validation logic for xx network.
It has examples of valid and invalid xx network addresses,
and valid addresses on other networks, which are invalid in xx network.

### get-transfers
This directory contains a script with logic to detect a transfer starting from a specified address.

In order to run this script, first start the local network as described above.

### transactions
This directory contains a script with an example of an extrinsic (transaction) being created,
signed and submitted to the local network.
The transaction is a transfer from Alice to Bob, 2 dev accounts included in the dev network.

In order to run this script, first start the local network as described above.
