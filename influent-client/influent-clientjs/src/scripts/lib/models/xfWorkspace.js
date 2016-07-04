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
		'lib/interfaces/xfUIObject',
		'lib/util/GUID',
		'lib/models/xfColumn',
		'lib/util/xfUtil',
		'lib/constants'
	],
	function (
		xfUIObject,
		guid,
		xfColumn,
		xfUtil,
		constants
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.WORKSPACE;

		var xfWorkspaceSpecTemplate = {
			dataId : ''
		};

		//--------------------------------------------------------------------------------------------------------------
		// Private Methods
		//--------------------------------------------------------------------------------------------------------------



		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfWorkspaceModule = {};

		xfWorkspaceModule.createInstance = function(spec){

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
			_UIObjectState.xfId = 'workspace_'+ guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					_UIObjectState.spec[key] = spec[key];
				}
			}

			_UIObjectState.spec.dataId = _UIObjectState.xfId;

			// create new object instance
			var xfWorkspaceInstance = {};
			xfUIObject.implementedBy(xfWorkspaceInstance, MODULE_NAME);


			//---------------
			// Public methods
			//---------------

			xfWorkspaceInstance.clone = function () {
				aperture.log.error('Unable to clone workspace');
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getXfId = function () {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getDataId = function () {
				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getUIType = function () {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getUIObjectByXfId = function (xfId) {
				if (xfId != null && _UIObjectState.xfId === xfId) {
					return xfWorkspaceInstance;
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

			xfWorkspaceInstance.getUIObjectsByDataId = function (dataId) {
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

			xfWorkspaceInstance.getParent = function () {
				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getLinks = function () {

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

			xfWorkspaceInstance.collapseLinks = function (direction) {
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapseLinks".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.remove = function () {
				// Workspaces cannot be removed, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "remove".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.removeChild = function (xfId, disposeObject, preserveLinks, removeIfEmpty) {

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
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.removeAllChildren = function () {

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

			xfWorkspaceInstance.insert = function (xfUIObj, beforeXfUIObj00) {

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
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.update = function (spec) {
				for (var key in spec) {
					if (spec.hasOwnProperty(key)) {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.replace = function (spec) {
				_UIObjectState.spec = this.getSpecTemplate();
				for (var key in spec) {
					if (spec.hasOwnProperty(key)) {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.showDetails = function (bShow) {
				if (bShow == null) {
					return _UIObjectState.showDetails;
				}
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].showDetails(bShow);
				}
			};

			//--------------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getChildren = function () {
				return _.clone(_UIObjectState.children);
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getSpecs = function (bOnlyEmptySpecs) {

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

			xfWorkspaceInstance.getVisualInfo = function () {
				return _UIObjectState != null ? _.clone(_UIObjectState) : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.setFocus = function (xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].highlightId(xfId);
				}
			};
			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.isSelected = function () {
				// Workspaces cannot be selected, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "isSelected".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.setSelection = function (xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setSelection(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.setHovering = function (xfId) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setHovering(xfId);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.setHidden = function (xfId, state) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].setHidden(xfId, state);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.expand = function () {
				// Workspace objects cannot be expanded, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "expand".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.collapse = function () {
				// Workspace objects cannot be collapsed, so we throw an error to indicate this.
				aperture.log.error(MODULE_NAME + ': call to unimplemented method "collapse".');
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.setDuplicateCount = function (count) {
				// do nothing
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getVisibleDataIds = function () {

				var containedDataIds = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {

					var childDataId = _UIObjectState.children[i].getVisibleDataIds();
					for (var j = 0; j < childDataId.length; j++) {
						containedDataIds.push(childDataId[j]);
					}
				}

				return containedDataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.cleanState = function () {
				_UIObjectState.xfId = '';
				_UIObjectState.UIType = MODULE_NAME;
				_UIObjectState.children = [];
				_UIObjectState.focus = null;
				_UIObjectState.showDetails = false;
				_UIObjectState.dates = {startDate: '', endDate: '', numBuckets: 0, duration: ''};
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.saveState = function () {

				// clone the whole state
				var state = _.clone(_UIObjectState);

				// delete any state that we do not want cloned
				delete state['sessionId'];
				delete state['childModule'];
				delete state['singleton'];
				delete state['subscriberTokens'];

				// add the spec
				state['spec'] = {};
				$.extend(true, state['spec'], _UIObjectState.spec);

				// add the selected UI object if not null
				state['selectedUIObject'] = null;
				if (_UIObjectState.selectedUIObject != null) {
					state['selectedUIObject'] = _UIObjectState.selectedUIObject;
				}

				// add children
				state['children'] = [];
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					state['children'].push(_UIObjectState.children[i].saveState());
				}

				return state;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.restoreVisualState = function (state) {
				_UIObjectState.xfId = state.xfId;
				_UIObjectState.UIType = state.UIType;
				_UIObjectState.focus = state.focus;
				_UIObjectState.showDetails = state.showDetails;
				_UIObjectState.footerDisplay = state.footerDisplay;

				_UIObjectState.dates.startDate = new Date(state.dates.startDate);
				_UIObjectState.dates.endDate = new Date(state.dates.endDate);
				_UIObjectState.dates.numBuckets = state.dates.numBuckets;
				_UIObjectState.dates.duration = state.dates.duration;

				_UIObjectState.selectedUIObject = state.selectedUIObject;


				_UIObjectState.children = [];
				for (var i = 0; i < state.children.length; i++) {
					if (state.children[i].UIType === constants.MODULE_NAMES.COLUMN) {
						var columnSpec = xfColumn.getSpecTemplate();
						var columnUIObj = xfColumn.createInstance(_.isEmpty(columnSpec) ? '' : columnSpec);
						columnUIObj.cleanState();
						columnUIObj.restoreVisualState(state.children[i]);
						this.insert(columnUIObj, null);
					} else {
						aperture.log.error('workspace children should only be of type ' + constants.MODULE_NAMES.COLUMN + '.');
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.restoreHierarchy = function (state, workspace) {

				for (var i = 0; i < state.children.length; i++) {

					var childState = state.children[i];
					var childObject = workspace.getUIObjectByXfId(childState.xfId);
					childObject.restoreHierarchy(childState, workspace);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.dispose = function () {

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].dispose();
					_UIObjectState.children[i] = null;
				}
				_UIObjectState.children = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.updatePromptState = function(dataId, state) {
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].updatePromptState(dataId, state);
				}
			};

			//----------------------------------------------------------------------------------------------------------
			// Workspace specific functions
			//----------------------------------------------------------------------------------------------------------

			xfWorkspaceInstance.getContextIds = function () {

				var contextIds = [];
				for (var i = 0; i < _UIObjectState.children.length; i++) {

					var containedContextIds = _UIObjectState.children[i].getContextIds();
					for (var j = 0; j < containedContextIds.length; j++) {
						contextIds.push(containedContextIds[j]);
					}
				}

				return contextIds;
			};

			return xfWorkspaceInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfWorkspaceModule.getSpecTemplate = function() {

			var template = {};
			_.extend(template, xfWorkspaceSpecTemplate);

			return template;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfWorkspaceModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfWorkspaceModule;
	}
);
