import { Worker, MessagePort } from "worker_threads";

import type { FeeEstimatorOptions, Result } from "./types";
import { TypedEventEmitter, EventMap } from "./typesafe-event-emitter.js";
import { initEstimator } from "./estimator-worker.js";

interface Events extends EventMap {
  data: [Result];
}

export type Options = FeeEstimatorOptions & { useWorker?: boolean };

// eslint-disable-next-line unicorn/prefer-event-target
export class FeeEstimator extends TypedEventEmitter<Events> {
  private readonly estimator: Worker | MessagePort;
  private _data: Result;

  constructor(options: Options) {
    super();

    this._data = {
      ready: false,
      fees: {
        "0.1": 1,
        "0.2": 1,
        "0.5": 1,
        "0.9": 1,
        "0.99": 1,
        "0.999": 1,
      },
    };

    this.estimator = initEstimator(options);

    this.estimator.on("message", this.onWorkerMessage);
    this.estimator.on("error", this.onWorkerError);
    this.estimator.on("exit", this.onWorkerExit);

    process.on("SIGINT", () => this.stop());
    process.on("SIGTERM", () => this.stop());
  }

  private onWorkerMessage = (data: Result) => {
    this._data = data;
    this.emit("data", data);
  };

  private onWorkerError = (error: Error) => {
    this.emit("error", error);
  };

  private onWorkerExit = (code: number) => {
    if (code !== 0) {
      this.emit("error", new Error(`FeeEstimator worker stopped with ${code} exit code`));
    }
  };

  public get data(): Result {
    return this._data;
  }

  public stop = () => {
    this.estimator.postMessage("stop");
  };
}
