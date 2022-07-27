const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const scheduleService = require('../services/schedule_service')
const constants = require('../constants')
const fs = require('fs');

/* GET home page. */
router.get('/', function (req, res, next) {
  const stats = JSON.parse(fs.readFileSync(constants.STATS_FILE_PATH).toString());
  res.render('index', { ...stats, title: 'SCaLE Backend' })
})

/**
 * Get a list of conference specific endpoints
 */
router.get('/metadata', function (req, res) {
  scheduleService.updateStats('requestSuccessCount')
  res.json({
    'scale-19x': {
      name: 'Southern California Linux Expo 2022',
      dates: ['2022-07-28', '2022-07-29', '2022-07-30', '2022-07-31'],
      urls: {
        events: {
          all: '/events',
          '2022-07-28': '/events/thursday',
          '2022-07-29': '/events/friday',
          '2022-07-30': '/events/saturday',
          '2022-07-31': '/events/sunday'
        },
        speakers: {
          all: '/speakers'
        }
      }
    }
  })
})

/**
 * Get a list of all speakers
 */
router.get('/speakers', function (req, res) {
  scheduleService.updateStats('requestSuccessCount')
  res.sendFile(constants.SPEAKERS_FILE_PATH)
})

/**
 * Get a list of all events
 */
router.get('/events', function (req, res) {
  scheduleService.updateStats('requestSuccessCount')
  res.sendFile(constants.EVENTS_FILE_PATH.all)
})

/**
 * Get a list of events for a single day
 *
 * @param day  string identifying the day to filter
 */
router.get('/events/:day', function (req, res, next) {
  const day = req.params.day
  if (!constants.EVENT_DAYS.includes(day)) {
    // FIXME: opt for a json error rather than this human readable error page.
    scheduleService.updateStats('requestErrorCount')
    return next(createError(404, 'Requested schedule not found'))
  }

  scheduleService.updateStats('requestSuccessCount')
  res.sendFile(constants.EVENTS_FILE_PATH[day])
})

// For development purposes. Not sure if this will be exposed on the api.
router.get('/refresh', function (req, res) {
  scheduleService.refreshSchedule()
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      res.send(err)
    })
})

router.get('/refresh/speakers', function (req, res) {
  scheduleService.refreshSpeakers()
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      res.send(err)
    })
})

module.exports = router
