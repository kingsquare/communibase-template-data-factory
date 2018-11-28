const assert = require("assert");
const Factory = require("../../src/index.js");
const cbc = require("communibase-connector-js");

const factory = new Factory({
  cbc
});

describe("#extraserializers()", () => {
  it("should work", done => {
    factory.setSerializers({
      CustomEntity: {
        titleFields: ["weirdTitlishProp"]
      }
    });
    factory
      .getTitlePromise("CustomEntity", {
        title: "im not the title",
        weirdTitlishProp: "bonjour"
      })
      .then(result => {
        assert.equal(result, "bonjour");
        done();
      });
  });
});
