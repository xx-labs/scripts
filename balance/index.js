const { ApiPromise, WsProvider } = require('@polkadot/api');
const readline = require('readline');
require('dotenv').config();

const ALICE = '6a6XHUGV5mu33rX1vn3iivxxUR4hwoUapsuECGyHpPzfaNtt';

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

async function main () {
    // Connect to the node
    const api = await connect();

    // Get account data
    const data = await api.query.system.account(ALICE);

    // Total balance is sum of free and reserved
    const balance = data.data.free.add(data.data.reserved);

    console.log(balance.toString());

    // Get account data at a past block (wait 20 seconds to let some blocks be produced)
    await new Promise(r => setTimeout(r, 20000));
    const hash = await api.rpc.chain.getBlockHash(2);
    const apiAt = await api.at(hash);
    const pastdata = await apiAt.query.system.account(ALICE);
    const pastBalance = pastdata.data.free.add(pastdata.data.reserved);

    console.log(pastBalance.toString());
}

main().catch(console.error).finally(() => process.exit());
