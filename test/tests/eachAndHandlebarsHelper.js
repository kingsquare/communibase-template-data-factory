const assert = require("assert");
const cbc = require("communibase-connector-js");
const Factory = require("../../src/index.js");
const Handlebars = require("handlebars");

const factory = new Factory({
  cbc
});

const expectedResult = {
  invoiceItems: [{ totalEx: "€ 240,00" }, { totalEx: "-€ 10,00" }]
};
const template = Handlebars.parse(
  "{{#each invoiceItems}}{{price totalEx}}{{/each}}"
);

describe("#getTemplateData() - Each loop / Handlebars helper", () => {
  it("should work", done => {
    cbc
      .getById("Invoice", process.env.TEST_INVOICE_ID)
      .then(invoice => factory.getPromise("Invoice", invoice, template))
      .then(result => {
        assert.equal(JSON.stringify(result), JSON.stringify(expectedResult));
        done();
      })
      .catch(done);
  });
});
