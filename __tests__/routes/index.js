/* eslint-env jest */

const request = require('supertest')
const async = require('async')
const app = require('../../app')

describe('Get schedule urls', () => {
  test('Expected schedule to provide dates', done => {
    request(app)
      .get('/schedule')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.dates).toEqual(['2020-03-05', '2020-03-06', '2020-03-07', '2020-03-08'])
        done()
      })
  })

  test('Expected schedule to provide urls for dates', done => {
    request(app)
      .get('/schedule')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.urls).toEqual(
          {
            '2020-03-05': '/events/thursday',
            '2020-03-06': '/events/friday',
            '2020-03-07': '/events/saturday',
            '2020-03-08': '/events/sunday'
          }
        )
        done()
      })
  })

  test('Expect that each data url resolves', (done) => {
    // async.series technique courtesy of https://stackoverflow.com/a/21090031
    const proxy = request(app)
    proxy.get('/schedule')
      .then(response => {
        const chainedCalls = response.body.dates.map(date => {
          const url = response.body.urls[date]
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
      .expect(302)
      .expect('Location', '/_data/scale-18x-events-friday.json')
      .end(done)
  })
})

describe('Test all events schedule', () => {
  test('Expect json extents list', done => {
    request(app)
      .get('/events')
      .expect(302)
      .expect('Location', '/_data/scale-18x-events.json')
      .end(done)
  })
})
