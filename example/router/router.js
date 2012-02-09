var seaport = require('../../');
var ports = seaport.createServer().listen(5001);

var bouncy = require('bouncy');
bouncy(function (req, bounce) {
    var domains = (req.headers.host || '').split('.');
    var ps = ports.query(domains.slice(0,-1).join('.'));
    
    if (ps.length === 0) {
        var res = bounce.respond();
        res.end('service not available\n');
    }
    else {
        bounce(ps[0].host, ps[0].port);
    }
}).listen(5000);
