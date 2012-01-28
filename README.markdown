seaport
=======

central role-based port allocation for clusters

![crane](http://substack.net/images/crane.png)

example
=======

auto-allocation
---------------

beep.js

``` js
var seaport = require('seaport');
var ports = seaport('testing').connect(9090);

var beep = ports(function (remote, conn) {
    this.fives = function (n, cb) { cb(n * 5) }
}).listen('beep');
```

connect.js

``` js
var seaport = require('seaport');
var ports = seaport('testing').connect(9090);

var up = ports.connect('beep');
up(function (remote) {
    remote.fives(11, function (n) {
        console.log('fives(11) : ' + n);
    });
});
```

output

```
$ seaport 9090 &
[1] 11035
seaport listening on :9090
$ node connect.js &
[2] 7143
$ node beep.js &
[3] 9040
fives(11) : 55
$ 
```

manually allocate
-----------------

hub.js

``` js
var seaport = require('seaport');
var server = seaport.createServer();

server.on('allocate', function (alloc) {
    console.log('--- allocated ---');
    console.dir(alloc);
});

server.on('free', function (free) {
    console.log('--- freed ---');
    console.dir(free);
});

server.listen(9090);
```

web.js

``` js
var seaport = require('seaport');
var ports = seaport('staging').connect('localhost', 9090);

ports.allocate('web', function (port) {
    console.log('allocated ' + port);
});
```

ouput:

```
$ node hub.js &
[1] 5007
$ node web.js
--- allocated ---
{ role: 'web',
  host: '127.0.0.1',
  port: 16856,
  environment: 'staging' }
allocated 16856
```

methods
=======

``` js
var seaport = require('seaport')
```

var server = seaport.createServer()
-----------------------------------

Create a new dnode seaport server.

The server emits `'allocate'` and `'free'` events when clients allocate and free
ports.

server.query(env, role)
-----------------------

Return the services in the environment `env` that satisfy the role `role`.

Services are just objects that look like: `{ host : '1.2.3.4', port : 5678 }`.

var ports = seaport(env).connect(...)
-------------------------------------

Connect to the seaport service at `...` under the environment `env`.

ports.get(role, cb)
-------------------

Request an array of host/port objects through `cb(services)` that fulfill `role`.

If there are no such services then the callback `cb` will get queued until some
service fulfilling `role` gets allocated.

ports.service(role, cb)
-----------------------

Create a service fulfilling the role of `role`.

Receive a callback `cb(port, ready)` with the allocated `port` and `ready()`
function to call and re-assume the `port` every time the seaport service
connection gets interrupted.

var up = ports.connect(role)
----------------------------

Return a new [upnode](https://github.com/substack/upnode) connection that
fulfills the `role` for the given environment `env`.

var service = ports(fn)
-----------------------

Create a new [upnode](https://github.com/substack/upnode) service with the
[dnode](https://github.com/substack/dnode) constructor `fn`.

service.listen(role)
--------------------

Expose the [upnode](https://github.com/substack/upnode) `service` to the seaport
server fulfilling the role `role`.

ports.allocate(role, cb)
------------------------

Request a port to fulfil a `role`. `cb(port, ready)` fires with the result.

Call `ready()` when your service is ready to start accepting connections.

If `cb.length === 1` then `ready()` will be fired automatically.

ports.free(port, cb)
--------------------

Give a port back. `cb()` fires when complete.

ports.assume(role, port, cb)
----------------------------

Dictate to the server what port you are listening on.
This is useful for re-establishing a route without restarting the server.

ports.query(env, role, cb)
--------------------------

Get the services in the environment `env` that satisfy the role `role` in
`cb(services)`.

Services are just objects that look like: `{ host : '1.2.3.4', port : 5678 }`.

install
=======

With [npm](http://npmjs.org) do:

```
npm install seaport
```

license
=======

MIT/X11
