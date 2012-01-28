var seaport = require('../../');
var ports = seaport('testing').connect(9090);

var up = ports.connect('beep');
up(function (remote) {
    remote.fives(11, function (n) {
        console.log('fives(11) : ' + n);
    });
});
