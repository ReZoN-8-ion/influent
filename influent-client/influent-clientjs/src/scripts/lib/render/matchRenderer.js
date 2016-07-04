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
		'lib/util/xfUtil',
		'lib/render/cardRenderer',
		'lib/render/clusterRenderer',
		'lib/constants'
	],
	function(
		appChannel,
		flowChannel,
		xfUtil,
		cardRenderer,
		clusterRenderer,
		constants
	) {

		var _cardDefaults = cardRenderer.getRenderDefaults();
		var CONTAINER_WIDTH_PADDING = 40;
		var _renderDefaults = {
			MATCHCARD_WIDTH : _cardDefaults.CARD_WIDTH + 2*_cardDefaults.MARGIN + CONTAINER_WIDTH_PADDING,
			CONTAINER_PADDING_TOP : 3,
			CONTAINER_PADDING_BOTTOM : 5,
			SEARCH_CTRL_PADDING_TOP : 5,
			SEARCH_CTRL_PADDING_BOTTOM : 2,
			SEARCH_RESULT_PADDING_TOP : 2,
			SEARCH_RESULT_COUNT_HEIGHT : 18,
			SEARCH_RESULT_HEIGHT : 100,
			TAB_HEIGHT : 12
		};

		//--------------------------------------------------------------------------------------------------------------

		var initStyling = function(canvas){
			canvas.css('position', 'relative');
			canvas.addClass('matchCardContainer');
			canvas.width(_renderDefaults.MATCHCARD_WIDTH);
			canvas.css('padding-top', _renderDefaults.CONTAINER_PADDING_TOP);
			canvas.css('padding-bottom', _renderDefaults.CONTAINER_PADDING_BOTTOM);

			// append the little tab to the top of the container
			var matchCardTab = $(canvas).children('.matchCardTab');
			if (matchCardTab.length === 0) {
				matchCardTab = $('<div></div>');
				matchCardTab.addClass('matchCardTab');
				matchCardTab.css('border-bottom-width', _renderDefaults.TAB_HEIGHT);
				matchCardTab.css('top', -(_renderDefaults.TAB_HEIGHT - _renderDefaults.SEARCH_CTRL_PADDING_TOP));
				canvas.append(matchCardTab);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var createSearchControls = function(visualInfo){

			var parentId = visualInfo.xfId;

			// Create the controls
			var form  = $('<div></div>');
			var removeButton = $('<div></div>');


			// Add the controls.
			form.append(removeButton);

			// configure the controls
			form.addClass('matchCardForm');

			removeButton.addClass('matchRemoveButton');
			xfUtil.makeTooltip(removeButton, 'remove', 'remove matchcard');

			// set the remove button click handling
			removeButton.click(
				function() {
					aperture.pubsub.publish(
						appChannel.REMOVE_REQUEST,
						{
							xfIds : [parentId],
							dispose : true,
							isMatchCard : true,
							userRequested : true
						}
					);
					return false;
				}
			);

			return form;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _processChildren = function(childObjects, parentCanvas, minIdx, maxIdx){
			for (var i=minIdx; i < Math.min(maxIdx, childObjects.length); i++){
				var visualInfo = childObjects[i].getVisualInfo();
				var element = null;

				switch(childObjects[i].getUIType()){
					case constants.MODULE_NAMES.IMMUTABLE_CLUSTER :
					case constants.MODULE_NAMES.MUTABLE_CLUSTER :
					case constants.MODULE_NAMES.SUMMARY_CLUSTER : {
						element = clusterRenderer.renderElement(visualInfo);
						break;
					}
					case constants.MODULE_NAMES.ENTITY : {
						element = cardRenderer.renderElement(visualInfo);
						break;
					}
					default : {
						aperture.log.error('Attempted to add an unsupported UIObject type to column');
					}
				}
				if (element){
					element.css('left', _cardDefaults.CARD_LEFT);
					parentCanvas.append(element);
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getPageString = function(visualInfo) {
			var minIdx = visualInfo.minIdx;
			var maxIdx = Math.min(visualInfo.maxIdx, visualInfo.children.length);
			return (minIdx + 1) + '-' + maxIdx + ' of ' + visualInfo.totalMatches + ' results';
		};

		//--------------------------------------------------------------------------------------------------------------

		var matchRenderer = {};

		//--------------------------------------------------------------------------------------------------------------

		matchRenderer.renderElement = function(visualInfo, updateOnly) {

			var canvas = $('#' + visualInfo.xfId);

			if (updateOnly) {
				return canvas;
			}

			var searchDiv = canvas.children('.searchControls');
			var cardDiv = canvas.children('.searchResults');
			if (cardDiv.length > 0){
				cardDiv.empty();
				cardDiv.height(_renderDefaults.SEARCH_RESULT_HEIGHT);
				// Remove any previous listeners.
				xfUtil.clearMouseListeners(canvas, ['mousedown']);
			} else {
				canvas = $('<div></div>');
				canvas.attr('id', visualInfo.xfId);

				// Create the search controls.
				searchDiv = $('<div></div>');
				searchDiv.addClass('searchControls');
				searchDiv.css('padding-top', _renderDefaults.SEARCH_CTRL_PADDING_TOP);
				searchDiv.css('padding-bottom', _renderDefaults.SEARCH_CTRL_PADDING_BOTTOM);
				canvas.append(searchDiv);

				var searchElement = createSearchControls(visualInfo);
				searchDiv.append(searchElement);

				// Create the container for the search results.
				cardDiv = $('<div></div>');
				cardDiv.addClass('searchResults');
				cardDiv.css('height', _renderDefaults.SEARCH_RESULT_HEIGHT);
				cardDiv.css('padding-top', _renderDefaults.SEARCH_RESULT_PADDING_TOP);
				canvas.append(cardDiv);
			}

			if(visualInfo.isSearchControlHighlighted) {		// set the appropriate borders
				searchDiv.removeClass('searchControlsBorderPlain');
				cardDiv.removeClass('matchResultsBorderPlain');
				searchDiv.addClass('searchControlsBorderHighlight');
				cardDiv.addClass('matchResultsBorderHighlight');
			}
			else {
				searchDiv.removeClass('searchControlsBorderHighlight');
				cardDiv.removeClass('matchResultsBorderHighlight');
				searchDiv.addClass('searchControlsBorderPlain');
				cardDiv.addClass('matchResultsBorderPlain');
			}

			if (visualInfo.spec.searchState === 'init') {
				// append a 'search results here' div
				var searchEntitiesDiv = $('<div></div>');
				searchEntitiesDiv.addClass('emptyMatchBackground');
				searchEntitiesDiv.html('Search Accounts');
				searchEntitiesDiv.width(_renderDefaults.MATCHCARD_WIDTH);
				searchEntitiesDiv.css('height', _renderDefaults.SEARCH_RESULT_HEIGHT);
				cardDiv.append(searchEntitiesDiv);
			} else if (visualInfo.spec.searchState === 'searching') {
				var searchingDiv = $('<div></div>');
				searchingDiv.addClass('emptyMatchBackground');
				searchingDiv.width(_renderDefaults.MATCHCARD_WIDTH);
				searchingDiv.css('height', _renderDefaults.SEARCH_RESULT_HEIGHT);
				searchingDiv.css('background', constants.AJAX_SPINNER_BG);
				cardDiv.append(searchingDiv);
				aperture.pubsub.publish(flowChannel.SET_SEARCH_PAGE_REQUEST, {
                    xfId: visualInfo.xfId,
                    page: 0,
                    noRender: true
                });
			} else {
				var childUIObjects = visualInfo.children;
				if ( childUIObjects.length > 0 ) {
					cardDiv.css('height','auto');

					_processChildren(childUIObjects, cardDiv, visualInfo.minIdx, visualInfo.maxIdx);

					var searchPagingControlDiv = $('<div class="searchPagingControls"></div>');

					var searchPagingLabel =$('<div class="searchResultCount"></div>');
					searchPagingLabel.html(_getPageString(visualInfo));
					searchPagingLabel.css('height', _renderDefaults.SEARCH_RESULT_COUNT_HEIGHT);

					var prevButton = xfUtil.makeButton(null, 'ui-icon-carat-1-w', null, 'prevPageButton', null).click(function() {
						aperture.pubsub.publish(appChannel.PREV_SEARCH_PAGE_REQUEST, {xfId : visualInfo.xfId});
					});
					xfUtil.makeTooltip(prevButton, 'display previous page of search results');

					var nextButton = xfUtil.makeButton(null, 'ui-icon-carat-1-e', null, 'nextPageButton', null).click(function() {
						aperture.pubsub.publish(appChannel.NEXT_SEARCH_PAGE_REQUEST, {xfId : visualInfo.xfId});
					});
					xfUtil.makeTooltip(nextButton, 'display next page of search results');

					searchPagingControlDiv.append(prevButton);
					searchPagingControlDiv.append(searchPagingLabel);
					searchPagingControlDiv.append(nextButton);

					cardDiv.append(searchPagingControlDiv);
				} else {
					var noEntitiesDiv = $('<div></div>');
					noEntitiesDiv.addClass('emptyMatchBackground');
					noEntitiesDiv.html('No Results Found');
					noEntitiesDiv.width(_renderDefaults.MATCHCARD_WIDTH);
					noEntitiesDiv.css('height', _renderDefaults.SEARCH_RESULT_HEIGHT);
					cardDiv.append(noEntitiesDiv);
				}


			}

			initStyling(canvas);

			return canvas;
		};

		//--------------------------------------------------------------------------------------------------------------

		matchRenderer.getRenderDefaults = function(){
			return _renderDefaults;
		};

		//--------------------------------------------------------------------------------------------------------------

		return matchRenderer;
	}
);
