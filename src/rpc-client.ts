import * as http from 'http';
import * as https from 'https';
import JSONBigInt from 'json-bigint';

import type {
    GetBlockHeaderVerbosity,
    GetBlockHeaderReturnType,
    GetBlockReturnType,
    GetBlockTemplateReturnType,
    GetBlockVerbosity,
    JSONType,
    JSONValue,
    MethodName,
    RequestOptions,
    RPCResponse
} from './types';

const {parse} = JSONBigInt({storeAsString: true, strict: true});
import { readFileSync, accessSync, constants } from 'fs';

/**
 * List of networks and their default port mapping.
 */

const networks = {
    mainnet: 8332,
    regtest: 18332,
    signet: 38332,
    testnet: 18332,
};

type RPCOptions = {
    network?: keyof typeof networks;
    host?: string;
    port?: number;
    ssl?: boolean;
    username?: string;
    password?: string;
    cookie?: string;
    timeout?: number;
}

const isRPCResponse = (payload: unknown): payload is RPCResponse => {
    return typeof payload === 'object' && payload !== null && 'result' in payload && 'error' in payload && 'id' in payload;
};

export class RPCClient {
    private readonly username: string;
    private readonly password: string;
    private readonly host: string;
    private readonly port: number;
    private readonly ssl: boolean;
    private readonly timeout: number;
    private readonly agent: http.Agent | https.Agent;

    constructor({
        host = 'localhost',
        port,
        network = 'mainnet',
        username,
        password,
        cookie,
        ssl = false,
        timeout = 30000,
    }: RPCOptions) {
        if (!networks[network]) {
            throw new Error(`Invalid network name ${network}`);
        }

        if (cookie) {
            try {
                accessSync(cookie, constants.R_OK);
            } catch {
                throw new Error(`Can't read cookie file: ${cookie}`);
            }

            let tokens = readFileSync(cookie).toString().split(":");
            if (tokens.length != 2) {
                throw new Error('Cookie file is invalid');
            }

            username = tokens[0];
            password = tokens[1];
        }

        if (!username || !password) {
            throw new Error('Unathenticated RPC communication is not supported. Provide valid username and password');
        }

        this.username = username;
        this.password = password;

        this.host = host;
        this.port = port || networks[network];
        this.ssl = ssl;
        this.timeout = timeout;

        this.agent = this.ssl ? new https.Agent({keepAlive: true}) : new http.Agent({keepAlive: true});
    }

    private createRequest = (reqBody: JSONType, options?: RequestOptions) => {
        const client = this.ssl ? https : http;

        const body = JSON.stringify(reqBody);

        const request = client.request({
            host: this.host,
            port: this.port,
            path: '/',
            protocol: this.ssl ? 'https:' : 'http:',
            agent: this.agent,
            method: 'POST',
            timeout: options?.timeout ?? this.timeout,
            auth: `${this.username}:${this.password}`,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
        });

        return {request, body};
    };

    private makeRequest = <T extends JSONValue>({method, parameters = [], suffix}: {
        method: MethodName;
        parameters?: JSONType;
        suffix?: string;
    }, options?: RequestOptions) => {
        return new Promise<T>((resolve, reject) => {
            const {request, body} = this.createRequest({
                id: `${Date.now()}${suffix == null ? '' : `-${suffix}`}`,
                method,
                params: parameters,
            }, options);

            let responseData = '';

            request.on('response', (res) => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`Received invalid status code: ${res.statusCode}`));
                }

                if (res.headers['content-type'] !== 'application/json') {
                    return reject(new Error(`Received invalid content-type: ${res.headers['content-type']}`));
                }

                res.setEncoding('utf8');
                res.on('data', (data) => {
                    responseData += data;
                });
                res.on('end', () => {
                    // use json-bigint to parse big numbers
                    const parsed = parse(responseData);

                    if (isRPCResponse(parsed)) {
                        if (parsed.error == null) {
                            resolve(parsed.result as T);
                        } else {
                            reject(new Error(`Code: ${parsed.error.code}, ${parsed.error.message}`));
                        }
                    } else {
                        reject(new Error(`Received invalid RPC response: ${parsed}`));
                    }
                });
                res.on('error', (err) => {
                    reject(err);
                });
            });

            request.on('error', (err) => {
                reject(err);
            });

            request.write(body);
            request.end();
        });
    };

    public getbestblockhash = async (): Promise<string> => {
        return await this.makeRequest<string>({method: 'getbestblockhash'});
    };

    public getblockheader = async <V extends GetBlockHeaderVerbosity>({ blockhash, verbose}: {
        blockhash: string,
        verbose: V
    }): Promise<GetBlockHeaderReturnType<V>> => {
        return await this.makeRequest({method: 'getblockheader', parameters: {blockhash, verbose}});
    };

    public getblock = async <N extends GetBlockVerbosity>({blockhash, verbosity}: {
        blockhash: string,
        verbosity: N
    }): Promise<GetBlockReturnType<N>> => {
        return await this.makeRequest({method: 'getblock', parameters: {blockhash, verbosity}});
    };

    public getblocktemplate = async (obj: JSONType): Promise<GetBlockTemplateReturnType> => {
        return await this.makeRequest({method: 'getblocktemplate', parameters: obj});
    };
}
