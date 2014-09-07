var _ = require('lodash')
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

internals.init = function initConfig(options){
  var config = _.merge({
      nodeEnv: process.env.NODE_ENV
      , env: process.env.NODE_ENV
    }, options)
    , configPath = _.isObject(options) && options.configPath
      ? options.configPath
      : cwd
    , defaultConfigPath = path.join(configPath, 'default.json')
    , envConfigPath = path.join(configPath, config.env + '.json')
    , envKeys

  // sync methods are ok b/c we're starting up
  internals.defaultConfig = fs.existsSync(defaultConfigPath)
    ? ALCE.parse(fs.readFileSync(defaultConfigPath, {encoding: 'utf8'}))
    : internals.defaultConfig

  internals.envConfig = fs.existsSync(envConfigPath)
    ? ALCE.parse(fs.readFileSync(envConfigPath, {encoding: 'utf8'}))
    : internals.envConfig

  // order of preference, higher numbers override lower numbers
  // 1. default.json
  // 2. env.json
  // 3. env vars
  // 4. options

  _.merge(config, internals.defaultConfig, internals.envConfig, options)

  // get the env vars
  if (config.allEnv) internals.envVars = internals.envToObject(process.env)
  else {
  // flatten the keys so can can get all the nested keys
    envKeys = Object.keys(flatten(_.extend(config, options)))
    internals.envVars = envKeys.reduce(internals.reduceDefaultKeys, {})
  }

  _.merge(config, internals.envVars)

  return config
}

module.exports = internals.init
module.exports.init = internals.init
module.exports.internals = internals
