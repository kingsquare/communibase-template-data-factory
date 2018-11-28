const _ = require("lodash");

// Simplified version of https://raw.githubusercontent.com/kvz/phpjs/master/functions/strings/number_format.js
// eslint-disable-next-line camelcase
const number_format = number => {
  const n = `${number}`.replace(/[^0-9+\-Ee.]/g, "");
  const s = `${(Math.round(n * 100) / 100).toFixed(2)}`.split(".");
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, ".");
  }
  if ((s[1] || "").length < 2) {
    s[1] = s[1] || "";
    s[1] += new Array(2 - (s[1].length + 1)).join("0");
  }
  return s.join(",");
};

// eslint-disable-next-line camelcase
const euro_format = number => {
  const formattedNumber = number_format(number);
  if (formattedNumber[0] === "-") {
    return `-€ ${formattedNumber.substr(1)}`;
  }

  return `€ ${formattedNumber}`;
};

const ucfirst = str => {
  str += "";
  const f = str.charAt(0).toUpperCase();
  return f + str.substr(1);
};

const getRequestedSubVariables = (requestedPaths, subPropertyName) => {
  const subResults = [];

  requestedPaths.forEach(requestedPath => {
    const pathNibbles = requestedPath.split(".");

    // if the first nibble is a # (e.g. #.emailAddress or #.#),
    // change this # into the subPropertyName: emailAddress.emailAddress or emailAddress.#
    if (
      pathNibbles[0] === "#" &&
      pathNibbles.length > subPropertyName.split(".").length
    ) {
      pathNibbles[0] = subPropertyName;
    }

    const result = [];
    while (pathNibbles.length > 0) {
      result.push(pathNibbles.shift());
      if (subPropertyName === result.join(".") && pathNibbles.length > 0) {
        subResults.push(pathNibbles.join("."));
      }
    }
  });

  return subResults;
};

const sortDictionaryByKey = myObj => {
  const keys = Object.keys(myObj);
  const len = keys.length;
  const newObject = {};

  keys.sort();
  for (let i = 0; i < len; i += 1) {
    const k = keys[i];

    if (_.isObject(myObj[k])) {
      newObject[k] = sortDictionaryByKey(myObj[k]);
    } else {
      newObject[k] = myObj[k];
    }
  }
  return newObject;
};

// http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript
const round = (number, precision) => Number(number.toFixed(precision));

module.exports = {
  euro_format,
  number_format,
  ucfirst,
  getRequestedSubVariables,
  sortDictionaryByKey,
  round
};
