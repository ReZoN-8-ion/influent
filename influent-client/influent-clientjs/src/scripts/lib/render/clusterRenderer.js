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
		'lib/communication/applicationChannels', 'lib/util/xfUtil', 'lib/render/cardRenderer', 'lib/constants'
	],
	function(
		appChannel, xfUtil, cardRenderer, constants
	) {

		var _renderDefaults = {
			STACK_WIDTH : 3,
			STACK_COUNT : 3,
			CLIP_LEADER_OFFSET : 8
		};
		_renderDefaults.EXPANDED_PADDING_BOTTOM = (_renderDefaults.STACK_COUNT-1)+_renderDefaults.STACK_COUNT;
		var _cardDefaults = cardRenderer.getRenderDefaults();
		var clusterRenderer = {};

		// Private Functions ------------------------------------------------------------------------------

		// we don't indent expanded clusters for viz reasons, but that means then that
		// their leaders need to stack up off to the side. a top level expanded
		// cluster will have a bigger gap between its leader and itself.
		var _updateLeaders = function(state) {
			var root = state.canvas.parents('.clusterExpanded').last();
			var strata;
			var left = -_renderDefaults.CLIP_LEADER_OFFSET;

			// find starting left point based on depth of tree
			for (strata = root; strata.length; strata = strata.children('.clusterExpanded')) {
				left -= _renderDefaults.CLIP_LEADER_OFFSET;
			}
			// then actually apply the positions
			for (strata = root; strata.length; strata = strata.children('.clusterExpanded')) {
				strata.children('.clusterBracket').css('left',  left+ 'px');
				left += _renderDefaults.CLIP_LEADER_OFFSET;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createFaceElement = function(visualInfo, state){
			state.canvas.addClass('clusterContainer');
			state.canvas.width(_cardDefaults.CARD_WIDTH);

			// create the stack
			var stackCards = [];
			var left = (_renderDefaults.STACK_COUNT-1) * _renderDefaults.STACK_WIDTH;
			var top = 0;
			var i = 0;
			for (i = 0; i < _renderDefaults.STACK_COUNT-1; i++) {
				var stackElement = $('<div></div>');
				stackElement.width(_cardDefaults.CARD_WIDTH);
				stackElement.height(_cardDefaults.CARD_HEIGHT);
				stackElement.addClass('stackElement');
				stackElement.css('position','absolute');
				stackElement.css('top',top);
				stackElement.css('left',left);

				left -= _renderDefaults.STACK_WIDTH;
				top += _renderDefaults.STACK_WIDTH;
				state.canvas.append(stackElement);
				stackCards.push(stackElement);
			}

			// Create the face card of the cluster.
			var faceElement = cardRenderer.renderElement(visualInfo);
			faceElement.css('top', top);
			state.canvas.append(faceElement);
			// Resize the stacked cards to be the same as the face card.
			for (i = 0; i < stackCards.length; i++) {
				stackCards[i].height( faceElement.height() );
			}

			// insert clip decorator
			if (visualInfo.UIType === constants.MODULE_NAMES.IMMUTABLE_CLUSTER ||
				visualInfo.UIType === constants.MODULE_NAMES.MUTABLE_CLUSTER
			) {
				var clipContainer = $('<div class="clipContainer"></div>');
				xfUtil.makeTooltip(clipContainer, 'Unstack ' + state.spec.label, 'unstack cards');
				clipContainer.click(function() {
					aperture.pubsub.publish(
						appChannel.EXPAND_EVENT,
						{
							xfId : visualInfo.xfId
						}
					);
					return true;
				});
				state.canvas.append(clipContainer);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createExpansionElements = function(visualInfo, state) {
			state.canvas.addClass('clusterExpanded');

			// Add a margin div that will contract on click
			var marginDiv = $(document.createElement('div'));
			xfUtil.makeTooltip(marginDiv, 'Restack ' + state.spec.label, 'restack cards');
			marginDiv.addClass('clusterBracket');
			marginDiv.append($('<div class="clusterBracketClip"></div>'));
			state.canvas.append(marginDiv);
			// Add the listener for collapsing the cluster.
			marginDiv.click(function() {
				aperture.pubsub.publish(appChannel.COLLAPSE_EVENT, {xfId : visualInfo.xfId});
				return false;   // prevents click handler on card from firing and re-expanding
			});

			// Adjust parent leader positions as needed.
			_updateLeaders(state);

			state.canvas.css('height','auto');

			return false;   // prevents click handler on card from firing and re-expanding
		};

		//--------------------------------------------------------------------------------------------------------------

		var _processChildren = function(childObjects, parentCanvas){
			var childCount = childObjects.length;
			for (var i=0; i < childCount; i++){
				var visualInfo = childObjects[i].getVisualInfo();
				var element = null;
				var objectType = childObjects[i].getUIType();
				switch(objectType){
					case constants.MODULE_NAMES.IMMUTABLE_CLUSTER :
					case constants.MODULE_NAMES.MUTABLE_CLUSTER :
					case constants.MODULE_NAMES.SUMMARY_CLUSTER : {
						element = _renderElement(visualInfo, parentCanvas);
						break;
					}
					case constants.MODULE_NAMES.ENTITY : {
						element = cardRenderer.renderElement(visualInfo);
						parentCanvas.append(element);
						break;
					}
					default : {
						aperture.log.error('Attempted to add an unsupported UIObject type to column');
					}
				}
				if (element){
					element.addClass('clusterSubElement');
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _initElement = function(visualInfo, canvas){
			// Initialize the drag/drop logic.
			if (canvas.hasClass('influentDraggable')) {
				canvas.draggable('destroy');
			}
			canvas.influentDraggable({
				revert: 'invalid',
				opacity: 0.7,
				cursor: 'move',
				stack: '.fileContainer'
			});

			canvas.data('xfId', visualInfo.xfId);
			// We need to pass the count value in so that on
			// drop, if the 'count' value is greater than the
			// threshold value, we can notify the user that
			// flattening this cluster may take a while.
			canvas.data('clusterCount', visualInfo.spec.count);
			canvas.data('entityType', visualInfo.spec.type);
			canvas.data('parent', visualInfo.spec.parent);

			// If this card is an immediate child of a column, we need
			// to add a left offset to ensure all the cards in a
			// column align.
			if (visualInfo.spec.parent.getUIType() === constants.MODULE_NAMES.COLUMN){
				canvas.css('left', _renderDefaults.CARD_LEFT);
			}

			canvas.css('padding-bottom', _renderDefaults.EXPANDED_PADDING_BOTTOM);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _renderElement = function(visualInfo, parentCanvas, updateOnly) {
			var spec = visualInfo.spec;
			// Add a suffix of "_cluster" so that we can differentiate
			// between the cluster's container, and the face card
			// the represents a collapsed cluster.
			var canvas = $('#' + visualInfo.xfId + '_cluster');

			if (updateOnly) {
				if (!visualInfo.isExpanded) {
					cardRenderer.renderElement(visualInfo, updateOnly);
				}

				return canvas;
			}

			if (canvas.length > 0) {
				canvas.empty();
			} else {
				canvas = $('<div></div>');
				canvas.attr('id', visualInfo.xfId + '_cluster');
			}

			if (visualInfo.isHidden) {
				return canvas;
			}

			_initElement(visualInfo, canvas);

			var _instanceState = {
				xfId: visualInfo.xfId,
				spec: _.clone(spec),
				canvas: canvas
			};

			// parent before processing children so that children can climb ancestry for leaders.
			if (parentCanvas) {
				parentCanvas.append(canvas);
			}

			// Check if the card is expanded, if it is we
			// need to process it's children and change it's visuals.
			// create all the cards for memberIds
			if (visualInfo.isExpanded) {
				_createExpansionElements(visualInfo, _instanceState);
				// create all the cards for memberIds
				var childUIObjects = visualInfo.children;
				if (childUIObjects.length > 0) {
					_processChildren(childUIObjects, canvas);
				}
			}
			// The cluster is not expanded so we only need to draw
			// the visuals for its face card and the stacked card
			// elements.
			else {
				_createFaceElement(visualInfo, _instanceState);
			}

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
				stop: function (e) {
					canvas.removeClass('is-dragged');
					// Prevent a click from propagating after releasing the drag operation
					$(e.toElement).one('click', function (e) {
						e.stopImmediatePropagation();
					});
				}
			});

			return canvas;
		};

		// Public Functions ------------------------------------------------------------------------------

		clusterRenderer.renderElement = _renderElement;
		clusterRenderer.getRenderDefaults = function(){
			return _renderDefaults;
		};
		return clusterRenderer;
	}
);
