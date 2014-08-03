var test = require('prova')
  , configInit = require('../index.js')
  , _ = require('lodash')
  , State = require('ampersand-state')
  , _env = _.cloneDeep(process.env)

test('config', function(t){
  var newEnv = 'testing'
    , newUrl = 'newUrl'
    , config = configInit()

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
  configInit.internals.defaultConfig = {couch: {url: false}}
  config = configInit()

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

  // cleanup
  process.env = _env
  t.end()
})
