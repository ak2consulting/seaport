var seaport = require('../../').connect('localhost', 9090);
seaport.allocate('http', function (port) {
    console.log('allocated ' + port);
});
