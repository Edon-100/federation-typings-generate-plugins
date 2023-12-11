"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FederatedTypesPlugin", {
    enumerable: true,
    get: function() {
        return FederatedTypesPlugin;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _server = require("../lib/server");
const _TypescriptCompiler = require("../lib/TypescriptCompiler");
const _normalizeOptions = require("../lib/normalizeOptions");
const _Caching = require("../lib/Caching");
const _download = /*#__PURE__*/ _interop_require_default(require("../lib/download"));
const _Logger = require("../Logger");
const _generateTypesStats = require("../lib/generateTypesStats");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const PLUGIN_NAME = 'FederatedTypesPlugin';
const SUPPORTED_PLUGINS = [
    'ModuleFederationPlugin',
    'NextFederationPlugin'
];
let isServe = false;
let typeDownloadCompleted = false;
let FederatedTypesPlugin = class FederatedTypesPlugin {
    apply(compiler) {
        this.logger = _Logger.Logger.setLogger(compiler.getInfrastructureLogger(PLUGIN_NAME));
        if (!compiler.options.plugins.some((p)=>{
            var _p_constructor_name;
            return SUPPORTED_PLUGINS.indexOf((_p_constructor_name = p == null ? void 0 : p.constructor.name) != null ? _p_constructor_name : '') !== -1;
        })) {
            this.logger.error('Unable to find the Module Federation Plugin, this is plugin no longer provides it by default. Please add it to your webpack config.');
            throw new Error('Unable to find the Module Federation Plugin');
        }
        this.normalizeOptions = (0, _normalizeOptions.normalizeOptions)(this.options, compiler);
        const { disableDownloadingRemoteTypes, disableTypeCompilation } = this.normalizeOptions;
        // Bail if both 'disableDownloadingRemoteTypes' & 'disableTypeCompilation' are 'truthy'
        if (disableDownloadingRemoteTypes && disableTypeCompilation) {
            return;
        }
        compiler.options.watchOptions.ignored = this.normalizeOptions.ignoredWatchOptions;
        if (!disableTypeCompilation) {
            compiler.hooks.beforeCompile.tap(PLUGIN_NAME, (_)=>{
                this.generateTypes({
                    outputPath: compiler.outputPath
                });
            });
            this.handleTypeServing(compiler, this.normalizeOptions.typeServeOptions);
            // TODO - this is not ideal, but it will repopulate types if clean is enabled
            if (compiler.options.output.clean) {
                compiler.hooks.afterEmit.tap(PLUGIN_NAME, (_)=>{
                    this.generateTypes({
                        outputPath: compiler.outputPath
                    });
                });
            }
        }
        if (!disableDownloadingRemoteTypes) {
            compiler.hooks.beforeCompile.tapAsync(PLUGIN_NAME, async (_, callback)=>{
                if (typeDownloadCompleted) {
                    callback();
                    return;
                }
                try {
                    this.logger.log('Preparing to download types from remotes on startup');
                    await this.importRemoteTypes();
                    callback();
                } catch (error) {
                    callback(this.getError(error));
                }
            });
        }
    }
    handleTypeServing(compiler, typeServeOptions) {
        if (typeServeOptions) {
            compiler.hooks.watchRun.tap(PLUGIN_NAME, ()=>{
                isServe = true;
            });
            compiler.hooks.beforeCompile.tapAsync(PLUGIN_NAME, async (_, callback)=>{
                this.logger.log('Preparing to serve types');
                try {
                    (0, _normalizeOptions.validateTypeServeOptions)(typeServeOptions);
                } catch (error) {
                    callback(error);
                    return;
                }
                this.logger.log('Starting Federated Types server');
                await (0, _server.startServer)({
                    outputPath: compiler.outputPath,
                    host: typeServeOptions.host,
                    port: typeServeOptions.port,
                    logger: this.logger
                });
                if (!isServe) {
                    compiler.hooks.failed.tap(PLUGIN_NAME, ()=>{
                        (0, _server.stopServer)({
                            port: typeServeOptions.port,
                            logger: this.logger
                        });
                    });
                    compiler.hooks.done.tap(PLUGIN_NAME, ()=>{
                        (0, _server.stopServer)({
                            port: typeServeOptions.port,
                            logger: this.logger
                        });
                    });
                }
                callback();
            });
        }
    }
    generateTypes({ outputPath }) {
        this.logger.log('Generating types');
        const federatedTypesMap = this.compileTypes();
        const { typesIndexJsonFilePath, publicPath } = this.normalizeOptions;
        const statsJson = {
            publicPath,
            files: (0, _generateTypesStats.generateTypesStats)(federatedTypesMap, this.normalizeOptions)
        };
        if (Object.entries(statsJson.files).length === 0) {
            return;
        }
        const dest = _path.default.join(outputPath, typesIndexJsonFilePath);
        _fs.default.writeFileSync(dest, JSON.stringify(statsJson));
    }
    compileTypes() {
        const exposedComponents = this.options.federationConfig.exposes;
        if (!exposedComponents) {
            return {};
        }
        // './Component': 'path/to/component' -> ['./Component', 'path/to/component']
        const compiler = new _TypescriptCompiler.TypescriptCompiler(this.normalizeOptions);
        try {
            return compiler.generateDeclarationFiles(exposedComponents, this.options.additionalFilesToCompile);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
    async delay(ms) {
        return new Promise((resolve)=>setTimeout(resolve, ms));
    }
    parseRemoteUrls(remoteComponents) {
        if (!remoteComponents || remoteComponents && (0, _normalizeOptions.isObjectEmpty)(remoteComponents)) {
            this.logger.log('No Remote components configured');
            return [];
        }
        return Object.entries(remoteComponents).map(([remote, entry])=>{
            let urlEndIndex = entry.length;
            if (entry.endsWith('.js')) {
                urlEndIndex = entry.lastIndexOf('/');
            }
            const remoteUrl = entry.substring(0, urlEndIndex);
            const splitIndex = remoteUrl.indexOf('@');
            const url = remoteUrl.substring(splitIndex + 1);
            return {
                origin: url != null ? url : remoteUrl,
                remote
            };
        });
    }
    async importRemoteTypes() {
        const remoteUrls = this.parseRemoteUrls(this.options.federationConfig.remotes);
        if (remoteUrls.length === 0) {
            return;
        }
        for (const { origin, remote } of remoteUrls){
            const { typescriptFolderName, typeFetchOptions } = this.normalizeOptions;
            const { shouldRetryOnTypesNotFound, downloadRemoteTypesTimeout, retryDelay, maxRetryAttempts, shouldRetry } = typeFetchOptions;
            const isRetrying = shouldRetry || shouldRetryOnTypesNotFound;
            const maxRetryCount = !isRetrying ? 0 : maxRetryAttempts;
            let retryCount = 0;
            let delay = retryDelay;
            while(retryCount < maxRetryCount){
                try {
                    await this.downloadTypesFromRemote(remote, origin, downloadRemoteTypesTimeout, shouldRetryOnTypesNotFound, typescriptFolderName);
                    break;
                } catch (error) {
                    this.logger.error(`Unable to download types from remote '${remote}'`);
                    this.logger.log(error);
                    if (isRetrying) {
                        retryCount++;
                        if (retryCount < maxRetryCount) {
                            delay = retryDelay * retryCount;
                            this.logger.log(`Retrying download of types from remote '${remote}' in ${delay}ms`);
                            await this.delay(delay);
                        }
                    }
                }
            }
            typeDownloadCompleted = true;
        }
    }
    async downloadTypesFromRemote(remote, origin, downloadRemoteTypesTimeout, shouldRetryOnTypesNotFound, typescriptFolderName) {
        try {
            this.logger.log(`Getting types index for remote '${remote}'`);
            const indexTypesUrl = new URL(origin);
            indexTypesUrl.pathname = _path.default.join(
              indexTypesUrl.pathname,
              this.normalizeOptions.typesIndexJsonFileName,
            );
            const resp = await _axios.default.get(indexTypesUrl.toString(), {
                timeout: downloadRemoteTypesTimeout
            });
            const statsJson = resp.data;
            if (statsJson == null ? void 0 : statsJson.files) {
                this.logger.log(`Checking with Cache entries`);
                const { filesToCacheBust, filesToDelete } = _Caching.TypesCache.getCacheBustedFiles(remote, statsJson);
                this.logger.log('filesToCacheBust', filesToCacheBust);
                this.logger.log('filesToDelete', filesToDelete);
                if (filesToDelete.length > 0) {
                    filesToDelete.forEach((file)=>{
                        _fs.default.unlinkSync(_path.default.resolve(this.normalizeOptions.webpackCompilerOptions.context, typescriptFolderName, remote, file));
                    });
                }
                if (filesToCacheBust.length > 0) {
                    await Promise.all(filesToCacheBust.filter(Boolean).map((file)=>{
                        const url = new URL(_path.default.join(origin, typescriptFolderName, file)).toString();
                        const destination = _path.default.join(this.normalizeOptions.webpackCompilerOptions.context, typescriptFolderName, remote);
                        this.logger.log('Downloading types...');
                        return (0, _download.default)({
                            url,
                            destination,
                            filename: file
                        });
                    }));
                    this.logger.log('downloading complete');
                }
            } else {
                this.logger.log(`No types index found for remote '${remote}'`);
                if (shouldRetryOnTypesNotFound) {
                    throw new Error(`shouldRetryOnTypesNotFound is enabled, retrying...`);
                }
            }
        } catch (error) {
            this.logger.error(`Unable to download '${remote}' remote types index file: `, error.message);
            throw error;
        }
    }
    getError(error) {
        if (error instanceof Error) {
            return error;
        }
        return new Error(error);
    }
    constructor(options){
        this.options = options;
    }
};

//# sourceMappingURL=FederatedTypesPlugin.js.map