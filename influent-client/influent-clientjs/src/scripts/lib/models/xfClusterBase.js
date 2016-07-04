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
		'lib/interfaces/xfUIObject', 'lib/communication/applicationChannels', 'lib/util/xfUtil', 'lib/constants', 'underscore'
	],
	function(
		xfUIObject, appChannel, xfUtil, constants
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.CLUSTER_BASE;

		var xfClusterToolBarSpecTemplate = {
			allowFile           : true,
			allowSearch         : true,
			allowFocus          : true,
			allowClose          : true
		};

		var xfClusterChartSpecTemplate = {
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

		var xfClusterSpecTemplate = {
			parent              : {},
			type                : MODULE_NAME,
			accounttype         : '',
			dataId              : '',
			count               : 0,
			members             : [],
			icons               : [],
			graphUrl            : '',
			flow                : {},
			duplicateCount      : 1,
			label               : '',
			confidenceInSrc     : 1.0,
			confidenceInAge     : 1.0,
			unbranchable        : false,
			inDegree			: 0,
			outDegree			: 0,
			leftOperation       : 'branch',
			rightOperation      : 'branch',
			ownerId             : '',
			promptForDetails	: false
		};

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfClusterModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfClusterModule.createInstance = function(uiObjectState){

			var _UIObjectState = uiObjectState;

			// create new object instance
			var xfClusterInstance = {};
			xfUIObject.implementedBy(xfClusterInstance, MODULE_NAME);

			//------------------------
			// UIObject Implementation
			//------------------------

			xfClusterInstance.clone = function() {
				aperture.log.error(MODULE_NAME + ' is an abstract base class and should not be cloned');
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getDataId = function() {
				return _UIObjectState.spec.dataId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getAccountType = function() {
				return _UIObjectState.spec.accounttype;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getLabel = function() {
				return _UIObjectState.spec.label;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getUIObjectByXfId = function(xfId) {

				if (_UIObjectState.isExpanded) {
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						var object = _UIObjectState.children[i].getUIObjectByXfId(xfId);
						if (object != null) {
							return object;
						}
					}

				}

				if (xfId != null && _UIObjectState.xfId === xfId) {
					return xfClusterInstance;
				}

				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getUIObjectsByDataId = function(dataId) {
				var objectList = [];
				var i=0, j=0;
				var membersList;
				
				if (_UIObjectState.isExpanded) {
					for (i = 0; i < _UIObjectState.children.length; i++) {
						membersList = _UIObjectState.children[i].getUIObjectsByDataId(dataId);
						for (j = 0; j < membersList.length; j++) {
							objectList.push(membersList[j]);
						}
					}
				} else if (_UIObjectState.spec.parent.getUIType() === constants.MODULE_NAMES.MATCH) {
					for (i = 0; i < _UIObjectState.children.length; i++) {
						membersList = _UIObjectState.children[i].getUIObjectsByDataId(dataId);
						if (membersList.length > 0) {
							objectList.push(xfClusterInstance);
						}
					}
				}

				if (dataId === _UIObjectState.spec.dataId) {
					objectList.push(xfClusterInstance);
				}

				return objectList;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getParent = function() {
				return _UIObjectState.spec.parent;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setParent = function(xfUIObj){
				_UIObjectState.spec.parent = xfUIObj;
			};

			//----------------------------------------------------------------------------------------------------------

			/**
			 * Returns a map of all the links incident on the cluster.
			 * If the cluster is expanded, this returns a map of all
			 * the cluster CHILDREN's links.
			 * @returns {*}
			 */
			xfClusterInstance.getLinks = function() {

				if (_UIObjectState.isExpanded) {
					var links = {};

					for (var i = 0; i < _UIObjectState.children.length; i++) {
						var childLinks = _UIObjectState.children[i].getLinks();
						for (var xfId in childLinks) {
							if (childLinks.hasOwnProperty(xfId)) {
								links[xfId] = childLinks[xfId];
							}
						}
					}

					return links;
				}

				return _UIObjectState.links;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getIncomingLinks = function() {

				var xfId= null, i;
				var incomingLinks = {};

				if (_UIObjectState.isExpanded) {
					for (i = 0; i < _UIObjectState.children.length; i++) {
						var childLinks = _UIObjectState.children[i].getIncomingLinks();
						for (xfId in childLinks) {
							if (childLinks.hasOwnProperty(xfId)) {
								incomingLinks[xfId] = childLinks[xfId];
							}
						}
					}
				} else {
					for (xfId in _UIObjectState.links) {
						if (_UIObjectState.links.hasOwnProperty(xfId)) {
							var link = _UIObjectState.links[xfId];
							if (link.getDestination().getXfId() === _UIObjectState.xfId) {
								incomingLinks[link.getXfId()] = link;
							}
						}
					}
				}

				return incomingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getOutgoingLinks = function() {

				var i, xfId= null;
				var outgoingLinks = {};

				if (_UIObjectState.isExpanded) {
					for (i = 0; i < _UIObjectState.children.length; i++) {
						var childLinks = _UIObjectState.children[i].getOutgoingLinks();
						for (xfId in childLinks) {
							if (childLinks.hasOwnProperty(xfId)) {
								outgoingLinks[xfId] = childLinks[xfId];
							}
						}
					}
				} else {
					for (xfId in _UIObjectState.links) {
						if (_UIObjectState.links.hasOwnProperty(xfId)) {
							var link = _UIObjectState.links[xfId];
							if (link.getSource().getXfId() === _UIObjectState.xfId) {
								outgoingLinks[link.getXfId()] = link;
							}
						}
					}
				}

				return outgoingLinks;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.addLink = function(link) {

				if ((link.getSource().getXfId() !== this.getXfId() &&
					link.getDestination().getXfId() !== this.getXfId()) ||
					(link.getXfId() in _UIObjectState.links)
				) {
					return false;
				}

				_UIObjectState.links[link.getXfId()] = link;
				return true;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.removeLink = function(xfId) {

				var removedLink = false;

				if (_UIObjectState.links.hasOwnProperty(xfId)) {
					delete _UIObjectState.links[xfId];
					removedLink = true;
				} else {
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						removedLink = _UIObjectState.children[i].removeLink(xfId);
						if (removedLink) {
							break;
						}
					}
				}

				return removedLink;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.removeAllLinks = function(linkType) {
				var tempLinkMap = _.clone(_UIObjectState.links);
				for (var linkId in tempLinkMap) {
					if (tempLinkMap.hasOwnProperty(linkId)) {
						tempLinkMap[linkId].remove();
					}
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].removeAllLinks(linkType);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.collapseLinks = function(direction, deleteAfterCollapse) {

				var i;

				if (_UIObjectState.isExpanded) {

					for (i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].collapseLinks(direction, true);
					}

					if (_UIObjectState.children.length === 0) {
						aperture.pubsub.publish(
							appChannel.REMOVE_REQUEST,
							{
								xfIds : [this.getXfId()],
								dispose : true
							}
						);
					}

				} else {

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

							if (foundLink && !xfUtil.isUITypeDescendant(targetEntities[targetEntities.length-1], constants.MODULE_NAMES.FILE)) {
								link.remove();
							}
						}
					}

					for (i = 0; i < targetEntities.length; i++) {
						targetEntities[i].collapseLinks(direction, true);
					}

					if (deleteAfterCollapse) {
						if (_.size(_UIObjectState.links) === 0) {
							// Check if this card is a descendant of a match card.
							if (!xfUtil.isUITypeDescendant(this, constants.MODULE_NAMES.FILE)){
								this.getParent().removeChild(this.getXfId(), true, true, true);
							}
						}
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.isLinkedTo = function(uiObject) {
				var links = xfClusterInstance.getLinks();
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

			xfClusterInstance.remove = function(eventChannel, dispose) {
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
					aperture.log.error('Invalid or missing publish event. Unable to remove ' + MODULE_NAME + ': ' + _UIObjectState.xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.update = function(spec) {
				for (var key in spec) {
					if (spec.hasOwnProperty(key)) {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.updateToolbar = function(spec, recursiveUpdate) {
				for (var key in spec) {
					if (spec.hasOwnProperty(key)) {
						_UIObjectState.toolbarSpec[key] = spec[key];
					}
				}

				if (recursiveUpdate) {
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].updateToolbar(spec, recursiveUpdate);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.showDetails = function(bShow) {
				if (bShow != null){
					_UIObjectState.showDetails = bShow;

					for (var i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].showDetails(bShow);
					}
				}

				return _UIObjectState.showDetails;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getSpecs = function(bOnlyEmptySpecs) {

				var specs = [];

				if (bOnlyEmptySpecs) {
					if (_UIObjectState.spec.graphUrl === '') {
						specs.push(_.clone(_UIObjectState.spec));
					}
				} else {
					specs.push(_.clone(_UIObjectState.spec));
				}

				if (_UIObjectState.isExpanded) {

					for (var i = 0; i < _UIObjectState.children.length; i++) {
						var childSpecs = _UIObjectState.children[i].getSpecs(bOnlyEmptySpecs);
						for (var j = 0; j < childSpecs.length; j++) {
							specs.push(childSpecs[j]);
						}
					}
					return specs;
				}

				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getVisualInfo = function() {
				return _UIObjectState != null ? _.clone(_UIObjectState) : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.isHighlighted = function() {
				return _UIObjectState.isHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getInDegree = function() {
				return _UIObjectState.spec.inDegree;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getOutDegree = function() {
				return _UIObjectState.spec.outDegree;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getCount = function() {
				return _UIObjectState.spec.count;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getOwnerId = function() {
				return _UIObjectState.spec.ownerId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setOwnerId = function(ownerId) {
				_UIObjectState.spec.ownerId = ownerId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.highlightId = function(xfId) {

				var i;

				if (xfId == null) {
					_UIObjectState.isHighlighted = false;
					for (i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].highlightId(xfId);
					}
				} else if (_UIObjectState.xfId === xfId) {
					// local and children are highlighted
					if (_UIObjectState.isExpanded) {
						_UIObjectState.isHighlighted = true;

						for (i = 0; i < _UIObjectState.children.length; i++) {
							// give the children their id
							_UIObjectState.children[i].highlightId(_UIObjectState.children[i].getXfId());
						}

					} else if (!_UIObjectState.isHighlighted) {
						_UIObjectState.isHighlighted = true;
					}
				} else {
					// If this id belongs to this objects parent,
					// and that parent is expanded, the child
					// shall also inherit the highlight.
					if (xfUtil.isClusterTypeFromObject(this.getParent()) &&
						this.getParent().isExpanded() &&
						this.getParent().isHighlighted()
					){
						_UIObjectState.isHighlighted = true;
					}
					else {
						// local IS NOT highlighted
						if (_UIObjectState.isHighlighted) {
							_UIObjectState.isHighlighted = false;
						}
					}

					// child MAY be highlighted
					for (i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].highlightId(xfId);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.isSelected = function() {
				return _UIObjectState.isSelected;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setSelection = function(xfId) {

				if (xfId == null || _UIObjectState.xfId !== xfId) {
					if (_UIObjectState.isSelected) {
						_UIObjectState.isSelected = false;
					}
				} else {
					if (!_UIObjectState.isSelected) {
						_UIObjectState.isSelected = true;
					}
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setSelection(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.isHovered = function() {
				return _UIObjectState.isHovered;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setHovering = function(xfId) {

				if(!_UIObjectState.isExpanded) {
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
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject : xfClusterInstance, updateOnly: true});
					}
				} else {
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].setHovering(xfId);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setHidden = function(xfId, state) {

				var i;
				if (_UIObjectState.xfId === xfId) {
					if (_UIObjectState.isHidden !== state ) {

						_UIObjectState.isHidden = state;
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: xfClusterInstance});

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

				if (_UIObjectState.isExpanded) {
					for (i = 0; i < _UIObjectState.children.length; i++) {
						_UIObjectState.children[i].setHidden(xfId, state);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.expand = function() {

				if (_UIObjectState.isExpanded) {
					return;
				}

				for (var linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						_UIObjectState.links[linkId].remove();
					}
				}

				_UIObjectState.isExpanded = true;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.collapse = function() {

				if (!_UIObjectState.isExpanded) {
					return;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var childLinks = _UIObjectState.children[i].getLinks();
					for (var childLinkId in childLinks) {
						if (childLinks.hasOwnProperty(childLinkId)) {
							childLinks[childLinkId].remove();
						}
					}

					if (_UIObjectState.children[i].isSelected()) {
						_UIObjectState.children[i].setSelection(null);
					}
				}

				_UIObjectState.isExpanded = false;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setDuplicateCount = function(count) {

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

			xfClusterInstance.getVisibleDataIds = function() {

				var visibleDataIds = [];

				if (!_UIObjectState.isExpanded) {

					if (_UIObjectState.spec.dataId == null) {
						return visibleDataIds;
					}

					visibleDataIds.push(_UIObjectState.spec.dataId);
					return visibleDataIds;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {

					var childDataId =  _UIObjectState.children[i].getVisibleDataIds();
					for (var j = 0; j < childDataId.length; j++) {
						visibleDataIds.push(childDataId[j]);
					}
				}

				return visibleDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.cleanState = function() {

				_UIObjectState.xfId = '';
				_UIObjectState.UIType = MODULE_NAME;
				_UIObjectState.spec = xfClusterModule.getSpecTemplate();
				_UIObjectState.children = [];
				_UIObjectState.isExpanded = false;
				_UIObjectState.isSelected = false;
				_UIObjectState.isHighlighted = false;
				_UIObjectState.isHovered = false;
				_UIObjectState.showToolbar = false;
				_UIObjectState.showDetails = false;
				_UIObjectState.showSpinner = false;
				_UIObjectState.links = {};
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.saveState = function() {

				var i;
				var state = {};

				state['xfId'] = _UIObjectState.xfId;
				state['UIType'] = _UIObjectState.UIType;

				state['isExpanded'] = _UIObjectState.isExpanded;
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
				state['spec']['count'] = _UIObjectState.spec.count;
				state['spec']['icons'] = _UIObjectState.spec.icons;
				state['spec']['graphUrl'] = _UIObjectState.spec.graphUrl;
				state['spec']['duplicateCount'] = _UIObjectState.spec.duplicateCount;
				state['spec']['label'] = _UIObjectState.spec.label;
				state['spec']['confidenceInSrc'] = _UIObjectState.spec.confidenceInSrc;
				state['spec']['confidenceInAge'] = _UIObjectState.spec.confidenceInAge;
				state['spec']['flow'] = _UIObjectState.spec.flow;
				state['spec']['members'] = _UIObjectState.spec.members;
				state['spec']['inDegree'] = _UIObjectState.spec.inDegree;
				state['spec']['outDegree'] = _UIObjectState.spec.outDegree;
				if (_UIObjectState.spec.ownerId) {
					state['spec']['ownerId'] = _UIObjectState.spec.ownerId;
				}
				state['spec']['promptForDetails'] = _UIObjectState.spec.promptForDetails;

				state['children'] = [];
				for (i = 0; i < _UIObjectState.children.length; i++) {
					state['children'].push(_UIObjectState.children[i].saveState());
				}

				return state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.restoreHierarchy = function(state, workspace) {
				_UIObjectState.spec.parent = workspace.getUIObjectByXfId(state.spec.parent);
				if (_UIObjectState.isExpanded) {
					for (var i = 0; i < state.children.length; i++) {

						var childState = state.children[i];
						var childObject = workspace.getUIObjectByXfId(childState.xfId);
						if (childObject) {
							childObject.restoreHierarchy(childState, workspace);
						}
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.dispose = function() {

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

				var kids = _UIObjectState.children;
				_UIObjectState.children = [];

				for (var i = 0; i < kids.length; i++) {
					kids[i].dispose();
				}

				for (var linkId in _UIObjectState.links) {
					if (_UIObjectState.links.hasOwnProperty(linkId)) {
						_UIObjectState.links[linkId].remove();
					}
				}
				_UIObjectState.links = null;

				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.sortChildren = function(sortFunction) {
				_UIObjectState.children.sort(sortFunction);

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].sortChildren(sortFunction);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getTotalLinkAmount = function(includeIncoming, includeOutgoing) {

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

			xfClusterInstance.updatePromptState = function(dataId, state) {
				if (_UIObjectState.spec.dataId === dataId) {
					_UIObjectState.spec.promptForDetails = state;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].updatePromptState(dataId, state);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getPromptState = function(xfId) {
				return _UIObjectState.spec.promptForDetails;
			};

			//--------------------------------
			// Cluster Specific Implementation
			//--------------------------------

			xfClusterInstance.showSpinner = function(bShow) {
				if (bShow != null){
					if (_UIObjectState.isExpanded) {
						for (var i = 0; i < _UIObjectState.children.length; i++) {
							_UIObjectState.children[i].showSpinner(bShow);
						}
					} else {
						if (_UIObjectState.showSpinner !== bShow) {
							_UIObjectState.showSpinner = bShow;
						}
					}
				}

				return _UIObjectState.showSpinner;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.showToolbar = function(bShow) {
				if (bShow != null){
					if (_UIObjectState.isExpanded) {
						for (var i = 0; i < _UIObjectState.children.length; i++) {
							_UIObjectState.children[i].showToolbar(bShow);
						}
					} else {
						if (_UIObjectState.showToolbar !== bShow) {
							_UIObjectState.showToolbar = bShow;
						}
					}
				}

				return _UIObjectState.showToolbar;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getChildren = function() {
				return _.clone(_UIObjectState.children);
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.isExpanded = function() {
				return _UIObjectState.isExpanded;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getLeftOperation = function() {
				return _UIObjectState.spec.leftOperation;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getRightOperation = function() {
				return _UIObjectState.spec.rightOperation;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setLeftOperation = function(op) {
				_UIObjectState.spec.leftOperation = op;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.setRightOperation = function(op) {
				_UIObjectState.spec.rightOperation = op;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.hasSelectedChild = function() {
				var childSelected = false;

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					if (_UIObjectState.children[i].isSelected()) {
						childSelected = true;
						break;
					}
				}

				return childSelected;
			};

			//----------------------------------------------------------------------------------------------------------

			return xfClusterInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfClusterModule.getSpecTemplate = function() {

			var specTemplate = {};
			$.extend(true, specTemplate, xfClusterSpecTemplate);
			var chartSpecTemplate = {};
			$.extend(true, chartSpecTemplate, xfClusterChartSpecTemplate);
			specTemplate.chartSpec = chartSpecTemplate;

			return specTemplate;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfClusterModule.getToolbarSpecTemplate = function() {

			var specTemplate = {};
			$.extend(true, specTemplate, xfClusterToolBarSpecTemplate);

			return specTemplate;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfClusterModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfClusterModule;
	}
);
