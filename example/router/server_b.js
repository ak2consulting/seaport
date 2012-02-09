var seaport = require('../../');
var ports = seaport.connect('localhost', 5001);
var http = require('http');

var server = http.createServer(function (req, res) {
    res.end('version 0.1.0\r\n');
});

ports.service('http@0.1.0', function (port, ready) {
    server.listen(port, ready);
});
