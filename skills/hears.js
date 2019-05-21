const { WebClient } = require('@slack/client')
const stringifyObject = require('stringify-object')
const _ = require('underscore')
const moment = require('moment')

module.exports = function (controller) {
  // Hears go here

  // controller.hears('(.*)', 'ambient', function(bot, message) {
  //   controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).catch(function (error) {
  //     bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + error)
  //   })
  // })
  controller.hears('^help$', 'direct_message', function (bot, message) {
    controller.store.getTeam(message.team)
      .then(team => {
        return controller.studio.get(bot, 'help', team.createdBy, message.channel)
      })
      .then(convo => {
        convo.changeTopic('default')
        const template = convo.threads['default'][0]
        template.username = process.env.username
        template.icon_url = process.env.icon_url

        convo.activate()
      }).catch(console.error)
  })

  controller.hears('^cohort(.*)', 'direct_message', function (bot, message) {
    if (message.match[0].split(' ').length < 4) {
      bot.reply(message, 'I need more info. Please send me the new cohort\'s number, first day, and last day. Ex: \'cohort 01 05-03-2019 08-03-2019\'')
      return
    }
    controller.store.getTeam(message.team)
      .then(team => {
        const newCohort = message.match[0].split(' ')[1]
        if (!team.cohorts) {
          team.cohorts = {}
        }
        team.cohorts[newCohort] = {
          startDate: message.match[0].split(' ')[2],
          endDate: message.match[0].split(' ')[3],
          materialsSent: {
            lastHw: '',
            lastCal: ''
          }
        }
        controller.store.teams[team.id] = team
        controller.logger.info('Added new cohort: ', controller.store.teams[team.id].cohorts[newCohort])
      })
      .catch(console.error)
  })

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
        controller.logger.info(message.match[0].split(' ')[1])
        const web = new WebClient(team.bot.app_token)
        return web.conversations.history({
          channel: message.match[0].split(' ')[1],
          limit: 5
        })
      }).then(res => {
        controller.logger.info(stringifyObject(res.messages))
      })
      .catch(console.error)
  })

  controller.hears('test', 'direct_message', function (bot, message) {
    controller.logger.info(message)
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

  controller.hears('^calendar(.*)', 'direct_message', function (bot, message) {
    const now = new Date()
    controller.logger.info(message)
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
        controller.logger.info(lessons, 'the lessons')
        const onlyCohort = message.match[0].split(' ')[1]
        const forced = message.match[0].split(' ')[2]
        controller.logger.info(onlyCohort)
        // only include calendars with at least one lesson
        const filtered = _.pick(lessons, (v, k, o) => {
          let thisCohort = !onlyCohort ? true : onlyCohort.length === 0 || onlyCohort === v.cohort

          let hoursAgo = true
          if (!forced && thisTeam.cohorts[v.cohort] && thisTeam.cohorts[v.cohort].materialsSent) {
            if (thisTeam.cohorts[v.cohort].materialsSent.lastHw !== '') {
              const lastHw = new Date(thisTeam.cohorts[v.cohort].materialsSent.lastHw)
              const diff = new Date(Math.abs(lastHw.getTime(), now.getTime()))
              controller.logger.info(`Last HW sent out ${moment.duration(diff).asHours()} hours ago`)
              hoursAgo = moment.duration(diff).asHours() > 12
            }
          }
          return v.lessons.length > 0 && thisCohort && hoursAgo
        })
        controller.trigger('material_message', [bot, thisTeam, 'calendar_alert', filtered])
      }).catch(console.error)
  })

  controller.hears('^homework(.*)', 'direct_message', function (bot, message) {
    const now = new Date()
    controller.logger.info(message)
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
        const forced = message.match[0].split(' ')[2]
        controller.logger.info(onlyCohort)
        // only include calendars with at least one lesson
        const filtered = _.pick(homework, (v, k, o) => {
          let thisCohort = !onlyCohort ? true : onlyCohort.length === 0 || onlyCohort === v.cohort

          let hoursAgo = true
          if (!forced && thisTeam.cohorts[v.cohort] && thisTeam.cohorts[v.cohort].materialsSent) {
            if (thisTeam.cohorts[v.cohort].materialsSent.lastHw !== '') {
              const lastHw = new Date(thisTeam.cohorts[v.cohort].materialsSent.lastHw)
              const diff = new Date(Math.abs(lastHw.getTime(), now.getTime()))
              controller.logger.info(`Last HW sent out ${moment.duration(diff).asHours()} hours ago`)
              hoursAgo = moment.duration(diff).asHours() > 12
            }
          }
          return v.lessons.length > 0 && thisCohort && hoursAgo
        })
        controller.logger.info(filtered, 'the homework')
        controller.trigger('material_message', [bot, thisTeam, 'homework_thread', filtered])
      })
      .catch(console.error)
  })
}
