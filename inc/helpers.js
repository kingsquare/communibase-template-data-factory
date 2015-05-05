"use strict";

//Simplified version of https://raw.githubusercontent.com/kvz/phpjs/master/functions/strings/number_format.js
function number_format(number) {
	var n = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var s = ('' + (Math.round(n * 100) / 100).toFixed(2)).split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, '.');
	}
	if ((s[1] || '').length < 2) {
		s[1] = s[1] || '';
		s[1] += new Array(2 - s[1].length + 1).join('0');
	}
	return s.join(',');
}

function ucfirst(str) {
	str += '';
	var f = str.charAt(0).toUpperCase();
	return f + str.substr(1);
}

function getRequestedSubVariables(requestedPaths, subPropertyName) {
	var subResults = [];

	requestedPaths.forEach(function (requestedPath) {
		var pathNibbles = requestedPath.split('.');

		// if the first nibble is a # (e.g. #.emailAddress or #.#),
		// change this # into the subPropertyName: emailAddress.emailAddress or emailAddress.#
		if (pathNibbles[0] === '#' && pathNibbles.length > subPropertyName.split('.').length) {
			pathNibbles[0] = subPropertyName;
		}

		var result = [];
		while (pathNibbles.length > 0) {
			result.push(pathNibbles.shift());
			if (subPropertyName === result.join('.')) {
				subResults.push(pathNibbles.join('.'));
			}
		}
	});

	return subResults;
}

function sortDictionaryByKey(myObj) {
	var keys = Object.keys(myObj),
		i, len = keys.length,
		newObject = {};

	keys.sort();

	for (i = 0; i < len; i+=1) {
		var k = keys[i];

		if (typeof myObj[k] === 'object') {
			newObject[k] = sortDictionaryByKey(myObj[k]);
		} else {
			newObject[k] = myObj[k];
		}
	}

	return newObject;
}

module.exports = {
	"number_format": number_format,
	"ucfirst": ucfirst,
	"getRequestedSubVariables": getRequestedSubVariables,
	"sortDictionaryByKey": sortDictionaryByKey,
};