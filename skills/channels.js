const { WebClient } = require('@slack/web-api')

module.exports = controller => {
  controller.channelJoin = function (channel, user, token) {
    const web = new WebClient(token)
    return web.groups.invite({ channel, user })
  }

  controller.createChannel = function (channelName, token) {
    const web = new WebClient(token)
    return web.groups.create({ name: channelName })
  }
}
