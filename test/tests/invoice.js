const assert = require('assert');
const cbc = require('communibase-connector-js');
const Factory = require('../../index.js');
const Handlebars = require('handlebars');

const factory = new Factory({
  cbc
});

const input = ['invoiceNumber', 'invoiceItems.0.taxPercentage', 'invoiceItems.0.totals.ex', 'address.street'];
const template = Handlebars.parse(`{{${input.join('}};{{')}}}`);

describe('#getTemplateData() - Invoice', () => {
  it('should work', (done) => {
    cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(invoice => factory.getPromise('Invoice', invoice, template)).then((actual) => {
      const expected = {
        invoiceNumber: '100001',
        invoiceItems: [
          {
            taxPercentage: 21,
            totals: {
              ex: 240
            }
          }, {}
        ],
        address: {
          street: 'Straatje'
        }
      };

      assert.deepEqual(actual, expected);
      done();
    }).catch(done);
  });

  it('should parse euro-sign correctly', (done) => {
    cbc.getById('Invoice', process.env.TEST_INVOICE_2_ID).then(invoice => factory.getPromise('Invoice', invoice, Handlebars.parse('{{ totalIn }}'))).then((actual) => {
      const expected = { totalIn: '-€ 200,00' };

      assert.deepEqual(actual, expected, 'totalIn differ from expected');
      done();
    }).catch(done);
  });
});
