export type FeeRates = {
	"0.1": number;
	"0.2": number;
	"0.5": number;
	"0.9": number;
	"0.99": number;
	"0.999": number;
};

export type Block = {
	height: number;
	hash: string;
	time: number;
} | null;

export type Result = {
	ready: boolean;
	lastBlock: Block;
	fees: FeeRates;
};

export type Mode = "txs" | "bundles";

export type Protocol = "http" | "https";

export type RpcOptions = {
	host: string;
	port: number;
	timeout?: number;
	protocol: Protocol;
} & (
	| {
			username: string;
			password: string;
	  }
	| {
			cookie: string;
	  }
);

export type FeeEstimatorOptions = {
	mode?: Mode;
	refresh?: number;
	debug?: boolean;
	useWorker?: boolean;
	rpcOptions: RpcOptions;
};

// RPC client

export type GetMempoolInfoReturnType = {
	loaded: boolean;
	size: number;
	bytes: number;
	usage: number;
	total_fee: number;
	maxmempool: number;
	mempoolminfee: number;
	minrelaytxfee: number;
	unbroadcastcount: number;
};

export type GetBlockTemplateReturnType = {
	transactions: {
		weight: number;
		fee: number;
		depends: number[];
	}[];
};

export type GetBlockHeaderReturnType = {
	hash: string;
	confirmations: number;
	height: number;
	version: number;
	versionHex: string;
	merkleroot: string;
	time: number;
	mediantime: number;
	nonce: number;
	bits: string;
	difficulty: number;
	chainwork: string;
	nTx: number;
	previousblockhash: string;
	nextblockhash: string;
};
