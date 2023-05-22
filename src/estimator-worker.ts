import {parentPort, workerData} from 'worker_threads';

import {RPCClient} from './rpc-client.js';
import {delay, median, sum} from './utils.js';
import {RingBuffer} from './ring-buffer.js';
import {getBundlesDistrib, getTxsDistrib} from './distributions.js';

import type {FeeEstimatorOptions, FeeRates, Mode, RpcOptions} from './types';

/**
 * Function estimating the min transaction fee
 * required for the confirmation of a transaction
 * by the next block
 */
// eslint-disable-next-line complexity
const estimateFee = async (rpc_options: RpcOptions, mode: Mode = 'txs', period = 30) => {
    let last_b_hash = null;
    let prev_block_ts = null;
    let prev_weights = new Map<number, number>();
    const nb_samples = Math.floor(10 * 60 / period);
    const delta_weights = new RingBuffer<Map<number, number>>(nb_samples);
    const interblocks = new RingBuffer<number>(144);

    const client = new RPCClient(rpc_options);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const start = Date.now();
        const b_hash = await client.getbestblockhash();

        if (b_hash !== last_b_hash) {
            prev_weights.clear();
            last_b_hash = b_hash;

            const block = await client.getblockheader({blockhash: b_hash, verbose: true});

            if (block) {
                const ts = block.time || 0;

                if (ts > 0) {
                    if (prev_block_ts != null) {
                        const delay = ts - prev_block_ts;
                        interblocks.push(delay);
                    }
                    prev_block_ts = ts;
                }
            }
        }

        const l_interblocks = interblocks.get();
        const nb_interblocks = l_interblocks.length;
        const avg_interblock = nb_interblocks === 0 ? 600 : sum(l_interblocks) / nb_interblocks;

        const b_template = await client.getblocktemplate({
            template_request: {
                rules: ['segwit', 'taproot', 'csv', 'bip34', 'bip65', 'bip66']
            }
        });

        const txs = b_template.transactions;

        const bundles_weights = getBundlesDistrib(txs);
        const lb_feerate = Math.min(...[...bundles_weights.entries()].filter(([, v]) => v > 0).map(([k]) => k));

        const weights = mode === 'txs' ? getTxsDistrib(txs) : bundles_weights;

        let l_delta_weights;

        if (prev_weights.size > 0) {
            l_delta_weights = delta_weights.get();
            const delta = new Map<number, number>();
            const keys = new Set([...weights.keys(), ...prev_weights.keys()]);

            for (const k of keys.values()) {
                const deltas_k = l_delta_weights.map((w) => w.get(k) ?? 0);
                const mdn_deltas_k = l_delta_weights.length === 0 ? 0 : median(deltas_k);
                const d = (weights.get(k) ?? 0) - (prev_weights.get(k) ?? 0);
                delta.set(k, k >= lb_feerate && d >= 0 ? d : mdn_deltas_k);
            }
            if (l_delta_weights.length > 0) {
                for (const k of l_delta_weights.slice(-1).keys()) {
                    if (k < lb_feerate) {
                        delta.set(k, median(l_delta_weights.map((w) => w.get(k) ?? 0)));
                    }
                }
            }
            delta_weights.push(delta);
        }

        l_delta_weights = delta_weights.get();

        let keys = new Set<number>();
        for (const d of l_delta_weights) {
            keys = new Set([...keys.values(), ...d.keys()]);
        }
        const ordered_keys = [...keys.values()];
        ordered_keys.sort((a, b) => b - a); // descending sort

        const min_fees: number[] = [];
        const tgt_proba = [0.5, 0.9, 0.99, 0.999] as const;
        for (const p of tgt_proba) {
            const cmptd_weights = new Map(weights);
            const mdn_delta_weights = new Map<number, number>();
            const tgt_delay = Math.ceil(-avg_interblock * Math.log(1 - p));

            for (const k of ordered_keys) {
                mdn_delta_weights.set(k, median(l_delta_weights.map((d) => d.get(k) ?? 0)));
                cmptd_weights.set(k, ((cmptd_weights.get(k) ?? 0) + (mdn_delta_weights.get(k) ?? 0) * tgt_delay / period));
            }

            if (sum([...cmptd_weights.values()]) < 4000000) {
                min_fees.push(1);
            } else {
                let weight = sum([...weights.entries()].filter(([k]) => k < lb_feerate).map(([, v]) => v));
                for (const k of ordered_keys) {
                    if (k <= lb_feerate) {
                        min_fees.push(lb_feerate);
                        break;
                    } else {
                        weight += cmptd_weights.get(k) ?? 0;
                        if (weight >= 4000000) {
                            min_fees.push(k);
                            break;
                        }
                    }
                }
            }
        }

        // send recommended fees to main thread
        parentPort?.postMessage(min_fees as unknown as FeeRates);

        prev_weights = new Map(weights);

        const elapsed = Date.now() - start;

        if (elapsed < period * 1000) {
            await delay((period * 1000) - elapsed);
        }
    }
};

parentPort?.on('message', (value) => {
    if (value === 'stop') {
        process.exit(0);
    }
});

const doWork = async () => {
    const receivedData = workerData as FeeEstimatorOptions;
    return await estimateFee(receivedData.rpcOptions, receivedData.mode, receivedData.refresh);
};

doWork();
