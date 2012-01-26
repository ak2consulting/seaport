var seaport = require('../../');
var server = seaport.createServer();
server.on('allocate', function (role, addr, port) {
    console.dir([ role, addr, port ]);
});
server.listen(9090);
