const { ApiPromise, WsProvider } = require('@polkadot/api');
require('dotenv').config();

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Connect to xxNetwork Public Node thorugh a websocket
 * @return {api} chain api
 */
async function connect() {
  const provider = new WsProvider(process.env.WS_CHAIN);
  const api = await ApiPromise.create({
    provider,
  });
  await api.isReady;
  return api;
}

async function checkSynching(api) {
  const health = await api.rpc.system.health();
  return health.isSyncing.toHuman();
}

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
function getTransfers(blockEvents) {
  const transfers = blockEvents
    .filter((record) => (record.event.section === 'balances' && record.event.method === 'Transfer'))
    .map(({ event: { data } }) => ({
      from: data[0].toHuman(),
      to: data[1].toHuman(),
      amount: data[2].toHuman(),
    }));
  return transfers;
}

async function main() {
  const api = await getAPI();

  const address = '1qnJN7FViy3HZaxZK9tGAA71zxHSBeUweirKqCaox4t8GT7';

  // Subscribe to new blocks
  console.log('Starting block listener...');
  const unsub = await api.rpc.chain.subscribeNewHeads(async (header) => {
  // Get block number
    const blockNumber = header.number.toNumber();
    console.log(blockNumber);

    // Get block hash
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

    // Get block events
    const blockEvents = await api.query.system.events.at(blockHash);
    const transfers = getTransfers(blockEvents);

    const fromAddr = transfers.some((transfer) => (transfer.from === address));
    const toAddr = transfers.some((transfer) => (transfer.to === address));
    if (fromAddr) {
      unsub();
      console.log('Found Transfer From Address: ', address);
    }

    if (toAddr) {
      unsub();
      console.log('Found Transfer To Address: ', address);
    }
  });
}

main().catch((err) => console.error(err)).finally(() => process.exit());
