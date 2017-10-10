const assert = require('assert');
const Factory = require('../../index.js');
const Handlebars = require('handlebars');
const cbc = require('communibase-connector-js');

const factory = new Factory({
  cbc
});

const template = Handlebars.parse('{{firstName}} - {{membershipNumber}}');

describe('#Entity Magic()', () => {
  it('should expose membershipNumber for Person', (done) => {
    cbc.getById('Person', process.env.TEST_PERSON_ID).then((person) => {
      factory.getPromise('Person', person, template).then((result) => {
        assert.deepEqual(result, {
          firstName: 'Janny',
          membershipNumber: 302962
        });
        done();
      });
    });
  });
});
