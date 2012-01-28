var test = require('tap').test;
var seaport = require('../');

test('connect with upnode', function (t) {
    t.plan(4);
    var port = Math.floor(Math.random() * 5e5 + 1e4);
    var server = seaport.createServer();
    server.listen(port);
    
    var ports = {
        a : seaport('staging').connect('localhost', port),
        b : seaport('staging').connect('localhost', port),
    };
    
    var up = ports.a.connect('beep');
    up(function (remote) {
        remote.fives(11, function (n) {
            t.equal(n, 55);
            up.close();
            server.close();
            beep.close();
            t.end();
        });
    });
    
    var beep = ports.b(function (remote, conn) {
        this.fives = function (n, cb) { cb(n * 5) }
    }).listen('beep');
});
