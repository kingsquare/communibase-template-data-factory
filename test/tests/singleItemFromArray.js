const assert = require('assert');
const fs = require('fs');
const cbc = require('communibase-connector-js');
const helpers = require('../../src/inc/helpers.js');
const Factory = require('../../src/index.js');
const Handlebars = require('handlebars');

const factory = new Factory({
  cbc
});

const expectedResult = {
  invoicedPeriods: {
    0: {},
    1: {},
    2: {},
    3: {
      startDate: new Date('2015-03-22T23:00:00.000Z')
    }
  },

  person: {
    firstName: 'Janny',
    emailAddresses: [
      {
        emailAddress: 'j.van.zutphen@belastingdienst.nl'
      },
      {
        emailAddress: 'jannyz@xs4all.nl'
      }
    ]
  },
  debtor: {
    company: {
      title: 'NEVI'
    }
  }
};

const template = Handlebars.parse(fs.readFileSync(`${__dirname}/../templates/singleItemFromArray.hbs`, 'utf-8'));

describe('#getTemplateData() - Single item from array', () => {
  it('should work', (done) => {
    cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID).then(membership => factory.getPromise('Membership', membership, template)).then((result) => {
      const actual = JSON.stringify(helpers.sortDictionaryByKey(result));
      const expected = JSON.stringify(helpers.sortDictionaryByKey(expectedResult));

      assert.equal(actual, expected);
      done();
    }).catch(done);
  });
});
