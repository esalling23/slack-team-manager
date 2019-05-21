const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  controller.on('team_join', function (bot, message) {
    controller.logger.info('a user joined', message)
    if (!controller.isUser(message.user)) return

    controller.storage.getTeam(message.team_id, function (error, team) {
      if (error) return
      if (_.findWhere(team.users, { userId: message.user.id })) return

      const web = new WebClient(team.bot.app_token)

      web.users.list().then(res => {
        const thisUser = _.findWhere(res.members, { id: message.user.id })

        team.users.push({
          userId: message.user.id,
          name: message.user.name,
          real_name: thisUser.real_name,
          email: thisUser.profile.email
        })

        team.users = team.users
        controller.store.teams[team.id] = team
      }).catch(error => controller.logger.info('Team Join User Profile Get error: ', error))
    })
  })
}
