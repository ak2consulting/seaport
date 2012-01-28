var upnode = require('upnode');
var dnode = require('dnode');

var seaport = module.exports = function (env) {
    function connect () {
        var up = upnode({ environment : env }).connect.apply(null, arguments);
        
        var self = {
            environent : env,
            up : up,
            close : up.close.bind(up),
        };
        
        [ 'free', 'query', 'assume', 'get', 'service' ]
            .forEach(function (name) {
                self[name] = function () {
                    var args = [].slice.call(arguments);
                    
                    up(function (remote) {
                        remote[name].apply(null, args);
                    });
                };
            })
        ;
        
        self.allocate = function () {
            var args = [].slice.call(arguments);
            var fn = args[args.length - 1];
            if (fn.length === 1) {
                args[args.length - 1] = function (port, ready) {
                    fn(port);
                    ready();
                };
            }
            
            up(function (remote) {
                remote.allocate.apply(null, args);
            });
        };
        
        self.service = function (role, fn) {
            self.allocate(role, function (port, ready) {
                up.on('up', function () {
                    self.assume(role, port);
                });
                
                fn(port, ready);
                if (fn.length === 1) ready();
            });
        };
        
        return self;
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
            if (env && !roles[env]) roles[env] = {};
            if (env && !ports[addr]) ports[addr] = [];
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
            
            function ready () {
                ports[addr].push(port);
                roles[env][role].push({ host : addr, port : port });
                allocatedPorts.push(port);
                
                server.emit('allocate', {
                    role : role,
                    host : addr,
                    port : port,
                    environment : env,
                });
            }
            
            cb(port, ready);
        };
        
        self.assume = function (role, port, cb) {
            var ix = ports[addr].indexOf(port);
            if (ix >= 0) ports[addr].splice(ix, 1);
            ports[addr].push(port);
            allocatedPorts.push(port);
            
            roles[env][role] = (roles[env][role] || []).filter(function (r) {
                return r.port !== port;
            });
            roles[env][role].push({ host : addr, port : port });
            
            server.emit('assume', {
                role : role,
                host : addr,
                port : port, 
                environment : env,
            });
            if (cb) cb();
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
            else if (typeof env_ === 'function') {
                cb = env_;
                role = undefined;
                env_ = env;
            }
            cb(server.query(env_, role));
        };
        
        self.get = function (env_, role, cb) {
            if (role === undefined) {
                role = env_;
                env_ = env;
            }
            else if (typeof role === 'function') {
                cb = role;
                role = env_;
                env_ = env;
            }
            var ps = server.query(env_, role);
            
            if (ps.length > 0) cb(ps)
            else {
                function onalloc (alloc) {
                    ps = server.query(env_, role);
                    if (ps.length > 0) {
                        server.removeListener('allocate', onalloc);
                        server.removeListener('assume', onalloc);
                        cb(ps);
                    }
                }
                server.on('allocate', onalloc);
                server.on('assume', onalloc);
            }
        };
        
        return self;
    }
    
    server.query = function (env, role) {
        if (env === undefined) {
            return roles;
        }
        else if (role === undefined) {
            return roles[env]
        }
        else {
            return roles[env] && roles[env][role] || []
        }
    };
    
    server.use(upnode.ping);
    return server;
};
