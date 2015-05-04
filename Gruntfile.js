/*global module:false */

"use strict";

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-shell');

	// Project configuration.
	grunt.initConfig({
		shell: {
			build: {
				command: 'node development/updateStxts.js && node development/bumpVersion.js'
			},
			options: {
				execOptions: {
					env: {
						STXT_API_KEY: 'c458A5mZ7fU7bofD4K2I4X2y'
					}
				}
			}
		}
	});

	// Default task(s).
	grunt.registerTask('build', ['shell:build']);
};