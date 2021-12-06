if (process.env.NODE_ENV !== 'development') {
  module.exports = {
    getStateHub: function getStateHub() {},
    StateHub: function StateHub() {
      return null
    },
  }
} else {
  module.exports = require('./dev')
}
