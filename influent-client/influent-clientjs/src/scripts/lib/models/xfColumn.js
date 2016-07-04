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
		'lib/interfaces/xfUIObject', 'lib/communication/applicationChannels', 'lib/util/GUID', 'lib/constants',
		'lib/models/xfCard', 'lib/models/xfImmutableCluster', 'lib/models/xfMutableCluster', 'lib/models/xfSummaryCluster',
		'lib/models/xfFile', 'lib/ui/xfLinkType', 'lib/models/xfLink', 'lib/util/xfUtil'
	],
	function(
		xfUIObject, appChannel, guid, constants,
		xfCard, xfImmutableCluster, xfMutableCluster, xfSummaryCluster,
		xfFile, xfLinkType, xfLink, xfUtil
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.COLUMN;

		var xfColumnSpecTemplate = {
			parent : {},
			dataId : ''
		};

		//--------------------------------------------------------------------------------------------------------------
		// Private Methods
		//--------------------------------------------------------------------------------------------------------------



		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfColumnModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfColumnModule.createInstance = function(spec) {

			// assume default if not specified.
			if (!spec) {
				spec = this.getSpecTemplate();
			}

			var _UIObjectState = {
				xfId : '',
				UIType : MODULE_NAME,
				spec : {},
				children : []
			};

			//---------------
			// Initialization
			//---------------

			// set the xfId
			_UIObjectState.xfId = 'column_'+ guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					_UIObjectState.spec[key] = spec[key];
				}
			}

			_UIObjectState.spec.dataId = _UIObjectState.xfId;

			// create new object instance
			var xfColumnInstance = {};
			xfUIObject.implementedBy(xfColumnInstance, MODULE_NAME);

			//---------------
			// Public methods
			//---------------

			xfColumnInstance.clone = function() {

				// create cloned object
				var clonedObject = xfColumnModule.createInstance(_UIObjectState.spec);

				// add cloned children
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					clonedObject.insert(_UIObjectState.children[i].clone());
				}

				// make the cloned object an orphan
				clonedObject.setParent(null);

				// return cloned object
				return clonedObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getDataId = function() {
				return _UIObjectState.spec.dataId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getLabel = function() {
				return 'Column Label';
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getUIObjectByXfId = function(xfId) {
				if (xfId != null && _UIObjectState.xfId === xfId) {
					return xfColumnInstance;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var object = _UIObjectState.children[i].getUIObjectByXfId(xfId);
					if (object != null) {
						return object;
					}
				}

				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getUIObjectsByDataId = function(dataId) {
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

			xfColumnInstance.getParent = function() {
				return _UIObjectState.spec.parent;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.setParent = function(xfUIObj){
				_UIObjectState.spec.parent = xfUIObj;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.isEmpty = function() {
				return _UIObjectState.children.length === 0;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getLinks = function() {

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

			xfColumnInstance.collapseLinks = function(direction) {
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapseLinks".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.remove = function(eventChannel, dispose) {
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

			xfColumnInstance.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					if (_UIObjectState.children[i].getXfId() === xfId) {

						_UIObjectState.children[i].setParent(null);

						if (disposeObject) {
							_UIObjectState.children[i].dispose();
							_UIObjectState.children[i] = null;
						}
						_UIObjectState.children.splice(i, 1);

						if (_UIObjectState.children == null) {
							_UIObjectState.children = [];
						}

						break;
					}

					if (_UIObjectState.children.length === 0 &&
						removeIfEmpty
					) {
						aperture.pubsub.publish(
							appChannel.REMOVE_REQUEST,
							{
								xfIds : [_UIObjectState.xfId],
								dispose : true
							}
						);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.removeAllChildren = function() {

				if (_UIObjectState.children.length === 0) {
					return;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].dispose();
					_UIObjectState.children[i] = null;
				}

				_UIObjectState.children.length = 0;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.insert = function(xfUIObj, beforeXfUIObj00) {

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
				if (xfUIObj.getUIType() === 'xfCard'){
					xfUIObj.updateToolbar(
						{
							allowFile: true,
							allowFocus: true,
							allowSearch: false,
							allowClose: true
						},
						false
					);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.showDetails = function(bShow) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].showDetails(bShow);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.showSpinner = function(bShow) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].showSpinner(bShow);
				}
			};

			//--------------------------------------------------------------------------------------------------------------

			xfColumnInstance.getChildren = function() {
				return _.clone(_UIObjectState.children);
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getSpecs = function(bOnlyEmptySpecs) {

				var specs = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var childSpecs = _UIObjectState.children[i].getSpecs(bOnlyEmptySpecs);
					for (var j = 0; j < childSpecs.length; j++) {
						specs.push(childSpecs[j]);
					}
				}

				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getVisualInfo = function() {
				return _UIObjectState != null ? _.clone(_UIObjectState) : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.highlightId = function(xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].highlightId(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.isSelected = function() {
				// Columns cannot be selected, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "isSelected".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.setSelection = function(xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setSelection(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.isHovering = function() {
				// Columns cannot be selected, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "isSelected".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.setHovering = function(xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setHovering(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.setHidden = function(xfId, state) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setHidden(xfId, state);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.expand = function() {
				// Column objects cannot be expanded, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "expand".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.collapse = function() {
				// Column objects cannot be collapsed, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapse".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.setDuplicateCount = function(count) {
				// do nothing
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.addFileLinksTo = function(fileUIObject, bIsFileSource) {

				var i;
				var fileChildren = [];

				for (i = 0; i < _UIObjectState.children.length; i++) {
					var child = _UIObjectState.children[i];
					if (child.getUIType() === constants.MODULE_NAMES.FILE) {
						fileChildren.push(child);
					}
				}

				for (i = 0; i < fileChildren.length; i++) {
					if (bIsFileSource) {
						xfLink.createInstance(fileUIObject, fileChildren[i], 1, 1, xfLinkType.FILE);
					} else {
						xfLink.createInstance(fileChildren[i], fileUIObject, 1, 1, xfLinkType.FILE);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.cleanColumn = function(unfiledOnly, exceptXfIds) {
				var removedDataIds = [];
				if (_UIObjectState.children && _UIObjectState.children.length > 0) {
					var i;
					var uiObj;
					var objectsToRemove = [];

					for (i = 0; i < _UIObjectState.children.length; i++) {
						uiObj = _UIObjectState.children[i];

						if (exceptXfIds && exceptXfIds.indexOf(uiObj.getXfId()) !== -1) {
							continue;
						}

						if (unfiledOnly && ((uiObj.getUIType() === constants.MODULE_NAMES.FILE || xfUtil.isUITypeDescendant(uiObj, constants.MODULE_NAMES.MATCH)))) {
							continue;
						}

						objectsToRemove.push(uiObj.getXfId());
						removedDataIds.push(uiObj.getDataId());
					}
					aperture.pubsub.publish(
						appChannel.REMOVE_REQUEST,
						{
							xfIds : objectsToRemove,
							dispose : true
						}
					);
				}
				return removedDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getVisibleDataIds = function() {

				var visibleDataIds = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {

					var childDataId =  _UIObjectState.children[i].getVisibleDataIds();
					for (var j = 0; j < childDataId.length; j++) {
						visibleDataIds.push(childDataId[j]);
					}
				}

				return visibleDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.cleanState = function() {

				_UIObjectState.xfId = '';
				_UIObjectState.UIType = MODULE_NAME;
				_UIObjectState.spec = {};
				_UIObjectState.children = [];
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.saveState = function() {

				var state = {};

				state['xfId'] = _UIObjectState.xfId;
				state['UIType'] = _UIObjectState.UIType;

				state['spec'] = {};
				state['spec']['parent'] = _UIObjectState.spec.parent.getXfId();
				state['spec']['dataId'] = _UIObjectState.spec.dataId;
				
				state['children'] = [];
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					state['children'].push(_UIObjectState.children[i].saveState());
				}

				return state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.restoreVisualState = function(state) {

				_UIObjectState.xfId = state.xfId;
				_UIObjectState.UIType = state.UIType;

				_UIObjectState.spec = {
					dataId: state.spec.dataId
				};

				_UIObjectState.children = [];
				var cardSpec, cardUIObj;
				var clusterSpec, clusterUIObj;
				var fileSpec, fileUIObj;
				
				for (var i = 0; i < state.children.length; i++) {
					if (state.children[i].UIType === constants.MODULE_NAMES.ENTITY) {
						cardSpec = xfCard.getSpecTemplate();
						cardUIObj = xfCard.createInstance(cardSpec);
						cardUIObj.cleanState();
						cardUIObj.restoreVisualState(state.children[i]);
						this.insert(cardUIObj, null);
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
					} else if (state.children[i].UIType === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
						clusterSpec = xfSummaryCluster.getSpecTemplate();
						clusterUIObj = xfSummaryCluster.createInstance(clusterSpec);
						clusterUIObj.cleanState();
						clusterUIObj.restoreVisualState(state.children[i]);
						this.insert(clusterUIObj, null);
					} else if (state.children[i].UIType === constants.MODULE_NAMES.FILE) {
						fileSpec = xfFile.getSpecTemplate();
						fileUIObj = xfFile.createInstance(fileSpec);
						fileUIObj.cleanState();
						fileUIObj.restoreVisualState(state.children[i]);
						this.insert(fileUIObj, null);
					} else {
						aperture.log.error('cluster children should only be of type ' +
							constants.MODULE_NAMES.ENTITY + ', ' +
							constants.MODULE_NAMES.IMMUTABLE_CLUSTER + ', ' +
							constants.MODULE_NAMES.SUMMARY_CLUSTER + ', ' +
							constants.MODULE_NAMES.MUTABLE_CLUSTER + ' or ' +
							constants.MODULE_NAMES.FILE + '.'
						);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.restoreHierarchy = function(state, workspace) {
				_UIObjectState.spec.parent = workspace.getUIObjectByXfId(state.spec.parent);
				for (var i = 0; i < state.children.length; i++) {

					var childState = state.children[i];
					var childObject = workspace.getUIObjectByXfId(childState.xfId);
					childObject.restoreHierarchy(childState, workspace);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.dispose = function() {

				_UIObjectState.spec.parent = null;
				_UIObjectState.spec = null;

				var kids = _UIObjectState.children;
				_UIObjectState.children = [];

				for (var i = 0; i < kids.length; i++) {
					kids[i].dispose();
				}

				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.updatePromptState = function(dataId, state) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].updatePromptState(dataId, state);
				}
			};

			//----------------------------------------------------------------------------------------------------------
			// Column specific functions
			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.sortChildren = function(sortFunction) {
				_UIObjectState.children.sort(sortFunction);

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].sortChildren(sortFunction);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.getContextIds = function() {

				var contextIds = [];
				contextIds.push(this.getDataId());
				for (var i = 0; i < _UIObjectState.children.length; i++) {

					if (_UIObjectState.children[i].getUIType() === constants.MODULE_NAMES.FILE) {
						contextIds.push(_UIObjectState.children[i].getDataId());
					}
				}

				return contextIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfColumnInstance.prepareColumnForServerUpdate = function() {
				if (_UIObjectState.children) {
					for (var i = 0; i < _UIObjectState.children.length; i++) {
						var uiObj = _UIObjectState.children[i];
						if (uiObj.getUIType() !== constants.MODULE_NAMES.FILE && !xfUtil.isUITypeDescendant(uiObj, constants.MODULE_NAMES.MATCH)) {
							uiObj.dispose();
							uiObj = null;
							_UIObjectState.children.splice(i, 1);
							i--;

							if (_UIObjectState.children == null) {
								_UIObjectState.children = [];
								return;
							}
						}
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			return xfColumnInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfColumnModule.getSpecTemplate = function() {

			var template = {};
			_.extend(template, xfColumnSpecTemplate);

			return template;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfColumnModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfColumnModule;
	}
);
