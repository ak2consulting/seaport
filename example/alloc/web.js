var seaport = require('../../')('staging');
var ports = seaport.connect('localhost', 9090);

ports.allocate('http', function (port) {
    console.log('allocated ' + port);
});
