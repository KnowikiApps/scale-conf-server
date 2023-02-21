const path = require('path')

function createConstants (version) {
  return {
    SCALE_VERSION: version,
    UPSTREAM_EVENTS_URL: `https://www.socallinuxexpo.org/scale/${version}/sign.xml`,
    UPSTREAM_SPEAKER_URL: 'https://www.socallinuxexpo.org/speakerappdata/',
    EVENTS_PATH: {
      all: `/_data/scale-${version}-events.json`,
      thursday: `/_data/scale-${version}-events-thursday.json`,
      friday: `/_data/scale-${version}-events-friday.json`,
      saturday: `/_data/scale-${version}-events-saturday.json`,
      sunday: `/_data/scale-${version}-events-sunday.json`
    },
    EVENTS_FILE_PATH: {
      all: path.resolve(__dirname, `./public/_data/scale-${version}-events.json`),
      thursday: path.resolve(__dirname, `./public/_data/scale-${version}-events-thursday.json`),
      friday: path.resolve(__dirname, `./public/_data/scale-${version}-events-friday.json`),
      saturday: path.resolve(__dirname, `./public/_data/scale-${version}-events-saturday.json`),
      sunday: path.resolve(__dirname, `./public/_data/scale-${version}-events-sunday.json`)
    },
    EVENT_DAYS: ['thursday', 'friday', 'saturday', 'sunday'],
    SPEAKERS_PATH: `/_data/scale-${version}-speakers.json`,
    SPEAKERS_FILE_PATH: path.resolve(__dirname, `./public/_data/scale-${version}-speakers.json`),
    STATS_FILE_PATH: path.resolve(__dirname, `./public/_data/stats.json`),
    PARALLEL_LIMIT: 10
  }
}
module.exports = createConstants('20x')
