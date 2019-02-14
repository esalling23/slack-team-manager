const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  // Events go here
  
  controller.on('morning_checkin', function(bot, team) {
    // console.log(event)
    console.log(team.id)
    for (const user of team.users) {
      console.log(bot)
      const web = new WebClient(bot.config.token);

      web.conversations.list({ types: "im" })
        .then(list => {
          console.log(list)
          const thisIM = _.findWhere(list.channels, { user: user.userId })
          console.log(thisIM)
          return controller.studio.get(bot, 'morning_check', user.userId, thisIM.id)
        })
        .then(convo => {
          convo.changeTopic('default')
          const template = convo.threads['default'][0]
          template.username = process.env.username
          template.icon_url = process.env.icon_url

          convo.activate()
        })
        .catch(console.error)
    }
  })
  
  // interval for every minute
  setInterval(function() {
    
    const now = new Date()
    console.log(now.getHours() - 5, now.getMinutes())
    if (now.getHours() === 8 && now.getMinutes() === 0) {
      for (const id in controller.store.teams) {
        const team = controller.store.teams[id]
        controller.trigger('morning_checkin', [controller.spawn(team.bot), team])
      }
    }
  }, 1000 * 60)
}
