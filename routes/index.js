const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const scheduleService = require('../services/schedule_service')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'SCaLE Backend' })
})

/**
 * Get a list of schedule specific endpoints
 */
router.get('/schedule', function (req, res) {
  res.json({
    dates: ['2020-03-05', '2020-03-06', '2020-03-07', '2020-03-08'],
    urls: {
      '2020-03-05': '/events/thursday',
      '2020-03-06': '/events/friday',
      '2020-03-07': '/events/saturday',
      '2020-03-08': '/events/sunday'
    }
  })
})

/**
 * Get a list of all speakers
 */
router.get('/speakers', function (req, res) {
  res.json({})
})

/**
 * Get a list of all events
 */
router.get('/events', function (req, res) {
  res.json({})
})

/**
 * Get a list of events for a single day
 *
 * @param day  string identifying the day to filter
 */
router.get('/events/:day', function (req, res, next) {
  const day = req.params.day
  if (!['thursday', 'friday', 'saturday', 'sunday'].includes(day)) {
    // FIXME: opt for a json error rather than this human readable error page.
    return next(createError(404, 'Requested schedule not found'))
  }

  res.json({ val: 'success' })
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

module.exports = router
