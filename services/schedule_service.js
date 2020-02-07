const axios = require('axios')
const xml2js = require('xml2js')
const constants = require('../constants')
const eventModel = require('../models/events')
const speakerModel = require('../models/speakers')

/**
 * Fetch schedule from upstream SCALE website and parse into defined JSON schema
 */
function refreshSchedule () {
  return axios.get(constants.UPSTREAM_EVENTS_URL).then(res => {
    return _parseScaleFeed(res.data)
  }).then(events => {
    eventModel.save(events)

    return {
      events: events.events
    }
  }).catch(err => {
    // console.error(err);
    throw err
  })
}

function refreshSpeakers () {
  const idList = eventModel.getUniqueSpeakerIds()
  // TODO rate limit requests to avoid overloading upstream server.
  // TODO remove slice
  return _refreshSpeakers(idList.slice(0, 3)).then(speakers => {
    speakerModel.save(speakers)
    return speakers
  })
  // return Promise.resolve(idList)
}

/**
 * Convert a single speaker's JSON convert XML into the app normalized speaker format
 * @param jsonData
 * @returns {{}}
 * @private
 */
function _normalizeSpeaker (jsonData) {
  if (!jsonData || !('users' in jsonData) || !('user' in jsonData.users)) {
    return {}
  }

  const user = jsonData.users.user[0]
  return {
    name: user.Name[0],
    title: user['Job-title'][0],
    organization: user.Organization[0],
    photo: user.Photo[0],
    biography: user.Biography[0],
    website: {
      name: user.Website[0].a[0]._,
      url: user.Website[0].a[0].$.href
    }
  }
}

function _parseSpeakerXml (xmlData) {
  // Parsed XML JSON is an array with a single object
  return xml2js.parseStringPromise(xmlData)
    .then(jsonData => _normalizeSpeaker(jsonData))
    .catch(err => {
      console.error('Error parsing XML feed: %s.', err)
      throw err
    })
}

function _refreshSpeakers (idList) {
  const speakers = {}
  return Promise.all(idList.map(id => {
    const url = constants.UPSTREAM_SPEAKER_URL + id
    console.log(`Fetching ${url}`)
    return axios.get(url)
      .then(res => _parseSpeakerXml(res.data))
      .then(speaker => {
        // console.log(speaker)
        speakers[id] = speaker
      }).catch(err => {
        console.error(`Error fetching speaker data for id ${id}: ${err}`)
        speakers[id] = null
      })
  })).then(() => speakers)
}

/**
 * Parse XML data into JSON
 * @param xmlData  stringified XML data
 * @return {object} normalized object
 */
function _parseScaleFeed (xmlData) {
  return xml2js.parseStringPromise(xmlData).then(jsonData => _normalizeSchedule(jsonData))
    .catch(err => {
      console.error('Error parsing XML feed: %s.', err)
      throw err
    })
}

/**
 * Convert source data into a normalized structure
 * @param jsonData  parsed source XML data source
 * @return {object} normalized data format
 */
function _normalizeSchedule (jsonData) {
  if (!jsonData || !('nodes' in jsonData) || !('node' in jsonData.nodes)) {
    return {}
  }

  const events = jsonData.nodes.node.map(node => {
    return {
      day: node.Day,
      time: node.Time,
      url: node.Path,
      photo: node.Photo,
      location: node.Room,
      // speakers return single-element array with string that may contain comma separated ids
      speaker_id: node['Speaker-IDs'][0].split(',').map(el => el.trim()),
      speakers: node.Speakers,
      title: node.Title,
      topic: node.Topic,
      abstract: node['Short-abstract']
    }
  })

  return {
    events: events
  }
}

module.exports = {
  refreshSchedule,
  refreshSpeakers
}
