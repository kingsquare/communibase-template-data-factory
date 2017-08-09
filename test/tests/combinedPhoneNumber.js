/* global describe: false, it: false */


const assert = require('assert');
const cbc = require('communibase-connector-js');
const helpers = require('../../inc/helpers.js');
const Factory = require('../../index.js');
const Handlebars = require('handlebars');

const factory = new Factory({
  cbc
});

const expectedResult = {
  phoneNumbers: {
    0: {
      combined: '0883300700'
    }
  }
};

describe('#getTemplateData() - PhoneNumber combined', () => {
  it('should work', (done) => {
    cbc.getById('Company', process.env.TEST_COMPANY_ID).then(company => factory.getPromiseByPaths('Company', company, ['phoneNumbers.0.combined'])).then((result) => {
      const actual = JSON.stringify(helpers.sortDictionaryByKey(result));
      const expected = JSON.stringify(helpers.sortDictionaryByKey(expectedResult));

      assert.equal(actual, expected);
      done();
    }).catch(done);
  });
});
