import { Compiler } from 'webpack';
import { FederatedTypesPluginOptions } from '../types';
export declare class FederatedTypesPlugin {
    private options;
    private normalizeOptions;
    private logger;
    constructor(options: FederatedTypesPluginOptions);
    apply(compiler: Compiler): void;
    private handleTypeServing;
    private generateTypes;
    private compileTypes;
    private delay;
    private parseRemoteUrls;
    private importRemoteTypes;
    private downloadTypesFromRemote;
    private getError;
}
