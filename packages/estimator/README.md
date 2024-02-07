# The $1 Fee Estimator
## @samouraiwallet/one-dollar-fee-estimator

This library is a Typescript port of the original Python library - [The $1 Fee Estimator](https://code.samourai.io/oxt/one_dollar_fee_estimator/).

> The $1 Fee Estimator is an algorithm designed to return a feerate:
>
> - allowing the confirmation of a Bitcoin transaction by the next block,
> - lower than the median feerate paid by the transactions included in the next block.
>
> Despite its simplicity, the $1 Fee Estimator requires very few data to perform well and is less than 200 lines of code, making it easy to deploy or to implement in all programming languages.

See [original README](https://code.samourai.io/oxt/one_dollar_fee_estimator/-/blob/master/README.md) to understand how this algorithm works.

## Requirements
- Node.js v16 or newer
- NPM (or yarn or pnpm)
- Synchnonized Bitcoin Core with accessible RPC

## Installation
```shell
npm i @samouraiwallet/one-dollar-fee-estimator
```

## Usage

### CLI
See [@samouraiwallet/one-dollar-fee-estimator-cli](../estimator-cli)

### Node.js

```javascript
import {FeeEstimator} from '@samouraiwallet/one-dollar-fee-estimator';

let receivedFees; // variable you want to store received fee rates in

const estimator = new FeeEstimator({
    mode: 'txs', // 'txs' | 'bundles' - optional, default 'txs'
    refresh: 30, // optional, default 30 - interval in seconds, setting too low can cause unexpected errors
    rpcOptions: {
        host: 'localhost',
        port: 8332,
        username: 'rpcUsername',
        password: 'rpcPassword',
        cookie: 'path/to/cookiefile' // optionally use cookie instead of username & password
    },
    useWorker: true, // optional, default false, set to true if your want to run estimator in a worker thread to prevent blocking of main thread
    debug: true // optional, default false, set to true if you want to see debug logs
})

// handle errors emitted by FeeEstimator
estimator.on('error', (err) => {
    console.error(err)
})

// receive live fee rate updates from the FeeEstimator
estimator.on('data', (result) => {
    // fee rates and ready status received from FeeEstimator
    // object of targets and their feerates: 
    // {
    //  ready: true,
    //  lastBlock: {
    //    height: 829364,
    //    hash: "00000000000000000001f3eb6464cd19b0a8a1f3a98b1b0af83ba9b4a4c0b259",
    //    time: 1707310080,
    //  }
    //  fees: {
    //    "0.1": number,
    //    "0.2": number,
    //    "0.5": number,
    //    "0.9": number,
    //    "0.99": number,
    //    "0.999": number,
    //   }
    // }
    // `ready` field signals that the mempool of the bitcoind is synchronized
    // calculated fee rates are unreliable if ready=false
    if (result.ready) {
      // these targets are probabilities for fee rates for next block (10%, 20%, 50%, ...)
      receivedFees = result.fees;
    }
})

// or just read last fee rates directly from the estimator
if (estimator.data.ready) {
    receivedFees = estimator.data.fees;
}

// FeeEstimator will continue working until you stop it, or the process is terminated
estimator.stop()

```
