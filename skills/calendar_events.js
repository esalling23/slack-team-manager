const fs = require('fs')
const _ = require('underscore')
const readline = require('readline')
const {google} = require('googleapis')
const flatten = require('flat')

let client

module.exports = (controller) => {
  // Authorize if this is the first time
  controller.calendarAuth = () => {
    return new Promise((resolve, reject) => {
      // If modifying these scopes, delete token.json.
      const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
      // The file token.json stores the user's access and refresh tokens, and is
      // created automatically when the authorization flow completes for the first
      // time.
      const TOKEN_PATH = 'token.json';

      // Load client secrets from a local file.
      fs.readFile('credentials.json', (err, content) => {
        if (err) return reject('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), resolve)
      });

      /**
       * Create an OAuth2 client with the given credentials, and then execute the
       * given callback function.
       * @param {Object} credentials The authorization client credentials.
       * @param {function} callback The callback to call with the authorized client.
       */
      function authorize(credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
          if (err) return getAccessToken(oAuth2Client, resolve);
          oAuth2Client.setCredentials(JSON.parse(token));
          callback(oAuth2Client);
        });
      }

      /**
       * Get and store new token after prompting for user authorization, and then
       * execute the given callback with the authorized OAuth2 client.
       * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
       * @param {getEventsCallback} callback The callback for the authorized client.
       */
      function getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
          rl.close();
          oAuth2Client.getToken(code, (err, token) => {
            if (err) return reject('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
              if (err) return reject(err);
              console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
          });
        });
      }
    })
  }
  
  // Grab the calendar events
  controller.calendarEvents = (auth) => {
    return new Promise((resolve, reject) => {
      const calendar = google.calendar({version: 'v3', auth});
      const days = 7
      const start = new Date()
      // end time should be adjusted by 240 (3 hours to be boston time)
      // then by the number of days into the future we want to look (7 for a week)
      const end = new Date(start.getTime() + 240 + (days * 24 * 60 * 60 * 1000))
      // console.log(start, end)

      const opt = {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      }

      calendar.calendarList.list((err, res) => {
        const filtered = _.filter(res.data.items, (event) => {
          const lessonCal = event.summary.match(/WDI BOS/i)
          let activeCal = false
          if (lessonCal !== null) {
            activeCal = lessonCal.input.split(lessonCal[0])[1].replace(' ', '')
          }
          return lessonCal && controller.activeCohorts.includes(activeCal)
        })

        const calPromises = _.map(filtered, (cal) => {
          const calOpt = opt
          calOpt.calendarId = cal.id
          return eventsPromise(calendar, calOpt)
        })

        Promise.all(calPromises).then((res) => {
          console.log(res, 'before filter')
          // console.log(flat, 'after flatten')
          const filtered = _.pick(res, (v, k, o) => {
            return v.lessons.length > 0
          })
          console.log(filtered, 'filtered')
          resolve(filtered)
        }).catch(reject)
      })
    })
  }
  
  // Filter out just the lessons
  const filteredMaterials = () => {
    return controller.materialList.reduce((lessons, curr) => {
      // console.log(curr)

      const availLessons = [curr['Lesson1'], curr['Lesson2'], curr['Lesson3'], curr['Lesson4']].filter(les => {
        // console.log(les.match(/\[(.*?)\]/)[1])
        return les !== '' && les.match(/\[(.*?)\]/)
      }).map(les => {
        return les.match(/\[(.*?)\]/)[1]
      })

      return lessons.concat(availLessons)
    }, [])
  }

  // Set up events promises
  const eventsPromise = (calendar, opt) => {
    return new Promise((resolve, reject) => {
      return calendar.events.list(opt, (err, res) => {
        if (err) reject(err)
        const events = _.map(res.data.items, item => {
          return item.summary.replace(/\((.*?)\)/, '').replace(' ', '')
        }).filter(item => {
          return filteredMaterials().includes(item)
        })
        const id = res.data.summary.split('BOS ')[1]
        const items = { 
          cohort: id,
          lessons: events
        }
        resolve(items)
      })
    })
  }
  
}
