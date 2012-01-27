seaport
=======

Centrol role-based port allocation for clusters.

example
=======

allocate a staging web server
-----------------------------

hub.js

``` js
var seaport = require('seaport');
var server = seaport.createServer();

server.on('allocate', function (alloc) {
    console.dir(alloc);
});

server.on('free', function (free) {
    console.dir(free);
});

server.listen(9090);

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

ports.allocate(role, cb)
------------------------

Request a port to fulfil a `role`. `cb(port)` fires with the result.

ports.free(port, cb)
--------------------

Give a port back. `cb()` fires when complete.

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
