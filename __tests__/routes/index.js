const request = require('supertest');
const express = require('express');
const app = express();
const indexRoute = require('../../routes/index');
const async = require('async');
app.use('/', indexRoute);

describe('Get schedule urls', () => {
    test('Expected schedule to provide dates', done => {
        request(app)
            .get('/schedule')
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body.dates).toEqual(['2020-03-01', '2020-03-02', '2020-03-03']);
                done();
            });
    });

    test('Expected schedule to provide urls for dates', done => {
        request(app)
            .get('/schedule')
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body.urls).toEqual(
                    {
                        '2020-03-01': '/events/friday',
                        '2020-03-02': '/events/saturday',
                        '2020-03-03': '/events/sunday',
                    }
                );
                done();
            });
    });

    test('Expect that each data url resolves', (done) => {
        // async.series technique courtesy of https://stackoverflow.com/a/21090031
        const req = request(app);
        req.get('/schedule')
        .then(response => {
            const chainedCalls = response.body.dates.map(date => {
                const url = response.body.urls[date];
                return function(cb) { req.get(url).expect(200, cb); };
            });
            return async.series(chainedCalls, done);
        });

    });
});

describe('Test schedule by day', () => {
    test('Expect 404 if bad day path specified', (done) => {
        return request(app)
            .get('/events/bad')
            .then(response => {
                expect(response.statusCode).toBe(404);
                done();
            });
    });

    test('Expect day specific schedule for a valid day path', (done) => {
        request(app)
            .get('/events/friday')
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toEqual({val:'success'});
                done();
            });
    });
});

