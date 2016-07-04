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
		'lib/module', 'lib/communication/applicationChannels', 'lib/util/xfUtil', 'lib/render/toolbarRenderer', 'lib/ui/toolbarOperations',
		'lib/constants', 'underscore'
	],
	function(
		module, appChannel, xfUtil, toolbarRenderer, toolbarOperations,
		constants
	) {

		var CARD_WIDTH = 150,
			MARGIN = 5,
			ICON_WIDTH = 24;

		var _renderDefaults = {
			CARD_WIDTH          : CARD_WIDTH,
			CARD_HEIGHT         : 120,
			CARD_SPACING        : 2,
			CARD_LEFT           : 7,
			MARGIN              : MARGIN,
			ICON_MARGIN         : 0,
			ICON_WIDTH          : ICON_WIDTH,
			ICON_HEIGHT         : 25,
			SCORE_BAR_WIDTH     : ICON_WIDTH,
			SCORE_BAR_HEIGHT    : 4,
			ELEMENT_PADDING     : 2,
			GRAPH_HEIGHT        : 60,
			GRAPH_WIDTH         : CARD_WIDTH - (MARGIN * 2),
			LINE_HEIGHT         : 16,
			BORDER_WIDTH        : 1
		};

		//------------------------------------------------------------------------------------------------------------------
		// Private Functions
		//------------------------------------------------------------------------------------------------------------------

		var _insertIcon = function(container, top, left, imgUrl, score, title) {

			// create a div to contain both image and score bar
			var iconContainer = $('<div></div>');
			container.append(iconContainer);
			iconContainer.addClass('iconContainer');
			iconContainer.width(_renderDefaults.ICON_WIDTH);
			iconContainer.height(_renderDefaults.ICON_HEIGHT + _renderDefaults.ELEMENT_PADDING + _renderDefaults.SCORE_BAR_HEIGHT);
			iconContainer.css('top',top);
			iconContainer.css('left',left);

			// Insert image into icon container
			var imageContainer = $('<div></div>');
			imageContainer.addClass('cardIconBlock');
			if (imgUrl.substr(0,6) === 'class:') {
				imageContainer.addClass('cardFontIcon');
				$('<span></span>').addClass(imgUrl.substr(6)).appendTo(imageContainer);
			} else {
				imageContainer.css('background-image', 'url("'+ imgUrl+ '")');
			}
			xfUtil.makeTooltip(imageContainer, title, 'card icon');
			iconContainer.append(imageContainer);

			//var imageContainer = $('<img/>');
			//imageContainer.attr('src', imgUrl);
            //xfUtil.makeTooltip(imageContainer, title, 'card icon');
			//iconContainer.append(imageContainer);

			// Create a bar chart based on score
			if ( score != null ) {
				var scoreBarBackground = $('<div></div>');
				iconContainer.append(scoreBarBackground);
				scoreBarBackground.addClass('scoreBarBackground');
				scoreBarBackground.width(_renderDefaults.SCORE_BAR_WIDTH);
				scoreBarBackground.height(_renderDefaults.SCORE_BAR_HEIGHT);
				scoreBarBackground.css('top', _renderDefaults.ICON_HEIGHT + _renderDefaults.ELEMENT_PADDING);

				if ( score > 0) {
					var scoreBarForeground = $('<div></div>');
					iconContainer.append(scoreBarForeground);
					scoreBarForeground.addClass('scoreBarForeground');
					scoreBarForeground.width((_renderDefaults.SCORE_BAR_WIDTH -1) * score); // leave a pixel to the right always as a hint that it's a proportion
					scoreBarForeground.height(_renderDefaults.SCORE_BAR_HEIGHT);
					scoreBarForeground.css('top', _renderDefaults.ICON_HEIGHT + _renderDefaults.ELEMENT_PADDING); // +1 for background border thickness
				}
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _insertLabel = function(container, top, left, text) {
			var textNodeContainer = $('<div></div>');
			container.append(textNodeContainer);
			textNodeContainer.addClass('textNodeContainer');
			textNodeContainer.css('top',top);
			textNodeContainer.css('left',left);
			textNodeContainer.width( _renderDefaults.CARD_WIDTH - 2*_renderDefaults.MARGIN );
			textNodeContainer.append(document.createTextNode(text));
            xfUtil.makeTooltip(textNodeContainer, text, 'card label');
			return _getLineHeight();
		};

		//------------------------------------------------------------------------------------------------------------------

		var _insertGraph = function(top,left, parentCanvas) {
			var graphContainer = $('<div></div>');
			parentCanvas.append(graphContainer);
			graphContainer.width(_renderDefaults.GRAPH_WIDTH);
			graphContainer.height(_renderDefaults.GRAPH_HEIGHT);
			graphContainer.css('position', 'absolute');
			graphContainer.css('top',top);
			graphContainer.css('right', MARGIN);
			graphContainer.addClass('graphContainer');

			return graphContainer;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _getLineHeight = function() {
			// TODO: can this be measured based on font properties in the class?
			return _renderDefaults.LINE_HEIGHT;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _getCardHeight = function(showDetails){
			return showDetails?_renderDefaults.CARD_HEIGHT : _renderDefaults.CARD_HEIGHT - _renderDefaults.GRAPH_HEIGHT;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _updateChartVisual = function(visualInfo, state) {
			var showDetails = visualInfo.showDetails;
			if (!showDetails) {
				if (state.detailsNodeContainer != null) {
					state.detailsNodeContainer.hide();
				}
				if (state.graphContainer != null ) {
					state.graphContainer.hide();
				}
				state.canvas.css('max-height', _renderDefaults.CARD_HEIGHT-_renderDefaults.GRAPH_HEIGHT);
			}
			else {
				if (state.graphContainer != null ) {
					state.graphContainer.show();
				}
				state.canvas.css('max-height', 'none');
				if (state.detailsNodeContainer != null) {
					state.detailsNodeContainer.show();
				}

			}
			state.canvas.height(_getCardHeight(showDetails));
		};

		//------------------------------------------------------------------------------------------------------------------

		var _updateCardSelection = function(visualInfo, state){
			var isSelected = visualInfo.isSelected;
			if (isSelected){
				state.bordered.addClass('selectedContainer');
			}
			else {
				state.bordered.removeClass('selectedContainer');
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _updateCardHighlight = function(isHighlighted, state) {
			if (isHighlighted) {
				state.bordered.addClass('highlightedContainer');
			} else {
				state.bordered.removeClass('highlightedContainer');
			}
		};

		//------------------------------------------------------------------------------------------------------------------
		/**
		 * Updates the duplicate count decorator of an xfCard.
		 * @param visualInfo
		 * @param state
		 * @private
		 */
		var _updateDuplicateCount = function(visualInfo, state) {
			var container = state.outerContainer;
			var count = visualInfo.spec.duplicateCount;
			var dupDiv = $('.duplicateCount', container);

			if (count > 1) {
				var text = 'x' + count;

				// add?
				if (dupDiv.length === 0) {
					dupDiv = $('<div class="duplicateCount"></div>').prependTo(container);
					$('<div class="duplicateCountText"></div>').appendTo(dupDiv).html(text);

					// update?
				} else {
					$('.duplicateCountText', dupDiv).html(text);
				}
			} else {
				// remove
				dupDiv.remove();
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _updateClusterCountIfNecessary = function(visualInfo, state) {

			state.clusterCount = null;

			if (visualInfo.spec.hasOwnProperty('count')) {
				var count = visualInfo.spec.count;

				if (count > 0) {
					var tdCount = $('<div class="clusterSize"></div>');
					tdCount.html(count);

					state.clusterCount = tdCount;
				}
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _constructCard = function(visualInfo, state) {

			state.canvas.addClass('baseballcardContainer');
			state.canvas.addClass(aperture.palette.parchmentClass(state.spec.confidenceInSrc, state.spec.confidenceInAge));
			state.canvas.width(_renderDefaults.CARD_WIDTH);

			var top = _renderDefaults.MARGIN;

			state.spinnerContainer.css('position','absolute');
			state.spinnerContainer.css('top', top);
			state.spinnerContainer.css('left', _renderDefaults.MARGIN);
			state.spinnerContainer.css('background', constants.AJAX_SPINNER_BG);
			state.spinnerContainer.width(_renderDefaults.CARD_WIDTH);
			state.spinnerContainer.height(_getCardHeight(visualInfo.showDetails));

			// parse icon list
			var iconList = state.spec['icons'];
			var icon;
			var iconX = _renderDefaults.ICON_MARGIN;

			state.iconContainer = _getStateElement(state, '.iconRow');
			if ( state.iconContainer == null) {
				state.iconContainer = $('<div></div>');
				state.iconContainer.addClass('iconRow');
				state.iconContainer.css('position','absolute');
				state.iconContainer.css('top',top);
				state.iconContainer.css('left',_renderDefaults.MARGIN);
				state.outerContainer.append(state.iconContainer);
			} else {
				state.iconContainer.css('top',top);
				state.iconContainer.empty();
			}

			if (iconList) {

				var iconClassOrder = aperture.config.get()['influent.config'].iconOrder;
				var iconClassMap = aperture.config.get()['influent.config'].iconMap;

				var visualIcons = {};
				var i = 0;
				
				for (i = 0; i < iconClassOrder.length; i++) {
					var iconClass = iconClassOrder[i];
					if (iconClassMap[iconClass]) {
						var iconLimit = iconClassMap[iconClass].limit || Number.MAX_VALUE;
						if (iconLimit > 0) {
							var iconCount = 0;
							for (var j = 0; j < iconList.length; j++) {
								icon = iconList[j];
								if (icon.type === iconClass) {
									if (visualIcons.hasOwnProperty(iconClass)) {
										visualIcons[iconClass].push(icon);
									} else {
										visualIcons[iconClass] = [icon];
									}
									iconCount++;
								}
								if (iconCount === iconLimit) {
									break;
								}
							}
						}
					}
				}

				var totalLimit =  4 - _.keys(visualIcons).length + 1;

				for (var iconType in visualIcons) {
					if (visualIcons.hasOwnProperty(iconType)) {
						iconList = visualIcons[iconType];
						for (i = 0; i < iconList.length && i < totalLimit; i++) {
							icon = iconList[i];
							_insertIcon(state.iconContainer, 0, iconX, icon.imgUrl, icon.score, icon.title);
							iconX += _renderDefaults.ICON_WIDTH + _renderDefaults.ELEMENT_PADDING;
						}
					}

				}

				top += _renderDefaults.ICON_HEIGHT + _renderDefaults.SCORE_BAR_HEIGHT + _renderDefaults.ELEMENT_PADDING;
			}

			_updateClusterCountIfNecessary(visualInfo, state);
			if (state.clusterCount != null) {
				state.outerContainer.append(state.clusterCount);
			}

			// Create summary text components.
			var label = visualInfo.spec.label;

			// append cluster count to face card
			if (visualInfo.spec.count && visualInfo.spec.count > 1) {
				label += ' (+' + (visualInfo.spec.count - 1) + ')';
			}

			var textNodeY = 0;

			state.labelContainer = _getStateElement(state, '.labelContainer');
			if (state.labelContainer == null ) {
				state.labelContainer = $('<div></div>');
				state.labelContainer.addClass('labelContainer');
				state.labelContainer.css('position','absolute');
				state.labelContainer.css('top',top);
				state.labelContainer.css('left',_renderDefaults.MARGIN);
				state.outerContainer.append(state.labelContainer);
			} else {
				state.labelContainer.css('top',top);
				state.labelContainer.empty();
			}

			textNodeY += _insertLabel(state.labelContainer, textNodeY, 0, label);
			top += textNodeY + _renderDefaults.ELEMENT_PADDING;


			state.graphContainer = _getStateElement(state, '.graphContainer');
			if (state.graphContainer == null) {
				state.graphContainer = _insertGraph(top, _renderDefaults.MARGIN, state.outerContainer);
			}
			state.graphContainer.css('top',top);

			top += _renderDefaults.GRAPH_HEIGHT;

			// Update visuals.
			_updateChartVisual(visualInfo, state);

			// Update selection.
			_updateCardSelection(visualInfo, state);

			// Update highlight
			_updateCardHighlight(visualInfo.isHighlighted, state);

			// Update duplicate count
			_updateDuplicateCount(visualInfo, state);
		};

		//------------------------------------------------------------------------------------------------------------------

		var _selectHandler = function(event, bSelect, xfId) {
			if ( bSelect ) {
				// Notify the UIObject that it has been clicked.
				aperture.pubsub.publish(appChannel.SELECTION_CHANGE_REQUEST, {
					xfId : xfId,
					selected : bSelect,
					clickEvent: event
				});
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _getStateElement = function(state, selector){
			var element = state.outerContainer.children(selector).first();
			return (element.length === 0)?null:element;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _initElement = function(visualInfo, canvas){
			canvas.css('position', 'relative');
			canvas.css('border-width', _renderDefaults.BORDER_WIDTH);
			canvas.css('margin-bottom', _renderDefaults.CARD_SPACING);

			// Required for drag and drop code.
			canvas.data('xfId', visualInfo.xfId);
			canvas.data('entityType', visualInfo.spec.type);
		};

		//------------------------------------------------------------------------------------------------------------------
		// Public Functions
		//------------------------------------------------------------------------------------------------------------------

		var cardRenderer = {};
		cardRenderer.renderElement = function(visualInfo, updateOnly) {
			var spec = visualInfo.spec;
			var canvas = $('#' + visualInfo.xfId);
			var outerContainer;
			var spinnerContainer;

			if (!updateOnly) {

				if (canvas.length === 0) {
					canvas = $('<div></div>');
					canvas.attr('id', visualInfo.xfId);
					outerContainer = $('<div class="insideBaseballCard"></div>');
					outerContainer.attr('id', 'outerContainer_' + visualInfo.xfId);
					spinnerContainer = $('<div></div>');
					spinnerContainer.attr('id', 'spinnerContainer_' + visualInfo.xfId);
					canvas.append(outerContainer);
					canvas.append(spinnerContainer);
				}
				else {

					// Remove any existing listeners.
					xfUtil.clearMouseListeners(canvas, ['click', 'mouseover']);
					outerContainer = $(canvas).find('#' + 'outerContainer_' + visualInfo.xfId);
					spinnerContainer = $(canvas).find('#' + 'spinnerContainer_' + visualInfo.xfId);
				}

				_initElement(visualInfo, canvas);

				var _instanceState = {
					xfId: visualInfo.xfId,
					canvas: canvas,
					spec: _.clone(spec),
					dupDiv: undefined,
					outerContainer: outerContainer,
					bordered: canvas.add(outerContainer),
					spinnerContainer: spinnerContainer,
					labelContainer: undefined,
					detailsNodeContainer: undefined,
					iconContainer: undefined,
					graphContainer: undefined
				};

				if (visualInfo.UIType !== constants.MODULE_NAMES.IMMUTABLE_CLUSTER &&
					visualInfo.UIType !== constants.MODULE_NAMES.MUTABLE_CLUSTER &&
					visualInfo.UIType !== constants.MODULE_NAMES.SUMMARY_CLUSTER
					) {
					if (canvas.hasClass('influentDraggable')) {
						canvas.draggable('destroy');
					}
					canvas.influentDraggable({
						revert: 'invalid',
						opacity: 0.7,
						cursor: 'move',
						stack: '.fileContainer',
						start: function () {
							canvas.addClass('is-dragged');
							canvas.data('origPosition', canvas.position());
						},
						stop: function () {
							canvas.removeClass('is-dragged');
						}
					});
				}

				_constructCard(visualInfo, _instanceState);

				var onSingleClick = function (event) {
					var selectionState = !visualInfo.isSelected;
					_selectHandler(event, selectionState, visualInfo.xfId);
					return selectionState;
				};

				canvas.clickAndDblClick(onSingleClick,

					// dblclick
					function () {
						// If it's not a cluster, go to the details for this entity, otherwise expand the cluster
						if (visualInfo.UIType === constants.MODULE_NAMES.IMMUTABLE_CLUSTER ||
							visualInfo.UIType === constants.MODULE_NAMES.MUTABLE_CLUSTER) {

							aperture.pubsub.publish(
								appChannel.EXPAND_EVENT,
								{
									xfId: visualInfo.xfId
								}
							);
						} else if (visualInfo.UIType === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
							onSingleClick();
						}
					}
				);

				canvas.mouseover(function () {
					aperture.pubsub.publish(appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST, {
						xfId: visualInfo.xfId
					});

					return false;
				});
			} else {
				outerContainer = $(canvas).find('#' + 'outerContainer_' + visualInfo.xfId);
			}


			if (visualInfo.isHidden) {
				canvas.hide();
			} else {
				canvas.show();
			}

			if (visualInfo.isHovered ||
				visualInfo.spec.leftOperation === toolbarOperations.WORKING ||
				visualInfo.spec.rightOperation === toolbarOperations.WORKING
			) {
				toolbarRenderer.createControls(visualInfo, outerContainer, _getCardHeight(visualInfo.showDetails));
				toolbarRenderer.showControls(outerContainer);
			} else {
				toolbarRenderer.hideControls(outerContainer);
			}

			spinnerContainer = canvas.find('[id^="spinnerContainer_"]');
			if (visualInfo.showSpinner){
				outerContainer.hide();
				spinnerContainer.show();
			}
			else {
				spinnerContainer.hide();
			}

			// Enable/disable graph
			var graphContainer = canvas.find('.graphContainer');
			var graphUrl = xfUtil.getSafeURI(spec['graphUrl']);
			if (graphUrl) {
				graphContainer.css('background', 'url("' + graphUrl + '") no-repeat center center');
			} else {
				graphContainer.css('background', constants.AJAX_SPINNER_BG);
			}


			return canvas;
		};

		//------------------------------------------------------------------------------------------------------------------

		cardRenderer.getRenderDefaults = function() {
			return _.clone(_renderDefaults);
		};

		//------------------------------------------------------------------------------------------------------------------

		cardRenderer.getCardHeight = _getCardHeight;

		//------------------------------------------------------------------------------------------------------------------

		return cardRenderer;
	}
);
