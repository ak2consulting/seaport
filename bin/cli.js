#!/usr/bin/env node
var seaport = require('../');
var seq = require('seq');

var argv = require('optimist').argv;

if (argv.listen) {
    var port = argv.listen;
    var server = seaport.createServer();
    server.listen(port);
    console.log('seaport listening on :' + port);
}
else {
    var env = argv._[0];
    var s = argv._[1].split(':');
    var port = s[1] || s[0];
    var host = s[1] ? s[0] : 'localhost';
    
    var roles = argv._[2].split(',');
    
    var ports = seaport(env).connect(host, port);
    
    var allocated = {};
    seq(roles)
        .parEach_(function (next, role) {
            ports.allocate(role, function (port) {
                console.log('allocated ' + role + ' on ' + port);
                if (!allocated[role]) allocated[role] = [];
                allocated[role].push(port);
                next();
            });
        })
        .seq(function () {
            console.dir(allocated);
        })
    ;
    
    ports.on('down', function () {
        Object.keys(allocated).forEach(function (role) {
            var port = allocated[role];
            ports.assume(role, port, function () {
                console.log('re-assumed ' + role + ' on ' + port);
            });
        });
    });
}
