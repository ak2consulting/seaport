var seaport = require('../../');
var ports = seaport('testing').connect(9090);

var beep = ports(function (remote, conn) {
    this.fives = function (n, cb) { cb(n * 5) }
}).listen('beep');
