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

define(
	[
		'lib/communication/applicationChannels',
		'lib/constants',
		'lib/toolbar/infToolbarDatePicker',
		'lib/toolbar/infToolbarOptionPicker',
		'lib/toolbar/infToolbarPatternSearch',
		'lib/toolbar/infToolbarSearch',
		'lib/util/duration',
		'lib/util/xfUtil',
		'hbs!templates/viewToolbar/infToolbar'
	],
	function(
		appChannel,
		constants,
		infToolbarDatePicker,
		infToolbarOptionPicker,
		infToolbarPatternSearch,
		infToolbarSearch,
		duration,
		xfUtil,
		infToolbarTemplate
	) {
		// All widget types are defined here
		var _widgetTypes = {
			DATE_PICKER: function(dates)	{ return {
				module: infToolbarDatePicker,
				spec: dates
			};},
			OPTION_PICKER: function(elements, selection) { return {
				module: infToolbarOptionPicker,
				spec: {
					elements: elements,
					selection: selection
				}
			};},
			SEARCH: function(searchParams) { return {
				module: infToolbarSearch,
				spec : {
					searchParams : searchParams
				}
			};},
			PATTERN_SEARCH: function() { return {
				module: infToolbarPatternSearch
			};}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _moduleSpecTemplate = {
			widgets: []
		};

		var module = {};
		$.extend(module, _widgetTypes);

		module.createInstance = function (view, canvas, spec) {

			var instance = {};

			var _UIObjectState = {
				view: null,
				canvas: null,
				subscriberTokens: null,
				spec: null,
				widgetInstances: []
			};

			_UIObjectState.view = view;
			_UIObjectState.canvas = canvas;

			// populate state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if (spec.hasOwnProperty(key)) {
					_UIObjectState.spec[key] = spec[key];
				}
			}

			//----------------------------------------------------------------------------------------------------------
			// Private
			//----------------------------------------------------------------------------------------------------------

			//----------------------------------------------------------------------------------------------------------
			// Public
			//----------------------------------------------------------------------------------------------------------

			instance.render = function () {

				if (!_UIObjectState.canvas || !_UIObjectState.canvas instanceof $) {
					throw 'No assigned canvas for rendering view toolbar';
				}

				_UIObjectState.canvas.empty();

				// Plug everything into the template
				_UIObjectState.canvas.append(infToolbarTemplate());

				aperture.util.forEach(_UIObjectState.widgetInstances, function(ele) {
					ele.render();
				});
			};

			//--------------------------------------------------------------------------------------------------------------

			// Add all the widgets to the bar and render it
			aperture.util.forEach(_UIObjectState.spec.widgets, function(ele) {
				if (!ele.module) {
					throw 'Invalid view toolbar module';
				}

				var inst = ele.module.createInstance(_UIObjectState.view, _UIObjectState.canvas, ele.spec);
				_UIObjectState.widgetInstances.push(inst);
			});
			instance.render();


			// UNIT TESTING --------------------------------------------------------------------------------------------

			if (constants.UNIT_TESTS_ENABLED) {
				instance._UIObjectState = _UIObjectState;
			}

			// UNIT TESTING --------------------------------------------------------------------------------------------

			return instance;
		};

		module.getSpecTemplate = function () {

			var specTemplate = {};
			$.extend(true, specTemplate, _moduleSpecTemplate);

			return specTemplate;
		};

		return module;
	}
);
