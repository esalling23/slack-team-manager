module.exports = function (controller) {
  controller.store = {
    teams: {},
    getTeam: function (teamId) {
      console.log('getting team: ', teamId)
      // console.log('local store says: ', controller.store.teams)
      return new Promise((resolve, reject) => {
        if (!controller.store.teams[teamId]) {
          controller.storage.teams.get(teamId, function (error, team) {
            if (error) reject(error)

            controller.store.teams[teamId] = team
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
      // console.log(controller.store.teams[team], ' we should probably save this team')
      controller.storage.teams.save(controller.store.teams[team], function (error, saved) {
        if (error) console.error(error)
        // console.log('we stored team id ', saved.id)
      })
    }
  }, 5000)
  
  // Initial set-up
  controller.storage.teams.all().then(res => {
    for (const team of res) {
      // console.log(team) 
      // console.log(controller.store.teams[team], ' we should probably save this team')
      controller.store.teams[team.id] = team
    }
  }).catch(console.error)
}
