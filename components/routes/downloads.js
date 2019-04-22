const _ = require('underscore')

// This script handles link buttons
// Button must be a link button (must add as link button)
// example url: https://slacktime.glitch.me/download/Stars.pdf

module.exports = function (webserver, controller) {
  webserver.get('/download/:file', function (req, res) {
    let filePath = 'http://res.cloudinary.com/extraludic/image/upload/v1/fl_attachment/escape-room/' + req.params.file

    res.redirect(filePath)
  })
}
