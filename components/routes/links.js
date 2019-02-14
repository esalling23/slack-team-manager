const _ = require('underscore')

module.exports = function (webserver, controller) {
  webserver.get('/link/:link/:team/:user?', function (req, res) {
    controller.storage.getTeam(req.params.team)
      .then(team => {
        let user = _.findWhere(team.users, { 'userId': req.params.user })
        if (!user) user = { userId: 'untrackable', bot_chat: 'gamelog' }
        const url = controller.linkUrls[req.params.link]
        res.redirect(url)
      })
      .catch(console.error)
  })
}
