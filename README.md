# dm.[js](https://developer.mozilla.org/en/docs/JavaScript) [![Build Status](https://travis-ci.org/gobwas/dm.js.svg?branch=master)](https://travis-ci.org/gobwas/dm.js)

> Dependency [Injection](http://en.wikipedia.org/wiki/Dependency_injection) Manager for javascript.

## Introduction

**dm.js** is a javascript library that implements dependency injection pattern. It could work both in node or browser.

It takes care of asynchronous creating, configuring and injecting objects aka *services* inside of your code.

There is a good chance to keep your application design loose coupled, well structured and flexible with dependency injection pattern.

If you interested in theory you can check things about:
+ [the inversion of control](http://en.wikipedia.org/wiki/Inversion_of_control),
+ [dependency injection](http://en.wikipedia.org/wiki/Dependency_injection),
+ [service locator](http://en.wikipedia.org/wiki/Service_locator_pattern).

## What is Service?

Service is just a javascript object. It realize some piece of logic of your application.

It is good idea to think your application is many to many services negotiations.
Since each service is responsible just for one job, you can use its functionality in any place of your application.
Each service can be simply tested and configured, when it sliced out from other logic of your application.

What do you need to create a service? Nothing special - just create some javascript constructor function, as usual.
Put it in separate file, as good guidelines tell you to do, and register it in **dm**. Then dm will load it by your [preferred way of resolving assets (amd, cjs etc)](#loader).

## What is Dependency?

Dependency is just another javascript object, or, simply, service, that some service is depends on to make his job. For example,
you have cache service, that stores some data in some place, but it needs to have the way to generate hash for each item, so it depends on
hash generator service. If you realize this with DM, you can easily:
+ switch hash generation algorithms without changing cache service;
+ mock hash generator for easy unit testing;
+ configure each of services independently;
+ store all the configuration in one place.

## What is Injection and who is Manager?

Dependency Injection Manager (also known as Service Locator) is an object, that knows all about dependencies.
It also knows all about services - what service implementation to use, which arguments pass to its constructor,
which calls to do after instantiating, and finally, which properties with which values set up for created instance. In other words, manager knows
how to configure each service.

Its a good idea to keep all application configuration in one place. This gives ability for developers concentrate just on service developing,
and not on how to get some other object, nor on the configuration parameters, that his service will use.

## How it works together?

**dm.js** use async way to resolve service building. It uses Promises/A+ compatible libraries, and most popular module definition notations.
So, all you need to configure DM is select needed adapters for promises and module loaders. And of course, you can write your own adapters easily.

Out of the box at the moment DM has these async adapters:
+ RSVP;
+ jQuery.Deferred;
+ Q.js
+ Harmony Promises.

And these loaders:
+ CJS (node way);
+ AMD (requirejs).

If you want to not configure adapters and some other things, there is a prebuilt versions planned in future.

## The Hello World Example

Lets greet the Great Big World in best principles of software architect:

```js

var config;

config = {
    // the 'world' service
    "world": {
        path: "/script/world/great-big-white-world.js",
        arguments: [{
            options: {
                worldId: "world-unique-identifier"
            }
        }]
    },

    // the 'greeter' service
    "greeter": {
        path: "/script/greeter/hello.js",
        calls: [
            ["injectTheWorld",      ["@world"]],
            ["injectTheOtherWorld", ["@world.other"]] // some other world
        ],
        properties: {
            greeting: "Hello!"
        }
    }
}

```

What happens here?

We just created `config` object. It contains our application's services configuration.

There are two services in our configuration - "world" and "greeter". The "world" contains some logic for interacting with world.

The "greeter" contains some logic for greeting some injected, not known as well, but known as an interface **world**.

> Also, later, some client of "greeter" service will not know which implementation he use, nor the world, that he greeting.
> He just know the interface of world greeter. And call the #greet method from it.
> Isn't it a perfect way to develop services independently and totally loose coupled? =)

```js

var dm, async, loader,
    hello;

// here the configuration of DM part
// it can be put in some bootstrap.js or main.js file
// at the beginning of your application
dm     = new DM.DependencyManager();
async  = new DM.async.RSVP(RSVP);
loader = new DM.loader.cjs();

dm.setAsync(async);
dm.setLoader(loader.setAsync(async));
dm.setConfig(config);

// here some application action
greeter = dm
    .get("greeter")
    .then(function(greeter) {
        greeter.greet("Everybody, I am dm.js!");
    });

```

## Configuration

As you can see, DM config is an object, that contains your all your services definition.
All available properties is:

Property   | Type      | Expected  | Default       | Example                    | Explanation
-----------|-----------|-----------|---------------|----------------------------|-------------
path       | `String`  | necessary |               | `"/script/service.js"`     | Path to service constructor
share      | `Boolean` | optional  | `true`        | `true`                     | Cache the instantiated object, or create new one every time when asked
factory    | `String`  | optional  |               | `"@my.custom.factory"`     | Factory of object, that receives parsed object's definition and returns created object
arguments  | `Array`   | optional  |               | `[{ id: 1 }, "@service"]`  | List of arguments to be passed to constructor (like Function.apply method)
calls      | `Array`   | optional  |               | `[["myCall", [1,2,"@b"]]]` | List of calls, where each item is Array with first item name of the method, and second - Array of arguments for method
properties | `Object`  | optional  |               | `{ a: 1, b: "@c", d: [] }` | Hash of object properties, to be set on

### Syntax

DM uses this symbols to identify parsing action:

Pattern       | Mean
--------------|------
@xxx          | Link to `xxx` named in config service
@xxx:yyy      | Link to `xxx` service's `yyy` method
@xxx:yyy[]    | Calling `xxx` service's `yyy` method with JSON stringified arguments list (`[]`)
%xxx%         | Parameter `xxx` from configuration (type safe)
#xxx#         | `xxx` resource loading
#xxx!yyy#     | `yyy` resource loading and passing through `xxx` handler (where `xxx` must have `handle` method)
#xxx:zzz!yyy# | `yyy` resource loading and passing through `xxx` service's `zzz` method as handler
%{xxx}        | Live insertion parameter
@{xxx}        | Live insertion service
#{xxx}        | Live insertion resource
@_@           | Link to DM instance 8-)

> All live insertion patterns are use `toString` method calling on each value, if it is not a String.

All patterns (instead of live patterns) will be recursively parsed, while DM cant get the primitive type or escaped type.

### Hooks

#### Escape object

You can use the DM method `escape` to avoid parsing of object properties values.

```js

var config = {
    "service": {
        "path": "...",
        "arguments": [{
            val: DM.escape({
                my_key: "@some_same_syntax_but_not_parsed"
            })
        }]
    }
}

```

If you don't have link to DM instance in your config file, you can use this hack to wrap your value like this:

> Note, that this snipped cant be stable at 100%. Use the #escape method instead.

```js

var config = {
    "service": {
        path: "...",
        arguments: [{
            val: {
                __escape__: true,
                __value__: {
                   my_key: "@some_same_syntax_but_not_parsed"
               }
            }
        }]
    }
}

```


## API

### DM

#### constructor([options])
________________________________________________________________

Creates new instance of DM.

##### Parameters

**options**

Type: `Object`

##### Return value

Type: `DM`

#### setConfig(config, [parameters])
________________________________________________________________

Sets up configuration for DM.

##### Parameters

**config**

Type: `Object`

Services map.

**parameters**

Type: `Object`

Parameters hash.

#### getConfig([key])
________________________________________________________________

Returns copy of a configuration.

##### Parameters

**key**

Type: `string`

If given, gets configuration of service with that key.

##### Return value

Type: `mixed`


#### setParameter(key, value)
________________________________________________________________

Sets up parameter. Can not replace already existing parameter.

##### Parameters

**key**

Type: `string`

**value**

Type: `mixed`

#### getParameter(key)
________________________________________________________________

Returns parameter if exists.

##### Parameters

**key**

Type: `string`

##### Return value


#### setAsync(adapter)
________________________________________________________________

##### Parameters

**adapter**

Type: `Async`

Async adapter for some Promises library.

#### setLoader(adapter)

**adapter**

Type: `Loader`

Loader adapter for some module loader.

##### Return value


#### set(key, service)
________________________________________________________________

Set up synthetic service in DM services map. Must be declared in configuration by given `key` as `synthetic`.

##### Parameters

**key**

Type: `string`

**service**

Type: `Object`

#### has(key)
________________________________________________________________

##### Parameters

**key**

Type: `string`

##### Return value


#### initialized(key)
________________________________________________________________

##### Parameters

**key**

Type: `string`

##### Return value


#### get(key)
________________________________________________________________

##### Parameters

**key**

Type: `string`

##### Return value


### Async

#### constructor(adaptee)
________________________________________________________________

##### Parameters

**adaptee**

Type: `Object`

##### Return value


#### promise(resolver)
________________________________________________________________

##### Parameters

**resolver**

Type: `Function`

##### Return value


#### all(promises)
________________________________________________________________

##### Parameters

**promises**

Type: `Array`

##### Return value


#### resolve(value)
________________________________________________________________

##### Parameters

**value**

Type: `mixed`

##### Return value


#### reject(error)
________________________________________________________________

##### Parameters

**error**

Type: `Error`

##### Return value


### Loader

#### constructor(adaptee)
________________________________________________________________

##### Parameters

**adaptee**

Type: `Object`

##### Return value


#### setAsync(adapter)
________________________________________________________________

##### Parameters

**adapter**

Type: `Async`

##### Return value


#### require(path, [options])
________________________________________________________________

##### Parameters

**path**

Type: `string`

**options**

Type: `Object`

##### Return value


#### read(path, [options])
________________________________________________________________

##### Parameters

**path**

Type: `string`

**options**

Type: `Object`

##### Return value






## What is inside?

dm.js consists of few linked components:

- core;
- async adapter;
- resource loader adapter;

### Core

DM class contains the core logic of parsing, resolving, constructing, injecting and storing dependent objects and resources.
Because of known reasons, it uses async style of work - the [Promises](html 5 promises). But, because you can use different libraries of
Promises, DM uses the abstraction over it, called 'async adapter'.

Another abstraction is used by the same reason is 'loader adapter' - you could use CommonJS loader (in node, or browser with
[browserified](browserify) content), or, AMD loader, like [require.js](require.js), or, whatever you want other.

So, when someone asking for some object, DM returns the Promise for this query, that will be resolved with configured object,
of rejected, when error occurs. Then DM gets the object configuration from config. If configuration says, that object needs
to be cached (by default all objects are needed to be cached) DM tries to get it from cache (see detailed section of
readme about object configuration). If asked service is not cached, DM loads constructor of object, located in
```path``` property of config. When it loaded, DM tries to load all dependencies, placed in ```calls```, ```arguments```
and ```properties``` properties of configuration. Then it calls constructor of an object with necessary ```arguments```,
then makes necessary ```calls```, and, finally, sets up necessary ```properties```. Then, if object is needs to be cached,
DM caches created instance and resolving given Promise with it.

For detailed explanation of all configuration properties see doc section below.

### Async

There are few built in adapters for most popular async libraries:

- [RSVP.js](rsvp);
- [Q.js](q.js);
- [ES6 Harmony Promises](Promises);
- [jquery deferred](jquery.com);

Of course, you can write adapter for your favorite library and successfully use it.

### Loader

There are also two built in adapters for most popular resource loading libraries:

- [Require.js](require.js);
- [CommonJS](common.js);

## Contributing

All developing version are available to install from npm as `dm@x.y.z-rc`.
To publish new release candidate (rc abbr) just do `npm publish --tag x.y.z-rc` and bump version in package.json `x.y.z-rc0`.
