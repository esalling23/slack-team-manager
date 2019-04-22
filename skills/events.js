const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  // Events go here
  
<<<<<<< HEAD
=======
  controller.on('homework_thread', function(bot, team, cohorts) {
    let cohortChannels
    const web = new WebClient(bot.config.token)
    web.conversations.list({ types: 'private_channel' })
      .then(list => {
        cohortChannels = _.filter(list.channels, (channel) => {
          const match = _.pick(cohorts, (val, key, obj) => {
            console.log(val, key, obj)
            const match = new RegExp(val.cohort + '-forum', 'g')
            return channel.name.match(match) !== null
          })
          return Object.keys(match).length > 0
        })
        console.log(cohortChannels)
        const calPromises = _.map(cohortChannels, (channel) => {
          return controller.studio.get(bot, 'homework_thread', team.creator, channel.id)
        })
        return Promise.all(calPromises)
      })
      .then(convos => {
        // console.log(convos)
      
        for (let convo of convos) {
          const channel = _.findWhere(cohortChannels, { id: convo.context.channel })
          
          const lessons = _.uniq(_.filter(cohorts, item => {
            console.log(item, channel.name)
            return item.cohort === channel.name.split('-')[2]
          })[0].lessons)
          
          convo.changeTopic('default')
          console.log(lessons, 'are the homeworks')
          if (lessons.length > 1) {
            const template = convo.threads['default'][0]
            template.username = process.env.username.replace('_', ' ')
            template.icon_url = process.env.icon_url
            template.attachments[0].text += '\n'

            for (let i of lessons) {
              template.attachments[0].text += '- ' + i + '\n' 
            }

            convo.activate()
          }
        }
      })
    // }
  })
  
>>>>>>> updates
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
  
  controller.on('calendar', function(bot, team, cohorts) {
    console.log(cohorts)
    let cohortChannels 
    
    const web = new WebClient(bot.config.token)
    web.conversations.list({ types: 'private_channel' })
      .then(list => {
<<<<<<< HEAD
        cohortChannels = _.each(list.channels, (channel) => {
          for (let key in cohorts) {
            console.log('the cohort this time is' , key.split('BOS ')[1])
            const match = new RegExp(key.split('BOS ')[1] + '-forum', 'g')
            if (channel.name.match(match) !== null) return channel
          }
=======
        cohortChannels = _.filter(list.channels, (channel) => {
          const match = _.pick(cohorts, (val, key, obj) => {
            console.log(val, key, obj)
            const match = new RegExp(val.cohort + '-forum', 'g')
            return channel.name.match(match) !== null
          })
          return Object.keys(match).length > 0
>>>>>>> updates
        })
        console.log(cohortChannels)
        const calPromises = _.map(cohortChannels, (channel) => {
          return controller.studio.get(bot, 'calendar_alert', team.creator, channel.id)
        })
        return Promise.all(calPromises)
      })
      .then(convos => {
<<<<<<< HEAD
        console.log(convos)
=======
        // console.log(convos)
>>>>>>> updates
      
        for (let convo of convos) {
          const channel = _.findWhere(cohortChannels, { id: convo.context.channel })
          
<<<<<<< HEAD
          const lessons = _.filter(cohorts, item => {
            console.log(item)
            return item.cohort === channel.name.split('-')[2]
          })[0].lessons
=======
          const lessons = _.uniq(_.filter(cohorts, item => {
            console.log(item, channel.name)
            return item.cohort === channel.name.split('-')[2]
          })[0].lessons)
>>>>>>> updates
          
          convo.changeTopic('default')
          console.log(lessons, 'are the lessons')
          const template = convo.threads['default'][0]
<<<<<<< HEAD
          template.username = process.env.username
=======
          template.username = process.env.username.replace('_', ' ')
>>>>>>> updates
          template.icon_url = process.env.icon_url
          template.attachments[0].text += '\n'

          for (let i of lessons) {
            template.attachments[0].text += '- ' + i + '\n' 
          }

          convo.activate()
        }
      })
      // .then(console.log)
      .catch(console.error)
    
  })
  
  // interval for every minute
  setInterval(function() {
    const now = new Date()
<<<<<<< HEAD
    const hours = now.getHours() - 5
=======
    const hours = now.getHours() - 4
>>>>>>> updates
    const mins = now.getMinutes()
    const dayOfWeek = now.getDay()
    console.log(hours, mins)
    console.log('is it friday @ 3pm?', now.getDay() === 5 && mins === 0 && hours === 15)
    
    if (dayOfWeek === 5 && mins === 0 && hours === 15) {
<<<<<<< HEAD
      // Every friday at 3pm
      controller.calendarAuth()
      .then(controller.calendarEvents)
      .then(lessons => {
        console.log(lessons, 'the lessons')
        for (const id in controller.store.teams) {
          const team = controller.store.teams[id]
          controller.trigger('calendar', [controller.spawn(team.bot), team, lessons])
        }
      })
      .catch(console.error)
=======
      
      // Every friday at 3pm
      controller.calendarAuth()
        .then(auth => {
          // adjust 3 hours for boston time
          const now = new Date().getTime() + 240

          // look 24 hours ahead so we don't include today's lessons
          const start = new Date(now + (24 * 60 * 60 * 1000))

          // then by the number of days into the future we want to look (7 for a week)
          const end = new Date(now + (7 * 24 * 60 * 60 * 1000))
          
          return controller.calendarEvents({
            auth,
            lessons: false,
            startTime: start.toISOString(),
            endTime: end.toISOString()
          })
        })
        .then(lessons => {
          // only include calendars with at least one lesson
          const filtered = _.pick(lessons, (v, k, o) => {
            return v.lessons.length > 0
          })
          console.log(filtered, 'the lessons')
          for (const id in controller.store.teams) {
            const team = controller.store.teams[id]
            controller.trigger('calendar', [controller.spawn(team.bot), team, filtered])
          }
        })
        .catch(console.error)
>>>>>>> updates
    } else if (hours === 13 && mins === 0 && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Every week day at 8am
      for (const id in controller.store.teams) {
        const team = controller.store.teams[id]
<<<<<<< HEAD
        controller.trigger('morning_checkin', [controller.spawn(team.bot), team])
      }
=======
        // controller.trigger('morning_checkin', [controller.spawn(team.bot), team])
      }
    } else if (hours === 17 && mins === 0 && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Every week day at 5pm
      controller.calendarAuth()
        .then(auth => {
          // adjust 3 hours for boston time
          const now = new Date().getTime() + 240
          // start a few hours behind
          const start = new Date(now - (3 * 60 * 60 * 1000))
          // end in a couple hours
          const end = new Date(now + (2 * 24 * 60 * 60 * 1000))
          
          return controller.calendarEvents({
            auth,
            lessons: false,
            startTime: start.toISOString(),
            endTime: end.toISOString()
          })
        })
        .then(homework => {
        // only include calendars with at least one lesson
          const filtered = _.pick(homework, (v, k, o) => {
            return v.lessons.length > 0
          })
          console.log(filtered, 'the homework')
          for (const id in controller.store.teams) {
            const team = controller.store.teams[id]
            controller.trigger('homework_thread', [controller.spawn(team.bot), team, filtered])
          }
        })
        .catch(console.error)
>>>>>>> updates
    }
  }, 1000 * 60)
}
