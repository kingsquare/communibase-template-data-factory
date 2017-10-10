const BaseSerializer = require('./Base.js');
const moment = require('moment');

module.exports = {
  titleFields: ['title', 'startDate'],

  /**
   * https://trello.com/c/aSUzT0Ai/1330-verbetering-gebruikservaring-naar-evenement-slepen-naast-evenement-titel-ook-
   *
   * @param {Array} chunks
   * @param {String} entityTitle
   * @param {Object} event
   * @return {string}
   */
  composeTitle(chunks, entityTitle, event) {
    if (chunks && chunks[1]) {
      chunks[1] = `(${moment(chunks[1]).format('D-M-YYYY')})`;
    }

    return BaseSerializer.composeTitle.apply(this, [chunks, entityTitle, event]);
  }
};
