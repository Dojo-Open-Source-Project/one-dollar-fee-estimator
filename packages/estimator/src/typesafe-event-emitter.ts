/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "node:events";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export interface EventMap extends Record<string, any[]> {}

// eslint-disable-next-line unicorn/prefer-event-target
export class TypedEventEmitter<T extends EventMap> extends EventEmitter {
	emit<K extends keyof T & string>(event: K, ...args: T[K]): boolean {
		return super.emit(event, ...args);
	}

	on<K extends keyof T & string>(
		event: K,
		listener: (...args: T[K]) => void,
	): this {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return super.on(event, listener as (...args: any[]) => void);
	}

	off<K extends keyof T & string>(
		event: K,
		listener: (...args: T[K]) => void,
	): this {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return super.off(event, listener as (...args: any[]) => void);
	}
}
