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
		'lib/constants',
		'lib/communication/accountsViewChannels',
		'lib/interfaces/xfResultObject'
	],
	function(
		constants,
		accountsChannel,
		xfUIObject
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.RESULT_BASE;

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfResultModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.createInstance = function(uiObjectState){

			//----------------------------------------------------------------------------------------------------------
			// Initialization
			//----------------------------------------------------------------------------------------------------------

			var _UIObjectState = uiObjectState;

			// create new object instance
			var xfInstance = {};
			xfUIObject.implementedBy(xfInstance, MODULE_NAME);

			//----------------------------------------------------------------------------------------------------------
			// Public methods
			//----------------------------------------------------------------------------------------------------------

			xfInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getDataId = function() {
				return _UIObjectState.spec.dataId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getResultByXfId = function(xfId) {
				return (xfId != null && _UIObjectState.xfId === xfId) ? xfInstance : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getResultByDataId = function(dataId) {
				return (dataId != null && _UIObjectState.spec.dataId != null && _UIObjectState.spec.dataId === dataId) ? xfInstance : null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.update = function(spec) {
				for (var key in spec) {
					if ( spec.hasOwnProperty(key) ) {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getSpecs = function(bOnlyEmptySpecs) {
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

			xfInstance.dispose = function() {
				_UIObjectState.spec = null;
				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.setVisibility = function(isVisible, notify) {
				var hasChanged = false;
				if (_UIObjectState.isVisible !== isVisible) {
					_UIObjectState.isVisible = isVisible;
					hasChanged = true;
				}

				if (notify && hasChanged) {
					aperture.pubsub.publish(accountsChannel.RESULT_VISIBILITY_CHANGE);
				}

				return hasChanged;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.numVisible = function() {
				return _UIObjectState.isVisible ? 1 : 0;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.numResults = function() {
				return 1;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.showMoreResults = function(numResultsToShow) {

				if (numResultsToShow <= 0) {
					return 0;
				}

				var localNumResultsToShow = numResultsToShow;
				if (localNumResultsToShow > 0 && !_UIObjectState.isVisible) {
					_UIObjectState.isVisible = true;
					localNumResultsToShow--;
				}

				return localNumResultsToShow;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.setSelected = function(xfId, isSelected) {
				if (_UIObjectState.xfId === xfId) {
					_UIObjectState.isSelected = isSelected;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getSelectedDataIds = function() {
				var dataIds = [];
				if (_UIObjectState.isSelected) {
					dataIds.push(_UIObjectState.spec.dataId);
				}
				return dataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getSelectedSpecs = function() {
				var specs = [];
				if (_UIObjectState.isSelected) {
					specs.push(_.clone(_UIObjectState.spec));
				}
				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.setExpanded = function(/*xfId, isExpanded*/) {};

			//----------------------------------------------------------------------------------------------------------
			// Result specific methods
			//----------------------------------------------------------------------------------------------------------

			xfInstance.isVisible = function() {
				return _UIObjectState.isVisible;
			};

			//----------------------------------------------------------------------------------------------------------

			return xfInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfResultModule;
	}
);
