const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const http = require('http')
const hbs = require('express-hbs')
const path = require('path')

module.exports = function (controller) {
  const webserver = express()
  webserver.use(cookieParser())
  webserver.use(bodyParser.json())
  webserver.use(bodyParser.urlencoded({ extended: true }))

  // set up handlebars ready for tabs
  webserver.engine('hbs', hbs.express4({partialsDir: path.join(__dirname, '/../views/partials')}))
  webserver.set('view engine', 'hbs')
  webserver.set('views', path.join(__dirname, '/../views/'))

  hbs.registerHelper('jsonPrint', function (obj) {
    return JSON.stringify(obj, null, 2)
  })

  // import express middlewares that are present in /components/express_middleware
  let normalizedPath = require('path').join(__dirname, 'express_middleware')
  require('fs').readdirSync(normalizedPath).forEach(function (file) {
    require('./express_middleware/' + file)(webserver, controller)
  })

  webserver.use(express.static('public'))

  const server = http.createServer(webserver)
  // const io = require('socket.io')(server)

  server.listen(process.env.PORT || 3000, null, function () {
    controller.logger.info('Express webserver configured and listening at http://localhost:' + process.env.PORT || 3000)
  })

  // import all the pre-defined routes that are present in /components/routes
  normalizedPath = require('path').join(__dirname, 'routes')
  require('fs').readdirSync(normalizedPath).forEach(function (file) {
    require('./routes/' + file)(webserver, controller)
  })

  controller.webserver = webserver
  controller.httpserver = server

  return webserver
}
