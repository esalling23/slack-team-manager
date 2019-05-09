const { WebClient } = require('@slack/client')
const stringifyObject = require('stringify-object')
const _ = require('underscore')

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
        const { start, end } = controller.setTime('lessons')
        return controller.calendarEvents({
          auth,
          grabLessons: true,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      })
      .then(lessons => {
        console.log(lessons, 'the lessons')
        controller.trigger('material_message', [bot, thisTeam, 'calendar_alert', lessons])
      }).catch(console.error)
  })

  controller.hears('^homework (.*)', 'direct_message', function (bot, message) {
    console.log(message)
    let thisTeam
    controller.store.getTeam(message.team)
      .then(team => {
        thisTeam = team
        return controller.calendarAuth()
      })
      .then(auth => {
        const { start, end } = controller.setTime('homework')
        return controller.calendarEvents({
          auth,
          grabLessons: false,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      })
      .then(homework => {
        const onlyCohort = message.match[0].split(' ')[1]
        // only include calendars with at least one lesson
        const filtered = _.pick(homework, (v, k, o) => {
          let thisCohort = onlyCohort.length === 0 || onlyCohort === v.cohort
          return v.lessons.length > 0 && thisCohort
        })
        console.log(filtered, 'the homework')
        controller.trigger('material_message', [bot, thisTeam, 'homework_thread', filtered])
      })
      .catch(console.error)
  })
}
