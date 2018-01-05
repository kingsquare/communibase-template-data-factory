const assert = require('assert');
const cbc = require('communibase-connector-js');
const Factory = require('../../src/index.js');
const Handlebars = require('handlebars');
const Promise = require('bluebird');

const dutchFactory = new Factory({
  cbc,
  stxt: {
    'Address.countryCode.DE': 'Duitsland',
    'Address.countryCode.NL': 'Nederland'
  }
});

const englishFactory = new Factory({
  cbc,
  stxt: {
    'Address.countryCode.DE': 'Germany',
    'Address.countryCode.NL': 'Netherlands'
  }
});

const template = Handlebars.parse('{{#addresses}} {{country}} {{/addresses}}');

describe('#getTemplateData() - Languages', () => {
  it('should work', (done) => {
    cbc.getById('Company', process.env.TEST_COMPANY_ID).then(company => Promise.all([
      dutchFactory.getPromise('Company', company, template),
      englishFactory.getPromise('Company', company, template)
    ])).then((actual) => {
      const expected = [
        {
          addresses: [
            {
              country: 'Duitsland'
            },
            {
              country: 'Nederland'
            }
          ]
        },
        {
          addresses: [
            {
              country: 'Germany'
            },
            {
              country: 'Netherlands'
            }
          ]
        }
      ];

      assert.deepEqual(actual, expected);
      done();
    }).catch(done);
  });
});
