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
  
  controller.on('calendar', function(bot, team, cohorts) {
    console.log(cohorts)
    let cohortChannels 
    
    const web = new WebClient(bot.config.token)
    web.conversations.list({ types: 'private_channel' })
      .then(list => {
        cohortChannels = _.each(list.channels, (channel) => {
          for (let key in cohorts) {
            console.log('the cohort this time is' , key.split('BOS ')[1])
            const match = new RegExp(key.split('BOS ')[1] + '-forum', 'g')
            if (channel.name.match(match) !== null) return channel
          }
        })
        console.log(cohortChannels)
        const calPromises = _.map(cohortChannels, (channel) => {
          return controller.studio.get(bot, 'calendar_alert', team.creator, channel.id)
        })
        return Promise.all(calPromises)
      })
      .then(convos => {
        console.log(convos)
      
        for (let convo of convos) {
          const channel = _.findWhere(cohortChannels, { id: convo.context.channel })
          
          const lessons = _.filter(cohorts, item => {
            console.log(item)
            return item.cohort === channel.name.split('-')[2]
          })[0].lessons
          
          convo.changeTopic('default')
          console.log(lessons, 'are the lessons')
          const template = convo.threads['default'][0]
          template.username = process.env.username
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
    const hours = now.getHours() - 5
    const mins = now.getMinutes()
    const dayOfWeek = now.getDay()
    console.log(hours, mins)
    console.log('is it friday @ 3pm?', now.getDay() === 5 && mins === 0 && hours === 15)
    
    if (dayOfWeek === 5 && mins === 0 && hours === 15) {
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
    } else if (hours === 13 && mins === 0 && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Every week day at 8am
      for (const id in controller.store.teams) {
        const team = controller.store.teams[id]
        controller.trigger('morning_checkin', [controller.spawn(team.bot), team])
      }
    }
  }, 1000 * 60)
}
