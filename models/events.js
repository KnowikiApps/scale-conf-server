const fs = require('fs')
const constants = require('../constants')

function save (events) {
  const filename = constants.EVENTS_FILE_PATH.all
  const tmpFilename = filename + '.tmp'
  fs.writeFileSync(tmpFilename, JSON.stringify({ events: events.events }))
  fs.renameSync(tmpFilename, filename)

  const collatedByDay = {}
  events.events.forEach(evt => {
    // day is an html string with attribute metadata and a simple day of the week in the text element.
    const slug = (evt.when && evt.when.day && evt.when.day.toLowerCase()) || 'unspecified'
    if (!collatedByDay[slug]) {
      collatedByDay[slug] = []
    }
    collatedByDay[slug].push(evt)
  })

  constants.EVENT_DAYS.forEach(day => {
    const dayFilename = constants.EVENTS_FILE_PATH[day]
    const tmpDayFilename = dayFilename + '.tmp'
    fs.writeFileSync(tmpDayFilename, JSON.stringify({ events: collatedByDay[day] }))
    fs.renameSync(tmpDayFilename, dayFilename)
  })
}

function getAll () {
  return JSON.parse(fs.readFileSync(constants.EVENTS_FILE_PATH.all).toString())
}

function getUniqueSpeakerIds () {
  const eventList = getAll()

  // spread operator to convert from Set back to an array
  return [...eventList.events.reduce((uniqIds, evt) => {
    evt.speaker_id.forEach(id => {
      if (id) {
        uniqIds.add(id)
      }
    })
    return uniqIds
  }, new Set())]
}

module.exports = {
  getAll,
  save,
  getUniqueSpeakerIds
}
