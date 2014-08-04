var test = require('prova')
  , jace = require('../index.js')
  , _ = require('lodash')
  , State = require('ampersand-state')
  , _env = _.cloneDeep(process.env)

test('jace', function(t){
  var newEnv = 'testing'
    , newUrl = 'newUrl'
    , config = jace()

  t.ok(
    config instanceof State
    , 'returns a instance of ampersand-state'
  )

  t.equal(
    config.nodeEnv
    , process.env.NODE_ENV || 'default'
    , 'prefers env vars over settings in the json file'
  )

  // mock env vars
  process.env.NODE_ENV = newEnv
  process.env.COUCH_URL = newUrl
  jace.internals.defaultConfig = {couch: {url: false}}
  config = jace()

  t.equal(
    config.nodeEnv
    , newEnv
    , 'calling the lib re-processes'
  )

  t.equal(
    config.couch.url
    , newUrl
    , 'finds env vars from nested objects'
  )

  config = jace({env: newUrl})
  t.equal(
    config.env
    , newUrl
    , 'options override everything'
  )

  process.env.DUMMY = true
  config = jace({allEnv: true})
  t.equal(
    config.dummy
    , true
    , 'allEnv option pulls in all env vars'
  )

  // cleanup
  process.env = _env
  t.end()
})

test('jace#internals.envToObject', function(t){
  var fn = jace.internals.envToObject
    , value = 'val'

  t.deepEqual(
    fn({'DB_COUCH_URL': value, 'DB_COUCH_NAME': value})
    , {db: {couch: {url: value, name: value}}}
    , 'converts an env object with uppercase and snake case keys to a nested object'
  )

  t.deepEqual(
    fn({THING: 'true', ThING2: 'TRUE'})
    , {thing: true, thing2: true}
    , 'correctly parses true values'
  )

  t.deepEqual(
    fn({THING: 'false', ThING2: 'FALSE'})
    , {thing: false, thing2: false}
    , 'correctly parses false values'
  )

  t.end()
})

test('jace integration', function(t){
  var config

  config = jace({
    configPath: __dirname + '/fixtures/'
    , env: 'test'
  })

  t.ok(
    config.hi
    , 'reads default.json'
  )

  t.equal(
    config.good
    , 'day'
    , 'overrides the defaults with the env json'
  )

  t.end()
})
