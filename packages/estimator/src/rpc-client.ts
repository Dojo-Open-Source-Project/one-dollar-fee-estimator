import * as http from "http";
import * as https from "https";
import { readFileSync } from "fs";

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
  RPCResponse,
  GetUptimeReturnType,
  GetMempoolInfoReturnType,
} from "./types";

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
};

const isRPCResponse = (payload: unknown): payload is RPCResponse => {
  return typeof payload === "object" && payload !== null && "result" in payload && "error" in payload && "id" in payload;
};

export class RPCClient {
  private readonly username: string;
  private readonly password: string;
  private readonly host: string;
  private readonly port: number;
  private readonly ssl: boolean;
  private readonly timeout: number;
  private readonly agent: http.Agent | https.Agent;

  constructor(options: RPCOptions) {
    this.validateNetwork(options.network);

    const credentials = this.getCredentials(options);
    this.username = credentials.username;
    this.password = credentials.password;

    const defaults = this.getDefaults(options);
    this.host = defaults.host;
    this.port = defaults.port;
    this.ssl = defaults.ssl;
    this.timeout = defaults.timeout;

    this.agent = this.instantiateAgent(this.ssl);
  }

  private validateNetwork(network?: keyof typeof networks) {
    if (network && !networks[network]) {
      throw new Error(`Invalid network name ${network}`);
    }
  }

  private getCredentials(options: RPCOptions): { username: string; password: string } {
    // eslint-disable-next-line prefer-const
    let { username, password, cookie } = options;
    if (cookie) {
      [username, password] = this.handleCookie(cookie);
    }
    if (!username || !password) {
      throw new Error("Unathenticated RPC communication is not supported. Provide valid username and password");
    }
    return { username, password };
  }

  private getDefaults(options: RPCOptions): { host: string; port: number; ssl: boolean; timeout: number } {
    return {
      host: options.host || "localhost",
      port: options.port || networks[options.network || "mainnet"],
      ssl: options.ssl || false,
      timeout: options.timeout || 30000,
    };
  }

  private instantiateAgent(ssl: boolean): http.Agent | https.Agent {
    return ssl ? new https.Agent({ keepAlive: true }) : new http.Agent({ keepAlive: true });
  }

  private handleCookie(cookie: string): [string, string] {
    try {
      const tokens = readFileSync(cookie, "utf8").split(":");
      if (tokens.length !== 2) {
        throw new Error("Cookie file is invalid");
      }
      return [tokens[0].trim(), tokens[1].trim()];
    } catch (error_) {
      const error = error_ as NodeJS.ErrnoException;
      switch (error.code) {
        case "ENOENT":
          throw new Error(`File not found: ${cookie}`);
        case "EACCES":
          throw new Error(`Permission denied: ${cookie}`);
        default:
          throw error;
      }
    }
  }

  private createRequest = (reqBody: JSONType, options?: RequestOptions) => {
    const client = this.ssl ? https : http;

    const body = JSON.stringify(reqBody);

    const request = client.request({
      host: this.host,
      port: this.port,
      path: "/",
      protocol: this.ssl ? "https:" : "http:",
      agent: this.agent,
      method: "POST",
      timeout: options?.timeout ?? this.timeout,
      auth: `${this.username}:${this.password}`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      signal: options?.abortSignal,
    });

    return { request, body };
  };

  private makeRequest = <T extends JSONValue>(
    {
      method,
      parameters = [],
      suffix,
    }: {
      method: MethodName;
      parameters?: JSONType;
      suffix?: string;
    },
    options?: RequestOptions,
  ) => {
    return new Promise<T>((resolve, reject) => {
      const { request, body } = this.createRequest(
        {
          id: `${Date.now()}${suffix == null ? "" : `-${suffix}`}`,
          method,
          params: parameters,
        },
        options,
      );

      let responseData = "";

      request.on("response", (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Received invalid status code: ${res.statusCode}`));
        }

        if (res.headers["content-type"] !== "application/json") {
          return reject(new Error(`Received invalid content-type: ${res.headers["content-type"]}`));
        }

        res.setEncoding("utf8");
        res.on("data", (data) => {
          responseData += data;
        });
        res.on("end", () => {
          const parsed = JSON.parse(responseData);

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
        res.on("error", (err) => {
          reject(err);
        });
      });

      request.on("error", (err) => {
        reject(err);
      });

      request.write(body);
      request.end();
    });
  };

  public getmempoolinfo = async (options?: RequestOptions): Promise<GetMempoolInfoReturnType> => {
    return await this.makeRequest({ method: "getmempoolinfo" }, options);
  };

  public getbestblockhash = async (options?: RequestOptions): Promise<string> => {
    return await this.makeRequest<string>({ method: "getbestblockhash" }, options);
  };

  public getblockheader = async <V extends GetBlockHeaderVerbosity>(
    {
      blockhash,
      verbose,
    }: {
      blockhash: string;
      verbose: V;
    },
    options?: RequestOptions,
  ): Promise<GetBlockHeaderReturnType<V>> => {
    return await this.makeRequest({ method: "getblockheader", parameters: { blockhash, verbose } }, options);
  };

  public getblock = async <N extends GetBlockVerbosity>(
    { blockhash, verbosity }: { blockhash: string; verbosity: N },
    options?: RequestOptions,
  ): Promise<GetBlockReturnType<N>> => {
    return await this.makeRequest({ method: "getblock", parameters: { blockhash, verbosity } }, options);
  };

  public getblocktemplate = async (obj: JSONType, options?: RequestOptions): Promise<GetBlockTemplateReturnType> => {
    return await this.makeRequest({ method: "getblocktemplate", parameters: obj }, options);
  };

  public getuptime = async (options?: RequestOptions): Promise<GetUptimeReturnType> => {
    return await this.makeRequest({ method: "uptime" }, options);
  };
}
