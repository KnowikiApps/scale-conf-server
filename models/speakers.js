const fs = require('fs')
const constants = require('../constants')

function getAll () {
  const filename = constants.SPEAKERS_FILE_PATH
  return JSON.parse(fs.readFileSync(filename).toString())
}

function save (speakers) {
  const filename = constants.SPEAKERS_FILE_PATH
  const tmpFilename = filename + '.tmp'
  fs.writeFileSync(tmpFilename, JSON.stringify(speakers, null, 2))
  fs.renameSync(tmpFilename, filename)
}

module.exports = {
  getAll,
  save
}
