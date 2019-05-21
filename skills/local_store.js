module.exports = function (controller) {
  controller.store = {
    teams: {},
    getTeam: function (teamId) {
      controller.logger.info(`getting team: ${teamId} ...`)
      // controller.logger.info('local store says: ', controller.store.teams)
      return new Promise((resolve, reject) => {
        if (!controller.store.teams[teamId]) {
          controller.storage.teams.get(teamId, function (error, team) {
            if (error) reject(error)

            controller.store.teams[teamId] = team
            controller.logger.info(`found team: ${team.url}`)
            resolve(team)
          })
        } else {
          resolve(controller.store.teams[teamId])
        }
      })
    }
  }

  // Store teams in database every 5 seconds
  setInterval(function () {
    for (const team in controller.store.teams) {
      // controller.logger.info(controller.store.teams[team], ' we should probably save this team')
      controller.storage.teams.save(controller.store.teams[team], function (error, saved) {
        if (error) controller.logger.error(error)
        // controller.logger.info('we stored team id ', saved.id)
      })
    }
  }, 5000)

  // Initial set-up
  controller.storage.teams.all().then(res => {
    for (const team of res) {
      // controller.logger.info(team)
      // controller.logger.info(controller.store.teams[team], ' we should probably save this team')
      controller.store.teams[team.id] = team
    }
  }).catch(controller.logger.error)
}
