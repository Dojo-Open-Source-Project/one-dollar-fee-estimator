import {Worker} from 'worker_threads';
import {EventEmitter} from 'events';
import {fileURLToPath} from 'url';
import path from 'path';

import type {FeeEstimatorOptions, FeeRates} from './types';

// eslint-disable-next-line unicorn/prefer-event-target
export class FeeEstimator extends EventEmitter {
    private readonly worker: Worker;
    private _feeRates: FeeRates;

    constructor(options: FeeEstimatorOptions) {
        super();

        this._feeRates = [1, 1, 1, 1];

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        this.worker = new Worker(path.join(__dirname, './estimator-worker.js'), {workerData: options});

        this.worker.on('message', this.onWorkerMessage);
        this.worker.on('error', this.onWorkerError);
        this.worker.on('exit', this.onWorkerExit);

        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    private onWorkerMessage = (data: FeeRates) => {
        this._feeRates = data;
        this.emit('fees', data);
    };

    private onWorkerError = (error: Error) => {
        this.emit('error', error);
    };

    private onWorkerExit = (code: number) => {
        if (code !== 0) {
            this.emit('error', new Error(`FeeEstimator worker stopped with  ${code} exit code`));
        }
    };

    public get feeRates(): FeeRates {
        return this._feeRates;
    }

    public stop = () => {
        this.worker.postMessage('stop');
    };
}
