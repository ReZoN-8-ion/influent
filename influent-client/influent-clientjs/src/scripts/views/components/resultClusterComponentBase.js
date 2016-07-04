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
		'hbs!templates/searchResults/searchResultCluster'
	],
	function(
		searchResultCluster
	) {


		//--------------------------------------------------------------------------------------------------------------

		var _add = function(xfId, container, clusterData, selectionChangeChannel, visibilityChangeChannel) {

			var state = {
				xfId : xfId,
				clusterLabel : clusterData.sortByLabel,
				selectionChangeChannel : selectionChangeChannel,
				visibilityChangeChannel : visibilityChangeChannel
			};

			clusterData['clusterState'] = 'down';

			var template = searchResultCluster({
				xfId : xfId,
				clusterInfo : clusterData
			});

			container.append(template);

			state.canvas = container.find('#' + state.xfId);

			_addSelectionClickHandler(state);
			_addCollapseHandler(state);

			return state.canvas;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addSelectionClickHandler = function(state) {
			state.canvas.find('.infSelectGroupResults').click(function() {
				var $checkbox = $(this).find('input');
				var checked = $checkbox.prop('checked');

				var $checkboxes = state.canvas.find('#infSearchResultTable').find('input');
				$checkboxes.prop('checked', checked);

				_highlightResult($checkboxes.parent(), checked);

				//signal event for id that changed
				aperture.pubsub.publish(state.selectionChangeChannel, {
					xfId : state.xfId,
					isSelected : checked
				});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addCollapseHandler = function(state) {
			state.canvas.find('.infResultClusterAccordionButton').click(function() {
				var cluster = state.canvas.find('.batchResults');
				var icon;
				var expanded = true;
				if ($(cluster).hasClass('in')) {
					$(cluster).removeClass('in');
					icon = $(this).find('.infResultClusterAccordionButtonIcon');
					icon.removeClass('fa-caret-down');
					icon.addClass('fa-caret-right');
					expanded = false;
				} else {
					$(cluster).addClass('in');
					icon = $(this).find('.infResultClusterAccordionButtonIcon');
					icon.removeClass('fa-caret-right');
					icon.addClass('fa-caret-down');
				}

				//signal event for cluster that changed
				aperture.pubsub.publish(state.visibilityChangeChannel, {
					xfId : state.xfId,
					isExpanded : expanded
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
			addSearchResultCluster : _add
		};
	}
);
