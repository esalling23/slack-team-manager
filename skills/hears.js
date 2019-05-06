const { WebClient } = require('@slack/client')
const stringifyObject = require('stringify-object')
// const _ = require('underscore')

module.exports = function (controller) {
  // Hears go here

  // controller.hears('(.*)', 'ambient', function(bot, message) {
  //   controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).catch(function (error) {
  //     bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + error)
  //   })
  // })

  controller.hears('^delete (.*)', 'direct_message', function (bot, message) {
    // deletes a certain # of own messages sent previously
    controller.store.getTeam(message.team)
      .then(team => {
        const channel = message.match[0].split(' ')[1]
        const ts = message.match[0].split(' ')[2]
        controller.deleteMsg({ ts, channel }, team.bot.token)
      }).catch(console.error)
  })

  controller.hears('^find (.*)', 'direct_message', function (bot, message) {
    // lookup history of messages
    controller.store.getTeam(message.team)
      .then(team => {
        console.log(message.match[0].split(' ')[1])
        const web = new WebClient(team.bot.app_token)
        return web.conversations.history({
          channel: message.match[0].split(' ')[1],
          limit: 5
        })
      }).then(res => {
        console.log(stringifyObject(res.messages))
      })
      .catch(console.error)
  })

  controller.hears('test', 'direct_message', function (bot, message) {
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

  controller.hears('calendar', 'direct_message', function (bot, message) {
    console.log(message)
    let thisTeam
    controller.store.getTeam(message.team)
      .then(team => {
        thisTeam = team
        return controller.calendarAuth()
      })
      .then(auth => {
        // adjust 3 hours for boston time
        const now = new Date().getTime() + 240
        // start a day ahead
        const start = new Date(now + (24 * 60 * 60 * 1000))
        // end in a week
        const end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000))

        console.log(start.toDateString(), end.toDateString())

        return controller.calendarEvents({
          auth,
          lessons: true,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      })
      .then(lessons => {
        console.log(lessons, 'the lessons')
        controller.trigger('calendar', [bot, thisTeam, lessons])
      }).catch(console.error)
  })

  controller.hears('homework', 'direct_message', function (bot, message) {
    console.log(message)
    let thisTeam
    controller.store.getTeam(message.team)
      .then(team => {
        thisTeam = team
        return controller.calendarAuth()
      }).then(auth => {
        // adjust 3 hours for boston time
        const now = new Date().getTime() + 240
        // start a few hours behind
        const start = new Date(now - (3 * 60 * 60 * 1000))
        // end at midnight tonight
        const end = new Date(start.getTime())
        end.setHours(24, 0, 0, 0)
        console.log(start.toDateString(), end.toDateString())
        return controller.calendarEvents({
          auth,
          lessons: false,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      }).then(homework => {
        console.log(homework, 'the homework')
        controller.trigger('homework_thread', [bot, thisTeam, homework])
      }).catch(console.error)
  })
}
