var test = require('tap').test;
var seaport = require('../');

test('alloc and free', function (t) {
    t.plan(4);
    var port = Math.floor(Math.random() * 5e5 + 1e4);
    var server = seaport.createServer();
    
    var gotPort;
    server.on('allocate', function (alloc) {
        gotPort = alloc.port;
    });
    
    server.on('free', function () {
        ports = seaport('staging').connect('localhost', port);
        ports.assume('http', gotPort);
    });
    
    server.on('assume', function (alloc) {
        t.equal(alloc.port, gotPort);
        
        ports.close();
        server.close();
        t.end();
    });
    
    server.listen(port);
    
    var ports = seaport('staging').connect('localhost', port);
    
    ports.allocate('http', function (p) {
        t.ok(p >= 10000 && p < 65536);
        t.equal(p, gotPort);
        
        ports.query('http', function (ps) {
            t.deepEqual(ps, [ { host : '127.0.0.1', port : p } ]);
        });
    });
});
