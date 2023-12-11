"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DEFAULT_FETCH_MAX_RETRY_ATTEMPTS: function() {
        return DEFAULT_FETCH_MAX_RETRY_ATTEMPTS;
    },
    DEFAULT_FETCH_RETRY_DELAY: function() {
        return DEFAULT_FETCH_RETRY_DELAY;
    },
    DEFAULT_FETCH_TIMEOUT: function() {
        return DEFAULT_FETCH_TIMEOUT;
    },
    isObjectEmpty: function() {
        return isObjectEmpty;
    },
    normalizeOptions: function() {
        return normalizeOptions;
    },
    validateTypeServeOptions: function() {
        return validateTypeServeOptions;
    }
});
const _lodashget = /*#__PURE__*/ _interop_require_default(require("lodash.get"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _constants = require("../constants");
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _object_without_properties_loose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
const DEFAULT_FETCH_TIMEOUT = 3000;
const DEFAULT_FETCH_MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_FETCH_RETRY_DELAY = 1000;
const defaultOptions = {
    compiler: 'tsc',
    disableDownloadingRemoteTypes: false,
    disableTypeCompilation: false,
    typescriptFolderName: _constants.TYPESCRIPT_FOLDER_NAME,
    typescriptCompiledFolderName: _constants.TYPESCRIPT_COMPILED_FOLDER_NAME,
    additionalFilesToCompile: [],
    typeFetchOptions: {
        downloadRemoteTypesTimeout: DEFAULT_FETCH_TIMEOUT,
        maxRetryAttempts: DEFAULT_FETCH_MAX_RETRY_ATTEMPTS,
        retryDelay: DEFAULT_FETCH_RETRY_DELAY,
        shouldRetryOnTypesNotFound: true,
        shouldRetry: true
    }
};
const validateTypeServeOptions = (options)=>{
    if (!options) {
        throw new Error('TypeServeOptions is required');
    }
    if (!options.host) {
        throw new Error('TypeServeOptions.host is required');
    }
    if (!options.port || !Number.isInteger(options.port)) {
        throw new Error('TypeServeOptions.port is required');
    }
};
const isObjectEmpty = (obj)=>{
    for(const x in obj){
        return false;
    }
    return true;
};
const normalizeOptions = (options, compiler)=>{
    const webpackCompilerOptions = compiler.options;
    const { context, watchOptions } = webpackCompilerOptions;
    const _ref = _extends({}, defaultOptions, options), { federationConfig, typescriptFolderName, typescriptCompiledFolderName } = _ref, restOptions = _object_without_properties_loose(_ref, [
        "federationConfig",
        "typescriptFolderName",
        "typescriptCompiledFolderName"
    ]);
    var _options_typeFetchOptions;
    const typeFetchOptions = _extends({}, defaultOptions.typeFetchOptions, (_options_typeFetchOptions = options.typeFetchOptions) != null ? _options_typeFetchOptions : {});
    var _federationConfig_filename;
    const federationFileName = (_federationConfig_filename = federationConfig.filename) != null ? _federationConfig_filename : 'remoteEntry.js';
    const distPath = (0, _lodashget.default)(webpackCompilerOptions, 'devServer.static.directory') || (0, _lodashget.default)(webpackCompilerOptions, 'output.path') || 'dist';
    const typesPath = federationFileName.substring(0, federationFileName.lastIndexOf('/'));
    const typesIndexJsonFilePath = _path.default.join(typesPath, _constants.TYPES_INDEX_JSON_FILE_NAME);
    const distDir = _path.default.join(distPath, typesPath, typescriptFolderName);
    const tsCompilerOptions = {
        declaration: true,
        emitDeclarationOnly: true,
        outDir: _path.default.join(distDir, `/${typescriptCompiledFolderName}/`),
        noEmit: false
    };
    const webpackPublicPath = webpackCompilerOptions.output.publicPath;
    const publicPath = typeof webpackPublicPath === 'string' ? webpackPublicPath === 'auto' ? '' : webpackPublicPath : '';
    const watchOptionsToIgnore = [
        _path.default.normalize(_path.default.join(context, typescriptFolderName))
    ];
    const ignoredWatchOptions = Array.isArray(watchOptions.ignored) ? [
        ...watchOptions.ignored,
        ...watchOptionsToIgnore
    ] : watchOptionsToIgnore;
    return _extends({}, restOptions, {
        typeFetchOptions,
        distDir,
        publicPath,
        tsCompilerOptions,
        typesIndexJsonFileName: _constants.TYPES_INDEX_JSON_FILE_NAME,
        typesIndexJsonFilePath,
        typescriptFolderName,
        webpackCompilerOptions,
        ignoredWatchOptions
    });
};

//# sourceMappingURL=normalizeOptions.js.map