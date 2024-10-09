# Changelog

## v0.7.0
- use `@samouraiwallet/bitcoin-rpc` client

## v0.6.0
- return `ready: false` on error

## v0.5.0
- changed output shape
- last block information now contains `time`

## v0.4.0
- added `lastBlockHeigh` and `lastBlockHash` to output
- better abort signal handling
- export more types

## v0.3.1
- use `getmempoolinfo` to detect ready state
- minor API change - see [README.md](./README.md)

## v0.2.0
### Major rewrite
- ability to use separate worker process for estimator is now optional
- support for bitcoin cookie file (credit `ottosch`)
- changed output format - see [README.md](./README.md)
- CLI support extracted into separate package

## v0.1.0
### Initial release
