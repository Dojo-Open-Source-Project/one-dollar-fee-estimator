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

# or globally

npm i -g @samouraiwallet/one-dollar-fee-estimator
```

## Usage

This library can be used both as a CLI tool (like original version) or it can be plugged to your existing Node.js project.
Since it is very lighweight in bundled code as well as required dependencies, it doesn't consume any unnecessary resources.

In order to avoid blocking the main event loop, estimator spawns its own worker thread which makes desired computations. 

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
        password: 'rpcPassword'
    }
})

// handle errors emitted by FeeEstimator
estimator.on('error', (err) => {
    console.error(err)
})

// receive live fee rate updates from the FeeEstimator
estimator.on('fees', (fees) => {
    // fee rates received from FeeEstimator
    // array of four numbers: [number, number, number, number]
    // these fee rates correspond to the targets of [0.5, 0.9, 0.99, 0.999] (probabilities for fee rates for next block)
    receivedFees = fees;
})

// or just read last fee rates directly from the estimator
receivedFees = estimator.feeRates;

// FeeEstimator will continue working until you stop it, or the process is terminated
estimator.stop()

```

### CLI

```shell
node dist/bin.js --connection <host>:<port> --username <username> --password <password> [--mode <mode>] [--refresh <delay>]

# OR when installed via NPM globally

one-dollar-fee-estimator --connection <host>:<port> --username <username> --password <password> [--mode <mode>] [--refresh <delay>]

[-c OR --connection] = Connection string to bitcoind RPC API. Must be of the form <host>:<port>

[-u OR --username] = Username used to access bitcoind RPC API.

[-p OR --password] = Password used to access bitcoind RPC API.

[-m OR --mode] = Mode used for the estimate (value = txs | bundles).

[-r OR --refresh] = Delay in seconds between 2 iterations of the computation.
 ```
