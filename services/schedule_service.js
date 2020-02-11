const axios = require('axios')
const xml2js = require('xml2js')
const pLimit = require('p-limit')
const cheerio = require('cheerio')
const constants = require('../constants')
const eventModel = require('../models/events')
const speakerModel = require('../models/speakers')
const limit = pLimit(constants.PARALLEL_LIMIT)
const xmlBuilder = new xml2js.Builder()

/**
 * Fetch schedule from upstream SCALE website and parse into defined JSON schema
 */
function refreshSchedule () {
  return axios.get(constants.UPSTREAM_EVENTS_URL).then(res => {
    return _parseScaleFeed(res.data)
  }).then(events => {
    eventModel.save(events)

    return {
      events: events.events || []
    }
  }).catch(err => {
    // console.error(err);
    throw err
  })
}

function refreshSpeakers () {
  const idList = eventModel.getUniqueSpeakerIds()
  return _refreshSpeakers(idList).then(speakers => {
    speakerModel.save(speakers)
    return speakers
  })
  // return Promise.resolve(idList)
}

function _getFromFirst (val, defaultVal) {
  if (defaultVal === undefined) {
    defaultVal = null
  }

  return (val && Array.isArray(val) && val[0]) || defaultVal
}

function _parseWebsite (htmlLink) {
  if (!htmlLink || (!htmlLink)) {
    return null
  }

  return {
    // get user.Website[0].a[0]._ || ''
    name: _getFromFirst(htmlLink, {})._ || '',
    // get user.Website[0].a[0].$.href || ''
    url: _getFromFirst(htmlLink, { $: {} }).$.href || ''
  }
}

function _xmlToHtml (obj) {
  return (obj && xmlBuilder.buildObject({ fragment: obj })) || obj
}

function _htmlToText (html) {
  if (!html) {
    return null
  }

  // Adopted from https://stackoverflow.com/a/59068839
  const parsed = cheerio.load(html)
  return (parsed('fragment *').contents().toArray()
    .map(el => el.type === 'text' ? parsed(el).text().trim() : null)
    .filter(text => text)
    .join(' '))
}

/**
 * Convert a single speaker's JSON convert XML into the app normalized speaker format
 * @param jsonData
 * @returns {{}}
 * @private
 */
function _normalizeSpeaker (jsonData) {
  const user = (jsonData && jsonData.users && _getFromFirst(jsonData.users.user, {})) || {}
  return {
    name: _getFromFirst(user.Name),
    title: _getFromFirst(user['Job-title']),
    organization: _getFromFirst(user.Organization),
    photo: _parseSpeakerImage(_getFromFirst(user.Photo)),
    biography: _htmlToText(_xmlToHtml(_getFromFirst(user.Biography))),
    website: _parseWebsite(_getFromFirst(user.Website, {}).a)
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

/**
 * Request user XML from upstream for each user ID in idList
 * @param idList  list of unique user IDs for use in upstream request
 * @returns {Promise<any>}
 * @private
 */
function _refreshSpeakers (idList) {
  const speakers = {}
  console.time('Speaker refresh')
  return Promise.all(idList.map(id => limit(() => {
    const url = constants.UPSTREAM_SPEAKER_URL + id
    console.time(`Fetching ${url}`)
    return axios.get(url)
      .then(res => _parseSpeakerXml(res.data))
      .then(speaker => {
        // console.log(speaker)
        speakers[id] = speaker
      }).catch(err => {
        console.error(`Error fetching speaker data for id ${id}: ${err}`)
        speakers[id] = null
      }).finally(() => {
        console.timeEnd(`Fetching ${url}`)
      })
  }))).then(value => {
    return speakers
  }).finally(() => {
    console.timeEnd('Speaker refresh')
  })
}

/**
 * Parse XML data into JSON
 * @param xmlData  stringified XML data
 * @return {object} normalized object
 */
function _parseScaleFeed (xmlData) {
  if (xmlData === undefined) {
    return Promise.reject(new Error('No XML data to parse'))
  }
  return xml2js.parseStringPromise(xmlData).then(jsonData => _normalizeSchedule(jsonData))
    .catch(err => {
      console.error('Error parsing XML feed: %s.', err)
      throw err
    })
}

function _parseEventWhen (day, time) {
  const htmlDay = day && cheerio.load(day)
  const htmlTime = time && cheerio.load(time)

  if (!htmlDay && !htmlTime) {
    return null
  }

  return {
    day: htmlDay.text() || null,
    startTime: (htmlTime && htmlTime('.date-display-start').attr('content')) || null,
    endTime: (htmlTime && htmlTime('.date-display-end').attr('content')) || null
  }
}

function _parseSpeakerImage (xmlImage) {
  const parsed = (xmlImage && _getFromFirst(xmlImage.img, {}).$) || {}
  if (!parsed || !parsed.src) {
    return null
  }

  return {
    alt: (parsed && parsed.alt) || null,
    height: (parsed && parsed.height) || null,
    width: (parsed && parsed.width) || null,
    src: (parsed && parsed.src) || null
  }
}

function _parseEventImage (image) {
  const parsed = image && cheerio.load(image)('img')
  if (!parsed) {
    return null
  }

  return {
    alt: parsed.attr('alt') || null,
    height: parsed.attr('height') || null,
    width: parsed.attr('width') || null,
    src: parsed.attr('src') || null
  }
}

/**
 * Convert source data into a normalized structure
 * @param jsonData  parsed source XML data source
 * @return {object} normalized data format
 */
function _normalizeSchedule (jsonData) {
  const srcNodes = (jsonData && jsonData.nodes && jsonData.nodes.node) || []
  const events = srcNodes.map(node => {
    return {
      when: _parseEventWhen(_getFromFirst(node.Day), _getFromFirst(node.Time)),
      url: _getFromFirst(node.Path),
      photo: _parseEventImage(_getFromFirst(node.Photo)),
      location: _getFromFirst(node.Room),
      // speakers return single-element array with string that may contain comma separated ids
      speaker_id: _getFromFirst(node['Speaker-IDs'], '').split(',').map(el => el.trim()).filter(el => el.length > 0),
      speakers: _getFromFirst(node.Speakers, '').split(',').map(el => el.trim()).filter(el => el.length > 0),
      title: _getFromFirst(node.Title),
      topic: _getFromFirst(node.Topic),
      abstract: _getFromFirst(node['Short-abstract'])
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
