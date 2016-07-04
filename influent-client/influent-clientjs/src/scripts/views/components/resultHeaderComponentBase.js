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
		'hbs!templates/searchResults/searchResultsHeader'
	],
	function(
		searchResultsHeaderTemplate
	) {


		//--------------------------------------------------------------------------------------------------------------

		var _reset = function(xfId, headerContainer, resultsContainer, headerData, totalResults, currentSearchString, selectionChangeChannel, sortOrderChangeChannel) {
			var state = {
				canvas : null,
				xfId : xfId,
				headerData : headerData,
				resultsContainer : resultsContainer,
				totalResults : totalResults,
				currentSearchString : currentSearchString,
				selectionChangeChannel : selectionChangeChannel,
				sortOrderChangeChannel : sortOrderChangeChannel
			};

			headerContainer.empty();

			var template = searchResultsHeaderTemplate({
				xfId : xfId,
				headerInfo : headerData,
				totalResults : totalResults
			});

			headerContainer.append(template);

			state.canvas = headerContainer;

			_addHandlers(state);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addHandlers = function(state) {
			state.canvas.find('.infSearchResultsSelectAll').click(function() {
				var $element = $(this).find('input');
				var checked = $element.prop('checked');

				var $checkboxes = state.resultsContainer.find('input');
				$checkboxes.prop('checked', checked);

				_highlightResult($('.selectSingleResult'), checked);

				//signal event for ids that changed
				aperture.pubsub.publish(state.selectionChangeChannel, {
					xfId : state.xfId,
					isSelected : checked
				});
			});

			$('.summaryColumnHeader', state.canvas.find('.summaryColumns')).each(function (i, e) {
				if (state.headerData.columns[i].property.searchableBy !== 'NONE' && state.totalResults > 0) {

					var	order = state.headerData.columns[i].orderDesc ? 'ascending' :
						state.headerData.columns[i].orderAsc ? 'none' : 'descending';
					var span = state.headerData.columns[i].numFormat ? $(e).find('span')[0] : $(e).find('span')[1];

					$(e).hover(function () {
						if (order === 'descending') {
							if (state.headerData.columns[i].numFormat) {
								$(e).prepend($('<span/>').addClass('glyphicon glyphicon-chevron-down'));
							} else {
								$(e).append($('<span/>').addClass('glyphicon glyphicon-chevron-down'));
							}
						} else if (order === 'ascending') {
							$(span).removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
						} else if (order === 'none') {
							$(span).removeClass('glyphicon-chevron-up').addClass('glyphicon-minus');
						}
					}, function () {
						if (state.headerData.columns[i].orderDesc) {
							$(span).removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
						} else if (state.headerData.columns[i].orderAsc) {
							$(span).removeClass('glyphicon-minus').addClass('glyphicon-chevron-up');
						} else if (!state.headerData.columns[i].orderDesc && !state.headerData.columns[i].orderAsc) {
							var removeSpan = state.headerData.columns[i].numFormat ? $(e).find('span')[0] : $(e).find('span')[1];
							$(removeSpan).remove();
						}
					});

					$(e).click(function () {
						var key = state.headerData.columns[i].property.key;

						//If we are already ordering by the given column then we need to change the order in the filter string
						var regex = new RegExp('\\s*order:' + key + '\\^?', 'gi');
						var orderMatch = state.currentSearchString.match(regex);
						var newOrder = order === 'none' ? '' : order === 'descending' ? ' ORDER:' + key : ' ORDER:' + key + '^';

						var searchString = state.currentSearchString + newOrder;

						if (orderMatch && orderMatch.length === 1) {
							searchString = state.currentSearchString.replace(orderMatch[0], newOrder);
						}

						aperture.pubsub.publish(state.sortOrderChangeChannel, {
							searchString : searchString
						});
					});
				}
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
			setSearchResultsHeader : _reset
		};
	}
);
