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
		'lib/communication/applicationChannels', 'lib/module', 'lib/render/workspaceRenderer', 'lib/render/columnRenderer', 'lib/render/cardRenderer',
		'lib/render/fileRenderer', 'lib/render/matchRenderer', 'lib/render/clusterRenderer',
		'lib/constants', 'underscore'
	],
	function(
		appChannel, modules, workspaceRenderer, columnRenderer, cardRenderer,
		fileRenderer, matchRenderer, clusterRenderer,
		constants
	) {
		var _cardDefaults = cardRenderer.getRenderDefaults();
		var _fileDefaults = fileRenderer.getRenderDefaults();
		var _matchDefaults = matchRenderer.getRenderDefaults();
		var _clusterDefaults = clusterRenderer.getRenderDefaults();
		var _columnDefaults = columnRenderer.getRenderDefaults();

		var _layoutState = {
			positionMap : {}
		};

		var _resetLayoutState = function(){
			_layoutState.positionMap = {};
		};

		//------------------------------------------------------------------------------------------------------------------

		var _constructPositionMap = function(columns){
			var originX = 0;
			for (var i=0; i < columns.length; i++){
				var columnObj = columns[i];
				var originY = _getColumnVerticalOffset(columnObj.getXfId());
				_processUIObject(columnObj, i, originY, originX);
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _processMatchcard = function(matchUIObject, top, left, colIndex, originX){
			var matchInfo = matchUIObject.getVisualInfo();

			// Store the height of the card before processing its children.
			_layoutState.positionMap[matchInfo.xfId] = {
				top : top,
				left : left
			};
			// Get the height contributed by the search controls.
			top += _matchDefaults.CONTAINER_PADDING_TOP;
			var searchCanvas = $('#' + matchInfo.xfId).children('.searchControls').first();
			if (searchCanvas.length > 0){
				top += searchCanvas.height() + _matchDefaults.SEARCH_CTRL_PADDING_TOP
					+ _matchDefaults.SEARCH_CTRL_PADDING_BOTTOM;
			}
			if(matchInfo.children.length !== 0){
				top +=  _matchDefaults.SEARCH_RESULT_PADDING_TOP;
				top = _processUIObject(matchUIObject, colIndex, top, originX); // Add the height of the search results.
				top += _matchDefaults.SEARCH_RESULT_COUNT_HEIGHT;
			}
			else {
				top += _matchDefaults.SEARCH_RESULT_HEIGHT;
			}
			top += _matchDefaults.CONTAINER_PADDING_BOTTOM;
			return top;
		};

		//------------------------------------------------------------------------------------------------------------------

		/*
		 * Create a map of all the uiObjects contained in
		 * the set of columns. The map will contain
		 * calculated positions for all the uiObjects.
		 * @param columns
		 */
		var _processUIObject = function(parentObject, colIndex, top, originX){
			var left = colIndex * _columnDefaults.COLUMN_DISTANCE + originX;
			var parentVisualInfo = parentObject.getVisualInfo();
			_layoutState.positionMap[parentVisualInfo.xfId] = {
				top : top,
				left : left
			};

			var startIndex = 0;
			var endIndex;
			if (parentVisualInfo.UIType === constants.MODULE_NAMES.MATCH) {
				startIndex = parentVisualInfo.minIdx;
				endIndex = Math.min(parentVisualInfo.maxIdx, parentVisualInfo.children.length);
			} else {
				endIndex = parentVisualInfo.children.length;
			}

			for (var i=startIndex; i < endIndex; i++){
				var childObj = parentVisualInfo.children[i];
				var objectType = childObj.getUIType();
				var visualInfo = childObj.getVisualInfo();
				var uiObjectHeight = 0;
				var uiObjectLeft = left;
				var clusterStackHeight = (_clusterDefaults.STACK_COUNT-1)*_clusterDefaults.STACK_WIDTH;

				// Skip links to/from hidden objects
				if (visualInfo.isHidden) {
					continue;
				}

				switch (objectType){
					case constants.MODULE_NAMES.FILE : {
						// Store the height of the card before processing its children.
						_layoutState.positionMap[visualInfo.xfId] = {
							top : top,
							left : uiObjectLeft
						};

						top += _fileDefaults.HEADER_HEIGHT;

						// Process the internal cluster object.
						var fileBodyHeight = null;
						if (visualInfo.clusterUIObject != null){

							_layoutState.positionMap[visualInfo.clusterUIObject.getXfId()] = {
								top : top,
								left : uiObjectLeft
							};

							if (visualInfo.clusterUIObject.isExpanded()){
								fileBodyHeight = _processUIObject(visualInfo.clusterUIObject, colIndex, top, originX) + _clusterDefaults.EXPANDED_PADDING_BOTTOM;
								top = fileBodyHeight +
									_fileDefaults.FOOTER_HEIGHT +
									_fileDefaults.MARGIN_BOTTOM;
							}
						}

						if (fileBodyHeight == null) {
							fileBodyHeight = cardRenderer.getCardHeight(visualInfo.showDetails) +
								2*(_cardDefaults.BORDER_WIDTH) +
								_cardDefaults.CARD_SPACING +
								clusterStackHeight;
							top += fileBodyHeight +
								_fileDefaults.FOOTER_HEIGHT +
								_fileDefaults.MARGIN_BOTTOM;
						}

						// Process the xfMatch object.
						if (visualInfo.matchUIObject != null){
							top = _processMatchcard(visualInfo.matchUIObject, top, uiObjectLeft, colIndex, originX);
						}
						break;
					}
					case constants.MODULE_NAMES.MATCH : {
						top = _processMatchcard(childObj, top, uiObjectLeft, colIndex, originX);
						break;
					}
					case constants.MODULE_NAMES.IMMUTABLE_CLUSTER:
					case constants.MODULE_NAMES.MUTABLE_CLUSTER:
					case constants.MODULE_NAMES.SUMMARY_CLUSTER: {
						// If the cluster is expanded, process it's children.
						if (childObj.isExpanded()){
							top = _processUIObject(childObj, colIndex, top, originX) + clusterStackHeight;
						}
						else {
							uiObjectHeight = cardRenderer.getCardHeight(visualInfo.showDetails)
								+ 2*(_cardDefaults.BORDER_WIDTH) + _cardDefaults.CARD_SPACING +
								clusterStackHeight;
						}
						uiObjectLeft += _cardDefaults.CARD_LEFT;
						break;
					}
					case constants.MODULE_NAMES.ENTITY : {
						uiObjectHeight = cardRenderer.getCardHeight(visualInfo.showDetails)
							+ 2*(_cardDefaults.BORDER_WIDTH) + _cardDefaults.CARD_SPACING;
						uiObjectLeft += _cardDefaults.CARD_LEFT;
						break;
					}
					default :{
						aperture.log.error('Attempted to process Sankey node positions of an unsupported UIObject type: ' + objectType);
					}
				}
				if (uiObjectHeight > 0){
					_layoutState.positionMap[visualInfo.xfId] = {
						top : top,
						left : uiObjectLeft
					};
					top += uiObjectHeight;
				}
			}
			return top;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _moveUIObject = function(parentObject, offsetY){
			var parentVisualInfo = parentObject.getVisualInfo();
			var position = _layoutState.positionMap[parentObject.getXfId()];
			position.top += offsetY;

			_layoutState.positionMap[parentObject.getXfId()] = position;

			for (var i=0; i < parentVisualInfo.children.length; i++){
				var childObj = parentVisualInfo.children[i];
				var objectType = childObj.getUIType();
				var visualInfo = childObj.getVisualInfo();
				var updatePosition = false;
				switch (objectType){
					case constants.MODULE_NAMES.FILE : {
						// Get the height contributed by the file tab container.
						if (visualInfo.children.length > 0){
							_moveUIObject(childObj, offsetY);
						}
						if (visualInfo.matchUIObject != null){
							_moveUIObject(visualInfo.matchUIObject, offsetY);
						}
						updatePosition = true;
						break;
					}
					case constants.MODULE_NAMES.MATCH : {
						_moveUIObject(childObj, offsetY);
						break;
					}
					case constants.MODULE_NAMES.IMMUTABLE_CLUSTER :
					case constants.MODULE_NAMES.MUTABLE_CLUSTER :
					case constants.MODULE_NAMES.SUMMARY_CLUSTER : {
						// If the cluster is expanded, process it's children.
						if (childObj.isExpanded()){
							_moveUIObject(childObj, offsetY);
						}
						else {
							updatePosition = true;
						}
						break;
					}
					case constants.MODULE_NAMES.ENTITY : {
						updatePosition = true;
						break;
					}
					default :{
						aperture.log.error('Attempted to process Sankey node positions of an unsupported UIObject type: ' + objectType);
					}
				}
				if (updatePosition){
					position = _layoutState.positionMap[childObj.getXfId()];
					position.top += offsetY;
					_layoutState.positionMap[childObj.getXfId()] = position;
				}
			}
			return top;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _getColumnVerticalOffset = function(columnId){
			var top = $(columnId).css('top');
			
			return top? Number(top.replace('px','')) : 0;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _layoutUIObjects = function(data){
			// Clear the position map.
			_resetLayoutState();

			var workspaceObj = data.workspace;
			var columns = workspaceObj.getVisualInfo().children;
			_constructPositionMap(columns);

			return _getPositionMap();
		};

		//------------------------------------------------------------------------------------------------------------------

		var _getPositionMap = function(){
			var clonedMap = {};
			$.extend(true, clonedMap, _layoutState.positionMap);
			return clonedMap;
		};

		//------------------------------------------------------------------------------------------------------------------

		var _removeUIObject = function(uiObject){
			var children = uiObject.getChildren();
			if (!_.isEmpty(children)){
				for (var i=0; i < children.length; i++){
					_removeUIObject(children[i]);
				}
			}
			delete _layoutState.positionMap[uiObject.getXfId()];
		};
		//------------------------------------------------------------------------------------------------------------------
		var xfLayoutProvider = {};
		xfLayoutProvider.processUIObject = _processUIObject;
		xfLayoutProvider.layoutUIObjects = _layoutUIObjects;
		xfLayoutProvider.getPositionMap = _getPositionMap;
		xfLayoutProvider.removeUIObject = _removeUIObject;
		return xfLayoutProvider;
	}
);
