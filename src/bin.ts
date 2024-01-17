#!/usr/bin/env node
import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';

import {FeeEstimator} from './estimator.js';

const main = async () => {
    const argv = await yargs(hideBin(process.argv), process.cwd())
        .usage('$0 [options]')
        .option('connection', {
            alias: 'c',
            describe: 'Connection string to bitcoind RPC API. Must be of the form <host>:<port>',
            string: true,
            coerce: (val: string) => ({host: val.split(':')[0], port: Number(val.split(':')[1])}),
            demandOption: true
        })
        .option('username', {
            alias: 'u',
            describe: 'Username used to access bitcoind RPC API',
            string: true,
            demandOption: false
        })
        .option('password', {
            alias: 'p',
            describe: 'Password used to access bitcoind RPC API',
            string: true,
            demandOption: false
        })
        .option('cookie', {
            alias: 'k',
            describe: 'Cookie file to access bitcoind RPC API',
            string: true,
            demandOption: false
        })
        .option('mode', {
            alias: 'm',
            describe: 'Mode used for the estimate (value = txs | bundles)',
            choices: ['txs', 'bundles'] as const,
        })
        .option('refresh', {
            alias: 'r',
            describe: 'Delay in seconds between 2 computations of the estimate',
            number: true
        })
        .help()
        .parse();

    const estimator = new FeeEstimator({
        mode: argv.mode,
        refresh: argv.refresh,
        rpcOptions: {
            host: argv.connection.host,
            port: argv.connection.port,
            username: argv.username,
            password: argv.password,
            cookie: argv.cookie
        }
    });

    estimator.on('fees', (fees) => {
        console.log('Recommended fees are', fees);
    });

    estimator.on('error', (error) => {
        console.error(error);
        process.exit(1);
    });
};

main();
