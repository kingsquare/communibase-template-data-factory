const assert = require("assert");
const helpers = require("../../src/inc/helpers.js");

describe("helpers.getRequestedSubVariables()", () => {
  it("should get specific subvalues", done => {
    const actual = helpers.getRequestedSubVariables(
      ["a.b", "c.a.g", "d", "e.f"],
      "a"
    );

    assert.deepEqual(actual, ["b"]);
    done();
  });

  it("should get specific sub-objects", done => {
    const actual = helpers.getRequestedSubVariables(
      ["a.b", "c.a.g", "d", "e.f"],
      "c"
    );

    assert.deepEqual(actual, ["a.g"]);
    done();
  });

  it("should get specific sub-subvalues", done => {
    const actual = helpers.getRequestedSubVariables(
      ["a.b", "c.a.g", "d", "e.f"],
      "c.a"
    );

    assert.deepEqual(actual, ["g"]);
    done();
  });

  it("should get all second-hand values", done => {
    const first = helpers.getRequestedSubVariables(["#.#"], "e.f");
    const second = helpers.getRequestedSubVariables(["#.#"], "e");

    assert.deepEqual(first, []);
    assert.deepEqual(second, ["#"]);
    done();
  });
});
