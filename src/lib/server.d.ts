import { TypeServeOptions } from '../types';
import { LoggerInstance } from '../Logger';
export type TypeServerOptions = {
    outputPath: string;
    port: TypeServeOptions['port'];
    host: TypeServeOptions['host'];
    logger: LoggerInstance;
};
export declare const startServer: ({ outputPath, port, host, logger, }: TypeServerOptions) => Promise<unknown>;
export declare const stopServer: ({ port, logger, }: {
    port: number | undefined;
    logger: LoggerInstance;
}) => void;
