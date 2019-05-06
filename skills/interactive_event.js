const _ = require('underscore')

module.exports = function (controller) {
  // for choose/confirm
  // Temporary storage
  let choiceSelect = []
  // const usersClicking = []

  controller.on('interactive_message_callback', function (bot, event) {
    // console.log(event, 'is the interactive message callback event')
    // A user selected a menu option
    if (event.actions[0].name.match(/^choose(.*)$/)) {
      // console.log(event.attachment_id)
      const reply = event.original_message

      // Grab the 'value' field from the selected option
      let value = event.actions[0].selected_options[0].value
      let choice
      // console.log(value)
      const actions = reply.attachments[0].actions

      // for each attachment option
      for (let i = 0; i < actions.length; i++) {
        // check if the attachment option value equals the selected value
        // NO TWO VALUES CAN BE THE SAME
        if (actions[i].options) {
          for (let j = 0; j < actions[i].options.length; j++) {
            if (actions[i].options[j].value === value) {
              // set the choice to the text of the matching option
              choice = actions[i].options[j].text
            }
          }
        }
      }
      // console.log(choice)

      // Take the original message attachment
      const menuAttachment = reply.attachments[0].actions[0]
      // Change the menu text to be the chosen option
      menuAttachment.text = choice
      // Set the attachment to the altered object
      reply.attachments[0].actions[0] = menuAttachment

      // If this user does not already have a choice stored
      if (!_.findWhere(choiceSelect, { user: event.user })) {
        if (event.actions[0].name.includes('multi')) {
          // console.log(event.actions[0].name)
          const key = parseInt(event.actions[0].name.match(/\d+/))
          // console.log(key)
          const val = {}
          const choiceMulti = {}

          val[key] = value
          choiceMulti[key] = choice

          choice = choiceMulti
          value = val
        }

        // console.log('we are adding this choice')
        // Create object to hold this selection
        // Selection is 'valid' or the solution/key if the value is 'correct'
        // Any other value will be incorrect
        // NO TWO VALUES CAN BE THE SAME
        choiceSelect.push({
          user: event.user,
          choice: choice,
          value: value,
          callback: event.callback_id
        })
      } else {
        // User has choice stored
        // console.log('we are updating this choice')
        // Update stored choice with new choice, valid bool, and callback_id
        choiceSelect = _.map(choiceSelect, function (item) {
          if (item.user === event.user) {
            item.callback = event.callback_id

            if (event.actions[0].name.includes('multi')) {
              if (typeof item.choice === 'string') item.choice = {}
              if (typeof item.value === 'string') item.value = {}
              const key = parseInt(event.actions[0].name.match(/\d+/))
              // console.log(key)
              item.choice[key] = choice
              item.value[key] = value
            } else {
              item.value = value
              item.choice = choice
            }
            return item
          } else return item
        })
      }
      console.log(choiceSelect, 'is the choice select')
    }

    // Confirm menu choice
    if (event.actions[0].name.match(/^confirm(.*)$/)) {
      // Locate the saved choice based on the user key
      const confirmedChoice = _.findWhere(choiceSelect, {
        user: event.user
      })
      controller.store.getTeam(event.team.id)
        .then((res) => {
          const vars = {
            status: confirmedChoice.choice,
            name: _.findWhere(res.users, { userId: event.user }).real_name
          }

          if (event.actions[0].name.includes('status')) {
            controller.makeCard(bot, event, 'morning_check', 'response', {}, function (card) {
              console.log('responded to morning status')
              bot.replyInteractive(event, card)
            })

            controller.studio.get(bot, 'morning_check', event.user, res.general_channel).then(convo => {
              convo.changeTopic('status')
              const template = convo.threads['status'][0]
              template.username = process.env.username
              template.icon_url = process.env.icon_url

              convo.vars = vars

              convo.activate()
            })
          } else if (event.actions[0].name.includes('move')) {
            // opt.user = _.findWhere(opt.team.users, {
            //   userId: event.user
            // })
            // opt.script = script
            // controller.confirmMovement(opt)
          }
        })
    }

    // User says something
    // if (event.actions[0].name.match(/^say/)) {
    //   const opt = {
    //     bot: bot,
    //     event: event,
    //     data: event.actions[0]
    //   }
    //
    //   controller.store.getTeam(event.team.id)
    //     .then((res) => {
    //       controller.studio.getScripts().then((list) => {
    //         let name = event.actions[0].value
    //
    //         const script = _.findWhere(list, {
    //           command: name
    //         })
    //
    //         const scriptName = script.command
    //
    //         controller.studio.get(bot, scriptName, event.user, event.channel).then((currentScript) => {
    //           controller.storage.teams.save(res).then(saved => {
    //             opt.team = saved
    //             opt.user = _.findWhere(res.users, {
    //               userId: event.user
    //             })
    //             opt.script = currentScript
    //
    //             controller.confirmMovement(opt)
    //             // usersClicking.splice(usersClicking.indexOf(event.user), 1)
    //           })
    //         })
    //       })
    //     })
    //     .catch(console.error)
    // }
  })
}
