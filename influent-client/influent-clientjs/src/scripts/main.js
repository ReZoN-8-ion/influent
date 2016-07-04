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

requirejs.config({
	'baseUrl': 'scripts/lib/extern',
	'paths': {
		'lib': '../../lib',
		'modules': '../../modules',
		'templates': '../../templates',
		'views': '../../views',
		
		'rsvp-bundle': 'rsvp',
		'route-recognizer-bundle': 'route-recognizer'
	},
	'bundles': {
		/**
		 * rsvp defines a bunch of different modules which need to be captured here.
		 * rsvp_base is used as the base implementation of rsvp. However, the router libs
		 * are expecting the library to be an es6 compliant lib, so there are extra rsvp
		 * defines later to support this.
		 */
		'rsvp-bundle': [
			'rsvp_base/-internal',
			'rsvp_base/all-settled',
			'rsvp_base/all',
			'rsvp_base/asap',
			'rsvp_base/config',
			'rsvp_base/defer',
			'rsvp_base/enumerator',
			'rsvp_base/events',
			'rsvp_base/filter',
			'rsvp_base/hash-settled',
			'rsvp_base/hash',
			'rsvp_base/instrument',
			'rsvp_base/map',
			'rsvp_base/node',
			'rsvp_base/promise-hash',
			'rsvp_base/promise',
			'rsvp_base/promise/all',
			'rsvp_base/promise/cast',
			'rsvp_base/promise/race',
			'rsvp_base/promise/reject',
			'rsvp_base/promise/resolve',
			'rsvp_base/race',
			'rsvp_base/reject',
			'rsvp_base/resolve',
			'rsvp_base/rethrow',
			'rsvp_base/utils',
			'rsvp_base'
		],

		'route-recognizer-bundle': [
			'route-recognizer/dsl',
			'route-recognizer'
		]
	}
});

/**
 * These defines support the rsvp lib as an es6 compliant lib
 */
define('rsvp', ['rsvp_base'], function(RSVP) { return {'default': RSVP}; });
define('rsvp/promise', ['rsvp_base/promise'], function(RSVP) { return {'default': RSVP.Promise}; });

//Load scripts.
require(['lib/app', 'lib/plugins'], function(app) {

	app.setup();

	// DOM Ready, start app
	$(function() {
		app.start();
	});
});
