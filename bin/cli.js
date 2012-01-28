#!/usr/bin/env node
var seaport = require('../');

var argv = require('optimist')
    .demand(1)
    .usage([
        'Usage:',
        '  $0 port            # to listen',
        '  $0 host:port show  # to show the port map',
    ].join('\r\n'))
    .argv
;

if (typeof argv._[0] === 'number') {
    var port = argv._[0];
    
    var server = seaport.createServer();
    server.listen(port);
    console.log('seaport listening on :' + port);
}
else {
    var s = argv._[0].split(':');
    var port = s[1] || s[0];
    var host = s[1] ? s[1] : s[0];
    
    var cmd = argv._[1];
    
    if (cmd === 'show' || cmd === undefined) {
        var ports = seaport().connect(host, port);
        ports.query(function (ps) {
            console.log(JSON.stringify(ps, undefined, 2));
            ports.close();
        });
    }
}
