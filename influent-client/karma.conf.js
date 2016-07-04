/*
 * Copyright 2013-2016 Uncharted Software Inc.
 *
 *  Property of Uncharted(TM), formerly Oculus Info Inc.
 *  https://uncharted.software/
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

module.exports = function(config) {
	config.set({

		// NOTE: uncomment the // COVERAGE lines to instrument for coverage.
		//       comment them back out if you want to debug source code on the command line.
		plugins: [
			'karma-chrome-launcher',
//			'karma-coverage', // COVERAGE
			'karma-firefox-launcher',
			'karma-html2js-preprocessor',
			'karma-ie-launcher',
			'karma-jasmine',
			'karma-jasmine-jquery',
			'karma-junit-reporter',
			'karma-phantomjs-launcher',
			'karma-requirejs'
		],

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine-jquery', 'jasmine'],

		// list of files / patterns to load in the browser
		files: [
			// jQuery imports
			'influent-clientjs/src/scripts/lib/extern/jquery.js',
			'influent-clientjs/src/scripts/lib/extern/jquery-ui.js',
			'influent-clientjs/src/scripts/lib/influent-jquery/influent-jquery.js',

			// bootstrap imports
			'influent-clientjs/filtered/bootstrap/bootstrap.js',
			'influent-clientjs/filtered/bootstrap/bootstrap-select.js',
			'influent-clientjs/filtered/bootstrap/bootstrap-datepicker.js',

			// aperture import
			'influent-clientjs/src/aperture/aperture.js',

			// Draper logging
			'influent-clientjs/src/scripts/lib/log/DraperAppender.js',

			// always add require after global imports
			'node_modules/requirejs/require.js',
			'node_modules/karma-requirejs/lib/adapter.js',

			// production code
			{pattern: 'influent-clientjs/src/scripts/**/*.js', included: false},
			{pattern: 'influent-clientjs/src/scripts/templates/**/*.hbs', included: false},
			{pattern: 'influent-clientjs/src/scripts/templates/helpers/*.js', included: false},

			// test code
			'influent-clientjs/test/test-config.js',
			'influent-clientjs/test/test-main.js',
			'influent-clientjs/test/test-specs/html/*.html',
			{pattern: 'influent-clientjs/test/test-specs/**/*.js', included: false},
			{pattern: 'influent-clientjs/test/extensions/*.js', included: false},
			{pattern: 'influent-clientjs/test/extensions/templates/**/*.hbs', included: false}
		],

		// list of files to exclude
		exclude: [
			'influent-clientjs/src/scripts/main.js'
		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'**/*.html': ['html2js']//,
//			'influent-clientjs/src/scripts/**/*.js': ['coverage'] // COVERAGE
		},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: [
			'progress',
			'junit'//,
//			'coverage' // COVERAGE
		],

		// COVERAGE
//		coverageReporter: {
//			type : 'html',
//			dir : 'coverage/'
//		},

		junitReporter: {
			outputFile: 'target/test-reports/karma-results.xml'
		},

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// increase browser timeout length (default 10s).   PhantomJS can take a while to initialize
		browserNoActivityTimeout: 100000,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: [
			'PhantomJS'//,
			//'Chrome' //,
			//'Firefox' //,
			//'IE'
		],

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true
	});
};
