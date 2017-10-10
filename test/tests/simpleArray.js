const assert = require('assert');
const cbc = require('communibase-connector-js');
const helpers = require('../../inc/helpers.js');
const Factory = require('../../index.js');
const Handlebars = require('handlebars');

const factory = new Factory({
  cbc
});

describe('#getTemplateData() - Specific array values (e.g. Person.sectors.[1])', () => {
  it('should work', (done) => {
    cbc.getById('Person', process.env.TEST_PERSON_ID).then(person => factory.getPromise('Person', person, Handlebars.parse('{{sectors.[1]}}'))).then((result) => {
      const actual = JSON.stringify(result);
      const expected = JSON.stringify({ sectors: ['a', 'c', 'e'] });
      assert.equal(actual, expected);
      done();
    }).catch(done);
  });

  it('should handle string arrays properly', (done) => {
    cbc.getById('Person', process.env.TEST_PERSON_ID).then(person => factory.getPromise('Person', person, Handlebars.parse('{{#each sectors}}{{.}}!{{/each}}'))).then((result) => {
      const actual = JSON.stringify(helpers.sortDictionaryByKey(result));
      const expected = JSON.stringify(helpers.sortDictionaryByKey({
        sectors: ['a', 'c', 'e']
      }));
      assert.equal(actual, expected);
      done();
    }).catch(done);
  });
});
