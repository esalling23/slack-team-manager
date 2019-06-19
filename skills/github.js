
// helper function to find items in `all` array missing from `total`
const findDifference = (subset, all) => {
  return all.filter(element => !subset.includes(element))
}

const gheBase = 'https://git.generalassemb.ly'
const apiBaseUrl = `${gheBase}/api/v3/repos/ga-wdi-boston`

module.exports = controller => {
  // const fetchPullRequests = (repoName) => fetch(`${apiBaseUrl}/${repoName}/pulls`)

  const fetchAllPRs = (repoName) => fetch(`${apiBaseUrl}/${repoName}/pulls?state=all&per_page=100&sort=updated&direction=desc`)

  // Returns fille list of sorted, missing PRs
  controller.listMissingPrs = async (developers) => {
    const hw = controller.materialList.map(day => day['Homework'])
    // fetch open and closed PRs for each material and convert to JSON
    const hwPrs = await Promise.all(hw.map(hw => {
      fetchAllPRs(hw.match(/\[(.*?)\]/)[1])
    }))
    const hwPrsJson = await Promise.all(hwPrs.map(pr => pr.json()))

    // add a `missing` property to each dev, detailing which PRs they missed
    const devsWithMissingPrs = controller.findMissingPrs(hwPrsJson, developers, controller.materialList)

    // sort developers by number of missing PRs
    const sortedPrs = devsWithMissingPrs.sort((a, b) => {
      return Math.sign(b.missing.length - a.missing.length)
    })

    return sortedPrs
  }

  // returns the `developers` param, with added fields `missing` and `completed`,
  // which are arrays of repo names
  controller.findMissingPrs = (prsPerRepo, developers, materials) => {
    // filter out repos for which this cohort hasn't opened ANY PRs, because that
    // means the repo has not been assigned
    const assignedRepos = prsPerRepo.filter(prs => prs.some(pr => {
      const usernames = developers.map(dev => dev.github)

      return usernames.includes(pr.user.login)
    }))

    // add `completed` array to each dev
    developers = developers.map(dev => ({ ...dev, completed: [] }))

    // iterate through the array of repos to check if each user has made a PR
    assignedRepos.forEach(prsArray => {
      prsArray.forEach(pr => {
        // find the developer object that this PR belongs to
        const user = developers.find(dev => {
          return dev.github === pr.user.login
        })

        // if we found one...
        if (user) {
          // add a string representing the name of the current repo to that PR
          user.completed.push(pr.base.repo.name)
        }
      })
    })

    // create an array containing a string for the name of each _assigned_ repo
    const assignedMaterialNames = assignedRepos.map(prArray => {
      return prArray[0].base.repo.name
    })

    // add a `missing` property to each dev, calculated using `findDifference`,
    // and return the devs array
    return developers.map(dev => ({
      ...dev,
      missing: findDifference(dev.completed, assignedMaterialNames)
    }))
  }
}
