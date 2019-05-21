// const _ = require('underscore')

module.exports = function (controller) {
  // Gets a script with thread, consts, and logic
  // returns the conversation object
  controller.makeCard = function (bot, context, scriptName, threadName, consts, cb) {
    // controller.logger.info(context, ' make card context')

    controller.studio.get(bot, scriptName, context.user, context.channel).then(function (convo) {
      // controller.logger.info(convo)
      let thread
      if (consts.sameDoor) {
        thread = convo.thread
      } else {
        thread = threadName
      }

      convo.changeTopic(threadName)

      if (!convo.threads[thread]) {
        thread = 'default'
      }

      convo.consts = consts
      const template = convo.cloneMessage(convo.threads[thread][0])

      template.username = process.env.username
      template.icon_url = process.env.icon_url

      // controller.logger.info(template)

      convo.stop('card_only')
      cb(template)
    }).catch(function (error) {
      if (error) return
      controller.logger.error('makeCard error: ', error)
    })
  }
}
