var test   = require('tape');
var Mapper = require('../lib/Mapper.js');

test('Basic mapping', function(t) {
  t.plan(2);

  function T()
  {
    this.name = '';
    this.age = null;
  }

  var m = new Mapper(T);
  var o = m.toSingle([ { name: 'Bob', age: 24 } ]);

  t.deepEqual(o, { name: 'Bob', age: 24 });
  t.strictEqual(o.constructor, T);

});

test('Custom output transform', function(t) {
  t.plan(2);

  function T()
  {
    this.name = '';
    this.age = null;
  }

  var m = new Mapper(T);
  m.use(function(input, output, instance) {
    output.name = output.n;
    output.age = 0|output.a;
    delete output.n;
    delete output.a;
  });

  var o = m.toSingle({ n: 'Bob', a: '24' });
  t.deepEqual(o, { name: 'Bob', age: 24 });
  t.strictEqual(o.constructor, T);
});

test('Ensure single', function(t) {
  t.plan(7);

  var OBJ = { test: 123 };

  var m = new Mapper(function() {});
  t.deepEqual(m.toSingle(OBJ), OBJ, 'straight');
  t.deepEqual(m.toSingle([OBJ]), OBJ, 'array');
  t.deepEqual(m.toSingle(null), {}, 'null');
  t.deepEqual(m.toSingle(undefined), {}, 'undefined');
  t.deepEqual(m.toSingle([null]), {}, 'a null');
  t.deepEqual(m.toSingle([undefined]), {}, 'a undefined');
  t.deepEqual(m.toSingle([]), {}, 'empty array');
});

test('Ensure many', function(t) {
  t.plan(7);

  var OBJ = { test: 123 };

  var m = new Mapper(function() {});
  t.deepEqual(m.toMany(OBJ), [OBJ], 'straight');
  t.deepEqual(m.toMany([OBJ]), [OBJ], 'array');
  t.deepEqual(m.toMany(null), [{}], 'null');
  t.deepEqual(m.toMany(undefined), [{}], 'undefined');
  t.deepEqual(m.toMany([null]), [{}], 'a null');
  t.deepEqual(m.toMany([undefined]), [{}], 'a undefined');
  t.deepEqual(m.toMany([]), [], 'empty array');

});

test('Input transform', function(t) {
  t.plan(2);

  function T()
  {
    this.name = '';
    this.age = null;
  }

  var m = new Mapper(T);
  var o = m.transformInput({ name: 'Bob', age: 24 });

  t.deepEqual(o, { name: 'Bob', age: 24 });
  t.notStrictEqual(o.constructor, T);
});

test('Custom input / output transform', function(t) {
  t.plan(3);

  function T()
  {
    this.name = '';
    this.age = null;
  }

  var m = new Mapper(T);
  m.use(function(input, output, instance) {
    if (input) {
      input.n = ''+instance.name;
      delete input.name;
      input.a = ''+instance.age;
      delete input.age;
    } else {
      output.name = ''+output.n;
      delete output.n;
      output.age = 0|output.a;
      delete output.a;
    }
  });

  var o = m.transformOutput({ n: 'Bob', a: '25' });

  t.deepEqual(o, { name: 'Bob', age: 25 });
  t.deepEqual(o.constructor, T);

  t.deepEqual(
    m.transformInput({ name: 'Bob', age: 24 }),
    { n: 'Bob', a: '24' });


});
