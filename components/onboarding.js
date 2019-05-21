module.exports = function (controller) {
  controller.on('onboard', function (bot, team, auth) {
    controller.store.getTeam(team.id)
      .then(storeTeam => {
        // reset data
        storeTeam.oauth_token = auth.access_token
        storeTeam.cohorts = {}
        // store
        controller.store.teams[team.id] = storeTeam
        controller.logger.info('Bot added to team: ', storeTeam.url)
      })
      .catch((error) => controller.logger.info(error)) // End users.list call
  })
}
