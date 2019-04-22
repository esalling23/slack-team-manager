const debug = require('debug')('botkit:rtm_manager')

module.exports = function (controller) {
  const managedBots = {}

  // Capture the rtm:start event and actually start the RTM...
  controller.on('rtm:start', function (config) {
    const bot = controller.spawn(config)
    debug('starting rtm')
    manager.start(bot, config)
  })

  //
  controller.on('rtm_close', function (bot) {
    manager.remove(bot)
  })

  // The manager object exposes some useful tools for managing the RTM
  const manager = {
    start: function (bot, config) {
      if (managedBots[bot.config.token]) {
        debug('Start RTM: already online')
      } else {
        bot.api.rtm.start({
          batch_presence_aware: true
        }, function (error, bot) {
          if (error) return
          managedBots[bot.config.token] = bot.rtm
        })

        bot.startRTM(function (error, bot) {
          if (error) {
            debug('error starting RTM:', error)
          } else {
            managedBots[bot.config.token] = bot.rtm
            debug('Start RTM: Success')
          }
        })
      }
    },
    stop: function (bot) {
      if (managedBots[bot.config.token]) {
        if (managedBots[bot.config.token].rtm) {
          debug('Stop RTM: Stopping bot')
          managedBots[bot.config.token].closeRTM()
        }
      }
    },
    remove: function (bot) {
      debug('Removing bot from manager')
      delete managedBots[bot.config.token]
    },
    reconnect: function () {
      debug('Reconnecting all existing bots...')
      controller.storage.teams.all(function (error, list) {
        if (error) {
          throw new Error('error: Could not load existing bots:', error)
        } else {
          for (let l = 0; l < list.length; l++) {
            manager.start(controller.spawn(list[l].bot))
          }
        }
      })
    }
  }

  return manager
}
