const fs = require('fs')
const _ = require('underscore')
const readline = require('readline')
const { google } = require('googleapis')

module.exports = (controller) => {
  // Authorize if this is the first time
  controller.calendarAuth = () => {
    return new Promise((resolve, reject) => {
      // If modifying these scopes, delete token.json.
      const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
      // The file token.json stores the user's access and refresh tokens, and is
      // created automatically when the authorization flow completes for the first
      // time.
      const TOKEN_PATH = 'token.json'

      // Load client secrets from a local file.
      fs.readFile('credentials.json', (err, content) => {
        if (err) return reject(new Error('Error loading client secret file:', err))
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), resolve)
      })

      /**
       * Create an OAuth2 client with the given credentials, and then execute the
       * given callback function.
       * @param {Object} credentials The authorization client credentials.
       * @param {function} callback The callback to call with the authorized client.
       */
      function authorize (credentials, callback) {
        const clientSecret = credentials.installed.client_secret
        const clientId = credentials.installed.client_id
        const redirectUris = credentials.installed.redirect_uris

        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[0])

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
          if (err) return getAccessToken(oAuth2Client, resolve)
          oAuth2Client.setCredentials(JSON.parse(token))
          callback(oAuth2Client)
        })
      }

      /**
       * Get and store new token after prompting for user authorization, and then
       * execute the given callback with the authorized OAuth2 client.
       * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
       * @param {getEventsCallback} callback The callback for the authorized client.
       */
      function getAccessToken (oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES
        })
        controller.logger.info('Authorize this app by visiting this url:', authUrl)
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
        rl.question('Enter the code from that page here: ', (code) => {
          rl.close()
          oAuth2Client.getToken(code, (err, token) => {
            if (err) return reject(new Error('Error retrieving access token', err))
            oAuth2Client.setCredentials(token)
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
              if (err) return reject(err)
              controller.logger.info('Token stored to', TOKEN_PATH)
            })
            callback(oAuth2Client)
          })
        })
      }
    })
  }

  // Grab the calendar events
  // takes `opt` object with:
  // `auth` from calendarAuth
  // `lessons` to query lessons (true) or homework (false)
  // `startTime` for the timeMin in calOpt
  // `endTime` for the timeMax in calOpt
  controller.calendarEvents = (opt) => {
    return new Promise((resolve, reject) => {
      const calendar = google.calendar({version: 'v3', auth: opt.auth})

      // controller.logger.info(start, end)

      const calOpt = {
        timeMin: opt.startTime,
        timeMax: opt.endTime,
        maxResults: 40,
        singleEvents: true,
        orderBy: 'startTime'
      }

      calendar.calendarList.list((err, res) => {
        if (err) reject(err)
        const filtered = _.filter(res.data.items, (event) => {
          const lessonCal = event.summary.match(/WDI BOS/i | /SEI BOS/i)
          let activeCal = false
          if (lessonCal !== null) {
            activeCal = lessonCal.input.slice(lessonCal.index, lessonCal.input.length).replace(' ', '')
          }
          return lessonCal && controller.activeCohorts.includes(activeCal)
        })

        // create a bunch of promises to get calendar events
        const calPromises = _.map(filtered, (cal) => {
          const data = calOpt
          data.calendarId = cal.id
          return eventsPromise(calendar, data, opt.grabLessons)
        })

        // promise all the promises
        return Promise.all(calPromises).then((res) => {
          // only include calendars with at least one lesson
          resolve(_.pick(res, (v, k, o) => {
            return v.lessons.length > 0
          }))
        }).catch(reject)
      })
    })
  }

  // filter out what we need
  const filteredMaterial = (grabLessons) => {
    return controller.materialList.reduce((lessons, curr) => {
      // controller.logger.info(curr)
      const check = grabLessons ? curr['Lessons'] : curr['Homework']

      const available = check.filter(les => {
        // controller.logger.info(les.match(/\[(.*?)\]/)[1])
        return les !== '' && les.match(/\[(.*?)\]/) && les.match(/\((.*?)\)/)
      }).map(les => {
        return { name: les.match(/\[(.*?)\]/)[1], url: les.match(/\((.*?)\)/)[1] }
      })

      return lessons.concat(available)
    }, [])
  }

  // Set up events promises
  const eventsPromise = (calendar, opt, grabLessons) => {
    const material = filteredMaterial(grabLessons)
    return new Promise((resolve, reject) => {
      return calendar.events.list(opt, (err, res) => {
        if (err) reject(err)
        const events = _.map(res.data.items, item => {
          return item.summary.replace(/\((.*?)\)/, '').replace(/\s+/g, '')
        }).filter(item => {
          return _.pluck(material, 'name').includes(item)
        })

        const upcoming = material.filter(item => {
          return events.includes(item.name)
        })

        const id = res.data.summary.split('BOS ')[1]
        const items = {
          cohort: id,
          lessons: upcoming
        }
        resolve(items)
      })
    })
  }
}
