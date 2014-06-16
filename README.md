# promise-repo

[![Build Status](https://travis-ci.org/bvalosek/promise-repo.png?branch=master)](https://travis-ci.org/bvalosek/promise-repo)
[![NPM version](https://badge.fury.io/js/promise-repo.png)](http://badge.fury.io/js/promise-repo)

Map an object store with a common interface around a clean, promise-driven API.

[![browser support](https://ci.testling.com/bvalosek/promise-repo.png)](https://ci.testling.com/bvalosek/promise-repo)

## Installation

```
$ npm install promise-repo
```

## Usage

Assume we have a basic model constructor:

```javascript
function User()
{
  this.id    = null;
  this.name  = null;
  this.email = null;
}
```

Create a new, promise-based repository of `User` models:

```javascript
var Repository = require('promise-repo');

var users = new Repository(User);
```

If we attempt to call any of the accessor methods, we will get an error since
there is nothing sourcing the repository:

```javascript
users.get(id)
  .then(function(user) { ... })
  .catch(function(err) { console.error(err); });
```

```
> Error: No source provider for this method
```

Pass in a provider object that implements some or all of the accessor methods
to power the repository:

```javascript
var _userCache = {};
var _id       = 0;

users.source({
  get: function(id) {
    return _userCache[id] || null;
  },
  add: function(user) {
    var id = ++_id;
    _userCache[id] = user;
    user.id = id;
    return user;
  }
});
```

Even though our provider isn't returning a promise, the mapper in
`promise-repo` will ensure that all responses are normalized to promises.

Now we can `get` and `add`:

```javascript
var billy = new User();
billy.name = 'Billy';
billy.email = 'b@illy.net';

users.add(billy)
  .then(function(u) {
    return users.get(u.id);
  })
  .then(function(u) {
    console.log(u);
  })
```

```
{
  id: 1,
  name: 'Billy',
  email: 'b@illy.net'
}
```

## Methods

The following methods are available on the repository object, assuming a
corresponding provider has been source:

### var repository = new Repository(T)

Returns a new promise-wrapped repository of models with type `T`.

### repository.source(provider)

A `provider` is simply an object that has one or more of the *accessor methods*
on it. A repository can be source by one or more providers. Any methods on
`provider` that are not part of the accessor methods interface will be ignored.

### var p = repository.get(id)

Get a model by its id. Returns a promise `p` for either a single instance of
`T` with a specific `id`, or null.

### var p = repository.getAll([skip, take])

Get all models. Returns a promise `p` for either an array of instances of `T`,
or an empty array if no items are returned.

The parameters `skip` and `take` are passed to the underlying provider to
allow for pagination (if implemented).

### var p = repository.query(queryParams...)

Query the repository. Returns a promise `p` for either an array of instances of
`T`, or an empty array if no items are returned.

All parameters passed to this function are passed to the underlying provider,
and the specific format of these parameters will be determined by what provider
is source for the repo.

### var p = repository.add(object)

Add a new model to the repository. Returns a promise `p` for either a single
instance of `T` or null.

This will pass `object` (which should either be of type `T` or similar) to the
underlying provider to add it to the repository.

The returned object will be the store's representation of the model after the
add operation, e.g, with a newly created `id` parameter filled out.

### var p = repository.remove(object)

Remove an existing model from the repository. Returns a void promise `p` if
successful.

This will pass `object` (which should either be of type `T` or similar) to the
underlying provider to remove it from the repository.

No object is returned, but if the promise resolves then the item was removed.

### var p = repository.update(object)

Update an existing model in the repository. Returns a promise `p` for either a
single instance of `T` or null.

This will pass `object` (which should either be of type `T` or similar) to the
underlying provider to update its fields in the repository.

The returned object will be the repository's representation of the model after the
update operation, e.g, with all fields present if `object` is only a partial
representation.

## Provider modules

While can write your own providers by implementing some or all of the accessor
methods, here are some modules for common backing stores:

* [postgres-repo](https://github.com/bvalosek/postgres-repo)
* redis-repo (coming soon)
* memory-repo (coming soon)
* rest-ajax-repo (coming soon)

## Testing

```
$ npm test
```

## License

MIT
