"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "generateTypesStats", {
    enumerable: true,
    get: function() {
        return generateTypesStats;
    }
});
const _crypto = /*#__PURE__*/ _interop_require_default(require("crypto"));
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
const generateTypesStats = (filesMap, normalizeOptions)=>{
    return Object.entries(filesMap).reduce((acc, [path, contents])=>{
        const filename = path.slice(path.indexOf(normalizeOptions.distDir) + `${normalizeOptions.distDir}/`.length);
        return _extends({}, acc, {
            [filename]: _crypto.default.createHash('md5').update(contents).digest('hex')
        });
    }, {});
};

//# sourceMappingURL=generateTypesStats.js.map