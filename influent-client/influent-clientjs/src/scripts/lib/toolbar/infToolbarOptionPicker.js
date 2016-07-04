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
		'hbs!templates/viewToolbar/infToolbarOptionPicker'
	],
	function(
		appChannel,
		infToolbarOptionPickerTemplate
	) {
		var module = {};

		module.createInstance = function (view, canvas, spec) {

			var instance = {};

			var _UIObjectState = {
				view: null,
				canvas: null,
				widgetCanvas: null,
				subscriberTokens: null,
				elements: spec.elements,
				selection: spec.selection
			};

			var _$ = function(e) {
				return _UIObjectState.widgetCanvas.find(e);
			};

			_UIObjectState.view = view;
			_UIObjectState.canvas = canvas;

			//--------------------------------------------------------------------------------------------------------------
			// Private Methods
			//--------------------------------------------------------------------------------------------------------------

			var _updateFilterUI = function() {
				_$('button').html(_UIObjectState.selection + ' <span class="caret"></span>');
			};

			//--------------------------------------------------------------------------------------------------------------

			var _sendFilterChange = function() {
				aperture.pubsub.publish(appChannel.FILTER_OPTION_PICKER_CHANGE_EVENT, {
					view: _UIObjectState.view,
					selection: _UIObjectState.selection
				});
			};

			//--------------------------------------------------------------------------------------------------------------

			var _initializeFilter = function () {

				_$('.dropdown-menu a').click(function() {

					if (_UIObjectState.selection !== $(this).text()) {
						_UIObjectState.selection = $(this).text();
						_sendFilterChange();
						_updateFilterUI();
					}
					_$('.dropdown-toggle').dropdown('toggle');
					return false;
				});
			};

			//--------------------------------------------------------------------------------------------------------------

			var _onFilterChangeRequest = function(eventChannel, data) {
				if (eventChannel !== appChannel.FILTER_OPTION_PICKER_CHANGE_REQUEST ||
					data.view !== _UIObjectState.view) {
					return;
				}

				_UIObjectState.selection = data.selection;
				_sendFilterChange();
				_updateFilterUI();
			};


			//--------------------------------------------------------------------------------------------------------------
			// Public
			//--------------------------------------------------------------------------------------------------------------

			instance.render = function () {

				if (!_UIObjectState.canvas || !_UIObjectState.canvas instanceof $) {
					throw 'No assigned canvas for rendering view toolbar widget';
				}

				if (_UIObjectState.elements.length === 0) {
					throw 'Selector filter widget has no elements';
				}

				var row = _UIObjectState.canvas.find('.row');

				var data = {
					entries: []
				};

				aperture.util.forEach(_UIObjectState.elements, function(ele) {
					data.entries.push({text: ele});
				});

				// Plug everything into the template
				_UIObjectState.widgetCanvas = $(infToolbarOptionPickerTemplate(data)).appendTo(row);

				_updateFilterUI();
				_initializeFilter();
			};

			// TODO: Do we need to listen to incoming changes?
			var subTokens = {};
			subTokens[appChannel.FILTER_OPTION_PICKER_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.FILTER_OPTION_PICKER_CHANGE_REQUEST, _onFilterChangeRequest);
			_UIObjectState.subscriberTokens = subTokens;

			// TODO: .. If so, we need to unsubscribe too.

			return instance;
		};

		return module;
	}
);
