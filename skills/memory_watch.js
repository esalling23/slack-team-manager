const msPerMin = 60000
const cmd = require('node-cmd')
const os = require('os-utils')

module.exports = function (controller) {
  setInterval(function () {
    controller.logger.info(`Free memory %: ${os.freemem()}`)

    os.cpuFree(function (v) {
      controller.logger.info('CPU Free: ' + v)
      cmd.get(
        `git prune
          git gc`,
        function (error, data, stderror) {
          if (error) return
          controller.logger.info('ran git commands')
          cmd.run('rm -rf .git')
        }
      )
    })

    cmd.get(
      `cd tmp/reduced_uploads
          ls`,
      function (error, data, stderror) {
        if (error) return
        controller.logger.info(`the reduced_uploads directory contains these files :\n\n ${JSON.stringify(data)}`)
        cmd.run('rm -rf tmp/reduced_uploads/*')
      }
    )

    cmd.get(
      `cd tmp/uploaded
          ls`,
      function (error, data, stderror) {
        if (error) return
        controller.logger.info(`the uploaded directory contains these files :\n\n ${JSON.stringify(data)}`)
        cmd.run('rm -rf tmp/uploaded/*')
      }
    )
  }, msPerMin * 5)
}
