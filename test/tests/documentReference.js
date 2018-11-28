const assert = require("assert");
const fs = require("fs");
const cbc = require("communibase-connector-js");
const Factory = require("../../src/index.js");
const Handlebars = require("handlebars");
const helpers = require("../../src/inc/helpers.js");

const factory = new Factory({
  cbc
});
const expectedResult = {
  phoneNumber: {
    countryCode: "+31"
  },
  address: {
    street: "Theodorus Backerlaan"
  }
};
const template = Handlebars.parse(
  fs.readFileSync(`${__dirname}/../templates/documentReference.hbs`, "utf-8")
);

describe("#getTemplateData() - Document references", () => {
  it("should work", done => {
    cbc
      .getById("Membership", process.env.TEST_MEMBERSHIP_ID)
      .then(membership =>
        factory.getPromise("Membership", membership, template)
      )
      .then(result => {
        assert.equal(JSON.stringify(result), JSON.stringify(expectedResult));
        done();
      })
      .catch(done);
  });

  it("should be gained in detail", done => {
    cbc
      .getById("Person", process.env.TEST_PERSON_ID)
      .then(person =>
        factory.getPromiseByPaths("Person", person, [
          "positions.0.addressReference.address.street"
        ])
      )
      .then(result => {
        const actual = JSON.stringify(helpers.sortDictionaryByKey(result));
        const expected = JSON.stringify(
          helpers.sortDictionaryByKey({
            positions: {
              0: { addressReference: { address: { street: "Teststraat" } } }
            }
          })
        );

        assert.equal(actual, expected);
        done();
      })
      .catch(done);
  });

  it("should support parent referencing", done => {
    cbc
      .getById("Person", process.env.TEST_PERSON_ID)
      .then(person =>
        factory.getPromiseByPaths("Person", person, [
          "positions.0.emailAddress.emailAddress"
        ])
      )
      .then(result => {
        assert.deepEqual(result, {
          positions: [
            {
              emailAddress: {
                emailAddress: "j.van.zutphen@belastingdienst.nl"
              }
            }
          ]
        });
        done();
      })
      .catch(done);
  });

  it("should expose rootDocument when requested", done => {
    cbc
      .getById("Person", process.env.TEST_PERSON_ID)
      .then(person =>
        factory.getPromiseByPaths("Person", person, [
          "positions.0.emailAddressReference.documentReference.rootDocument.firstName"
        ])
      )
      .then(actual => {
        assert.deepEqual(actual, {
          positions: [
            {
              emailAddressReference: {
                documentReference: {
                  rootDocument: {
                    firstName: "Janny"
                  }
                }
              }
            }
          ]
        });
        done();
      })
      .catch(done);
  });

  it("should traverse 1-to-1 documentreference property", done => {
    cbc
      .getById("Invoice", process.env.TEST_INVOICE_ID)
      .then(invoice => {
        return factory.getPromiseByPaths("Invoice", invoice, [
          "invoiceItems.0.document.startDate"
        ]);
      })
      .then(actual => {
        assert.equal(
          JSON.stringify(actual),
          '{"invoiceItems":[{"document":{"startDate":"2015-03-22T23:00:00.000Z"}},{}]}'
        );
        done();
      })
      .catch(done);
  });
});
