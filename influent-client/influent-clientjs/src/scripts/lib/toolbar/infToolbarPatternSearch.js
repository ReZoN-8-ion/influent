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
		'lib/communication/flowViewChannels',
		'hbs!templates/viewToolbar/infToolbarPatternSearch'
	],
	function(
		appChannel,
		flowChannel,
		infToolbarPatternSearchTemplate
	) {
		var module = {};

		module.createInstance = function (view, canvas) {

			var instance = {};

			var _UIObjectState = {
				view: view,
				canvas: canvas,
				widgetCanvas: null,
				subscriberTokens: null
			};

			//----------------------------------------------------------------------------------------------------------
			// Private Methods
			//----------------------------------------------------------------------------------------------------------

			var _$ = function(e) {
				return _UIObjectState.widgetCanvas.find(e);
			};

			//----------------------------------------------------------------------------------------------------------

			var _initializeWidget = function() {
				_$('.dropdown-menu a').click(function() {

					aperture.pubsub.publish(flowChannel.PATTERN_SEARCH_REQUEST);
					_$('.dropdown-toggle').dropdown('toggle');
					return false;
				}).mouseenter(
					function(e) {
						aperture.pubsub.publish(flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS, {
							xfId : null,
							isHighlighted : true
						});
						aperture.pubsub.publish(appChannel.HOVER_START_EVENT, { element : e.target.title });
						aperture.pubsub.publish(appChannel.TOOLTIP_START_EVENT, { element : e.target.title });
						return false;
					}
				).mouseleave(
					function(e) {
						aperture.pubsub.publish(flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS, {
							xfId : null,
							isHighlighted : false
						});
						aperture.pubsub.publish(appChannel.HOVER_END_EVENT, { element : e.target.title });
						aperture.pubsub.publish(appChannel.TOOLTIP_END_EVENT, { element : e.target.title });
						return false;
					}
				);
			};

			//----------------------------------------------------------------------------------------------------------
			// Public
			//----------------------------------------------------------------------------------------------------------

			instance.render = function () {

				if (!_UIObjectState.canvas || !_UIObjectState.canvas instanceof $) {
					throw 'No assigned canvas for rendering view toolbar widget';
				}

				var row = _UIObjectState.canvas.find('.row');

				// Plug everything into the template
				_UIObjectState.widgetCanvas = $(infToolbarPatternSearchTemplate({
					id: 'patterns-like-these',
					tooltip: 'Search for similar patterns of activity',
					icon: 'icon-pattern-search',
					text: 'Find Patterns Like This'
				})).appendTo(row);

				_initializeWidget();
			};

			// TODO: Do we need to listen to incoming changes?
			var subTokens = {};
			_UIObjectState.subscriberTokens = subTokens;
			// TODO: .. If so, we need to unsubscribe too.

			return instance;
		};

		return module;
	}
);
