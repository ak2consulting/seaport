var seaport = require('../');
var test = require('tap').test;

test('versions', function (t) {
    t.plan(5);
    
    var serverPort = Math.floor(Math.random() * 5e5 + 1e5);
    var server = seaport.createServer();
    server.listen(serverPort);
    
    var ports = [
        seaport.connect(serverPort),
        seaport.connect(serverPort),
        seaport.connect(serverPort),
    ];
    
    setTimeout(function () {
        var pending = 3;
        ports[0].get('beep', function (ps) {
            t.equal(ps.length, 3);
            if (--pending === 3) t.end();
        });
        
        ports[0].get('beep@1.2.x', function (ps) {
            t.equal(ps.length, 1);
            t.equal(ps[0].port, ports_['beep@1.2.3']);
            if (--pending === 3) t.end();
        });
        
        ports[0].get('beep@>1.2', function (ps) {
            t.equal(ps.length, 1);
            t.equal(ps[0].port, ports_['beep@1.3.5']);
            if (--pending === 3) t.end();
        });
    }, 250);
    
    var ports_ = {};
    setTimeout(function () {
        ports[1].service('beep@1.2.3', function (port, ready) {
            ports_['beep@1.2.3'] = port;
            setTimeout(ready, 50);
        });
        ports[1].service('beep@1.3.5', function (port, ready) {
            ports_['beep@1.3.5'] = port;
            setTimeout(ready, 50);
        });
        ports[2].service('beep@0.9.2', function (port, ready) {
            ports_['beep@0.9.2'] = port;
            setTimeout(ready, 50);
        });
    }, 50);
    
    t.on('end', function () {
        server.close();
        ports[0].close();
        ports[1].close();
        ports[2].close();
    });
});
