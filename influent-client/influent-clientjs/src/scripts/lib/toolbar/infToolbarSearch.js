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
		'lib/advanced-search/infToolbarAdvancedSearch',
		'lib/communication/applicationChannels',
		'hbs!templates/viewToolbar/infToolbarSearch'
	],
	function(
		infToolbarAdvancedSearch,
		appChannel,
		infToolbarSearchTemplate
	) {
		var module = {};

		module.createInstance = function (view, canvas, spec) {

			var instance = {};
			
			var _UIObjectState = {
				view: view,
				canvas: canvas,
				widgetCanvas: null,
				subscriberTokens: null,
				advancedModule: null
			};

			_UIObjectState.advancedModule = infToolbarAdvancedSearch.createInstance(view, canvas, spec.searchParams);

			//--------------------------------------------------------------------------------------------------------------
			// Private Methods
			//--------------------------------------------------------------------------------------------------------------

			var _$ = function(e) {
				return _UIObjectState.widgetCanvas.find(e);
			};

			//--------------------------------------------------------------------------------------------------------------

			var _sendFilterChange = function() {
				aperture.pubsub.publish(appChannel.FILTER_SEARCH_CHANGE_EVENT, {
					view: _UIObjectState.view,
					input: _$('input').val()
				});
			};

			var _showAdvancedSearch = function() {
				aperture.pubsub.publish(appChannel.ADVANCED_SEARCH_REQUEST, {
					view: _UIObjectState.view,
					input: _$('input').val()
				});
			};
			
			//--------------------------------------------------------------------------------------------------------------

			var _onFilterChangeRequest = function(eventChannel, data) {
				_$('input').val(data.input);
				if (eventChannel !== appChannel.FILTER_SEARCH_CHANGE_REQUEST ||
					data.view !== _UIObjectState.view) {
					return;
				}

				_$('input').val(data.input);
				_sendFilterChange();
			};

			var _onFilterDisplayChangeRequest = function(eventChannel, data) {
				if (eventChannel !== appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST ||
					data.view !== _UIObjectState.view) {
					return;
				}
				_$('input').val(data.input);
			};

			//--------------------------------------------------------------------------------------------------------------

			var _initializeFilter = function () {

				_$('input').keypress(function(event) {
					if ( event.which === 13 ) {
						event.preventDefault();
						
						_sendFilterChange();
					}
				});

				_$('.infGoSearch').click(function() {
					_sendFilterChange();
				});

				_$('.infAdvSearchShow').click(function() {
					_showAdvancedSearch();
				});

			};

			//--------------------------------------------------------------------------------------------------------------
			// Public
			//--------------------------------------------------------------------------------------------------------------

			instance.render = function () {

				if (!_UIObjectState.canvas || !_UIObjectState.canvas instanceof $) {
					throw 'No assigned canvas for rendering view toolbar widget';
				}

				var row = _UIObjectState.canvas.find('.row');

				// Plug everything into the template
				_UIObjectState.widgetCanvas = $(infToolbarSearchTemplate()).appendTo(row);

				_initializeFilter();

				// propagate
				_UIObjectState.advancedModule.render();
			};

			// TODO: Do we need to listen to incoming changes?
			var subTokens = {};
			subTokens[appChannel.FILTER_SEARCH_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.FILTER_SEARCH_CHANGE_REQUEST, _onFilterChangeRequest);
			subTokens[appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST, _onFilterDisplayChangeRequest);
			_UIObjectState.subscriberTokens = subTokens;

			// TODO: .. If so, we need to unsubscribe too.

			return instance;
		};

		return module;
	}
);
