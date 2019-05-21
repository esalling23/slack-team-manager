const { WebClient } = require('@slack/web-api')

module.exports = controller => {
  controller.deleteMsg = function (msg, token) {
    const web = new WebClient(token)

    web.chat.delete({ ts: msg.ts, channel: msg.channel })
      .then(res => {
        controller.logger.info(res, 'deleted')
      }).catch(controller.logger.error)
  }
}
