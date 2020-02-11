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
        // Writing changed output as reference.
        // fs.writeFileSync(path.resolve(__dirname, './fixtures/schedule_sample_update.json'), JSON.stringify(result))

        expect(result).toEqual(jsonData)
        expect(result.events.length).toBe(177)
        done()
      })
  })

  test('Expect network error to return rejected', (done) => {
    axios.get.mockRejectedValue(new Error('some error'))
    scheduleService.refreshSchedule().catch(err => {
      expect(err.message).toEqual('some error')
      done()
    })
  })

  test('Expect undefined network response to return empty dataset', (done) => {
    axios.get.mockResolvedValue({ data: undefined })
    scheduleService.refreshSchedule().then(val => {
      done.fail('Undefined dataset expected to result in xml parsing error')
    }).catch(err => {
      expect(err).toEqual(new Error('No XML data to parse'))
      done()
    })
  })

  test('Expect empty network response to return empty dataset', (done) => {
    axios.get.mockResolvedValue({ data: '' })
    scheduleService.refreshSchedule().then(val => {
      expect(val).toEqual({ events: [] })
      done()
    })
  })

  test('Expect empty XML document to return empty dataset', (done) => {
    axios.get.mockResolvedValue({ data: '<?xml version="1.0" encoding="UTF-8" ?>' })
    scheduleService.refreshSchedule().then(val => {
      expect(val).toEqual({
        events: []
      })
      done()
    })
  })

  test('Expect empty XML nodes document to return empty dataset', (done) => {
    axios.get.mockResolvedValue({ data: '<?xml version="1.0" encoding="UTF-8" ?>\n<nodes></nodes>' })
    scheduleService.refreshSchedule().then(val => {
      expect(val).toEqual({
        events: []
      })
      done()
    })
  })

  test('Expect empty XML node in nodes to return empty dataset', (done) => {
    axios.get.mockResolvedValue({ data: '<?xml version="1.0" encoding="UTF-8" ?>\n<nodes><node/></nodes>' })
    scheduleService.refreshSchedule().then(val => {
      expect(val).toEqual({
        events: [
          {
            abstract: null,
            when: null,
            url: null,
            photo: null,
            location: null,
            speaker_id: [],
            speakers: [],
            title: null,
            topic: null
          }
        ]
      })
      done()
    })
  })
})

describe('Refresh speaker data from upstream data source', () => {
  // test('Extract unique speaker ids from user data', done => {
  //   const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/schedule_sample.json')))
  //   scheduleService.
  // })
  test('Expect speaker data to be collected and merged into a single structure', done => {
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

  test('Expect that a network error on one of the requests will continue with a single null record', (done) => {
    // Mock speaker IDs used by refreshSpeakers
    eventModel.getUniqueSpeakerIds.mockImplementation(() => [100, 200, 300])

    // Mock network request for XML data used by refreshSpeakers
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker1.xml')).toString()
    })

    // second request fails
    axios.get.mockRejectedValueOnce(new Error('some error'))

    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker3.xml')).toString()
    })

    scheduleService.refreshSpeakers().then(result => {
      expect(Object.keys(result).length).toBe(3)
      expect(result['200']).toBe(null)
      done()
    })
  })

  test('Expect that a 403 access denied, which occurs if speaker is invalid, will continue with a null record', (done) => {
    // Mock speaker IDs used by refreshSpeakers
    eventModel.getUniqueSpeakerIds.mockImplementation(() => [100, 200, 300])

    // Mock network request for XML data used by refreshSpeakers
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker1.xml')).toString()
    })
    // second request empty
    axios.get.mockRejectedValueOnce({
      config: {},
      request: {},
      response: {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {},
        request: {},
        data: '<!DOCTYPE html>\n<html><head></head><body>...</body></html>'
      },
      isAxiosError: true
    })
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker3.xml')).toString()
    })

    scheduleService.refreshSpeakers().then(result => {
      expect(Object.keys(result).length).toBe(3)
      expect(result['200']).toBe(null)
      done()
    })
  })

  test('Expect that a valid empty response in one response will be an empty record', (done) => {
    // Mock speaker IDs used by refreshSpeakers
    eventModel.getUniqueSpeakerIds.mockImplementation(() => [100, 200, 300])

    // Mock network request for XML data used by refreshSpeakers
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker1.xml')).toString()
    })
    // second request empty
    axios.get.mockResolvedValueOnce({ data: '' })
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker3.xml')).toString()
    })

    scheduleService.refreshSpeakers().then(result => {
      expect(Object.keys(result).length).toBe(3)
      expect(result['200']).toEqual({
        biography: null,
        name: null,
        organization: null,
        photo: null,
        title: null,
        website: null
      })
      done()
    })
  })

  test('Expect that an empty xml doc in one response will be an empty record', (done) => {
    // Mock speaker IDs used by refreshSpeakers
    eventModel.getUniqueSpeakerIds.mockImplementation(() => [100, 200, 300])

    // Mock network request for XML data used by refreshSpeakers
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker1.xml')).toString()
    })
    // second request empty XML
    axios.get.mockResolvedValueOnce({ data: '<?xml version="1.0" encoding="UTF-8" ?>' })
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker3.xml')).toString()
    })

    scheduleService.refreshSpeakers().then(result => {
      expect(Object.keys(result).length).toBe(3)
      expect(result['200']).toEqual({
        biography: null,
        name: null,
        organization: null,
        photo: null,
        title: null,
        website: null
      })
      done()
    })
  })

  test('Expect an incompletely defined xml dataset will be handled have empty string values', (done) => {
    eventModel.getUniqueSpeakerIds.mockImplementation(() => [100])
    axios.get.mockResolvedValueOnce({
      data: fs.readFileSync(path.resolve(__dirname, './fixtures/speaker_partially_defined.xml')).toString()
    })

    const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/speaker_partially_defined.json')))

    scheduleService.refreshSpeakers().then(result => {
      expect(Object.keys(result).length).toBe(1)
      expect(result['100']).toEqual(jsonData)
      done()
    })
  })
})
