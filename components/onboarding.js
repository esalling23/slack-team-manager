const _ = require('underscore')

const {
  WebClient
} = require('@slack/client')

function isUser (member) {
  // console.log(member.name, 'is the member being checked')
  return !member.is_bot && member.name !== process.env.botName && member.name !== 'slackbot'
}

module.exports = function (controller) {
  controller.on('onboard', function (bot, team, auth) {
    const web = new WebClient(auth.access_token)
    controller.store.getTeam(team.id)
      .then(storeTeam => {
        // reset data
        storeTeam.oauth_token = auth.access_token
        // store
        controller.store.teams[team.id] = storeTeam
      })
      .then(web.users.list)
      .then((res) => {
        const storeTeam = controller.store.teams[team.id]
        // console.log(res)
        const realUsers = _.filter(res.members, member => isUser(member))
        storeTeam.users = _.map(realUsers, function (user) {
          console.log(user)
          return {
            userId: user.id,
            name: user.name,
            real_name: user.real_name,
            email: user.profile.email
          }
        })

        controller.store.teams[team.id] = storeTeam
        return web.channels.list()
      })
      .then(res => {
        const general_channel = _.findWhere(res.channels, { name: "general" }).id
        controller.store.teams[team.id].general_channel = general_channel
        console.log(general_channel)
        return web.channels.invite({ channel: general_channel, user: team.bot.user_id })
      })
      .catch((error) => console.log(error)) // End users.list call
  })
}
