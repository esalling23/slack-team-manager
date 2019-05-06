module.exports = function (controller) {
  controller.on('onboard', function (bot, team, auth) {
    controller.store.getTeam(team.id)
      .then(storeTeam => {
        // reset data
        storeTeam.oauth_token = auth.access_token
        // store
        controller.store.teams[team.id] = storeTeam
        console.log('Bot added to team: ', storeTeam.url)
      })
      .catch((error) => console.log(error)) // End users.list call
  })
}
