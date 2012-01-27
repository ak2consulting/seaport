var test = require('tap').test;
var seaport = require('../');

test('alloc and free', function (t) {
    t.plan(1);
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
        server.end();
        t.end();
    });
});
