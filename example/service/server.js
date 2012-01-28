var seaport = require('../../');
var ports = seaport.connect('localhost', 9090);
var http = require('http');

var server = http.createServer(function (req, res) {
    res.end('beep boop\r\n');
});

ports.service('http server', function (port, ready) {
    server.listen(port, ready);
});
