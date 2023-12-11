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
    startServer: function() {
        return startServer;
    },
    stopServer: function() {
        return stopServer;
    }
});
const _http = /*#__PURE__*/ _interop_require_default(require("http"));
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const activeServers = new Map();
const startServer = async ({ outputPath, port, host, logger })=>{
    return new Promise((resolve)=>{
        if (activeServers.get(port)) {
            resolve(1);
            return;
        }
        const server = _http.default.createServer((req, res)=>{
            const safeSuffix = _path.default.normalize(req.url).replace(/^(\.\.(\/|\\|$))+/, '');
            const fileName = _path.default.join(outputPath, safeSuffix);
            try {
                // Ensure the requested file is within the specified directory
                if (!fileName.startsWith(outputPath)) {
                    res.writeHead(403, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Forbidden');
                    return;
                }
                // Check if the file exists
                _fs.default.stat(fileName, (err, stat)=>{
                    if (err) {
                        logger.log(`Error reading file: ${err}`);
                        res.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        res.end('Internal Server Error');
                    } else {
                        if (stat.isFile()) {
                            res.writeHead(200, {
                                'Content-Type': 'text/plain'
                            });
                            _fs.default.createReadStream(fileName).pipe(res);
                        } else {
                            // Handle non-file requests (e.g., directories)
                            res.writeHead(404, {
                                'Content-Type': 'text/plain'
                            });
                            res.end('Not Found');
                        }
                    }
                });
            } catch (err) {
                logger.log(`Error reading file: ${err}`);
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                res.end('Internal Server Error');
            }
        });
        server.listen(port, host, ()=>{
            logger.log(`Federated Type Server listening on http://${host}:${port}`);
            resolve(1);
        });
        activeServers.set(port, server);
    });
};
const stopServer = ({ port, logger })=>{
    if (!activeServers.get(port)) return;
    logger.log('Stopping Federated Type Server');
    const server = activeServers.get(port);
    if (server) {
        server.close();
    }
};

//# sourceMappingURL=server.js.map