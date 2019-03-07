const _ = require('underscore')

module.exports = function (controller) {
  
  controller.studio.before('team', function(convo, next) {
    const id = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id
    
    controller.store.getTeam(id)
      .then(team => {
        console.log(convo)
        if (convo.thread === 'default') {
          _.each(team.users, function(user) {
            convo.threads.default[0].attachments[0].fields.push({ title: '', value: '' })
          })
        } else if (convo.thread === 'edit_team') {
          const menu = convo.threads['edit_team'][0].attachments[0].actions
          menu.options = _.map(team.users, user => {
            return { text: user.name, value: 'edit ' + user.email }
          })
        }
        next()
      })
      .catch(console.error)
  })

}