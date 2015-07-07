'use strict';

module.exports = {
	titleFields: ['passedPercentage'],
	composeTitle: function (chunks, entityTitle, document) {
		var id = document._id;
		var title = chunks.join(' ').trim().replace(/ +/g, ' ');
		return (title.length > 0 ?
			'Korting na ' + chunks[0] + '% verstreken' :
				('<< ' + ( id ?
					(this.stxt[entityTitle] || entityTitle) + ' ' + id :
					'Nieuw "' + (this.stxt[entityTitle] || entityTitle) + '" document ' ) +
				' >>'));
	}
};