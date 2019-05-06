module.exports = controller => {
  // should return true if this is not a bot user
  // if `includeThisBot` is true, will return true if the current user is
  // this application/bot
  controller.isUser = function (member, includeThisBot) {
    // check if the bot is this application, and if we want to include it
    // returns true if `includeThisBot` is true, and the app name is as defined
    // in .env variables as `botName`
    const includeBot = member.name === process.env.botName && includeThisBot

    // this is a user if the member is not a bot & not named 'slackbot'
    // OR we are including this app
    return (!member.is_bot && member.name !== 'slackbot') || includeBot
  }

  // emails to ignore
  controller.ignoreEmails = [
    'esalling23@gmail.com',
    'erica.salling@gmail.com',
    'erica@elab.emerson.edu',
    'testingthebots@gmail.com',

    'wadek2@gmail.com',
    'sam@extraludic.com'
  ]
}
