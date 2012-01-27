var upnode = require('upnode');
var dnode = require('dnode');
var port = parseInt(process.argv[2], 10);

var seaport = module.exports = function (env) {
    if (env === 'error') return undefined; // NICE TRY
    
    function connect () {
        var up = upnode({ environment : env }).connect.apply(null, arguments);
        
        [ 'allocate', 'free', 'query' ].forEach(function (name) {
            up[name] = function () {
                var args = [].slice.call(arguments);
                
                up(function (remote) {
                    remote[name].apply(null, args);
                });
            };
        });
        
        return up;
    }
    return { connect : connect }
};

seaport.connect = seaport('production').connect;

seaport.createServer = function (opts) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = {};
    }
    if (!opts) opts = {};
    if (!opts.range) opts.range = { '*' : [ 10000, 20000 ] } ;
    
    var server = dnode(function (remote, conn) {
        if (!opts.secret) return service(remote, conn);
        
        this.auth = function (secret, cb) {
            if (secret === opts.secret) cb(null, service(remote, conn))
            else cb('ACCESS DENIED')
        };
    });
    
    var ports = server.ports = {};
    var roles = server.roles = {};
    
    function service (remote, conn) {
        var self = {};
        var allocatedPorts = [];
        
        var addr, env;
        conn.on('ready', function () {
            addr = conn.stream.remoteAddress;
            env = remote.environment;
            if (!roles[env]) roles[env] = {};
        });
        
        conn.on('end', function () {
            allocatedPorts.forEach(function (port) {
                self.free(port);
            });
        });
        
        self.allocate = function (role, n, cb) {
            if (typeof n === 'function') {
                cb = n;
                n = 1;
            }
            if (typeof cb !== 'function') return;
            
            if (!ports[addr]) ports[addr] = [];
            if (!roles[env][role]) roles[env][role] = [];
            
            var r = opts.range[addr] || opts.range['*'];
            
            var port;
            do {
                port = Math.floor(Math.random() * (r[1] - r[0])) + r[0];
            } while (ports[addr][port]);
            
            ports[addr].push(port);
            roles[env][role].push({ host : addr, port : port });
            allocatedPorts.push(port);
            
            cb(port);
            var alloc = {
                role : role,
                host : addr,
                port : port,
                environment : env,
            };
            server.emit('allocate', alloc);
        };
        
        self.free = function (port, cb) {
            if (ports[addr]) delete ports[addr][port];
            
            var foundRole = undefined;
            Object.keys(roles[env]).forEach(function (role) {
                var rs = roles[env][role];
                rs.forEach(function (r) {
                    if (r.port === port && r.host === addr) {
                        foundRole = role;
                        delete roles[env][role];
                    }
                });
            });
            
            if (typeof cb === 'function') cb();
            server.emit('free', {
                role : foundRole,
                host : addr,
                port : port,
                environment : env,
            });
        };
        
        self.query = function (env, role, cb) {
            cb(server.query(env, role));
        };
        
        return self;
    }
    
    server.query = function (env, role) {
        return role === undefined ? roles : roles[role] || [];
    };
    
    server.use(upnode.ping);
    return server;
};
