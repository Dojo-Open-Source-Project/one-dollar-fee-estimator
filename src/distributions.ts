type Tx = {
    weight: number
    fee: number,
    depends: number[]
}

/**
 * Build a hashmap of transactions weights
 * @param {Tx[]} txs
 */
export const getTxsDistrib = (txs: Tx[]): Map<number, number> => {
    const weights = new Map<number, number>();

    for (const tx of txs) {
        const weight = tx.weight;
        const fee = tx.fee;

        const vsize = Math.ceil(weight / 4);
        const feerate = fee / vsize;
        const bin = Math.ceil(feerate);

        weights.set(bin, (weights.get(bin) ?? 0) + weight);
    }

    return weights;
};

/**
 * Build a hashmap of bundles weights
 * @param {Tx[]} txs
 */
export const getBundlesDistrib = (txs: Tx[]): Map<number, number> => {
    const weights = new Map<number, number>();
    const d_bundles = new Map<number, Set<number>>();

    for (let i = 1; i < txs.length + 1; i++) {
        const forDeletion = new Set<number>();
        let bundle = new Set<number>([i, ...(txs[i - 1].depends)]);

        if (bundle.size > 1) {
            for (const [k, b] of d_bundles.entries()) {
                // eslint-disable-next-line no-loop-func
                const intersection = new Set([...b].filter((x) => bundle.has(x)));
                if (intersection.size > 0) {
                    bundle = new Set([...bundle.values(), ...b.values()]);
                    forDeletion.add(k);
                }
            }
        }

        d_bundles.set(i, bundle);

        if (forDeletion.size > 0) {
            for (const k of forDeletion.values()) {
                d_bundles.delete(k);
            }
        }
    }

    for (const b of d_bundles.values()) {
        let bundle_weight = 0;
        let bundle_fee = 0;

        for (const i of b.values()) {
            bundle_weight += txs[i - 1].weight;
            bundle_fee += txs[i - 1].fee;
        }

        const bundle_vsize = Math.ceil(bundle_weight / 4);
        const feerate = bundle_fee / bundle_vsize;
        const bin = Math.ceil(feerate);

        weights.set(bin, (weights.get(bin) ?? 0) + bundle_weight);
    }

    return weights;
};
