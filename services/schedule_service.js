const axios = require('axios')
const xml2js = require('xml2js')

const EVENTS_URL = 'https://www.socallinuxexpo.org/scale/18x/sign.xml'
// const SPEAKER_URL = 'https://www.socallinuxexpo.org/speakerappdata/{id}'

/**
 * Fetch schedule from upstream SCALE website and parse into defined JSON schema
 */
function refreshSchedule () {
  return axios.get(EVENTS_URL).then(res => {
    return _parseScaleFeed(res.data)
  }).then(events => {
    return events
  }).catch(err => {
    // console.error(err);
    throw err
  })
}

/**
 * Parse XML data into JSON
 * @param xmlData  stringified XML data
 * @return normalized object
 */
function _parseScaleFeed (xmlData) {
  return new Promise(function (resolve, reject) {
    xml2js.parseString(xmlData, function (err, result) {
      if (!err) {
        resolve(_normalizeSchedule(result))
      } else {
        console.error('Error parsing XML feed: %s.', err)
        reject(err)
      }
    })
  })
}

/**
 * Convert source data into a normalized structure
 * @parma jsonData  parsed source XML data source
 * @return normalized data format
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
      speaker_id: node['Speaker-IDs'],
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
  refreshSchedule
}
