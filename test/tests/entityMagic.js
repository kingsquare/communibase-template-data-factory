const assert = require("assert");
const Factory = require("../../src/index.js");
const Handlebars = require("handlebars");
const cbc = require("communibase-connector-js");

const factory = new Factory({
  cbc
});

describe("#Entity Magic()", () => {
  it("should expose membershipNumber for Person", done => {
    cbc.getById("Person", process.env.TEST_PERSON_ID).then(person => {
      const template = Handlebars.parse("{{firstName}} - {{membershipNumber}}");
      factory.getPromise("Person", person, template).then(result => {
        assert.deepEqual(result, {
          firstName: "Janny",
          membershipNumber: 302962
        });
        done();
      });
    });
  });

  it("should expose sessions for Event-participants", done => {
    cbc.getAll("Event").then(events => {
      const template = Handlebars.parse(
        "{{#each participants}}{{personId}}:{{#each sessions}}{{title}}{{/each}}{{/each}}"
      );
      factory
        .getPromise("Event", events[0], template)
        .then(result => {
          assert.equal(result.participants[0].sessions.length, 1);
          done();
        })
        .catch(done);
    });
  });
});
