var State = require('ampersand-state')
  , _ = require('lodash')
  , path = require('path')
  , snakeize = require('snake-case')
  , flat  = require('flat')
  , fs = require('fs')
  , flatten = flat.flatten
  , unflatten = flat.unflatten
  , cwd = process.cwd()
  , internals = {
    defaultConfig: {}
    , envConfig: {}
    , envVars: {}
  }

internals.Config = State.extend({
  extraProperties: 'allow'
  , props: {
    nodeEnv: ['string', true, 'default']
  }
  , session: {
    configPath: ['string', true, path.join(cwd, 'config')]
  }
  , derived: {
    env: {
      deps: ['nodeEnv']
      , fn: function deriveNodeEnv(){
        return this.nodEnv
      }
    }
  }
  , toJSON: function toJSON(){
    return _.extend(this.serialize(), this.getAttributes({derived: true}))
  }
})

internals.reduceDefaultKeys = function reduceDefaultKeys(out, key){
  // nested keys are expected to be underscore separated as env vars
  // e.g. {couch: {url: 'localhost'}} → COUCH_URL = localhost
  var envVar = snakeize(key.replace('.', '_')).toUpperCase()
    , envVarValue = process.env[envVar]
    , newValueObject = {}

  // if the env var is set, unflatten the key and merge it in
  if (envVarValue) {
    newValueObject[key] = envVarValue

    out = _.merge(out, unflatten(newValueObject))
  }

  return out
}

module.exports = function initConfig(options){
  var config = new internals.Config()
    , defaultConfigPath = path.join(config.configPath, 'default.json')
    , envConfigPath = path.join(config.configPath, config.env + '.json')

  // sync methods are ok b/c we're starting up
  internals.defaultConfig = fs.existsSync(defaultConfigPath)
    ? JSON.parse(fs.readFileSync(defaultConfigPath, {encoding: 'utf8'}))
    : internals.defaultConfig

  internals.envConfig = fs.existsSync(envConfigPath)
    ? JSON.parse(fs.readFileSync(envConfigPath, {encoding: 'utf8'}))
    : internals.envConfig

  // order of preference, higher numbers override lower numbers
  // 1. default.json
  // 2. env.json
  // 3. env vars
  // 4. options

  // silient b/c this is inital configuration
  config.set(internals.defaultConfig, {silent: true})
  config.set(internals.envConfig, {silent: true})

  // get the env vars
  // flatten the keys so can can get all the nested keys
  internals.envVars = Object.keys(flatten(_.extend(config.toJSON(), options)))
    .reduce(internals.reduceDefaultKeys, {})

  config.set(internals.envVars, {silient: true})

  config.set(options, {silent: true})

  return config
}

module.exports.internals = internals
