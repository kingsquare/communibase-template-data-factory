const assert = require('assert');
const cbc = require('communibase-connector-js');
const Factory = require('../../index.js');
const Handlebars = require('handlebars');

const factory = new Factory({
  cbc
});
const factoryWithStxt = new Factory({
  cbc,
  stxt: {
    'Address.type.postal': 'Postadres'
  }
});

describe('#getTitlePromise()', () => {
  it('Company._title', (done) => {
    cbc.getById('Company', process.env.TEST_COMPANY_ID).then(
      company => factory.getPromise('Company', company, Handlebars.parse('{{_title}}'))
    ).then((actual) => {
      const expected = { _title: 'NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal' };

      assert.deepEqual(actual, expected);
      done();
    }).catch(done);
  });

  it('Company._title (with stxt)', (done) => {
    cbc.getById('Company', process.env.TEST_COMPANY_ID).then(
      company => factoryWithStxt.getPromise('Company', company, Handlebars.parse('{{_title}}'))
    ).then((actual) => {
      const expected = { _title: 'NEVI - Postbus 198 2700 AD ZOETERMEER DE - Postadres' };

      assert.deepEqual(actual, expected);
      done();
    }).catch(done);
  });

  it('Debtor._title & Debtor.person._title', (done) => {
    cbc.getById('Debtor', process.env.TEST_DEBTOR_ID).then(
      debtor => factory.getPromise('Debtor', debtor, Handlebars.parse('{{_title}}{{person._title}}'))
    ).then((actual) => {
      actual._title = actual._title.substr(1);
      const expected = {
        person: { _title: 'J. van Zutphen' },
        _title: ' - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - ' +
          'Rijsenburgselaan 19 3972 EH DRIEBERGEN-RIJSENBURG NL - postal'
      };

      assert.deepEqual(actual, expected);
      done();
    }).catch(done);
  });

  it('Debtor._title (document reference)', (done) => {
    cbc.getById('Debtor', process.env.TEST_DEBTOR_2_ID).then(
      debtor => factory.getTitlePromise('Debtor', debtor)
    ).then((actual) => {
      actual = actual.substr(1);
      const expected = ' - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - ' +
          'Theodorus Backerlaan 8 3984PJ ODIJK NL - visit';
      assert.deepEqual(actual, expected, 'The title is not nicely formatted!');
      done();
    }).catch(done);
  });

  it('Event._title', (done) => {
    cbc.getById('Event', process.env.TEST_EVENT_ID).then(
      event => factory.getTitlePromise('Event', event).then((actual) => {
        const expected = 'Ooa Intervisieseizoen 2016 (1-1-2016)';
        assert.equal(actual, expected, 'The title is not nicely formatted!');
        done();
      })
    ).catch(done);
  });

  it('Group._title', (done) => {
    cbc.getById('Group', process.env.TEST_GROUP_ID)
      .then(group => factory.getPromise('Group', group, Handlebars.parse('{{_title}}')))
      .then((actual) => {
        const expected = { _title: 'Ooa Professionaliseringsabonnement' };
        assert.deepEqual(actual, expected);
        done();
      }).catch(done);
  });

  it('Invoice._title', (done) => {
    cbc.getById('Invoice', process.env.TEST_INVOICE_ID)
      .then(invoice => factory.getPromise('Invoice', invoice, Handlebars.parse('{{_title}}')))
      .then((actual) => {
        const expected = { _title: '100001' };

        assert.deepEqual(actual, expected);
        done();
      }).catch(done);
  });

  it('Membership._title', (done) => {
    cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID)
      .then(membership => factory.getPromise('Membership', membership, Handlebars.parse('{{_title}}')))
      .then((actual) => {
        const expected = { _title: 'Ooa Professionaliseringsabonnement - J. van Zutphen - 302962' };
        assert.deepEqual(actual, expected);
        done();
      }).catch(done);
  });

  it('Person._title', (done) => {
    cbc.getById('Person', process.env.TEST_PERSON_ID)
      .then(person => factory.getPromise('Person', person, Handlebars.parse('{{_title}}')))
      .then((actual) => {
        const expected = { _title: 'J. van Zutphen' };
        assert.deepEqual(actual, expected);
        done();
      }).catch(done);
  });

  it('EmailAddressReference._title', (done) => {
    cbc.getById('Person', process.env.TEST_PERSON_ID).then(
      person => factory.getPromise('Person', person, Handlebars.parse('{{positions.0.emailAddressReference._title}}'))
    ).then((actual) => {
      const expected = {
        positions: [
          {
            emailAddressReference: {
              _title: 'j.van.zutphen@belastingdienst.nl - private'
            }
          }
        ]
      };
      assert.deepEqual(actual, expected);
      done();
    }).catch(done);
  });
});
