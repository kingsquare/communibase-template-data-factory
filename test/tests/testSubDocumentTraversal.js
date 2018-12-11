const assert = require("assert");
const cbc = require("communibase-connector-js");
// const helpers = require("../../src/inc/helpers.js");
const Factory = require("../../src/index.js");
const Handlebars = require("handlebars");

const factory = new Factory({
  cbc
});

describe("#getTemplateData() - Sub document traversal i.e. participant -> person.positions.0.company.title", () => {
  it("should work", done => {
    cbc
      .getById("Event", process.env.TEST_EVENT_ID)
      .then(event =>
        factory.getPromise(
          "Participant",
          event.participants[0],
          Handlebars.parse("{{person.positions.0.company.title}}")
        )
      )
      .then(result => {
        const actual = JSON.stringify(result);
        const expected = JSON.stringify({
          person: { positions: [{ company: { title: "NEVI" } }] }
        });
        assert.equal(actual, expected);
        done();
      })
      .catch(done);
  });
});
