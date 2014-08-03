# JACE

[![NPM](https://nodei.co/npm/jace.png)](https://nodei.co/npm/jace/) [![Build Status](https://travis-ci.org/joeybaker/jace.png?branch=master)](https://travis-ci.org/joeybaker/jace)

JSON Ampersand Configuration by Environment State. Node project configuration. (Also, it sounds like brace, which is used to support a whole project)

Jace is a configuration library for a node project that recognizes several levels of overrides.

The order of preference, higher numbers override lower numbers

1. default.json
2. {env}.json // env is determined by the `NODE_ENV` bash variable, or by the `env` option.
3. bash env vars, converted to nested objects.
4. options object

Every level merges and overrides the previous.

## Install
`npm i -S jace`

## Usage
```js
var jace = require('jace')
  , options = {
    db: {
      user: 'me'
    }
    , users: 0
    // defaults to './config'
    , configPath: __dirname
  }
  , config = jace(options)

// config is an ampersand-state object
config.env // will be the value of process.env.NODE_ENV if set, else 'default'
config.db.user // 'me'

// …

function onUserRegistration(){
  config.users++
}

config.on('change:users', console.log.bind(console, 'added a user'))
```

### Setting env vars
Bash environmental variables are set with `export MY_VAR=rabbit`. Jace converts snake case (underscore separated) env vars into nested objects.

`MY_RABBIT=fluffy` becomes `{my: {rabbit: 'fluffy'}}`

`MY_RABBIT=fluffy; MY_BUNNY=cottontail` becomes `{my: {rabbit: 'fluffy', bunny: 'cottontail'}}`

## Options
### `configPath`
Where should we look for `default.json` and other config files? Defaults to `./config`.

### `allEnv`
Defaults to `false`. If `true`, will pull in all env vars, not just the ones defined in a JSON config file or the options.

NOTE: most systems have many irrelvant env vars. It's easy to pollute your config with uncessary properties if you turn this on.

## Tests
Tests are [prova](https://github.com/azer/prova), based on [tape](https://github.com/substack/tape). They can be run with `npm test`.

## Developing
To publish, run `gulp publish --bump=patch`

## Changelog
### 1.0.0
Initial Release
