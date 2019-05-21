const env = require('node-env-file')
const path = require('path')
const winston = require('winston')
env(path.join(__dirname, '/.env'))

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  process.exit(1)
}

const Botkit = require('botkit')
// const debug = require('debug')('botkit:main')

const botOptions = {
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  clientSigningSecret: process.env.clientSigningSecret,
  debug: false,
  scopes: ['bot'],
  // send_via_rtm: true,
  studio_token: process.env.studio_token,
  studio_command_uri: process.env.studio_command_uri
}

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
  const mongoStorage = require('botkit-storage-mongo')({
    mongoUri: process.env.MONGO_URI,
    tables: ['events', 'file_uploads', 'chat']
  })
  console.log(mongoStorage)
  botOptions.storage = mongoStorage
} else {
  botOptions.json_file_store = path.join(__dirname, '/.data/db/') // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
const controller = Botkit.slackbot(botOptions)

controller.startTicking()

// Logger
controller.logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Set up an Express-powered webserver to expose oauth and webhook endpoints
const webserver = require(path.join(__dirname, '/components/express_webserver.js'))(controller)

webserver.get('/', function (req, res) {
  res.render('index', {
    domain: req.get('host'),
    protocol: req.protocol,
    layout: 'layouts/default',
    data: {
      clientId: process.env.clientId
    }
  })
})
// Set up a simple storage backend for keeping a record of customers
// who sign up for the app via the oauth
require(path.join(__dirname, '/components/user_registration.js'))(controller)

// Send an onboarding message when a new team joins
require(path.join(__dirname, '/components/onboarding.js'))(controller)

const normalizedPath = require('path').join(__dirname, 'skills')

require('fs').readdirSync(normalizedPath).forEach(function (file) {
  if (!file.includes('save')) {
    require('./skills/' + file)(controller)
  }
})
