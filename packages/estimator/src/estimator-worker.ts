import { parentPort, workerData, isMainThread, Worker, MessageChannel, MessagePort } from "worker_threads";
import { fileURLToPath } from "url";

import { RPCClient } from "./rpc-client.js";
import { createDebugLog, abortableDelay, median, sum, typedObjectKeys } from "./utils.js";
import { RingBuffer } from "./ring-buffer.js";
import { getBundlesDistrib, getTxsDistrib } from "./distributions.js";

import type { FeeEstimatorOptions, FeeRates, Result } from "./types";

const initialFees: FeeRates = {
  "0.1": 1,
  "0.2": 1,
  "0.5": 1,
  "0.9": 1,
  "0.99": 1,
  "0.999": 1,
};

/**
 * Function estimating the min transaction fee
 * required for the confirmation of a transaction
 * by the next block
 */
// eslint-disable-next-line complexity
const estimateFee = async function* (options: FeeEstimatorOptions, abortController?: AbortController): AsyncGenerator<Result, void, unknown> {
  const { rpcOptions, mode = "txs", refresh = 30, debug } = options;
  const debugLog = createDebugLog(debug);

  debugLog("Estimator: Initialized with options:", options);

  let bitcoindUptime = 0;
  let last_b_hash = null;
  let prev_block_ts = null;
  let prev_weights = new Map<number, number>();
  const nb_samples = Math.floor((10 * 60) / refresh);
  const delta_weights = new RingBuffer<Map<number, number>>(nb_samples);
  const interblocks = new RingBuffer<number>(144);

  const client = new RPCClient(rpcOptions);
  debugLog("Estimator: Initialized RPC client");

  // Detect stop signal
  let abort = false;
  if (abortController) {
    abortController.signal.addEventListener(
      "abort",
      () => {
        abort = true;
      },
      { once: true },
    );
  }

  let lastFees = initialFees;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (abort) {
      return;
    }
    const start = Date.now();
    debugLog("Estimator: Starting new iteration", new Date(start).toJSON());

    try {
      const [b_hash, uptime] = await Promise.all([client.getbestblockhash(), client.getuptime()]);

      bitcoindUptime = uptime;

      if (b_hash !== last_b_hash) {
        prev_weights.clear();
        last_b_hash = b_hash;

        const block = await client.getblockheader({ blockhash: b_hash, verbose: true });

        debugLog("Detected new block:", block.height, b_hash);

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
    } catch (error) {
      console.error("Estimator: Encountered RPC error:", error);
      yield { fees: lastFees, bitcoindUptime };
      await abortableDelay(refresh * 1000);
      continue;
    }

    const l_interblocks = interblocks.get();
    const nb_interblocks = l_interblocks.length;
    const avg_interblock = nb_interblocks === 0 ? 600 : sum(l_interblocks) / nb_interblocks;

    let b_template;
    try {
      b_template = await client.getblocktemplate({
        template_request: {
          rules: ["segwit", "taproot", "csv", "bip34", "bip65", "bip66"],
        },
      });
    } catch (error) {
      console.error("Estimator: Encountered RPC error:", error);
      yield { fees: lastFees, bitcoindUptime };
      await abortableDelay(refresh * 1000);
      continue;
    }

    const txs = b_template.transactions;

    const bundles_weights = getBundlesDistrib(txs);
    const lb_feerate = Math.min(...[...bundles_weights.entries()].filter(([, v]) => v > 0).map(([k]) => k));

    const weights = mode === "txs" ? getTxsDistrib(txs) : bundles_weights;

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

    const min_fees: FeeRates = { ...initialFees };

    const tgt_proba = typedObjectKeys(min_fees);

    for (const p of tgt_proba) {
      const cmptd_weights = new Map(weights);
      const mdn_delta_weights = new Map<number, number>();
      const tgt_delay = Math.ceil(-avg_interblock * Math.log(1 - Number(p)));

      for (const k of ordered_keys) {
        mdn_delta_weights.set(k, median(l_delta_weights.map((d) => d.get(k) ?? 0)));
        cmptd_weights.set(k, (cmptd_weights.get(k) ?? 0) + ((mdn_delta_weights.get(k) ?? 0) * tgt_delay) / refresh);
      }

      if (sum([...cmptd_weights.values()]) < 4000000) {
        min_fees[p] = 1;
      } else {
        let weight = sum([...weights.entries()].filter(([k]) => k < lb_feerate).map(([, v]) => v));
        for (const k of ordered_keys) {
          if (k <= lb_feerate) {
            min_fees[p] = lb_feerate;
            break;
          } else {
            weight += cmptd_weights.get(k) ?? 0;
            if (weight >= 4000000) {
              min_fees[p] = k;
              break;
            }
          }
        }
      }
    }

    yield { fees: min_fees, bitcoindUptime };

    lastFees = { ...min_fees };

    prev_weights = new Map(weights);

    const elapsed = Date.now() - start;

    debugLog("Estimator: Done, cycle lasted", elapsed / 1000, "sec");

    if (elapsed < refresh * 1000) {
      await abortableDelay(refresh * 1000 - elapsed, abortController);
    }
  }
};

const doWork = async (options: FeeEstimatorOptions, messagePort?: MessagePort) => {
  const port = isMainThread ? messagePort! : parentPort!;

  const abortController = new AbortController();

  port.on("message", (value) => {
    if (value === "stop") {
      abortController.abort();
      port.close();
    }
  });

  for await (const result of estimateFee(options, abortController)) {
    // send recommended fees over message port
    port.postMessage(result);
  }
};

if (!isMainThread) {
  const receivedOptions = workerData as FeeEstimatorOptions;
  doWork(receivedOptions);
}

export const initEstimator = (options: FeeEstimatorOptions) => {
  if (options.useWorker) {
    const __filename = fileURLToPath(import.meta.url);
    return new Worker(__filename, { workerData: options });
  } else {
    const channel = new MessageChannel();
    doWork(options, channel.port2);
    return channel.port1;
  }
};
