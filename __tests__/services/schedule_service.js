/* eslint-env jest */

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const scheduleService = require('../../services/schedule_service.js')

jest.mock('../../models/events')
const eventModel = require('../../models/events')

jest.mock('axios')

describe('Refresh events from upstream data source', () => {
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

describe('Refresh speaker data from upstream data source', () => {
  // test('Extract unique speaker ids from user data', done => {
  //   const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/schedule_sample.json')))
  //   scheduleService.
  // })
  test('Parse speaker data into a single structure', done => {
    // Mock speaker IDs used by refreshSpeakers
    eventModel.getUniqueSpeakerIds.mockImplementation(() => [100, 200, 300])

    // Mock network request for XML data used by refreshSpeakers
    const fixtureIndices = [1, 2, 3]
    fixtureIndices.forEach(index => {
      const data = fs.readFileSync(path.resolve(__dirname, `./fixtures/speaker${index}.xml`)).toString()
      axios.get.mockResolvedValueOnce({
        data: data
      })
    })

    // Expected output
    const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/speaker_sample.json')))

    scheduleService.refreshSpeakers().then(result => {
      expect(result).toEqual(jsonData)
      expect(Object.keys(result).length).toBe(3)
      done()
    })
  })
})
