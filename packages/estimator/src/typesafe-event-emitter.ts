/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";

export interface EventMap extends Record<string, any[]> {}

// eslint-disable-next-line unicorn/prefer-event-target
export class TypedEventEmitter<T extends EventMap> extends EventEmitter {
  emit<K extends keyof T & string>(event: K, ...args: T[K]): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof T & string>(event: K, listener: (...args: T[K]) => void): this {
    return super.on(event, listener as (...args: any[]) => void);
  }

  off<K extends keyof T & string>(event: K, listener: (...args: T[K]) => void): this {
    return super.off(event, listener as (...args: any[]) => void);
  }
}
