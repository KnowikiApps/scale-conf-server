const axios = require('axios');
const scheduleService = require('../../services/schedule_service.js');

jest.mock('axios');

describe('Fetch updated schedule', () => {
    //test('Expect scale endpoint to be queried', done => {
    //    scheduleService.refreshSchedule('http://localhost/someendpoint')
    //    .catch(err => {
    //        expect(err.errno).toEqual('ECONNREFUSED');
    //        done();
    //    });
    //});

    test('Expect scale endpoint to be queried', done => {
        axios.get.mockResolvedValue({data: ''});
        scheduleService.refreshSchedule()
        .then(result => {
            expect(result).toContain('events');
            expect(result.events.length).toBe(10);
            done();
        });
    });

});
