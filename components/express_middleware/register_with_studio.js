const request = require('request')
const debug = require('debug')('botkit:register_with_studio')

module.exports = function (webserver, controller) {
  let registeredThisSession = false

  controller.registerDeployWithStudio = function (host) {
    if (!registeredThisSession && controller.config.studio_token) {
      // information about this instance of Botkit
      // send to Botkit Studio in order to display in the hosting tab
      const instance = {
        url: host,
        version: controller.version(),
        ts: new Date()
      }

      request({
        method: 'post',
        uri: (controller.config.studio_command_uri || 'https://studio.botkit.ai') + '/api/v1/bots/phonehome?access_token=' + controller.config.studio_token,
        form: instance
      }, function (error, res, body) {
        registeredThisSession = true

        if (error) {
          debug('error registering instance with Botkit Studio', error)
        } else {
          let json = null
          try {
            json = JSON.parse(body)
          } catch (error) {
            debug('error registering instance with Botkit Studio', error)
          }

          if (json) {
            if (json.error) {
              debug('error registering instance with Botkit Studio', json.error)
            }
          }
        }
      })
    }
  }

  if (webserver && controller.config.studio_token) {
    webserver.use(function (req, res, next) {
      controller.registerDeployWithStudio(req.get('host'))
      next()
    })
  }
}
