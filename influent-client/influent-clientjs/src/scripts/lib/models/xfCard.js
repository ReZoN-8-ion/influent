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
		'lib/interfaces/xfUIObject', 'lib/communication/applicationChannels', 'lib/util/GUID', 'lib/util/xfUtil', 'lib/constants', 'underscore'
	],
	function(
		xfUIObject, appChannel, guid, xfUtil, constants
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.ENTITY;

		var xfCardToolBarSpecTemplate = {
			allowFile           : true,
			allowSearch         : true,
			allowFocus          : true,
			allowClose          : true
		};

		var xfCardChartSpecTemplate = {
			startValue          : 0,
			endValue            : 0,
			credits             : [],
			debits              : [],
			maxCredit           : 0,
			maxDebit            : 0,
			maxBalance          : 0,
			minBalance          : 0,
			focusCredits        : [],
			focusDebits         : []
		};

		var xfCardSpecTemplate = {
			parent              : {},
			type                : MODULE_NAME,
			accounttype         : '',
			dataId              : '',
			icons               : [],
			graphUrl            : '',
			flow                : {},
			chartSpec           : {},
			duplicateCount      : 1,
			label               : '',
			confidenceInSrc     : 1.0,
			confidenceInAge     : 1.0,
			unbranchable        : false,
			inDegree			: 0,
			outDegree			: 0,
			leftOperation       : 'branch',
			rightOperation      : 'branch',
			promptForDetails	: false
		};

		//--------------------------------------------------------------------------------------------------------------
		// Private Methods
		//--------------------------------------------------------------------------------------------------------------



		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfCardModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfCardModule.createInstance = function(spec){

			//---------------
			// Initialization
			//---------------
			var _UIObjectState = {
				xfId                : '',
				UIType              : MODULE_NAME,
				spec                : {},
				toolbarSpec         : _.clone(xfCardToolBarSpecTemplate),
				links               : {},
				isSelected          : false,
				isHighlighted       : false,
				isHovered           : false,
				isHidden			: false,
				showToolbar         : false,
				showDetails         : false,
				showSpinner         : false
			};

			// set the xfId
			_UIObjectState.xfId = 'card_'+guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					_UIObjectState.spec[key] = spec[key];
				}
			}

			// create new object instance
			var xfCardInstance = {};
			xfUIObject.implementedBy(xfCardInstance, MODULE_NAME);

			//---------------
			// Public methods
			//---------------

			xfCardInstance.clone = function() {

				// create cloned object
				var clonedObject = xfCardModule.createInstance(_UIObjectState.spec);

				// add necessary UI state
				clonedObject.showDetails(_UIObjectState.showDetails);

				// make the cloned object an orphan
				clonedObject.setParent(null);

				// return cloned object
				return clonedObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getDataId = function() {
				return _UIObjectState.spec.dataId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getAccountType = function() {
				return _UIObjectState.spec.accountype;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getUIObjectByXfId = function(xfId) {

				return (xfId != null && _UIObjectState.xfId === xfId) ? xfCardInstance : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getUIObjectsByDataId = function(dataId) {
				return (_UIObjectState.spec.dataId != null && _UIObjectState.spec.dataId === dataId) ? [xfCardInstance] : [];
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getParent = function() {
				return _UIObjectState.spec.parent;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setParent = function(xfUIObj){
				_UIObjectState.spec.parent = xfUIObj;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getLinks = function() {
				return _UIObjectState.links;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getLabel = function() {
				return _UIObjectState.spec.label;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getIncomingLinks = function() {

				var incomingLinks = {};

				for (var xfId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(xfId)) {
						var link = _UIObjectState.links[xfId];
						if (link.getDestination().getXfId() === _UIObjectState.xfId) {
							incomingLinks[link.getXfId()] = link;
						}
					}
				}

				return incomingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getOutgoingLinks = function() {

				var outgoingLinks = {};

				for (var xfId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(xfId)) {
						var link = _UIObjectState.links[xfId];
						if (link.getSource().getXfId() === _UIObjectState.xfId) {
							outgoingLinks[link.getXfId()] = link;
						}
					}
				}

				return outgoingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.addLink = function(link) {
				_UIObjectState.links[link.getXfId()] = link;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.removeLink = function(xfId) {
				if (_UIObjectState.links.hasOwnProperty(xfId)) {
					delete _UIObjectState.links[xfId];
					return true;
				}

				return false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.removeAllLinks = function(linkType) {
				var tempLinkMap = _.clone(_UIObjectState.links);
				for (var linkId in tempLinkMap) {
					if (tempLinkMap.hasOwnProperty(linkId)) {
						tempLinkMap[linkId].remove();
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.collapseLinks = function(direction, deleteAfterCollapse) {

				var targetEntities = [];

				var links = _.clone(_UIObjectState.links);
				for (var linkId in links) {
					if (links.hasOwnProperty(linkId)) {
						var link = _UIObjectState.links[linkId];
						var src = link.getSource();
						var dest = link.getDestination();
						var foundLink = false;

						if (direction === 'right') {
							if (src.getXfId() === _UIObjectState.xfId) {
								targetEntities.push(dest);
								foundLink = true;
							}
						} else {
							if (dest.getXfId() === _UIObjectState.xfId) {
								targetEntities.push(src);
								foundLink = true;
							}
						}

						if (foundLink) {
							link.remove();
						}
					}
				}

				for (var i = 0; i < targetEntities.length; i++) {
					targetEntities[i].collapseLinks(direction, true);
				}

				if (deleteAfterCollapse) {
					if (_.size(_UIObjectState.links) === 0) {
						// Check if this card is a descendant of a match card.
						if (!xfUtil.isUITypeDescendant(this, constants.MODULE_NAMES.FILE)){
							aperture.pubsub.publish(
								appChannel.REMOVE_REQUEST,
								{
									xfIds : [this.getXfId()],
									dispose : true
								}
							);
						}
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.isLinkedTo = function(uiObject) {
				var links = xfCardInstance.getLinks();
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
			// An event channel argument is required to help enforce that this method should
			// ONLY ever be called from a pubsub type handler.
			xfCardInstance.remove = function(eventChannel, dispose) {
				if (appChannel.REMOVE_REQUEST === eventChannel){

					for (var linkId in _UIObjectState.links) {
						if (_UIObjectState.links.hasOwnProperty(linkId)) {
							_UIObjectState.links[linkId].remove();
						}
					}

					_UIObjectState.spec.parent.removeChild(
						_UIObjectState.xfId,
						(dispose != null) ? dispose : true,
						false,
						true
					);
				}
				else {
					aperture.log.error('Invalid or missing publish event. Unabled to remove ' + MODULE_NAME + ': ' + _UIObjectState.xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {
				// Cards have no children and therefore can not implement the 'removeChild' method,
				// so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "removeChild".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.removeAllChildren = function() {
				// Cards have no children and therefore we return;
				return;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.insert = function(xfUIObj, beforeXfUIObj00) {
				// Cards have no children and therefore can not implement the 'insert' method,
				// so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "insert".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.update = function(spec) {
				for (var key in spec) {
					if ( spec.hasOwnProperty(key) ) {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.updateToolbar = function(spec, recursiveUpdate) {
				for (var key in spec) {
					if ( spec.hasOwnProperty(key) ) {
						_UIObjectState.toolbarSpec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.showToolbar = function(bShow) {
				if (bShow != null){
					if (_UIObjectState.showToolbar !== bShow) {
						_UIObjectState.showToolbar = bShow;
					}
				}

				return _UIObjectState.showToolbar;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.showDetails = function(bShow) {
				if (bShow != null) {
					if (_UIObjectState.showDetails !== bShow) {
						_UIObjectState.showDetails = bShow;
					}
				}

				return _UIObjectState.showDetails;
			};

			//--------------------------------------------------------------------------------------------------------------

			xfCardInstance.showSpinner = function(bShow) {
				if (bShow != null) {
					if (_UIObjectState.showSpinner !== bShow) {
						_UIObjectState.showSpinner = bShow;
					}
				}

				return _UIObjectState.showSpinner;
			};

			//--------------------------------------------------------------------------------------------------------------

			xfCardInstance.getChildren = function() {
				return [];
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getSpecs = function(bOnlyEmptySpecs) {
				var specs = [];

				if (bOnlyEmptySpecs) {
					if (_UIObjectState.spec.graphUrl === '') {
						specs.push(_.clone(_UIObjectState.spec));
					}
				} else {
					specs.push(_.clone(_UIObjectState.spec));
				}

				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getVisualInfo = function() {
				return _UIObjectState != null ? _.clone(_UIObjectState) : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.isHighlighted = function() {
				return _UIObjectState.isHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.highlightId = function(xfId) {
				if (xfId == null) {
					_UIObjectState.isHighlighted = false;
				} else if (_UIObjectState.xfId === xfId) {
					if (!_UIObjectState.isHighlighted) {
						_UIObjectState.isHighlighted = true;
					}
				} else {
					// If this id belongs to this objects parent,
					// and that parent is expanded, the child
					// shall also inherit the highlight.
					if (xfUtil.isClusterTypeFromObject(this.getParent()) && this.getParent().isExpanded() && this.getParent().isHighlighted()){
						_UIObjectState.isHighlighted = true;
					}
					else if (_UIObjectState.isHighlighted) {
						_UIObjectState.isHighlighted = false;
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.isSelected = function() {
				return _UIObjectState.isSelected;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setSelection = function(xfId) {

				if (xfId == null || _UIObjectState.xfId !== xfId) {
					if (_UIObjectState.isSelected) {
						_UIObjectState.isSelected = false;
					}
				} else {
					if (!_UIObjectState.isSelected) {
						_UIObjectState.isSelected = true;
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setHovering = function(xfId) {
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

				if (stateChanged) {
					aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject : xfCardInstance, updateOnly: true});
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setHidden = function(xfId, state) {

				if (_UIObjectState.xfId === xfId) {
					if (_UIObjectState.isHidden !== state ) {

						_UIObjectState.isHidden = state;
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: xfCardInstance, updateOnly: true});

						var i;

						// Set parent cluster visibility
						if (xfUtil.isClusterTypeFromObject(this.getParent())) {

							var siblings = this.getParent().getChildren();
							var anyVisible = false;
							for (i = 0; i < siblings.length; i++) {
								if (!siblings[i].getVisualInfo().isHidden) {
									anyVisible = true;
									break;
								}
							}

							this.getParent().setHidden(this.getParent().getXfId(), !anyVisible);
						}
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.expand = function() {
				// Cards have no children and therefore can not implement the 'expand' method,
				// so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "expand".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.collapse = function() {
				// Cards have no children and therefore can not implement the 'collapse' method,
				// so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapse".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setDuplicateCount = function(count) {

				if (_UIObjectState.spec.duplicateCount === count) {
					return;
				}

				_UIObjectState.spec.duplicateCount = count;

				aperture.pubsub.publish(
					appChannel.RENDER_UPDATE_REQUEST,
					{
						UIObject: this
					}
				);
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getVisibleDataIds = function() {

				var visibleDataIds = [];

				if (_UIObjectState.spec.dataId == null) {
					return visibleDataIds;
				}

				visibleDataIds.push(_UIObjectState.spec.dataId);
				return visibleDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.cleanState = function() {

				_UIObjectState.xfId = '';
				_UIObjectState.UIType = MODULE_NAME;
				_UIObjectState.spec = xfCardModule.getSpecTemplate();
				_UIObjectState.links = {};
				_UIObjectState.isSelected = false;
				_UIObjectState.isHighlighted = false;
				_UIObjectState.isHovered = false;
				_UIObjectState.showToolbar = false;
				_UIObjectState.showDetails = false;
				_UIObjectState.showSpinner = false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.saveState = function() {

				var state = {};

				state['xfId'] = _UIObjectState.xfId;
				state['UIType'] = _UIObjectState.UIType;

				state['isSelected'] = _UIObjectState.isSelected;
				state['isHighlighted'] = _UIObjectState.isHighlighted;
				state['showToolbar'] = _UIObjectState.showToolbar;
				state['showDetails'] = _UIObjectState.showDetails;
				state['toolbarSpec'] = _UIObjectState.toolbarSpec;

				state['spec'] = {};
				state['spec']['parent'] = _UIObjectState.spec.parent.getXfId();
				state['spec']['dataId'] = _UIObjectState.spec.dataId;
				state['spec']['type'] = _UIObjectState.spec.type;
				state['spec']['accounttype'] = _UIObjectState.spec.accounttype;
				state['spec']['icons'] = _UIObjectState.spec.icons;
				state['spec']['graphUrl'] = _UIObjectState.spec.graphUrl;
				state['spec']['duplicateCount'] = _UIObjectState.spec.duplicateCount;
				state['spec']['label'] = _UIObjectState.spec.label;
				state['spec']['confidenceInSrc'] = _UIObjectState.spec.confidenceInSrc;
				state['spec']['confidenceInAge'] = _UIObjectState.spec.confidenceInAge;
				state['spec']['flow'] = _UIObjectState.spec.flow;
				state['spec']['chartSpec'] = _UIObjectState.spec.chartSpec;
				state['spec']['inDegree'] = _UIObjectState.spec.inDegree;
				state['spec']['outDegree'] = _UIObjectState.spec.outDegree;
				state['spec']['promptForDetails'] = _UIObjectState.spec.promptForDetails;

				return state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.restoreVisualState = function(state) {

				this.cleanState();

				_UIObjectState.xfId = state.xfId;
				_UIObjectState.UIType = state.UIType;

				_UIObjectState.isSelected = state.isSelected;
				_UIObjectState.isHighlighted = state.isHighlighted;
				_UIObjectState.showToolbar = state.showToolbar;
				_UIObjectState.showDetails = state.showDetails;
				_UIObjectState.toolbarSpec = state.toolbarSpec;

				_UIObjectState.spec.dataId = state.spec.dataId;
				_UIObjectState.spec.type = state.spec.type;
				_UIObjectState.spec.accounttype = state.spec.accounttype;
				_UIObjectState.spec.icons = state.spec.icons;
				_UIObjectState.spec.graphUrl = state.spec.graphUrl;
				_UIObjectState.spec.duplicateCount = state.spec.duplicateCount;
				_UIObjectState.spec.label = state.spec.label;
				_UIObjectState.spec.confidenceInSrc = state.spec.confidenceInSrc;
				_UIObjectState.spec.confidenceInAge = state.spec.confidenceInAge;
				_UIObjectState.spec.flow = state.spec.flow;
				_UIObjectState.spec.chartSpec = state.spec.chartSpec;
				_UIObjectState.spec.inDegree = state.spec.inDegree;
				_UIObjectState.spec.outDegree = state.spec.outDegree;
				_UIObjectState.spec.promptForDetails = state.spec.promptForDetails;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.restoreHierarchy = function(state, workspace) {
				_UIObjectState.spec.parent = workspace.getUIObjectByXfId(state.spec.parent);
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.dispose = function() {

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
				_UIObjectState.spec.chartSpec = null;
				_UIObjectState.spec = null;

				for (var linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						_UIObjectState.links[linkId].remove();
					}
				}

				_UIObjectState.links = null;
				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.sortChildren = function(sortFunction) {
				// do nothing
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getTotalLinkAmount = function(includeIncoming, includeOutgoing) {

				var linkId = '', links = [];
				if (includeIncoming) {
					var incomingLinks = this.getIncomingLinks();
					for (linkId in incomingLinks) {
						if (incomingLinks.hasOwnProperty(linkId)) {
							links.push(incomingLinks[linkId]);
						}
					}
				}

				if (includeOutgoing) {
					var outgoingLinks = this.getOutgoingLinks();
					for (linkId in outgoingLinks) {
						if (outgoingLinks.hasOwnProperty(linkId)) {
							links.push(outgoingLinks[linkId]);
						}
					}
				}

				var amount = 0;
				for (var i = 0; i < links.length; i++) {
					var link = links[i];
					amount += link.getAmount();
				}

				return amount;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.updatePromptState = function(dataId, state) {
				if (_UIObjectState.spec.dataId === dataId) {
					_UIObjectState.spec.promptForDetails = state;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getPromptState = function(xfId) {
				return _UIObjectState.spec.promptForDetails;
			};

			//--------------------------------
			// Card Specific Implementation
			//--------------------------------

			xfCardInstance.getInDegree = function() {
				return _UIObjectState.spec.inDegree;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getOutDegree = function() {
				return _UIObjectState.spec.outDegree;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getCount = function() {
				return 1;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getLeftOperation = function() {
				return _UIObjectState.spec.leftOperation;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.getRightOperation = function() {
				return _UIObjectState.spec.rightOperation;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setLeftOperation = function(op) {
				_UIObjectState.spec.leftOperation = op;
			};

			//----------------------------------------------------------------------------------------------------------

			xfCardInstance.setRightOperation = function(op) {
				_UIObjectState.spec.rightOperation = op;
			};

			//----------------------------------------------------------------------------------------------------------

			return xfCardInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfCardModule.getSpecTemplate = function() {

			var specTemplate = {};
			$.extend(true, specTemplate, xfCardSpecTemplate);
			var chartSpecTemplate = {};
			$.extend(true, chartSpecTemplate, xfCardChartSpecTemplate);
			specTemplate.chartSpec = chartSpecTemplate;

			return specTemplate;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfCardModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfCardModule;
	}
);
