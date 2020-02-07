/* eslint-env jest */

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const scheduleService = require('../../services/schedule_service.js')

jest.mock('axios')

describe('Fetch updated schedule', () => {
  test('Expect scale endpoint to be queried', done => {
    const xmlData = fs.readFileSync(path.resolve(__dirname, './fixtures/schedule_sample.xml'))
    const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/schedule_sample.json')))
    axios.get.mockResolvedValue({ data: xmlData })

    scheduleService.refreshSchedule()
      .then(result => {
        expect(result).toEqual(jsonData)
        expect(result.events.length).toBe(177)
        done()
      })
  })
})
