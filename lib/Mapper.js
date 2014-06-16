module.exports = Mapper;

/**
 * Transform the output from a source and input to a source via a stack of
 * transform functions.
 * @param {Function} T type constructor
 * @constructor
 */
function Mapper(T)
{
  this.T = T;
  this._transforms = [];
}

/**
 * Add a transform to the stack that handles both input and output
 * transformation.
 * @param {function(input:object, output:object, instance:object): object} f
 */
Mapper.prototype.use = function(f)
{
  this._transforms.push(f);
};

/**
 * Take the raw output from a source and mutate it via a series of transforms,
 * then dump into a type object.
 * @param {object} raw
 * @return {object} instance Suggested instance container
 */
Mapper.prototype.transformOutput = function(raw, instance)
{
  // If we have a "suggested" instance object to use, ensure its the right type
  if (!instance || instance.constructor !== this.T)
    instance = new this.T();

  // Apply all transforms in order
  for (var n = 0; n < this._transforms.length; n++) {
    var f = this._transforms[n];
    var inst = f(null, raw, instance);

    // If a tranform function returns a value, start using that instead of the
    // instance we created. This allows for transform functions to override the
    // default instance its handed when doing output transform
    if (inst !== undefined)
      instance = inst;
  }

  // Dump and chump into the instance from whats left in our raw output hash
  for (var key in raw) {
    instance[key] = raw[key];
  }

  return instance;
};

/**
 * Prepare a slug of input to be passed back ot the source from a typed object.
 * @param {object} instance Typed object input
 * @param {object} slug prepared output object
 */
Mapper.prototype.transformInput = function(instance, slug)
{
  slug = slug || {};

  // Straight dumpn
  for (var key in instance) {
    if (key === 'toJSON' || key === 'toString') continue;
    if (typeof instance[key] === 'function') continue;
    slug[key] = instance[key];
  }

  // Apply transform functions in reverse order
  for (var n = this._transforms.length - 1; n >= 0; n--) {
    var f = this._transforms[n];
    f(slug, null, instance);
  }

  return slug;
};

/**
 * Take the output from something and ensure its a single, transformed value.
 * @param {object} thing
 * @param {object=} instance
 * @return {object}
 */
Mapper.prototype.toSingle = function(thing, instance)
{
  if (thing && thing.length)
    thing = thing[0];

  return this.transformOutput(thing, instance);
};

/**
 * Take the output of something and ensure its an array of transformed values.
 * @param {array.<object>} things
 * @return {array.<object>}
 */
Mapper.prototype.toMany = function(things)
{
  if (!things || things.length === undefined)
    things = [things];

  var _this = this;
  return things.map(function(thing) {
    return _this.transformOutput(thing);
  });
};

