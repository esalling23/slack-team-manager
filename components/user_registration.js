const debug = require('debug')('botkit:user_registration')

module.exports = function (controller) {
  /* Handle event caused by a user logging in with oauth */
  controller.on('oauth:success', function (payload) {
    debug('Got a successful login!', payload)
    if (!payload.identity.team_id) {
      debug('error: received an oauth response without a team id', payload)
    }
    controller.store.getTeam(payload.identity.team_id)
      .then(team => {
        let newTeam = false
        if (!team) {
          team = {
            id: payload.identity.team_id,
            createdBy: payload.identity.user_id,
            url: payload.identity.url,
            name: payload.identity.team
          }
          newTeam = true
        }

        team.bot = {
          token: payload.bot.bot_access_token,
          user_id: payload.bot.bot_user_id,
          createdBy: payload.identity.user_id,
          app_token: payload.access_token
        }

        const testbot = controller.spawn(team.bot)

        testbot.api.auth.test({}, function (error, botAuth) {
          if (error) {
            debug('error: could not authenticate bot user', error)
          } else {
            team.bot.name = botAuth.user

            // add in info that is expected by Botkit
            testbot.identity = botAuth

            testbot.identity.id = botAuth.user_id
            testbot.identity.name = botAuth.user

            testbot.team_info = team

            // team.bot_instance = testbot
            // controller.logger.info(team.bot_instance, " THIS IS THE BOT INSTANCE")

            // Replace this with your own database!

            controller.store.teams[team.id] = team

            if (newTeam) {
              controller.trigger('create_team', [testbot, team, payload])
            } else {
              controller.trigger('update_team', [testbot, team, payload])
            }
          }
        })
      }).catch(controller.logger.error)
  })

  controller.on('create_team', function (bot, team, payload) {
    debug('Team created:', team)
    // Trigger an event that will establish an RTM connection for this bot
    controller.trigger('rtm:start', [bot.config, team, payload])
    // controller.trigger('rtm_events', [bot])
    // Trigger an event that will cause this team to receive onboarding messages
    controller.trigger('onboard', [bot, team, payload])
  })

  controller.on('update_team', function (bot, team, payload) {
    debug('Team updated:', team)
    // Trigger an event that will establish an RTM connection for this bot
    controller.trigger('rtm:start', [bot])
    // controller.trigger('rtm_events', [bot])
    controller.trigger('onboard', [bot, team, payload])
  })
}
