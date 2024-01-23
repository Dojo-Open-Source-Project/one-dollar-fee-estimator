# The $1 Fee Estimator CLI
## @samouraiwallet/one-dollar-fee-estimator-cli

This is a CLI tool for users that want to run [The $1 Fee Estimator](https://code.samourai.io/dojo/one-dollar-fee-estimator-js) locally in terminal

## Requirements
- Node.js v16 or newer
- NPM (or yarn or pnpm)
- Synchnonized Bitcoin Core with accessible RPC

## Installation
```shell
# install globally
npm i -g @samouraiwallet/one-dollar-fee-estimator-cli
```

## Usage

### Node.js

See [@samouraiwallet/one-dollar-fee-estimator](../estimator)

### CLI

```shell
# when installed via NPM globally

one-dollar-fee-estimator --connection <host>:<port> --username <username> --password <password> [--mode <mode>] [--refresh <delay>]

# OR using NPX

npx @samouraiwallet/one-dollar-fee-estimator-cli --connection <host>:<port> --username <username> --password <password> [--mode <mode>] [--refresh <delay>]

[-c OR --connection] = Connection string to bitcoind RPC API. Must be of the form <host>:<port>

[-u OR --username] = Username used to access bitcoind RPC API.

[-p OR --password] = Password used to access bitcoind RPC API.

[-k OR --cookie] = Cookie used to access bitcoind RPC API instead of username and password.

[-m OR --mode] = Mode used for the estimate (value = txs | bundles).

[-r OR --refresh] = Delay in seconds between 2 iterations of the computation.

[--debug] = Display debug information in logs
 ```
