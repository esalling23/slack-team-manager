// const _ = require('underscore')
// const gm = require("gm")

module.exports = function (controller) {
  controller.middleware.receive.use(function (bot, message, next) {
    // controller.logger.info('RCVD:', message)
    next()
  })

  controller.middleware.send.use(function (bot, message, next) {
    // controller.logger.info('SEND:', message)
    next()
  })
}
