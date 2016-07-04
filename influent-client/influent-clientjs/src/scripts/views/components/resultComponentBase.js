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
		'lib/constants',
		'lib/plugins',
		'lib/util/infTagUtilities',
		'hbs!templates/searchResults/searchDetails',
		'hbs!templates/searchResults/searchResult'
	],
	function(
		constants,
		plugins,
		tagUtil,
		searchDetails,
		searchResultTemplate
	) {
		var _add = function(xfId, container, headerInfo, result, snippet, selectionChangeChannel, entityDetailsChangeChannel) {
			var state = {
				canvas : null,
				summaryCanvas : null,
				detailsCanvas : null,
				xfId : xfId,
				snippet : snippet,
				result : result,
				resultData : result.getVisualInfo(headerInfo),
				selectionChangeChannel : selectionChangeChannel,
				entityDetailsChangeChannel : entityDetailsChangeChannel
			};

			var template = searchResultTemplate({
				xfId : state.xfId,
				columns : state.resultData.columns,
				detailsSpan : state.resultData.detailsSpan,
				promptForDetails : state.resultData.promptForDetails
			});

			container.append(template);

			state.canvas = container;
			state.summaryCanvas = container.find('#summary_' + state.xfId);
			state.detailsCanvas = container.find('#details_' + state.xfId);

			_addSelectionClickHandler(state);

			_updateDetailsCanvas(state);

			return state;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addDetailsClickHandler = function(state) {
			state.detailsCanvas.find('#infSearchResultDetailsToggle').click(function() {
				//signal event for a change in detail level
				aperture.pubsub.publish(state.entityDetailsChangeChannel, {
					xfId : state.xfId,
					container : state.detailsCanvas
				});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _showMatchDetails = function($details, state) {
			var template = searchDetails({properties: state.snippet});
			
			$details.append(template);
			
			_addDetailsClickHandler(state);
		};
		
		//--------------------------------------------------------------------------------------------------------------

		var _promptForDetailsCallback = function($details) {
			var resultDetails = $details.find('.resultDetails');
			resultDetails.find('.infSearchResultOverlay').remove();

			_showMatchDetails(resultDetails, this);

			this.result.setDetailsPrompt(false);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _updateDetailsCanvas = function(state) {

			var $details = state.detailsCanvas.find('.resultDetails');

			var prompting = false;
			if (state.resultData.promptForDetails) {

				var extensions = plugins.get('details');
				var plugin = aperture.util.find(
					extensions,
					function (e) {
						return e.searchResultPrompt !== undefined;
					}
				);

				if (plugin) {
					plugin.searchResultPrompt(state.detailsCanvas, state.result, _promptForDetailsCallback.bind(state));
					prompting = true;
				}
			}

			if (!prompting) {
				_showMatchDetails($details, state);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addSelectionClickHandler = function(state) {
			state.summaryCanvas.find('.selectSingleResult').click(function() {
				var $checkbox = $(this).find('input');
				var checked = $checkbox.prop('checked');

				_highlightResult($(this), checked);

				//signal event for selected id
				aperture.pubsub.publish(state.selectionChangeChannel, {
					xfId : state.xfId,
					isSelected : checked
				});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _highlightResult = function(container, highlight) {
			if (highlight) {
				container.addClass('searchResultSelected');
			} else {
				container.removeClass('searchResultSelected');
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		return {
			addSearchResult: _add
		};
	}
);
