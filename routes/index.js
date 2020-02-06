var express = require('express');
var router = express.Router();
var createError = require('http-errors');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'SCaLE Backend' });
});


router.get('/schedule', function(req, res) {
    res.json({
        dates: ["2020-03-01", "2020-03-02", "2020-03-03"],
        urls: {
            "2020-03-01": "/events/friday",
            "2020-03-02": "/events/saturday",
            "2020-03-03": "/events/sunday"
        },
    });
});

router.get('/speakers', function(req, res) {
    res.json({});
});

router.get('/events', function(req, res) {
    res.json({});
});

router.get('/events/:day', function(req, res, next) {
    const day = req.params.day;
    if (!['friday', 'saturday', 'sunday'].includes(day)) {
        return next(createError(404, 'Requested schedule not found'));
    }

    res.json({val:'success'});
});

module.exports = router;
