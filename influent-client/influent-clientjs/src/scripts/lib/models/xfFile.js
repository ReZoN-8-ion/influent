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
		'lib/interfaces/xfUIObject', 'lib/communication/applicationChannels', 'lib/models/xfMatch', 'lib/util/GUID',
		'lib/models/xfImmutableCluster', 'lib/util/xfUtil', 'lib/constants', 'lib/ui/xfLinkType'
	],
	function(
		xfUIObject, appChannel, xfMatch, guid,
		xfImmutableCluster, xfUtil, constants, xfLinkType
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.FILE;

		var xfFileToolBarSpecTemplate = {
			allowFile           : false,
			allowFocus          : false,
			allowClose          : true,
			allowSearch         : true
		};

		var xfFileSpecTemplate = {
			parent : {},
			dataId : ''
		};

		//--------------------------------------------------------------------------------------------------------------
		// Private Methods
		//--------------------------------------------------------------------------------------------------------------

		var _createMatchcard = function(parentFile, searchTerm){
			var matchSpec = xfMatch.getSpecTemplate();
			matchSpec.parent = parentFile;
			matchSpec.searchTerm = searchTerm;

			return xfMatch.createInstance(matchSpec);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _hasMatchcard = function(state){
			return state.matchUIObject != null;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _hasCluster = function(state){
			return state.clusterUIObject != null;
		};

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfFileModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfFileModule.createInstance = function(spec){

			var _UIObjectState = {
				xfId                : '',
				UIType              : MODULE_NAME,
				spec                : {},
				toolbarSpec         : _.clone(xfFileToolBarSpecTemplate),
				matchUIObject       : null,
				clusterUIObject     : null,
				duplicateCount      : 1,
				links               : {},
				title               : '',
				isSelected          : false,
				isHighlighted       : false,
				isMatchHighlighted  : false,
				isHovered			: false,
				isHidden			: false,
				showToolbar         : true,
				showDetails         : true,
				showSpinner         : false,
				titleInitialized    : false
			};

			//---------------
			// Initialization
			//---------------

			// set the xfId
			_UIObjectState.xfId = 'file_'+guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					_UIObjectState.spec[key] = spec[key];
				}
			}
			_UIObjectState.spec.dataId = _UIObjectState.xfId;

			// create new object instance
			var xfFileInstance = {};
			xfUIObject.implementedBy(xfFileInstance, MODULE_NAME);

			//---------------
			// Public methods
			//---------------

			xfFileInstance.clone = function() {

				// create cloned object
				var clonedObject = xfFileModule.createInstance(_UIObjectState.spec);

				// add necessary UI state
				if (_UIObjectState.titleInitialized) {
					clonedObject.setLabel(_UIObjectState.title);
				}

				// clone match card if exists
				if (_hasMatchcard(_UIObjectState)) {
					clonedObject.setMatchUIObject(_UIObjectState.matchUIObject.clone());
				}

				// clone match card if exists
				if (_hasCluster(_UIObjectState)) {
					clonedObject.setClusterUIObject(_UIObjectState.clusterUIObject.clone());
				}
				// make the cloned object an orphan
				clonedObject.setParent(null);

				// return cloned object
				return clonedObject;
			};

			//----------------------------------------------------------------------------------------------------------


			xfFileInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getDataId = function() {
				return _UIObjectState.spec.dataId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getLabel = function() {
				return _UIObjectState.title;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.isLabelInitialized = function() {
				return _UIObjectState.titleInitialized;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setLabel = function(newLabel) {
				if (typeof(newLabel) === 'string') {
					_UIObjectState.title = newLabel;
					_UIObjectState.titleInitialized = true;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getUIObjectByXfId = function(xfId) {
				if (_UIObjectState.xfId === xfId) {
					return xfFileInstance;
				}

				// Check if the xfId corresponds to an associated xfMatch object.
				if (_hasMatchcard(_UIObjectState)){
					var matchObj = _UIObjectState.matchUIObject.getUIObjectByXfId(xfId);
					if (matchObj != null){
						return matchObj;
					}
				}

				// Check if the xfId corresponds to an associated xfMatch object.
				if (_hasCluster(_UIObjectState)){
					var clusterObj = _UIObjectState.clusterUIObject.getUIObjectByXfId(xfId);
					if (clusterObj != null){
						return clusterObj;
					}
				}

				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getUIObjectsByDataId = function(dataId) {
				var objectList = [];

				if (_UIObjectState.spec.dataId === dataId) {
					objectList.push(xfFileInstance);
				}

				// Check if the dataId corresponds to an associated xfMatch object.
				if (_hasMatchcard(_UIObjectState)){
					var matchList = _UIObjectState.matchUIObject.getUIObjectsByDataId(dataId);
					if (matchList.length > 0){
						objectList = objectList.concat(matchList);
					}
				}

				// Check if the dataId corresponds to an associated xfMatch object.
				if (_hasCluster(_UIObjectState)){
					var clusterList = _UIObjectState.clusterUIObject.getUIObjectsByDataId(dataId);
					if (clusterList.length > 0){
						objectList = objectList.concat(clusterList);
					}
				}

				return objectList;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getParent = function() {
				return _UIObjectState.spec.parent;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setParent = function(xfUIObj){
				_UIObjectState.spec.parent = xfUIObj;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.addLink = function(link) {

				if (link.getType() === xfLinkType.FILE) {
					_UIObjectState.links[link.getXfId()] = link;
				} else {
					if (_hasCluster(_UIObjectState)){
						_UIObjectState.clusterUIObject.addLink(link);
					}
					else {
						aperture.log.error('No cluster found. Unable to add link.');
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getLinks = function() {

				var linkId = null;
				var links = {};

				// Get the links from the xfFile if it's expanded.
				for (linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						links[linkId] = _UIObjectState.links[linkId];
					}
				}

				if (_hasCluster(_UIObjectState)) {
					var clusterLinks = _UIObjectState.clusterUIObject.getLinks();
					for (linkId in clusterLinks) {
						if (clusterLinks.hasOwnProperty(linkId)) {
							links[linkId] = clusterLinks[linkId];
						}
					}
				}

				// Get links from the internal match card.
				if (_hasMatchcard(_UIObjectState)) {
					var matchLinks = _UIObjectState.matchUIObject.getLinks();
					for (linkId in matchLinks) {
						if (matchLinks.hasOwnProperty(linkId)) {
							links[linkId] = matchLinks[linkId];
						}
					}
				}

				return links;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.isLinkedTo = function(uiObject) {
				var links = xfFileInstance.getLinks();
				var linkedUIObjects = {};
				for (var linkId in links) {
					if (links.hasOwnProperty(linkId)) {
						var link = links[linkId];
						linkedUIObjects[link.getSource().getXfId()] = true;
						linkedUIObjects[link.getDestination().getXfId()] = true;
					}
				}

				return linkedUIObjects[uiObject.getXfId()];
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.removeLink = function(xfId) {

				if (_hasCluster(_UIObjectState)) {
					if (_UIObjectState.clusterUIObject.removeLink(xfId)) {
						return true;
					}
				}

				if (_hasMatchcard(_UIObjectState)) {
					if (_UIObjectState.matchUIObject.removeLink(xfId)) {
						return true;
					}
				}

				if (_UIObjectState.links.hasOwnProperty(xfId)) {
					delete _UIObjectState.links[xfId];
					return true;
				}

				return false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.removeAllLinks = function(linkType) {

				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.removeAllLinks(linkType);
				}

				if (_hasMatchcard(_UIObjectState)) {
					_UIObjectState.matchUIObject.removeAllLinks(linkType);
				}

				var tempLinkMap = _.clone(_UIObjectState.links);
				for (var linkId in tempLinkMap) {
					if (tempLinkMap.hasOwnProperty(linkId)) {
						tempLinkMap[linkId].remove();
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.collapseLinks = function(direction) {
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapseLinks".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.remove = function(eventChannel, dispose) {
				// An event channel argument is required to help enforce that this method should
				// ONLY ever be called from a pubsub type handler.
				if (appChannel.REMOVE_REQUEST === eventChannel){

					// Get all the links and remove them from any link maps.
					var allLinks = this.getLinks();
					for (var linkId in allLinks) {
						if (allLinks.hasOwnProperty(linkId)) {
							allLinks[linkId].remove();
						}
					}

					_UIObjectState.spec.parent.removeChild(
						_UIObjectState.xfId,
						(dispose != null) ? dispose : true,
						false
					);
				}
				else {
					aperture.log.error('Invalid or missing publish event. Unable to remove ' + MODULE_NAME + ': ' + _UIObjectState.xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {

				if (_hasMatchcard(_UIObjectState) && _UIObjectState.matchUIObject.getXfId() === xfId) {
					_UIObjectState.matchUIObject.setParent(null);
					if (disposeObject) {
						_UIObjectState.matchUIObject.dispose();
					}
					_UIObjectState.matchUIObject = null;
				}
				else if (_hasCluster(_UIObjectState) && _UIObjectState.clusterUIObject.getXfId() === xfId){
					_UIObjectState.clusterUIObject.setParent(null);
					if (disposeObject) {
						_UIObjectState.clusterUIObject.dispose();
					}
					_UIObjectState.clusterUIObject = null;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.removeAllChildren = function() {

				if (_hasMatchcard(_UIObjectState)) {
					_UIObjectState.matchUIObject.dispose();
					_UIObjectState.matchUIObject = null;
				}

				if (_hasCluster(_UIObjectState)){
					_UIObjectState.clusterUIObject.dispose();
					_UIObjectState.clusterUIObject = null;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.insert = function(xfUIObj, beforeXfUIObj00) {
				aperture.log.error('Unable to insert children into ' + MODULE_NAME + '. Please use update method instead.');
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.expand = function() {
				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.expand();
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.collapse = function() {
				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.collapse();
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.showDetails = function(bShow) {
				if (bShow == null){
					return _UIObjectState.showDetails;
				}

				_UIObjectState.showDetails = bShow;

				if (_hasMatchcard(_UIObjectState)) {
					_UIObjectState.matchUIObject.showDetails(bShow);
				}

				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.showDetails(bShow);
				}

				return _UIObjectState.showDetails;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.showSpinner = function(bShow) {
				if (bShow != null) {
					if (_UIObjectState.showSpinner !== bShow) {
						_UIObjectState.showSpinner = bShow;
					}
				}

				return _UIObjectState.showSpinner;
			};
			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.showToolbar = function(bShow) {
				if (bShow != null) {
					if (_hasMatchcard(_UIObjectState)) {
						_UIObjectState.matchUIObject.showToolbar(bShow);
					}

					if (_hasCluster(_UIObjectState)) {
						_UIObjectState.clusterUIObject.showToolbar(bShow);
					}
				}

				return _UIObjectState.showToolbar;
			};

			//--------------------------------------------------------------------------------------------------------------

			xfFileInstance.getChildren = function() {
				if (_hasCluster(_UIObjectState)) {
					return [_UIObjectState.clusterUIObject];
				}

				return [];
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getSpecs = function(bOnlyEmptySpecs) {

				var i;
				var specs = [];

				if (_hasMatchcard(_UIObjectState)) {
					var matchSpecs = _UIObjectState.matchUIObject.getSpecs(bOnlyEmptySpecs);
					for (i = 0; i < matchSpecs.length; i++) {
						specs.push(matchSpecs[i]);
					}
				}

				if (_hasCluster(_UIObjectState)) {
					var clusterSpecs = _UIObjectState.clusterUIObject.getSpecs(bOnlyEmptySpecs);
					for (i = 0; i < clusterSpecs.length; i++) {
						specs.push(clusterSpecs[i]);
					}
				}

				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getVisualInfo = function() {
				return _UIObjectState != null ? _.clone(_UIObjectState) : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.isSelected = function() {
				return _UIObjectState.isSelected;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setSelection = function(xfId) {

				if (xfId == null || _UIObjectState.xfId !== xfId) {
					if (_UIObjectState.isSelected) {
						_UIObjectState.isSelected = false;
					}
				} else {
					if (!_UIObjectState.isSelected) {
						_UIObjectState.isSelected = true;
					}
				}

				// Update the cluster
				if (_hasCluster(_UIObjectState)){
					_UIObjectState.clusterUIObject.setSelection(xfId);
				}

				// Update any attached xfMatch objects
				if (_hasMatchcard(_UIObjectState)){
					_UIObjectState.matchUIObject.setSelection(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.isHighlighted = function() {
				return _UIObjectState.isHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.highlightId = function(xfId) {
				var stateChanged = false;

				if (_UIObjectState.xfId === xfId) {
					if (!_UIObjectState.isHighlighted) {
						_UIObjectState.isHighlighted = true;
						stateChanged = true;
					}
				} else {
					if (_UIObjectState.isHighlighted) {
						_UIObjectState.isHighlighted = false;
						stateChanged = true;
					}
				}

				if (!stateChanged) {
					if (_hasCluster(_UIObjectState)){
						_UIObjectState.clusterUIObject.highlightId(xfId);
					}

					if (_hasMatchcard(_UIObjectState)){
						_UIObjectState.matchUIObject.highlightId(xfId);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.isMatchHighlighted = function() {
				return _UIObjectState.isMatchHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setMatchHighlighted = function(matchHighlighted) {
				_UIObjectState.isMatchHighlighted = matchHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.hasMatchCard = function() {
				return _hasMatchcard(_UIObjectState);
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.hasCluster = function() {
				return _hasCluster(_UIObjectState);
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.isHovered = function() {
				return _UIObjectState.isHovered;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setHovering = function(xfId) {
				// Set the hovering state of the file itself.
				var stateChanged = false;
				if (_UIObjectState.xfId === xfId) {
					if (!_UIObjectState.isHovered) {
						_UIObjectState.isHovered = true;
						stateChanged = true;
					}
				} else {
					if (_UIObjectState.isHovered) {
						_UIObjectState.isHovered = false;
						stateChanged = true;
					}
				}

				// Update all the children.
				if (_hasCluster(_UIObjectState)){
					_UIObjectState.clusterUIObject.setHovering(xfId);
				}

				// Update any attached xfMatch objects.
				if (_hasMatchcard(_UIObjectState)){
					_UIObjectState.matchUIObject.setHovering(xfId);
				}

				if (stateChanged) {
					aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: xfFileInstance, updateOnly: true});
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setHidden = function(xfId, state) {


				if (_UIObjectState.xfId === xfId) {
					if (_UIObjectState.isHidden !== state) {

						_UIObjectState.isHidden = state;
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: xfFileInstance, updateOnly: true});
					}
				}

				// Update all the children.
				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.setHidden(xfId, state);
				}

				// Update any attached xfMatch objects.
				if (_hasMatchcard(_UIObjectState)) {
					_UIObjectState.matchUIObject.setHidden(xfId, state);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setDuplicateCount = function(count) {
				// do nothing
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getVisibleDataIds = function() {

				var visibleDataIds = [];

				if (_UIObjectState.spec.dataId != null) {
					visibleDataIds.push(_UIObjectState.spec.dataId);
				}

				// Check if the dataId corresponds to an associated xfMatch object.
				if (_hasMatchcard(_UIObjectState)){
					var matchList = _UIObjectState.matchUIObject.getVisibleDataIds();
					if (matchList.length > 0){
						visibleDataIds = visibleDataIds.concat(matchList);
					}
				}

				if (_hasCluster(_UIObjectState)){
					var clusterList = _UIObjectState.clusterUIObject.getVisibleDataIds();
					if (clusterList.length > 0){
						visibleDataIds = visibleDataIds.concat(clusterList);
					}
				}

				return visibleDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.cleanState = function() {

				_UIObjectState.xfId = '';
				_UIObjectState.UIType = MODULE_NAME;
				_UIObjectState.spec = {};
				_UIObjectState.matchUIObject = null;
				_UIObjectState.clusterUIObject = null;
				_UIObjectState.children = [];
				_UIObjectState.duplicateCount = 1;
				_UIObjectState.title = '';
				_UIObjectState.isExpanded = false;
				_UIObjectState.isSelected = false;
				_UIObjectState.isHighlighted = false;
				_UIObjectState.isHovered = false;
				_UIObjectState.showToolbar = true;
				_UIObjectState.titleInitialized = false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.saveState = function() {

				var state = {};

				state['xfId'] = _UIObjectState.xfId;
				state['UIType'] = _UIObjectState.UIType;

				state['duplicateCount'] = _UIObjectState.duplicateCount;
				state['title'] = _UIObjectState.title;
				state['showToolbar'] = _UIObjectState.showToolbar;
				state['matchUIObject'] = (_hasMatchcard(_UIObjectState)) ? _UIObjectState.matchUIObject.saveState() : null;
				state['clusterUIObject'] = (_hasCluster(_UIObjectState)) ? _UIObjectState.clusterUIObject.saveState() : null;
				state['isExpanded'] = _UIObjectState.isExpanded;
				state['isSelected'] = _UIObjectState.isSelected;
				state['isHighlighted'] = _UIObjectState.isHighlighted;
				state['isHovered'] = _UIObjectState.isHovered;
				state['titleInitialized'] = _UIObjectState.titleInitialized;
				state['toolbarSpec'] = _UIObjectState.toolbarSpec;

				state['spec'] = {};
				state['spec']['parent'] = _UIObjectState.spec.parent.getXfId();
				state['spec']['dataId'] = _UIObjectState.spec.dataId;

				state['links'] = [];
				var links = xfFileInstance.getLinks();
				for (var linkId in links) {
					if (links.hasOwnProperty(linkId)) {
						var link = links[linkId];
						state['links'].push(link.saveState());
					}
				}

				return state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.restoreVisualState = function(state) {

				_UIObjectState.xfId = state.xfId;
				_UIObjectState.UIType = state.UIType;

				_UIObjectState.duplicateCount = state.duplicateCount;
				_UIObjectState.title = state.title;
				_UIObjectState.isExpanded = state.isExpanded;
				_UIObjectState.isSelected = state.isSelected;
				_UIObjectState.isHighlighted = state.isHighlighted;
				_UIObjectState.isHovered = state.isHovered;
				_UIObjectState.showToolbar = state.showToolbar;
				_UIObjectState.titleInitialized = state.titleInitialized;
				_UIObjectState.toolbarSpec = state.toolbarSpec;

				_UIObjectState.spec.dataId = state.spec.dataId;

				if (state.clusterUIObject != null) {
					var clusterSpec = xfImmutableCluster.getSpecTemplate();
					var clusterUIObj = xfImmutableCluster.createInstance(clusterSpec);
					clusterUIObj.cleanState();
					clusterUIObj.restoreVisualState(state.clusterUIObject);
					_UIObjectState.clusterUIObject = clusterUIObj;
				}

				if (state.matchUIObject != null) {
					var matchSpec = xfMatch.getSpecTemplate();
					var matchUIObj = xfMatch.createInstance(matchSpec);
					matchUIObj.cleanState();
					matchUIObj.restoreVisualState(state.matchUIObject);
					_UIObjectState.matchUIObject = matchUIObj;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.restoreHierarchy = function(state, workspace) {
				_UIObjectState.spec.parent = workspace.getUIObjectByXfId(state.spec.parent);

				if (_hasMatchcard(_UIObjectState)) {
					_UIObjectState.matchUIObject.restoreHierarchy(state.matchUIObject, workspace);
				}

				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.restoreHierarchy(state.clusterUIObject, workspace);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.dispose = function() {

				if (_UIObjectState.isSelected) {
					aperture.pubsub.publish(
						appChannel.SELECTION_CHANGE_REQUEST,
						{
							xfId: null,
							selected : true,
							noRender: true
						}
					);
				}

				_UIObjectState.spec.parent = null;
				_UIObjectState.spec.flow = null;
				_UIObjectState.toolbarSpec = null;
				_UIObjectState.spec = null;
				_UIObjectState.children = null;

				for (var linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						_UIObjectState.links[linkId].remove();
					}
				}
				_UIObjectState.links = null;

				if (_hasMatchcard(_UIObjectState)) {
					_UIObjectState.matchUIObject.dispose();
					_UIObjectState.matchUIObject = null;
				}
				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.dispose();
					_UIObjectState.clusterUIObject = null;
				}

				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.updatePromptState = function(dataId, state) {
				if (_hasMatchcard(_UIObjectState)){
					_UIObjectState.matchUIObject.updatePromptState(dataId, state);
				}

				if (_hasCluster(_UIObjectState)){
					_UIObjectState.clusterUIObject.updatePromptState(dataId, state);
				}
			};

			//-----------------------------
			// File Specific Implementation
			//-----------------------------

			xfFileInstance.setMatchUIObject = function(matchUIObject) {
				matchUIObject.setParent(this);
				_UIObjectState.matchUIObject = matchUIObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getMatchUIObject = function() {
				return _UIObjectState.matchUIObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.setClusterUIObject = function(clusterUIObject) {

				if (_UIObjectState.clusterUIObject) {
					_UIObjectState.clusterUIObject.dispose();
				}

				clusterUIObject.setParent(this);
				clusterUIObject.updateToolbar(
					{
						allowFile: false,
						allowFocus: true,
						allowSearch: true,
						allowClose: true
					},
					true
				);

				_UIObjectState.clusterUIObject = clusterUIObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getClusterUIObject = function() {
				return _UIObjectState.clusterUIObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.showSearchControl = function(isVisible, searchTerm){
				if (isVisible){
					if(!_hasMatchcard(_UIObjectState)) {
						_UIObjectState.matchUIObject = _createMatchcard(this, searchTerm);
					} else {
						_UIObjectState.matchUIObject.setSearchTerm(searchTerm);
					}
				}
				else if (_hasMatchcard(_UIObjectState)){
					aperture.pubsub.publish(
						appChannel.REMOVE_REQUEST,
						{
							xfIds : [_UIObjectState.matchUIObject.getXfId()],
							dispose : true
						}
					);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getContainedCardDataIds = function() {
				var containedIds = [];

				if (_hasCluster(_UIObjectState) && _UIObjectState.clusterUIObject.getUIType() === constants.MODULE_NAMES.IMMUTABLE_CLUSTER) {
					containedIds = containedIds.concat(_UIObjectState.clusterUIObject.getContainedCardDataIds());
				}

				return containedIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getIncomingLinks = function() {

				var linkId = null;
				var incomingLinks = {};

				// Get the links from the xfFile if it's expanded.
				for (linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						var link = _UIObjectState.links[linkId];
						if (link.getDestination().getXfId() === _UIObjectState.xfId) {
							incomingLinks[link.getXfId()] = link;
						}
					}
				}

				if (_hasCluster(_UIObjectState)) {
					var clusterLinks = _UIObjectState.clusterUIObject.getIncomingLinks();
					for (linkId in clusterLinks) {
						if (clusterLinks.hasOwnProperty(linkId)) {
							incomingLinks[linkId] = clusterLinks[linkId];
						}
					}
				}

				// Get links from the internal match card.
				if (_hasMatchcard(_UIObjectState)) {
					var matchLinks = _UIObjectState.matchUIObject.getIncomingLinks();
					for (linkId in matchLinks) {
						if (matchLinks.hasOwnProperty(linkId)) {
							incomingLinks[linkId] = matchLinks[linkId];
						}
					}
				}

				return incomingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.getOutgoingLinks = function() {

				var linkId = null;
				var outgoingLinks = {};

				// Get the links from the xfFile if it's expanded.
				for (linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						var link = _UIObjectState.links[linkId];
						if (link.getSource().getXfId() === _UIObjectState.xfId) {
							outgoingLinks[link.getXfId()] = link;
						}
					}
				}

				if (_hasCluster(_UIObjectState)) {
					var clusterLinks = _UIObjectState.clusterUIObject.getOutgoingLinks();
					for (linkId in clusterLinks) {
						if (clusterLinks.hasOwnProperty(linkId)) {
							outgoingLinks[linkId] = clusterLinks[linkId];
						}
					}
				}

				// Get links from the internal match card.
				if (_hasMatchcard(_UIObjectState)) {
					var matchLinks = _UIObjectState.matchUIObject.getOutgoingLinks();
					for (linkId in matchLinks) {
						if (matchLinks.hasOwnProperty(linkId)) {
							outgoingLinks[linkId] = matchLinks[linkId];
						}
					}
				}

				return outgoingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.hasSelectedChild = function() {

				if (_hasCluster(_UIObjectState)) {
					if (_UIObjectState.clusterUIObject.isSelected) {
						return true;
					}

					return _UIObjectState.clusterUIObject.hasSelectedChild();
				}

				return false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfFileInstance.sortChildren = function(sortFunction) {
				if (_hasCluster(_UIObjectState)) {
					_UIObjectState.clusterUIObject.sortChildren(sortFunction);
				}
			};

			//----------------------------------------------------------------------------------------------------------
			xfFileInstance.setXfId = function(xfId) {
				_UIObjectState.xfId = xfId;
			};

			return xfFileInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfFileModule.getSpecTemplate = function() {

			var specTemplate = {};
			$.extend(true, specTemplate, xfFileSpecTemplate);

			return specTemplate;
		};

		//--------------------------------------------------------------------------------------------------------------

		if (constants.UNIT_TESTS_ENABLED) {
			xfFileModule.getModuleName = function () {
				return MODULE_NAME;
			};
		}

		//--------------------------------------------------------------------------------------------------------------

		return xfFileModule;
	}
);
