var upnode = require('upnode');
var dnode = require('dnode');
var port = parseInt(process.argv[2], 10);

exports.connect = function () {
    var up = upnode.connect.apply(null, arguments);
    
    [ 'allocate', 'free' ].forEach(function (name) {
        up[name] = function () {
            var args = [].slice.call(arguments);
            up(function (seaport) {
                seaport[name].apply(null, args);
            });
        };
    });
    
    return up;
};

exports.createServer = function (opts) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = {};
    }
    if (!opts) opts = {};
    if (!opts.range) opts.range = { '*' : [ 10000, 20000 ] } ;
    
    var server = dnode(function (remote, conn) {
        if (!opts.secret) return service(conn);
        
        this.auth = function (secret, cb) {
            if (secret === opts.secret) cb(null, service(conn))
            else cb('ACCESS DENIED')
        };
    });
    
    var ports = server.ports = {};
    
    function service (conn) {
        var self = {};
        var allocated = [];
        var addr = null;
        conn.on('ready', function () {
            addr = conn.stream.remoteAddress;
        });
        
        self.allocate = function (role, n, cb) {
            if (typeof n === 'function') {
                cb = n;
                n = 1;
            }
            if (typeof cb !== 'function') return;
            
            if (!ports[addr]) ports[addr] = {};
            var r = opts.range[addr] || opts.range['*'];
            var port = Math.floor(Math.random() * (r[1] - r[0])) + r[0];
            ports[addr] = port;
            
            cb(port);
            server.emit('allocate', role, addr, port);
        };
        
        self.free = function (port, cb) {
            if (ports[addr]) delete ports[addr][port];
            if (typeof cb === 'function') cb();
        };
        
        self.query = function (role, cb) {
            var roles = Object.keys(ports).reduce(function (acc, ip) {
                Object.keys(ports[ip]).forEach(function (r) {
                    if (!acc[r]) acc[r] = [];
                    acc[r].push({ host : ip, port : ports[ip][r] });
                });
                return acc;
            });
            
            if (role === undefined) cb(roles)
            else cb(roles[role] || []);
        };
        
        return self;
    }
    
    server.use(upnode.ping);
    return server;
};
