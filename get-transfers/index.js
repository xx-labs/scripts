const { ApiPromise, WsProvider } = require('@polkadot/api');
require('dotenv').config();

/**
 *
 * @param {number} ms miliseconds
 * @returns
 */
async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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
 * Check if node is in sync
 * @param {Promise} api
 * @returns {boolean}
 */
async function checkSynching(api) {
  const health = await api.rpc.system.health();
  return health.isSyncing.toHuman();
}

/**
 * Get api of synchronized xxNetwork Public Node
 * @returns {Promise} chain api
 */
async function getAPI() {
  // Connect to the node
  const api = await connect();

  // Wait for node to be synced
  const isSyncing = await checkSynching(api);
  if (isSyncing) {
    api.disconnect();
    console.log('Node is not synced! Waiting 5 seconds...');
    await wait(5000);
    return getAPI();
  }
  return api;
}

/**
 * Get all transfers in the latest finalized block
 * @param {Object} blockEvents list of events
 * @returns {Object} list of transfers
 */
function getTransfers(blockEvents) {
  const transfers = blockEvents
    .filter((record, idx) =>
      (record.event.section === 'balances' && record.event.method === 'Transfer') &&
      !(blockEvents[idx+1].event.section === 'vesting' && blockEvents[idx+1].event.method === 'VestingUpdated')
    )
    .map(({ event: { data } }) => ({
      from: data[0].toHuman(),
      to: data[1].toHuman(),
      amount: data[2].toHuman(),
    }));
  return transfers;
}

/**
 * Get receipt of successful transfer sent/received by a specified address
 * @param {Promise} api chain api
 * @param {string} address xx network address
 * @param {boolean} sender true if address is the sender
 * @returns {Promise}
 */
async function getReceipt(api, address, sender) {
  console.log('Starting finalized blocks listener...');

  return new Promise((reject, resolve) => {
    api.rpc.chain.subscribeFinalizedHeads(async (header) => {
      // Get block number
      const blockNumber = header.number.toNumber();
      console.log(blockNumber);

      // Get block hash
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

      // Get block events
      const blockEvents = await api.query.system.events.at(blockHash);
      const transfers = getTransfers(blockEvents);
      let transfer;
      if (sender) {
        transfer = transfers.filter((tx) => (tx.from === address));
      } else {
        transfer = transfers.filter((tx) => (tx.to === address));
      }
      if (transfer.length) {
        console.log(`Found Transfer in block #${blockNumber} ${sender ? 'from' : 'to'} ${address}: `, transfer);
        resolve();
      }
    });
  });
}

/**
 * Listen to all new finalized blocks after making sure node is in sync
 * and get receipt of latest committed transfer sent/received by input address
 */
async function main() {
  const api = await getAPI();

  // Insert address of which you want to get a receipt
  const Alice = '6a6XHUGV5mu33rX1vn3iivxxUR4hwoUapsuECGyHpPzfaNtt';
  // const Bob = '6YXN1Q6Lx3u8tr2WVr5myb3zNa3pVG5FL3ku8uqckR5RoA21';

  // Define if that address is the sender or recipient of the transfer
  const sender = true;

  // Subscribe to new finalized blocks
  await getReceipt(api, Alice, sender);
}

main().catch((err) => console.error(err)).finally(() => process.exit());
