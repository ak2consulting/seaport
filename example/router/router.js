var seaport = require('../../');
var ports = seaport.createServer().listen(5001);

var bouncy = require('bouncy');
bouncy(function (req, bounce) {
    var domains = (req.headers.host || '').split('.');
    var service = 'http@' + ({
        unstable : '0.1.x',
        stable : '0.0.x',
    }[domains[0]] || '0.0.x');
    
    var ps = ports.query(service);
    
    if (ps.length === 0) {
        var res = bounce.respond();
        res.end('service not available\n');
    }
    else {
        bounce(ps[0].host, ps[0].port);
    }
}).listen(5000);
