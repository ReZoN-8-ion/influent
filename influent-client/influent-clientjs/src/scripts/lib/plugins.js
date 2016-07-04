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

define(function() {
	var registry = {};
	var u = aperture.util;

	// registers a plugin on load
	function add(name, plugin) {
		var a = registry[name];

		if (a == null) {
			a = registry[name] = [];
		}

		plugin = aperture.util.viewOf(plugin);

		// clear this in case there is a problem loading it
		var m = plugin.module;
		plugin.module = null;

		// register the plugin.
		a.push(plugin);

		// load required modules
		if (u.isString(m)) {
			require(['../../' + m], function(module) {
				plugin.module = module;
			});
		}
	}

	// get plugin registrations.
	aperture.config.register('influent.plugins', function(cfg) {
		cfg = cfg['influent.plugins'];

		u.forEach(cfg, function(list, name) {
			if (u.isString(name)) {
				if (list && !u.isArray(list)) {
					list = [list];
				}
				u.forEach(list, function(plugin) {
					add(name, plugin);
				});

			} else {
				aperture.log.error('influent.plugins config does not consist of named properties.');
			}
		});
	});

	// return registered plugins under name.
	return {
		get : function(name) {
			return registry[name];
		}
	};
});
