import {describe, it, assert} from 'vitest';

import * as utils from '../src/utils.js';

describe('utils module', () => {
    describe('sum()', () => {
        it('should return correct sum of numbers in array', () => {
            assert.strictEqual(utils.sum([1, 5, 3, 20, 100, 4]), 133);
        });

        it('should return zero on empty array', () => {
            assert.strictEqual(utils.sum([]), 0);
        });
    });

    describe('median()', () => {
        it('should return correct median value for array of values', () => {
            assert.strictEqual(utils.median([1, 1, 5, 5, 10]), 5);
        });

        it('should return correct median value for array of unsorted values', () => {
            assert.strictEqual(utils.median([5, 5, 10, 1, 1]), 5);
        });

        it('should return single value if array contains single value', () => {
            assert.strictEqual(utils.median([33]), 33);
        });

        it('should return NaN when array is empty', () => {
            assert.strictEqual(Number.isNaN(utils.median([])), true);
        });
    });
});
