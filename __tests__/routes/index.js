/* eslint-env jest */

const request = require('supertest')
const async = require('async')
const app = require('../../app')

describe('Get schedule urls', () => {
  test('Expected schedule to provide dates and name', done => {
    request(app)
      .get('/metadata')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body['scale-19x'].dates).toEqual(['2022-07-28', '2022-07-29', '2022-07-30', '2022-07-31'])
        expect(response.body['scale-19x'].name).toEqual('Southern California Linux Expo 2022')
        done()
      })
  })

  test('Expected schedule to provide urls for dates', done => {
    request(app)
      .get('/metadata')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body['scale-19x'].urls).toEqual(
          {
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
        )
        done()
      })
  })

  test('Expect that each date url resolves', (done) => {
    // async.series technique courtesy of https://stackoverflow.com/a/21090031
    const proxy = request(app)
    proxy.get('/metadata')
      .then(response => {
        const chainedCalls = response.body['scale-19x'].dates.map(date => {
          const url = response.body['scale-19x'].urls.events[date]
          return function (cb) {
            // console.log(url)
            proxy.get(url).redirects(1).then(response => {
              // console.log(response)
              expect(response.statusCode).toBe(200)
              cb()
            })
          }
        })
        return async.series(chainedCalls, done)
      })
  })

  test('Expect that speaker/event all urls resolves', (done) => {
    // async.series technique courtesy of https://stackoverflow.com/a/21090031
    const proxy = request(app)
    proxy.get('/metadata')
      .then(response => {
        const chainedCalls = [
          response.body['scale-19x'].urls.events.all,
          response.body['scale-19x'].urls.speakers.all
        ].map(url => {
          return function (cb) {
            // console.log(url)
            proxy.get(url).redirects(1).then(response => {
              // console.log(response)
              expect(response.statusCode).toBe(200)
              cb()
            })
          }
        })
        return async.series(chainedCalls, done)
      })
  })
})

describe('Test schedule by day', () => {
  test('Expect 404 if bad day path specified', (done) => {
    return request(app)
      .get('/events/bad')
      .then(response => {
        expect(response.statusCode).toBe(404)
        done()
      })
  })

  test('Expect day specific schedule for a valid day path', (done) => {
    request(app)
      .get('/events/friday')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=UTF-8')
      .end(done)
  })
})

describe('Test all events schedule', () => {
  test('Expect json extents list', done => {
    request(app)
      .get('/events')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=UTF-8')
      .end(done)
  })
})
