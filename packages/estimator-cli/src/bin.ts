#!/usr/bin/env node
import path from "node:path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import {
	FeeEstimator,
	type Options,
} from "@samouraiwallet/one-dollar-fee-estimator";

const getHostPort = (val: string): { host: string; port: number } => {
	// Regex pattern for IPv4 or hostname, followed by [optional]:port.
	const pattern = /^([\w.-]+):?(\d+)?$/;
	const match = val.match(pattern);

	if (!match) {
		throw new Error("Invalid format. Expected <host>:<port>");
	}

	const [, host, portStr] = match;

	if (!portStr) {
		throw new Error("No port provided.");
	}

	const port = Number(portStr);

	if (Number.isNaN(port)) {
		throw new TypeError("Invalid port number.");
	}

	if (port <= 0 || port > 65535) {
		throw new Error("Port number out of range. Valid range is 1-65535.");
	}

	return { host, port };
};

const main = async () => {
	const argv = await yargs(hideBin(process.argv), process.cwd())
		.usage("$0 [options]")
		.option("connection", {
			alias: "c",
			describe:
				"Connection string to bitcoind RPC API. Must be of the form <host>:<port>",
			string: true,
			coerce: getHostPort,
			demandOption: true,
		})
		.option("secure", {
			alias: "s",
			describe: "Use HTTPS to connect to bitcoind RPC API",
			boolean: true,
		})
		.option("username", {
			alias: "u",
			describe: "Username used to access bitcoind RPC API",
			string: true,
			conflicts: "cookie",
			implies: "password",
		})
		.option("password", {
			alias: "p",
			describe: "Password used to access bitcoind RPC API",
			string: true,
			conflicts: "cookie",
			implies: "username",
		})
		.option("cookie", {
			alias: "k",
			describe: "Cookie file to access bitcoind RPC API",
			string: true,
			conflicts: ["username", "password"],
			coerce: path.resolve,
		})
		.option("mode", {
			alias: "m",
			describe: "Mode used for the estimate (value = txs | bundles)",
			choices: ["txs", "bundles"] as const,
		})
		.option("refresh", {
			alias: "r",
			describe: "Delay in seconds between 2 computations of the estimate",
			number: true,
		})
		.option("debug", {
			describe: "Enable debug mode",
			boolean: true,
		})
		.help()
		.parse();

	const rpcOptions = ((): Options["rpcOptions"] => {
		if (argv.cookie) {
			return {
				host: argv.connection.host,
				port: argv.connection.port,
				protocol: argv.secure ? "https" : "http",
				cookie: argv.cookie,
			};
		}

		if (argv.username && argv.password) {
			return {
				host: argv.connection.host,
				port: argv.connection.port,
				protocol: argv.secure ? "https" : "http",
				username: argv.username,
				password: argv.password,
			};
		}

		throw new Error(
			"Expected an RPC cookie file path or an RPC username & password",
		);
	})();

	const estimator = new FeeEstimator({
		mode: argv.mode,
		refresh: argv.refresh,
		rpcOptions: rpcOptions,
		debug: argv.debug,
	});

	estimator.on("data", (data) => {
		if (!data.ready)
			console.log("Bitcoind mempool not fully loaded. Fees are unreliable");
		console.log("Recommended fees are", data.fees);
	});

	estimator.on("error", (error) => {
		console.error(error);
		process.exit(1);
	});
};

main();
