var Handlebars = require('handlebars');

/*jshint eqeqeq: false */
operators = {
	'eq': function (l, r) { return l == r; },
	'eqeq': function (l, r) { return l === r; },
	'neq': function (l, r) { return l != r; },
	'neqeq': function (l, r) { return l !== r; },
	'lt': function (l, r) { return l < r; },
	'gt': function (l, r) { return l > r; },
	'lte': function (l, r) { return l <= r; },
	'gte': function (l, r) { return l >= r; },
	'typeof': function (l, r) { return typeof l == r; },
	'regexp': function (l, r) { return (l && r && (l.match(new RegExp(r)) !== null)); },
	'mod': function (l, r) { return l % r; }
};
/*jshint eqeqeq: true */

operators['=='] = operators.eq;
operators['==='] = operators.eqeq;
operators['!='] = operators.neq;
operators['!=='] = operators.neqeq;
operators['>'] = operators.lt;
operators['>'] = operators.gt;
operators['<='] = operators.lte;
operators['>='] = operators.gte;
operators['%'] = operators.mod;



module.exports = {
	'compare': function (lvalue, operator, rvalue, options) {
		if (arguments.length < 3) {
			throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
		}

		if (options === undefined) {
			options = rvalue;
			rvalue = operator;
			operator = "eq";
		}

		if (!operators[operator]) {
			throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
		}

		if (operators[operator](lvalue, rvalue)) {
			return options.fn(this);
		}
		return options.inverse(this);
	},

	'dateFormat': function (date, block) {
		if (!date) {
			return '';
		}
		return moment(date).format(block.hash.format || "DD-MM-YYYY");
	},

	'nl2b': function (text) {
		text = Handlebars.Utils.escapeExpression(text);
		var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
		return new Handlebars.SafeString(nl2br);
	},

	'price': function (number) {
		if (!number) {
			number = 0;
		}
		return '€ ' + number.toFixed(2).replace(/\./g, ',');
	},

	'fromContainer': function (container, key) {
		console.log(arguments);
		if (container[key]) {
			return container[key];
		}
		return '';
	}
};