var fs = require('fs');
var packageLocation = __dirname + '/../package.json';
var packageData = JSON.parse(fs.readFileSync(packageLocation, 'utf-8'));
var splittedVersion = packageData.version.split('.');
var lastNumber = parseInt(splittedVersion.pop());

// up the last number by 1
lastNumber += 1;

packageData.version = splittedVersion.join('.') + '.' + lastNumber;

fs.writeFileSync(packageLocation, JSON.stringify(packageData,null,2));
console.log('bumped package version');