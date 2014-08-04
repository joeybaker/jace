var State = require('ampersand-state')
  , _ = require('lodash')
  , path = require('path')
  , snakeize = require('snake-case')
  , flat  = require('flat')
  , fs = require('fs')
  , ALCE = require('alce')
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
    , allEnv: ['boolean', true, false]
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

internals.parseEnvVarValue = function parseEnvVarValue(value){
  var parsedValue

  // parse out boolean values
  if (value.toLowerCase() === 'true')
    parsedValue = true
  else if (value.toLowerCase() === 'false')
    parsedValue = false
  else parsedValue = value

  return parsedValue
}

internals.reduceDefaultKeys = function reduceDefaultKeys(out, key){
  // nested keys are expected to be underscore separated as env vars
  // e.g. {couch: {url: 'localhost'}} → COUCH_URL = localhost
  var envVar = snakeize(key.replace(/\./g, '_')).toUpperCase()
    , envVarValue = process.env[envVar]
    , newValueObject = {}

  // if the env var is set, unflatten the key and merge it in
  if (envVarValue) {
    newValueObject[key] = internals.parseEnvVarValue(envVarValue)

    out = _.merge(out, unflatten(newValueObject))
  }

  return out
}

internals.envToObject = function envToObject(env){
  return _.reduce(env, function reduceEnvObject(out, value, key){
    var newObject = {}

    newObject[key.toLowerCase().replace(/_/g, '.')] = internals.parseEnvVarValue(value)

    return _.merge(out, unflatten(newObject))
  }, {})
}

module.exports = function initConfig(options){
  var config = new internals.Config(options)
    , defaultConfigPath = path.join(config.configPath, 'default.json')
    , envConfigPath = path.join(config.configPath, config.env + '.json')
    , envKeys

  // sync methods are ok b/c we're starting up
  internals.defaultConfig = fs.existsSync(defaultConfigPath)
    ? ALCE.parse(fs.readFileSync(defaultConfigPath, {encoding: 'utf8'})).toObject()
    : internals.defaultConfig

  internals.envConfig = fs.existsSync(envConfigPath)
    ? ALCE.parse(fs.readFileSync(envConfigPath, {encoding: 'utf8'})).toObject()
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
  if (config.allEnv) internals.envVars = internals.envToObject(process.env)
  else {
    envKeys = Object.keys(flatten(_.extend(config.toJSON(), options)))
    internals.envVars = envKeys.reduce(internals.reduceDefaultKeys, {})
  }

  config.set(internals.envVars, {silient: true})

  config.set(options, {silent: true})

  return config
}

module.exports.internals = internals
