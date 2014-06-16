var test = require('tape');

var Repository = require('../lib/Repository.js');
var Promise    = require('bluebird');

test('Missing implementations', function(t) {
  t.plan(7);

  function T() { }
  var m = new Repository(T);

  m.get().catch(function() { t.pass('get'); });
  m.getAll().catch(function() { t.pass('getAll'); });
  m.add().catch(function() { t.pass('add'); });
  m.remove().catch(function() { t.pass('remove'); });
  m.update().catch(function() { t.pass('update'); });
  m.fetch().catch(function() { t.pass('fetch'); });
  m.query().catch(function() { t.pass('query'); });

});

test('Map output to single', function(t) {

  // Test all the single outout methods
  var methods = ['get', 'add', 'update', 'fetch'];
  t.plan(4 * methods.length);

  var OBJ = { stuff: 123 };

  function T() { }
  var m = new Repository(T);
  var RET;

  methods.forEach(function(M) {
    m['_' + M] = function() { return RET; };

    // plain value
    RET = OBJ;
    m[M]()
      .then(function(x) { t.deepEqual(x, OBJ, 'straight obj'); })

      // array-ed value
      .then(function() { RET = [OBJ]; })
      .then(function() { return m.get(); })
      .then(function(x) { t.deepEqual(x, OBJ, 'arrayed'); })

      // Promise for a val
      .then(function() { RET = Promise.resolve(OBJ); })
      .then(function() { return m.get(); })
      .then(function(x) { t.deepEqual(x, OBJ, 'promise'); })

      // Promise for an array-ed val
      .then(function() { RET = Promise.resolve([OBJ]); })
      .then(function() { return m.get(); })
      .then(function(x) { t.deepEqual(x, OBJ, 'arrayed promise'); });
  });

});

test('Map output to an array', function(t) {
  var methods = ['query', 'getAll'];
  t.plan(4 * methods.length);

  var OBJ = { stuff: 123 };

  function T() { }
  var m = new Repository(T);
  var RET;

  methods.forEach(function(M) {
    m['_' + M] = function() { return RET; };

    // plain value
    RET = OBJ;
    m[M]()
      .then(function(x) { t.deepEqual(x, [OBJ], 'straight obj'); })

      // array-ed value
      .then(function() { RET = [OBJ]; })
      .then(function() { return m.getAll(); })
      .then(function(x) { t.deepEqual(x, [OBJ], 'arrayed'); })

      // Promise for a val
      .then(function() { RET = Promise.resolve(OBJ); })
      .then(function() { return m.getAll(); })
      .then(function(x) { t.deepEqual(x, [OBJ], 'promise'); })

      // Promise for an array-ed val
      .then(function() { RET = Promise.resolve([OBJ]); })
      .then(function() { return m.getAll(); })
      .then(function(x) { t.deepEqual(x, [OBJ], 'arrayed promise'); });
  });
});

test('Basic sourcing', function(t) {
  t.plan(2);

  var OBJ = { stuff: 123 };

  function T() { }
  var m = new Repository(T);

  m.source({ get: function() { return OBJ; }});
  m.get().then(function(x) { t.deepEqual(x, OBJ, 'source single'); });
  m.source({ getAll: function() { return [OBJ]; }});
  m.getAll().then(function(x) { t.deepEqual(x, [OBJ], 'source multi'); });

});

test('Throw on oversource', function(t) {
  t.plan(1);

  var m = new Repository(function() {});

  m.source({ get: function(id) { } });
  t.throws(function() { m.source({ get: function(id) { } }); });

});

test('add', function(t) {
  var methods = ['add', 'fetch', 'update'];
  t.plan(3 * methods.length);

  function User()
  {
    this.id = null;
    this.name = '';
  }

  methods.forEach(function(M) {
    var m = new Repository(User);

    var prov = {};
    prov[M] = function(item) {
      t.deepEqual(item, { id: '1', n: 'bob' });
    };
    m.source(prov);

    m.use(function(input, output, instance) {
      if (input) {
        input.id = ''+instance.id;
        input.n = ''+instance.name;
        delete input.name;
      } else {
        output.name = output.n;
        delete output.n;
        output.id = ''+output.id;
      }
    });

    m[M]({ id: 1, name: 'bob' }).then(function(user) {
      t.deepEqual(user, { id: '1', name: 'bob' });
      t.strictEqual(user.constructor, User);
    });
  });


});

