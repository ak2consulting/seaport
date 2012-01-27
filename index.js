var upnode = require('upnode');
var dnode = require('dnode');
var port = parseInt(process.argv[2], 10);

var seaport = module.exports = function (env) {
    if (env === 'error') return undefined; // NICE TRY
    
    function connect () {
        var up = upnode({ environment : env }).connect.apply(null, arguments);
        
        [ 'allocate', 'free', 'query', 'assume' ].forEach(function (name) {
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
            if (!ports[addr]) ports[addr] = [];
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
            server.emit('allocate', {
                role : role,
                host : addr,
                port : port,
                environment : env,
            });
        };
        
        self.assume = function (role, port, cb) {
            var ix = ports[addr].indexOf(port);
            if (ix >= 0) ports[addr].splice(ix, 1);
            ports[addr].push(port);
            
            roles[env][role] = (roles[env][role] || []).filter(function (r) {
                return r.port !== port;
            });
            
            server.emit('assume', {
                role : role,
                host : addr,
                port : port, 
                environment : env,
            });
            cb();
        };
        
        self.free = function (port, cb) {
            if (ports[addr]) {
                var ix = ports[addr].indexOf(port);
                if (ix >= 0) ports[addr].splice(ix, 1);
            }
            
            var foundRole = undefined;
            Object.keys(roles[env]).forEach(function (role) {
                var rs = roles[env][role];
                roles[env][role] = rs.filter(function (r) {
                    var x = !(r.port === port && r.host === addr);
                    if (!x) foundRole = role;
                    return x;
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
        
        self.query = function (env_, role, cb) {
            if (typeof role === 'function') {
                cb = role;
                role = env_;
                env_ = env;
            }
            cb(server.query(env, role));
        };
        
        return self;
    }
    
    server.query = function (env, role) {
        return role === undefined
            ? roles
            : roles[env] && roles[env][role] || []
        ;
    };
    
    server.use(upnode.ping);
    return server;
};
