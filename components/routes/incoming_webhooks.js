const debug = require('debug')('botkit:incoming_webhooks')
const request = require('request')

module.exports = function (webserver, controller) {
  debug('Configured /slack/receive url')
  webserver.post('/slack/receive', function (req, res) {
    // NOTE: we should enforce the token check here
    // respond to Slack that the webhook has been received.
    res.status(200)

    // Now, pass the webhook into be processed
    controller.handleWebhookPayload(req, res)
  })

  // create all channels for a new cohort
  // running in slack `/new-cohort 04 sei` will create:
  // sei-bos-04-forum, sei-bos-04-planning, sei-bos-04-code, sei-bos-04-etc,
  // sei-bos-04-links, sei-bos-04-projects, sei-bos-04-outcomes
  // and invites the person who runs the command
  webserver.post('/new-cohort', function (req, res) {
    const cohort = req.body.text.split(' ')[0]
    const immersive = req.body.text.split(' ')[1]
    const responseUrl = req.body.response_url

    const channelTypes = [
      'forum',
      'planning',
      'code',
      'etc',
      'links',
      'projects',
      'outcomes'
    ]

    res.status(201).json({
      response_type: 'ephemeral',
      text: `Working on that...`
    })
    let token

    controller.store.getTeam(req.body.team_id)
      .then(team => {
        token = team.oauth_token
        const channelsToCreate = channelTypes.map(type => {
          return controller.createChannel(`${immersive}-bos-${cohort}-${type}`, token)
        })
        return Promise.all(channelsToCreate)
      })
      .then(res => {
        const invitees = res.map(r => {
          return controller.channelJoin(r.group.id, req.body.user_id, token)
        })
        return Promise.all(invitees)
      })
      .then(res => {
        request({
          method: 'POST',
          uri: responseUrl,
          body: {
            response_type: 'in_channel',
            text: 'Done!'
          },
          json: true
        })
      })
      .catch(console.error)
  })

  // Search for relevant links
  webserver.post('/quick-links', function (req, res) {
    const category = req.body.text.split(' ')[0]
    // const responseUrl = req.body.response_url

    if (!category || !controller.searchLinks[category]) {
      res.status(201).json({
        response_type: 'ephemeral',
        text: `Make sure to include a category like \`/quick-links orientation\`\n\nAvailable Categories: ${Object.keys(controller.searchLinks).join(', ')}`
      })
    } else {
      let responseBody = `*Quick Links for ${category}:*\n`
      controller.searchLinks[category].forEach(link => {
        const name = link.match(/\[(.*?)\]/)[1]
        const url = link.match(/\((.*?)\)/)[1]
        responseBody += `\n <${url}|${name}>`
      })

      res.status(201).json({
        response_type: 'ephemeral',
        text: responseBody
      })
    }
  })

  // TO DO:
  // look up missing assignments
  // look up assigned homeworks so far
  // look up upcoming lessons
  // look up attendance standing?
}
