module.exports = Repository;

var Promise = require('bluebird').Promise;
var Mapper  = require('./Mapper.js');

/**
 * A repository pattern that uses a series of sourced providers that attempt to
 * fire off CRUD-ish methods. Gaurentees a promise-based API and consistent
 * arity of return values.
 * @constructor
 */
function Repository(T)
{
  var mapper = this._mapper = new Mapper(T);
  this._toMany = function(x) { return mapper.toMany(x); };
  this._toSingle = function(x) { return mapper.toSingle(x); };

  // Implementation pointers
  this._get    = null;
  this._getAll = null;
  this._query  = null;
  this._add    = null;
  this._remove = null;
  this._fetch  = null;
  this._update = null;
}

var METHODS = ['get', 'getAll', 'query', 'add', 'remove', 'fetch', 'update'];

/**
 * Delegate custom transforms to the internal mapper
 * @param {function(input:object, output:object, instance:object): object} f
 * @return {Repository} this object
 */
Repository.prototype.use = function(f)
{
  this._mapper.use(f);
  return this;
};

/**
 * Provide this repo with a backing source for one or more methods.
 * @param {object} source
 */
Repository.prototype.source = function(source)
{
  for (var n = 0; n < METHODS.length; n++) {
    var key = METHODS[n];
    var _key = '_' + key;
    if (typeof source[key] !== 'function') continue;
    if (this[_key])
      throw new Error('Attempted to source duplicate method');
    this[_key] = source[key].bind(source);
  }
};

/**
 * Find an item based on its id.
 * @param {string} id
 * @return {Promise} A single object.
 */
Repository.prototype.get = function(id)
{
  if (!this._get)
    return Promise.reject('No source provider for this method');

  return Promise
    .resolve(this._get(id))
    .then(this._toSingle);
};

/**
 * Get all items.
 * @return {Promise} An array of objects
 */
Repository.prototype.getAll = function()
{
  if (!this._getAll)
    return Promise.reject('No source provider for this method');

  return Promise
    .resolve(this._getAll())
    .then(this._toMany);
};

/**
 * Query the underying provider for an array of items.
 * @return {Promise} An array of objects
 */
Repository.prototype.query = function()
{
  if (!this._query)
    return Promise.reject('No source provider for this method');

  return Promise
    .resolve(this._query.apply(this._query, arguments))
    .then(this._toMany);
};

/**
 * @param {object} item
 * @return {Promise} A single object
 */
Repository.prototype.add = function(item)
{
  if (!this._add)
    return Promise.reject('No source provider for this method');

  var slug = this._mapper.transformInput(item);
  return Promise
    .resolve(this._add(slug))
    .then(this._handleOutput(slug, item));
};

/**
 * Persist an item's state to the underyling provider.
 * @param {object} item
 * @return {Promise} A single object
 */
Repository.prototype.update = function(item)
{
  if (!this._update)
    return Promise.reject('No source provider for this method');

  var slug = this._mapper.transformInput(item);
  return Promise
    .resolve(this._update(slug))
    .then(this._handleOutput(slug, item));
};

/**
 * Find and populate an item basic on its identity
 * @param {object} item
 * @return {Promise} A single object
 */
Repository.prototype.fetch = function(item)
{
  if (!this._fetch)
    return Promise.reject('No source provider for this method');

  var slug = this._mapper.transformInput(item);
  return Promise
    .resolve(this._fetch(slug))
    .then(this._handleOutput(slug, item));
};

/**
 * Remove a particular item.
 * @param {object} item
 * @return {Promise} void
 */
Repository.prototype.remove = function(item)
{
  if (!this._remove)
    return Promise.reject('No source provider for this method');

  return Promise
    .resolve(this._remove(item))
    .then();
};

/**
 * Given a slug, ensure out output for a single item is at worst the input we
 * gave it.
 * @private
 */
Repository.prototype._handleOutput = function(slug, instance)
{
  var _this = this;
  return function(output) {
    if (output === undefined)
      output = slug;
    return _this._mapper.toSingle(output, instance);
  };
};
