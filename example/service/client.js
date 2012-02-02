var seaport = require('../../');
var ports = seaport('staging').connect('localhost', 9090);
var request = require('request');

ports.get('http server', function (ps) {
    var u = 'http://' + ps[0].host + ':' + ps[0].port;
    request(u).pipe(process.stdout);
});
