const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  // Hears go here
  controller.hears('test', 'direct_message', function(bot, message) {
    console.log(message)
    controller.store.getTeam(message.team)
      .then(team => {
        controller.studio.get(bot, 'morning_check', message.user, message.channel).then(convo => {
          convo.changeTopic('default')
          const template = convo.threads['default'][0]
          template.username = process.env.username
          template.icon_url = process.env.icon_url

          convo.activate()
        })
      }).catch(console.error)
    
  })
}
