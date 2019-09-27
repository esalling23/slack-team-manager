module.exports = controller => {
  controller.activeCohorts = ['04', '05']
  controller.developers = {
    '02': require('../json/bos_02.json'),
    '03': require('../json/bos_03.json')
  }
}
