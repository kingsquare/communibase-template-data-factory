/* global Promise:true */


const BaseSerializer = require('./Base.js');

module.exports = {
  titleFields: ['title', '{{ - }}', 'addresses'],

  _getTitlePromise(titleFields, entityTypeTitle, company) {
    const self = this;
    return BaseSerializer._getTitlePromise.apply(this, arguments).then((titleParts) => {
      if (!company.addresses || company.addresses.length === 0) {
        return titleParts;
      }

      return self.getTitlePromise('Address', company.addresses[0]).then((addressTitles) => {
        titleParts.push(addressTitles);
        return titleParts;
      }).catch(() => titleParts);
    }).catch((err) => {
      console.log(err);
      return ['<< Onbekend, informatie ontbreekt >>'];
    });
  }
};
