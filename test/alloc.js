var test = require('tap').test;
var seaport = require('../');

test('alloc and free', function (t) {
    t.plan(3);
    var port = Math.floor(Math.random() * 5e5 + 1e4);
    var server = seaport.createServer();
    
    var gotPort;
    server.on('allocate', function (alloc) {
        gotPort = alloc.port;
    });
    
    server.listen(port);
    
    var ports = seaport('staging').connect('localhost', port);
    
    ports.allocate('http', function (p) {
        t.ok(p >= 10000 && p < 65536);
        t.equal(p, gotPort);
        
        ports.query('http', function (ps) {
            t.deepEqual(ps, [ { host : '127.0.0.1', port : p } ]);
            
            server.end();
            server.close();
            ports.close();
            t.end();
        });
    });
});
