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

export type RpcOptions = {
  host: string;
  port: number;
  timeout?: number;
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

export type MethodName = "getmempoolinfo" | "getbestblockhash" | "getblockheader" | "getblock" | "getblocktemplate" | "uptime";

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONType;
export type JSONType = { [member: string]: JSONValue } | Array<JSONValue>;

export type RPCResponse = {
  result: JSONValue;
  error: { code: number; message: string; data?: unknown } | null;
  id: number | string;
};

export type RequestOptions = {
  timeout?: number;
  abortSignal?: AbortSignal;
};

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

export type GetBlockHeaderVerbosity = boolean;

export type BlockHeaderV0 = string;

export type BlockHeaderV1 = {
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

export type GetBlockHeaderReturnType<T> = T extends false ? BlockHeaderV0 : T extends true ? BlockHeaderV1 : never;

export type GetBlockVerbosity = 0 | 1;

export type BlockV0 = string;

export type BlockV1 = {
  time: number;
};

export type GetBlockReturnType<T> = T extends 0 ? BlockV0 : T extends 1 ? BlockV1 : never;

export type GetUptimeReturnType = number;
