var seaport = require('../../');
var server = seaport.createServer();

server.on('allocate', function (alloc) {
    console.dir(alloc);
});

server.on('free', function (free) {
    console.dir(free);
});

server.listen(9090);
