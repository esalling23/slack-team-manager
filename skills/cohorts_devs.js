module.exports = controller => {
  controller.activeCohorts = ['03', '02']
  controller.developers = {
    '02': require('../json/bos_02.json'),
    '03': require('../json/bos_03.json')
  }
}
