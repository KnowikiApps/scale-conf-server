const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const scheduleService = require('../services/schedule_service')
const constants = require('../constants')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'SCaLE Backend' })
})

/**
 * Get a list of conference specific endpoints
 */
router.get('/metadata', function (req, res) {
  res.json({
    'scale-18x': {
      name: 'Southern California Linux Expo 2019',
      dates: ['2020-03-05', '2020-03-06', '2020-03-07', '2020-03-08'],
      urls: {
        events: {
          all: '/events',
          '2020-03-05': '/events/thursday',
          '2020-03-06': '/events/friday',
          '2020-03-07': '/events/saturday',
          '2020-03-08': '/events/sunday'
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
  res.sendFile(constants.SPEAKERS_FILE_PATH)
})

/**
 * Get a list of all events
 */
router.get('/events', function (req, res) {
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
    return next(createError(404, 'Requested schedule not found'))
  }

  res.sendFile(constants.EVENTS_FILE_PATH[day])
})

router.get('/speakers', function (req, res) {
  res.sendFile(constants.SPEAKERS_FILE_PATH)
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
