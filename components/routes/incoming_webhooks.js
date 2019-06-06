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
}
