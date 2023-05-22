
export type FeeRates = readonly [number, number, number, number];

export type Mode = 'txs' | 'bundles';

export type RpcOptions = {
    host: string
    port: number
    username: string
    password: string
    timeout?: number
}

export type FeeEstimatorOptions = {
    mode?: Mode;
    refresh?: number;
    rpcOptions: RpcOptions;
}

// RPC client

export type MethodName =
    | 'getbestblockhash'
    | 'getblockheader'
    | 'getblock'
    | 'getblocktemplate'

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONType;
export type JSONType = { [member: string]: JSONValue } | Array<JSONValue>;

export type RPCResponse = {
    result: JSONValue,
    error: { code: number, message: string, data?: unknown } | null;
    id: number | string;
}

export type RequestOptions = {
    timeout?: number;
}

export type GetBlockTemplateReturnType = {
    transactions: {
        weight: number
        fee: number,
        depends: number[]
    }[]
}

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
}

export type GetBlockHeaderReturnType<T> =
    T extends false ? BlockHeaderV0 :
        T extends true ? BlockHeaderV1 :
            never;

export type GetBlockVerbosity = 0 | 1;

export type BlockV0 = string;

export type BlockV1 = {
    time: number;
}

export type GetBlockReturnType<T> =
    T extends 0 ? BlockV0 :
        T extends 1 ? BlockV1 :
            never;
