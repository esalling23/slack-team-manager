const { WebClient } = require('@slack/web-api')

module.exports = controller => {
  controller.deleteMsg = function (msg, token) {
    const web = new WebClient(token)

    web.chat.delete({ ts: msg.ts, channel: msg.channel })
      .then(res => {
        console.log(res, 'deleted')
      }).catch(console.error)
  }
}
