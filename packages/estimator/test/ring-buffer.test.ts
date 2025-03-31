import { describe, it, assert } from "vitest";

import { RingBuffer } from "../src/ring-buffer";

describe("RingBuffer", () => {
	it("should not go after set maxSize", () => {
		const buffer = new RingBuffer(3);
		for (let i = 1; i < 10; i++) {
			buffer.push(i);
		}

		assert.strictEqual(buffer.get().length, 3);
	});

	it("should have correct structure for less items than maxSize", () => {
		const buffer = new RingBuffer<number>(10);

		for (let i = 1; i < 8; i++) {
			buffer.push(i);
		}

		assert.deepStrictEqual(buffer.get(), [1, 2, 3, 4, 5, 6, 7]);
	});

	it("should have correct structure for more items than maxSize", () => {
		const buffer = new RingBuffer<number>(11);

		for (let i = 1; i < 15; i++) {
			buffer.push(i);
		}

		assert.deepStrictEqual(
			buffer.get(),
			[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		);
	});
});
