const _ = require('underscore')
const { WebClient } = require('@slack/client')
const moment = require('moment')

module.exports = function (controller) {
  // Events go here

  controller.findPrivateChannels = function (web) {
    return web.conversations.list({ types: 'private_channel' })
  }

  controller.findForumChannels = function (list, cohorts) {
    const cohortChannels = _.filter(list.channels, (channel) => {
      const match = _.pick(cohorts, (val, key, obj) => {
        console.log(val, key, obj)
        const match = new RegExp(val.cohort + '-forum', 'g')
        return channel.name.match(match) !== null
      })
      return Object.keys(match).length > 0
    })
    console.log('Cohort Channels:', cohortChannels)
    return cohortChannels
  }

  controller.sendMaterialMessage = function (convos, cohorts, cohortChannels) {
    for (let convo of convos) {
      const channel = _.findWhere(cohortChannels, { id: convo.context.channel })

      const lessons = _.uniq(_.filter(cohorts, item => {
        console.log(item, channel.name)
        return item.cohort === channel.name.split('-')[2]
      })[0].lessons)

      convo.changeTopic('default')
      console.log(lessons, 'are the homeworks')
      if (lessons.length > 0) {
        const template = convo.threads['default'][0]
        template.username = process.env.username.replace('_', ' ')
        template.icon_url = process.env.icon_url
        template.attachments[0].text += '\n'

        const hideUrl = template.attachments[0].title === 'Upcoming Lessons'

        for (let i of lessons) {
          const text = hideUrl ? `${i}` : `<https://git.generalassemb.ly/ga-wdi-boston/${i}|${i}>`
          template.attachments[0].text += `- ${text} \n`
        }

        convo.activate()
      }
    }
  }

  controller.on('material_message', function (bot, team, scriptName, cohorts) {
    let cohortChannels
    const web = new WebClient(bot.config.token)
    web.conversations.list({ types: 'private_channel' })
      .then(list => {
        cohortChannels = controller.findForumChannels(list, cohorts)
        const calPromises = _.map(cohortChannels, (channel) => {
          return controller.studio.get(bot, scriptName, team.createdBy, channel.id)
        })
        return Promise.all(calPromises)
      })
      .then(convos => {
        const thisTeam = controller.store.teams[team.id]
        _.each(cohorts, cohort => {
          const num = cohort.cohort
          if (!thisTeam.cohorts[num].materialsSent) {
            thisTeam.cohorts[num].materialsSent = {
              lastHw: '',
              lastCal: ''
            }
          }
          switch (scriptName) {
            case 'calendar_alert':
              thisTeam.cohorts[num].materialsSent.lastCal = new Date()
              break

            case 'homework_thread':
              thisTeam.cohorts[num].materialsSent.lastHw = new Date()
              break
          }
          console.log(`Cohort ${num} got ${scriptName} last at ${new Date()}`)
        })
        controller.store.teams[thisTeam.id] = thisTeam
        controller.sendMaterialMessage(convos, cohorts, cohortChannels)
      })
      .catch(console.error)
  })

  controller.setTime = function (type) {
    // adjust 3 hours for boston time
    const now = new Date().getTime() + 240
    let start
    let end

    switch (type) {
      case 'lessons':
        // look 24 hours ahead so we don't include today's lessons
        start = new Date(now + (24 * 60 * 60 * 1000))
        // then by the number of days into the future we want to look (7 for a week)
        end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000))
        break

      case 'homework':
        // start a few hours behind
        start = new Date(now - (3 * 60 * 60 * 1000))
        // end in a couple hours
        end = new Date(start.getTime())
        end.setHours(24, 0, 0, 0)
        break
    }
    return {
      start,
      end
    }
  }

  // controller.on('morning_checkin', function (bot, team) {
  //   // console.log(event)
  //   console.log(team.id)
  //   for (const user of team.users) {
  //     console.log(bot)
  //     const web = new WebClient(bot.config.token)
  //
  //     web.conversations.list({ types: 'im' })
  //       .then(list => {
  //         console.log(list)
  //         const thisIM = _.findWhere(list.channels, { user: user.userId })
  //         console.log(thisIM)
  //         return controller.studio.get(bot, 'morning_check', user.userId, thisIM.id)
  //       })
  //       .then(convo => {
  //         convo.changeTopic('default')
  //         const template = convo.threads['default'][0]
  //         template.username = process.env.username
  //         template.icon_url = process.env.icon_url
  //
  //         convo.activate()
  //       })
  //       .catch(console.error)
  //   }
  // })

  // interval for every minute
  setInterval(function () {
    const now = new Date()
    const hours = now.getHours() - 4
    const mins = now.getMinutes()
    const dayOfWeek = now.getDay()
    console.log(hours, mins)
    // console.log('is it friday @ 3pm?', now.getDay() === 5 && mins === 0 && hours === 15)

    if (dayOfWeek === 5 && mins === 0 && hours === 15) {
      // Every friday at 3pm
      // Send next week's lessons list
      controller.calendarAuth()
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
          // only include calendars with at least one lesson
          for (const id in controller.store.teams) {
            const team = controller.store.teams[id]
            // only include calendars with at least one lesson
            const filtered = _.pick(lessons, (v, k, o) => {
              let hoursAgo = true
              if (team.cohorts[v.cohort] && team.cohorts[v.cohort].materialsSent) {
                const lastHw = new Date(team.cohorts[v.cohort].materialsSent.lastHw)
                const diff = new Date(Math.abs(lastHw.getTime(), now.getTime()))
                hoursAgo = moment.duration(diff).asHours() > 12
              }
              return v.lessons.length > 0 && hoursAgo
            })
            console.log(filtered, 'the lessons')
            controller.trigger('material_message', [controller.spawn(team.bot), team, 'calendar_alert', filtered])
          }
        })
        .catch(console.error)
    } else if (hours === 13 && mins === 0 && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Every week day at 8am
      // for (const id in controller.store.teams) {
      //   const team = controller.store.teams[id]
      //   controller.trigger('morning_checkin', [controller.spawn(team.bot), team])
      // }
    } else if (hours === 16 && mins === 50 && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Every week day at 4:50pm
      // Send night's homework list
      controller.calendarAuth()
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
          for (const id in controller.store.teams) {
            const team = controller.store.teams[id]
            // only include calendars with at least one lesson
            const filtered = _.pick(homework, (v, k, o) => {
              let hoursAgo = true
              if (team.cohorts[v.cohort] && team.cohorts[v.cohort].materialsSent) {
                const lastHw = new Date(team.cohorts[v.cohort].materialsSent.lastHw)
                const diff = new Date(Math.abs(lastHw.getTime(), now.getTime()))
                hoursAgo = moment.duration(diff).asHours() > 12
              }
              return v.lessons.length > 0 && hoursAgo
            })
            console.log(filtered, 'the homework')
            controller.trigger('material_message', [controller.spawn(team.bot), team, 'homework_thread', filtered])
          }
        })
        .catch(console.error)
    }
  }, 1000 * 60)
}
