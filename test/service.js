var seaport = require('../');
var test = require('tap').test;

test('service', function (t) {
    var serverPort = Math.floor(Math.random() * 5e5 + 1e5);
    var server = seaport.createServer();
    server.listen(serverPort);
    
    var ports = [
        seaport.connect(serverPort),
        seaport.connect(serverPort),
    ];
    
    var t0 = Date.now();
    ports[0].get('woo', function (ps) {
        t.ok(Date.now() - t0 >= 100);
        t.deepEqual(ps, [ { host : '127.0.0.1', port : gotPort } ]);
        t.end();
    });
    
    var gotPort;
    setTimeout(function () {
        ports[1].service('woo', function (port, ready) {
            gotPort = port;
            setTimeout(ready, 50);
        });
    }, 50);
    
    t.on('end', function () {
        server.close();
        ports[0].close();
        ports[1].close();
    });
});
