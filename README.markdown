seaport
=======

service registry and port assignment for clusters

![crane](http://substack.net/images/crane.png)

example
=======

simple service
--------------

First spin up the seaport server:

```
$ seaport 9090
seaport listening on :9090
```

then obtain a port for a server called `'http server'`:

server.js:

``` js
var seaport = require('seaport');
var ports = seaport.connect('localhost', 9090);
var http = require('http');

var server = http.createServer(function (req, res) {
    res.end('beep boop\r\n');
});

ports.service('http server', function (port, ready) {
    server.listen(port, ready);
});
```

now just `get()` that `'http server'` service!

client.js:

``` js
var seaport = require('seaport');
var ports = seaport.connect(9090);
var request = require('request');

ports.get('http server', function (ps) {
    var u = 'http://' + ps[0].host + ':' + ps[0].port;
    request(u).pipe(process.stdout);
});
```

output:

```
$ node server.js &
[1] 6012
$ node client.js
beep boop
```

and if you spin up `client.js` before `server.js` then it still works because
`get()` queues the response!

command-line usage
==================

```
Usage:

  seaport port

    Create seaport server.

  seaport host:port show

    Show the port map from the server at host:port.

  seaport host:port service name@version [COMMAND...]

    Register a service. COMMAND will get an assigned port to use as
    its last argument. If COMMAND exits it will be restarted.

  seaport host:port query name@version

    Query the server for services matching the name@version pattern.
    The version may contain semver patterns to specify a range.
    Prints out a JSON array of host:port strings.
```

methods
=======

```
var seaport = require('seaport')
```

All the parameters that take a `role` parameter can be intelligently versioned
with [semvers](https://github.com/isaacs/node-semver) by specifying a version in
the `role` parameter after an `'@'` character.

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

server methods
==============

Instead of using the command-line tool to spin up a seaport server, you can use
these api methods:

var server = seaport.createServer()
-----------------------------------

Create a new dnode seaport server.

The server emits `'allocate'`, `'assume'`, and `'free'` events when clients
allocate, assume, and free ports.

install
=======

To get the seaport library, with [npm](http://npmjs.org) do:

```
npm install seaport
```

To get the seaport command, do:

```
npm install -g seaport
```

license
=======

MIT/X11
