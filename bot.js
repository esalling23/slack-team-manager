const env = require('node-env-file')
env(__dirname + '/.env')

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  process.exit(1)
}

const Botkit = require('botkit')
const debug = require('debug')('botkit:main')

const bot_options = {
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  clientSigningSecret: process.env.clientSigningSecret,
  debug: false,
  scopes: ['bot'],
  // send_via_rtm: true,
  studio_token: process.env.studio_token,
  studio_command_uri: process.env.studio_command_uri
}

console.log(process.env.cal_id)

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
  const mongoStorage = require('botkit-storage-mongo')({
    mongoUri: process.env.MONGO_URI,
    tables: ['events', 'file_uploads', 'chat']
  })
  console.log(mongoStorage)
  bot_options.storage = mongoStorage
} else {
  bot_options.json_file_store = __dirname + '/.data/db/' // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
const controller = Botkit.slackbot(bot_options)

controller.startTicking()

// Set up an Express-powered webserver to expose oauth and webhook endpoints
const webserver = require(__dirname + '/components/express_webserver.js')(controller)

webserver.get('/', function(req, res) {
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
require(__dirname + '/components/user_registration.js')(controller)

// Send an onboarding message when a new team joins
require(__dirname + '/components/onboarding.js')(controller)

// enable advanced botkit studio metrics
require('botkit-studio-metrics')(controller)

const normalizedPath = require("path").join(__dirname, "skills")
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  if (!file.includes('save'))
    require("./skills/" + file)(controller)
})
