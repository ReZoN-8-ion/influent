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
		'lib/interfaces/xfUIObject', 'lib/communication/applicationChannels', 'lib/util/GUID', 'lib/util/xfUtil',
		'lib/models/xfClusterBase', 'lib/constants',
		'underscore'
	],
	function(
		xfUIObject, appChannel, guid, xfUtil,
		xfClusterBase, constants
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.SUMMARY_CLUSTER;

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfSummaryCluster = {};

		//--------------------------------------------------------------------------------------------------------------

		xfSummaryCluster.createInstance = function(spec){

			//------------------
			// private variables
			//------------------

			var guidId = 'summary_' + guid.generateGuid();

			var _UIObjectState = {
				xfId                : guidId,
				UIType              : MODULE_NAME,
				spec                : _.clone(spec),
				toolbarSpec         : xfSummaryCluster.getSpecTemplate(),
				children            : [],
				isExpanded          : false,
				isSelected          : false,
				isHighlighted       : false,
				isHovered			: false,
				isHidden			: false,
				showToolbar         : false,
				showDetails         : false,
				showSpinner         : false,
				links               : {}
			};
			_UIObjectState.spec.type = MODULE_NAME;

			//----------------
			// private methods
			//----------------

			//---------------
			// public methods
			//---------------

			// create new object instance
			var xfClusterInstance = xfClusterBase.createInstance(_UIObjectState);

			//----------
			// Overrides
			//----------

			xfClusterInstance.clone = function() {

				// create cloned object
				var clonedObject = xfSummaryCluster.createInstance(_UIObjectState.spec);

				// add necessary UI state
				clonedObject.showDetails(_UIObjectState.showDetails);

				// make the cloned object an orphan
				clonedObject.setParent(null);

				// return cloned object
				return clonedObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.expand = function() {
				return;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.collapse = function() {
				return;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {
				return;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.removeAllChildren = function() {
				return;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.insert = function(xfUIObj, beforeXfUIObj00) {
				return;
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

			xfClusterInstance.restoreVisualState = function(state) {

				this.cleanState();

				_UIObjectState.xfId = state.xfId;
				_UIObjectState.UIType = state.UIType;

				_UIObjectState.isExpanded = state.isExpanded;
				_UIObjectState.isSelected = state.isSelected;
				_UIObjectState.isHighlighted = state.isHighlighted;
				_UIObjectState.showToolbar = state.showToolbar;
				_UIObjectState.showDetails = state.showDetails;
				_UIObjectState.toolbarSpec = state.toolbarSpec;

				_UIObjectState.spec.dataId = state.spec.dataId;
				_UIObjectState.spec.type = state.spec.type;
				_UIObjectState.spec.accounttype = state.spec.accounttype;
				_UIObjectState.spec.count = state.spec.count;
				_UIObjectState.spec.icons = state.spec.icons;
				_UIObjectState.spec.graphUrl = state.spec.graphUrl;
				_UIObjectState.spec.duplicateCount = state.spec.duplicateCount;
				_UIObjectState.spec.label = state.spec.label;
				_UIObjectState.spec.confidenceInSrc = state.spec.confidenceInSrc;
				_UIObjectState.spec.confidenceInAge = state.spec.confidenceInAge;
				_UIObjectState.spec.flow = state.spec.flow;
				_UIObjectState.spec.members = state.spec.members;
				_UIObjectState.spec.inDegree = state.spec.inDegree;
				_UIObjectState.spec.outDegree = state.spec.outDegree;
				_UIObjectState.spec.ownerId = state.spec.ownerId;
				_UIObjectState.spec.promptForDetails = state.spec.promptForDetails;

				_UIObjectState.children = [];
			};

			//----------------------------------------------------------------------------------------------------------

			return xfClusterInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfSummaryCluster.getSpecTemplate = function() {
			var spec = xfClusterBase.getSpecTemplate();
			spec.type = MODULE_NAME;
			return spec;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfSummaryCluster.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfSummaryCluster;
	}
);
