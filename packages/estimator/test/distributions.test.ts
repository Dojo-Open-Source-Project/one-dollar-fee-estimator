import { describe, it, assert} from 'vitest';

import {getTxsDistrib, getBundlesDistrib} from '../src/distributions';

const mockTxs = [
    {
        weight: 200,
        fee: 300,
        depends: []
    },
    {
        weight: 100,
        fee: 300,
        depends: []
    },
    {
        weight: 200,
        fee: 200,
        depends: [1]
    },
    {
        weight: 150,
        fee: 150,
        depends: []
    },
    {
        weight: 200,
        fee: 500,
        depends: [2]
    },
    {
        weight: 150,
        fee: 300,
        depends: []
    }
];

const expectedTxsDistribResult = [
    [6, 200],
    [12, 100],
    [4, 350],
    [10, 200],
    [8, 150]
];

const expectedBundleDistribResult = [
    [5, 400],
    [4, 150],
    [11, 300],
    [8, 150]
];

describe('distributions', () => {
    describe('getTxsDistrib()', () => {
        it('should properly compute TXs distributions', () => {
            const results = getTxsDistrib(mockTxs);

            assert.deepStrictEqual([...results.entries()], expectedTxsDistribResult);
        });
    });

    describe('getBundlesDistrib()', () => {
        it('should properly compute bundles distributions', () => {
            const results = getBundlesDistrib(mockTxs);

            assert.deepStrictEqual([...results.entries()], expectedBundleDistribResult);
        });
    });
});
