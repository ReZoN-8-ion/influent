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
		'lib/interfaces/xfUIObject', 'lib/communication/applicationChannels', 'lib/util/GUID',
		'lib/models/xfCard', 'lib/models/xfImmutableCluster', 'lib/models/xfMutableCluster',
		'lib/models/xfSummaryCluster', 'lib/constants', 'underscore'
	],
	function(
		xfUIObject, appChannel, guid,
		xfCard, xfImmutableCluster, xfMutableCluster, xfSummaryCluster, constants
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.MATCH;
		var SEARCH_RESULTS_PER_PAGE = aperture.config.get()['influent.config']['searchResultsPerPage'];

		var xfMatchSpecTemplate = {
			parent : {},
			searchTerm : '',
			searchState : 'init',
			searchOperation : 'AND'
		};


		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfMatchModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfMatchModule.createInstance = function(spec){
			var _UIObjectState = {
				xfId : '',
				UIType : MODULE_NAME,
				spec : {},
				children : [],
				totalMatches : 0,
				shownMatches : 0,
				isSearchControlFocused : false,
				isSearchControlHighlighted : false,
				page : 0,
				minIdx : 0,
				maxIdx : SEARCH_RESULTS_PER_PAGE
			};
			//---------------
			// Initialization
			//---------------

			// set the xfId
			_UIObjectState.xfId = 'match_'+guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					_UIObjectState.spec[key] = spec[key];
				}
			}

			// create new object instance
			var xfMatchInstance = {};
			xfUIObject.implementedBy(xfMatchInstance, MODULE_NAME);

			//---------------
			// Private methods
			//---------------

			var _updatePageMinMax = function() {
				var minIdx = _UIObjectState.page * SEARCH_RESULTS_PER_PAGE;
				var maxIdx = (_UIObjectState.page + 1) * SEARCH_RESULTS_PER_PAGE;
				if (maxIdx > _UIObjectState.children.length) {
					maxIdx = _UIObjectState.children.length;
				}
				_UIObjectState.minIdx = minIdx;
				_UIObjectState.maxIdx = maxIdx;
			};

			//---------------
			// Public methods
			//---------------

			xfMatchInstance.clone = function() {

				// create cloned object
				var clonedObject = xfMatchModule.createInstance(_UIObjectState.spec);

				// add cloned children
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					clonedObject.insert(_UIObjectState.children[i].clone());
				}

				// add necessary UI state
				clonedObject.setSearchResultInfo(
					_UIObjectState.totalMatches,
					_UIObjectState.shownMatches,
					_UIObjectState.page,
					_UIObjectState.minIdx,
					_UIObjectState.maxIdx
				);

				// make the cloned object an orphan
				clonedObject.setParent(null);

				// return cloned object
				return clonedObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setShownMatches = function(tm) {
				_UIObjectState.shownMatches = tm;
			};


			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setTotalMatches = function(tm) {
				_UIObjectState.totalMatches = tm;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getDataId = function() {
				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getLabel = function() {
				return 'Match Label';
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getUIObjectByXfId = function(xfId) {
				if (xfId != null && _UIObjectState.xfId === xfId) {
					return xfMatchInstance;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					if(_UIObjectState.children[i] != null) {
						var object = _UIObjectState.children[i].getUIObjectByXfId(xfId);
						if (object != null) {
							return object;
						}
					}
				}

				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getUIObjectsByDataId = function(dataId) {
				var objectList = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var membersList = _UIObjectState.children[i].getUIObjectsByDataId(dataId);
					for (var j = 0; j < membersList.length; j++) {
						objectList.push(membersList[j]);
					}
				}

				return objectList;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getParent = function() {
				return _UIObjectState.spec.parent;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setParent = function(xfUIObj){
				_UIObjectState.spec.parent = xfUIObj;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getLinks = function() {

				var links = {};

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var membersLinksMap = _UIObjectState.children[i].getLinks();
					for (var linkId in membersLinksMap) {
						if (membersLinksMap.hasOwnProperty(linkId)) {
							links[linkId] = membersLinksMap[linkId];
						}
					}
				}

				return links;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.removeLink = function(xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					if (_UIObjectState.children[i].removeLink(xfId)) {
						return true;
					}
				}

				return false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.removeAllLinks = function(linkType) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].removeAllLinks(linkType);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.collapseLinks = function(direction) {
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapseLinks".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.remove = function(eventChannel, dispose) {
				// An event channel argument is required to help enforce that this method should
				// ONLY ever be called from a pubsub type handler.
				if (appChannel.REMOVE_REQUEST === eventChannel){
					_UIObjectState.spec.parent.removeChild(
						_UIObjectState.xfId,
						(dispose != null) ? dispose : true,
						false,
						true
					);
				}
				else {
					aperture.log.error('Invalid or missing publish event. Unable to remove ' + MODULE_NAME + ': ' + _UIObjectState.xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					if (_UIObjectState.children[i].getXfId() === xfId) {

						_UIObjectState.children[i].setParent(null);

						if (disposeObject) {
							_UIObjectState.children[i].dispose();
							_UIObjectState.children[i] = null;
						}
						_UIObjectState.children.splice(i, 1);
						break;
					}
				}

				// If we've deleted the last visible child we should page back if we can
				if (xfMatchInstance.getChildren().length === 0 && _UIObjectState.page > 0) {
					xfMatchInstance.pageLeft();
				}

				// Update the last visible cards charts
				if (xfMatchInstance.getChildren().length !== 0) {
					var newCard = xfMatchInstance.getChildren()[xfMatchInstance.getChildren().length-1];
					if (newCard) {
						aperture.pubsub.publish(appChannel.UPDATE_CHART_REQUEST,
							{
								xfId: newCard.getXfId()
							}
						);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.removeAllChildren = function() {

				if (_UIObjectState.children.length === 0) {
					return;
				}

				// need to purge existing selections before calling dispose() or xfMatch.setSelection will hit NPEs
				var matchChild;
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					matchChild = _UIObjectState.children[i];

					if (matchChild.isSelected()) {
						aperture.pubsub.publish(
							appChannel.SELECTION_CHANGE_REQUEST,
							{
								xfId: null,
								selected : true,
								noRender: true
							}
						);
					} else {

						// Check if any children of the matchChild are selected
						for (var j = 0; j < matchChild.getChildren().length; j++) {
							if (matchChild.getChildren()[j].isSelected()) {
								aperture.pubsub.publish(
									appChannel.SELECTION_CHANGE_REQUEST,
									{
										xfId: null,
										selected : true,
										noRender: true
									}
								);
							}
						}
					}
				}

				for (i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].dispose();
					_UIObjectState.children[i] = null;
				}

				_UIObjectState.children.length = 0;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.update = function(spec) {
				for (var key in spec) {
					if ( spec.hasOwnProperty(key) ) {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.insert = function(xfUIObj, beforeXfUIObj00) {

				if (beforeXfUIObj00 == null) {
					_UIObjectState.children.push(xfUIObj);
				} else {
					var inserted = false;
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						if (_UIObjectState.children[i].getXfId() === beforeXfUIObj00.getXfId()) {
							_UIObjectState.children.splice(i, 0, xfUIObj);
							inserted = true;
							break;
						}
					}
					if (!inserted) {
						_UIObjectState.children.push(xfUIObj);
					}
				}

				xfUIObj.setParent(this);
				xfUIObj.updateToolbar(
					{
						'allowFile'           : false,
						'allowSearch'         : false,
						'allowFocus'          : true,
						'allowClose'          : true
					},
					true
				);

				_updatePageMinMax();
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.showDetails = function(bShow) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].showDetails(bShow);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.showSpinner = function(bShow) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].showSpinner(bShow);
				}
			};

			//----------------------------------------------------------------------------------------------------------
			// This only returns VISIBLE children.   For all children use _UIObjectState.children
			xfMatchInstance.getChildren = function() {
				return _.clone(_UIObjectState.children).slice(_UIObjectState.minIdx, _UIObjectState.maxIdx);
			};

			//----------------------------------------------------------------------------------------------------------
			// Returns an array of all data ids contained in this match card.   Does NOT return just visible ones
			// splitMutableClusters (true) will split out the data ids of any mutable (stacked) cluster into its
			// contained data ids
			xfMatchInstance.getAllDataIds = function(splitMutableClusters) {
				var ids = [];
				if (_UIObjectState.children) {
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						var id = _UIObjectState.children[i].getDataId();
						var pieces = id.split('|');
						if (pieces.length > 1 && splitMutableClusters) {
							for (var j = 1; j < pieces.length; j++) {
								ids.push(pieces[j]);
							}
						} else {
							ids.push(id);
						}
					}
					return ids;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getSpecs = function(bOnlyEmptySpecs) {

				var specs = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					// Only get the dataIds for the cards on the current page.
					if (i === _UIObjectState.maxIdx){
						break;
					}

					if (i >= _UIObjectState.minIdx && i < _UIObjectState.maxIdx){
						var childSpecs = _UIObjectState.children[i].getSpecs(bOnlyEmptySpecs);
						for (var j = 0; j < childSpecs.length; j++) {
							specs.push(childSpecs[j]);
						}
					}
				}

				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setPage = function(newPage) {
				var newMinIdx = newPage * SEARCH_RESULTS_PER_PAGE;
				if ((_UIObjectState.children && newMinIdx < _UIObjectState.children.length && newPage >= 0)||newPage === 0) {
					_UIObjectState.page = newPage;
					_updatePageMinMax();
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.pageLeft = function() {
				if (_UIObjectState.page > 0) {
					_UIObjectState.page--;
					_updatePageMinMax();
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.pageRight = function() {
				var newMinIdx = (_UIObjectState.page+1) * SEARCH_RESULTS_PER_PAGE;
				if (_UIObjectState.children && newMinIdx < _UIObjectState.children.length) {
					_UIObjectState.page++;
					_updatePageMinMax();
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getVisualInfo = function() {
				return _UIObjectState != null ? _.clone(_UIObjectState) : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.highlightId = function(xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].highlightId(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.isSelected = function() {
				// Columns cannot be selected, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "isSelected".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setSelection = function(xfId) {
				// Only visible objects should be considered
				for (var i = _UIObjectState.minIdx; i < Math.min(_UIObjectState.maxIdx, _UIObjectState.children.length); i++) {
					_UIObjectState.children[i].setSelection(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setHovering = function(xfId) {
				// Hovering should only affect visible children
				for (var i = _UIObjectState.minIdx; i < Math.min(_UIObjectState.maxIdx, _UIObjectState.children.length); i++) {
					_UIObjectState.children[i].setHovering(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setHidden = function(xfId, state) {

				for (var i = _UIObjectState.minIdx; i < Math.min(_UIObjectState.maxIdx, _UIObjectState.children.length); i++) {
					_UIObjectState.children[i].setHidden(xfId, state);
				}
			};
			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.isSearchControlFocused = function() {
				return _UIObjectState.isSearchControlFocused;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.isSearchControlHighlighted = function() {
				return _UIObjectState.isSearchControlHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setSearchControlHighlighted = function(isSearchControlHighlighted) {
				if(_UIObjectState.isSearchControlHighlighted !== isSearchControlHighlighted) {
					_UIObjectState.isSearchControlHighlighted = isSearchControlHighlighted;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.expand = function() {
				// Match objects cannot be expanded, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "expand".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.collapse = function() {
				// Match objects cannot be collapsed, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapse".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setDuplicateCount = function(count) {
				// do nothing
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getVisibleDataIds = function() {

				var visibleDataIds = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					// Only get the dataIds for the cards on the current page.
					if (i === _UIObjectState.maxIdx){
						break;
					}

					if (i >= _UIObjectState.minIdx && i < _UIObjectState.maxIdx){
						var childDataId =  _UIObjectState.children[i].getVisibleDataIds();
						for (var j = 0; j < childDataId.length; j++) {
							visibleDataIds.push(childDataId[j]);
						}
					}
				}

				return visibleDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.cleanState = function() {
				_UIObjectState.xfId = '';
				_UIObjectState.UIType = MODULE_NAME;
				_UIObjectState.spec = {};
				_UIObjectState.children = [];
				_UIObjectState.totalMatches = 0;
				_UIObjectState.shownMatches = 0;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.saveState = function() {

				var state = {};

				state['xfId'] = _UIObjectState.xfId;
				state['UIType'] = _UIObjectState.UIType;
				state['totalMatches'] = _UIObjectState.totalMatches;
				state['shownMatches'] = _UIObjectState.shownMatches;

				state['spec'] = {};
				state['spec']['parent'] = _UIObjectState.spec.parent.getXfId();
				state['spec']['searchTerm'] = _UIObjectState.spec.searchTerm;
				state['spec']['searchState'] = _UIObjectState.spec.searchState;

				state['children'] = [];
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					state['children'].push(_UIObjectState.children[i].saveState());
				}

				return state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.restoreVisualState = function(state) {

				_UIObjectState.xfId = state.xfId;
				_UIObjectState.UIType = state.UIType;
				_UIObjectState.totalMatches = state.totalMatches;
				_UIObjectState.shownMatches = state.shownMatches;

				_UIObjectState.spec.searchTerm = state.spec.searchTerm;
				_UIObjectState.spec.searchState = state.spec.searchState;

				_UIObjectState.children = [];
				
				var cardSpec, cardUIObj;
				var summarySpec, summaryUIObj;
				var clusterSpec, clusterUIObj;
				for (var i = 0; i < state.children.length; i++) {
					if (state.children[i].UIType === constants.MODULE_NAMES.ENTITY) {
						cardSpec = xfCard.getSpecTemplate();
						cardUIObj = xfCard.createInstance(cardSpec);
						cardUIObj.cleanState();
						cardUIObj.restoreVisualState(state.children[i]);
						this.insert(cardUIObj, null);
					} else if (state.children[i].UIType === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
						summarySpec = xfSummaryCluster.getSpecTemplate();
						summaryUIObj = xfSummaryCluster.createInstance(summarySpec);
						summaryUIObj.cleanState();
						summaryUIObj.restoreVisualState(state.children[i]);
						this.insert(summaryUIObj, null);
					} else if (state.children[i].UIType === constants.MODULE_NAMES.IMMUTABLE_CLUSTER) {
						clusterSpec = xfImmutableCluster.getSpecTemplate();
						clusterUIObj = xfImmutableCluster.createInstance(clusterSpec);
						clusterUIObj.cleanState();
						clusterUIObj.restoreVisualState(state.children[i]);
						this.insert(clusterUIObj, null);
					} else if (state.children[i].UIType === constants.MODULE_NAMES.MUTABLE_CLUSTER) {
						clusterSpec = xfMutableCluster.getSpecTemplate();
						clusterUIObj = xfMutableCluster.createInstance(clusterSpec);
						clusterUIObj.cleanState();
						clusterUIObj.restoreVisualState(state.children[i]);
						this.insert(clusterUIObj, null);
					} else {
						aperture.log.error(
							'Restoring a child of type ' +
							state.children[i].UIType +
							' but match children should only be of type ' +
							constants.MODULE_NAMES.ENTITY + ', ' +
							constants.MODULE_NAMES.IMMUTABLE_CLUSTER + ', ' +
							constants.MODULE_NAMES.MUTABLE_CLUSTER + ' or ' +
							constants.MODULE_NAMES.SUMMARY_CLUSTER + '.'
						);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.restoreHierarchy = function(state, workspace) {
				_UIObjectState.spec.parent = workspace.getUIObjectByXfId(state.spec.parent);
				for (var i = 0; i < state.children.length; i++) {

					var childState = state.children[i];
					var childObject = workspace.getUIObjectByXfId(childState.xfId);
					childObject.restoreHierarchy(childState, workspace);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.dispose = function() {

				_UIObjectState.spec.parent = null;
				_UIObjectState.spec = null;

				this.removeAllChildren();

				_UIObjectState.children = null;

				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.updatePromptState = function(dataId, state) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].updatePromptState(dataId, state);
				}
			};

			//------------------------------
			// Match Specific Implementation
			//------------------------------

			xfMatchInstance.setSearchTerm = function(searchTerm) {
				_UIObjectState.spec.searchTerm = searchTerm;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setSearchOperation = function(searchOperation) {
				_UIObjectState.spec.searchOperation = searchOperation;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getSearchOperation = function() {
				return _UIObjectState.spec.searchOperation;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getSearchTerm = function() {
				return _UIObjectState.spec.searchTerm;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setSearchState = function(state) {

				if (state !== 'init' &&
					state !== 'searching' &&
					state !== 'results'
				) {
					aperture.log.error(MODULE_NAME + ': Invalid search state requested.');
				}

				_UIObjectState.spec.searchState = state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getSearchState = function() {
				return _UIObjectState.searchState;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.setSearchResultInfo = function(totalMatches, shownMatches, page, minIdx, maxIdx) {
				_UIObjectState.totalMatches = totalMatches;
				_UIObjectState.shownMatches = shownMatches;
				_UIObjectState.page = page;
				_UIObjectState.minIdx = minIdx;
				_UIObjectState.maxIdx = maxIdx;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getIncomingLinks = function() {

				var linkId= null, i;
				var incomingLinks = {};

				for (i = 0; i < _UIObjectState.children.length; i++) {
					// Only get links for cards on the current page.
					if (i === _UIObjectState.maxIdx){
						break;
					}

					if (i >= _UIObjectState.minIdx && i < _UIObjectState.maxIdx){
						var childLinks = _UIObjectState.children[i].getIncomingLinks();
						for (linkId in childLinks) {
							if (childLinks.hasOwnProperty(linkId)) {
								incomingLinks[linkId] = childLinks[linkId];
							}
						}
					}
				}

				return incomingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfMatchInstance.getOutgoingLinks = function() {

				var linkId= null, i;
				var outgoingLinks = {};

				for (i = 0; i < _UIObjectState.children.length; i++) {
					// Only get links for cards on the current page.
					if (i === _UIObjectState.maxIdx){
						break;
					}

					if (i >= _UIObjectState.minIdx && i < _UIObjectState.maxIdx){
						var childLinks = _UIObjectState.children[i].getOutgoingLinks();
						for (linkId in childLinks) {
							if (childLinks.hasOwnProperty(linkId)) {
								outgoingLinks[linkId] = childLinks[linkId];
							}
						}
					}
				}

				return outgoingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			// Initialize to page zero (0).
			xfMatchInstance.setPage(0);
			return xfMatchInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfMatchModule.getSpecTemplate = function() {

			var template = {};
			_.extend(template, xfMatchSpecTemplate);

			return template;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfMatchModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfMatchModule;
	}
);
