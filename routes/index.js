const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const scheduleService = require('../services/schedule_service')
const constants = require('../constants')
const fs = require('fs');
const { expressjwt: jwt } = require("express-jwt");
const queries = require('../db/queries');

/* Load environment */
require('dotenv').config();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'SCaLE Backend' })
})

/**
 * Get a list of conference specific endpoints
 */
router.get('/metadata', function (req, res) {
  res.json({
    'scale-21x': {
      name: 'Southern California Linux Expo 2024',
      dates: ['2024-03-14', '2024-03-15', '2024-03-16', '2024-03-17'],
      urls: {
        events: {
          all: '/events',
          '2024-03-14': '/events/thursday',
          '2024-03-15': '/events/friday',
          '2024-03-16': '/events/saturday',
          '2024-03-17': '/events/sunday'
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

router.post('/logs', 
  jwt({ secret: process.env.SECRET, algorithms: ["HS256"] }),
  function (req, res) {
    if (!req.auth.admin) {
      res.status(400).json({ 'error': 'User must be admin' });
    } else {
      queries.createLog(req.body.message, res);
    }
})

module.exports = router
