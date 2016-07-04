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
		'lib/communication/accountsViewChannels'
	],
	function(
		constants,
		accountsChannel
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.SEARCH_RESULT_BASE;
		var MAX_SHOWN_ORDERING_FIELDS = 3;

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfResultModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.createInstance = function(uiObjectState, searchParams){

			var _UIObjectState = uiObjectState;

			// create new object instance
			var xfInstance = {};

			//----------------------------------------------------------------------------------------------------------
			// Public methods
			//----------------------------------------------------------------------------------------------------------

			xfInstance.getXfId = function() {
				return _UIObjectState.xfId;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getUIType = function() {
				return _UIObjectState.UIType;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getResultByXfId = function(xfId) {

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var object = _UIObjectState.children[i].getResultByXfId(xfId);
					if (object != null) {
						return object;
					}
				}

				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getResultByDataId = function(dataId) {

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var object = _UIObjectState.children[i].getResultByDataId(dataId);
					if (object != null) {
						return object;
					}
				}

				return null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.dispose = function() {

				var kids = _UIObjectState.children;
				_UIObjectState.children = [];

				for (var i = 0; i < kids.length; i++) {
					kids[i].dispose();
					kids[i] = null;
				}

				_UIObjectState = null;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getTotalSearchResults = function() {
				return _UIObjectState.totalResults;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getVisibleResults = function() {
				var numVisible = 0;

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					numVisible += _UIObjectState.children[i].numVisible();
				}

				return numVisible;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getNumResults = function() {
				var numResults = 0;

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					numResults += _UIObjectState.children[i].numResults();
				}

				return numResults;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.setVisibility = function(isVisible, notify) {
				var hasChanged = false;
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					if (_UIObjectState.children[i].setVisibility(isVisible, false)) {
						hasChanged = true;
					}
				}

				if (notify && hasChanged) {
					aperture.pubsub.publish(accountsChannel.RESULT_VISIBILITY_CHANGE);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getSummaryInformation = function() {
				var sortByLabel = null;

				for (var i = 0; i < _UIObjectState.headers.orderBy.length; i++) {
					var orderBy = _UIObjectState.headers.orderBy[i];
					var orderByText = orderBy.propertyKey;
					var prop = searchParams.getProperty(orderBy.propertyKey);
					if (prop) {
						orderByText = prop.friendlyText ? prop.friendlyText : orderByText;
					}

					if (i >= MAX_SHOWN_ORDERING_FIELDS) {
						var remaining = _UIObjectState.headers.orderBy.length - MAX_SHOWN_ORDERING_FIELDS;
						sortByLabel += ' (and ' + remaining + ' other' + (remaining > 1 ? 's' : '') +')';
						break;
					}

					if (sortByLabel === null) {
						sortByLabel = orderByText;
					} else {
						sortByLabel += ', ' + orderByText;
					}
				}
				
				var sumTotal = this.getTotalSearchResults();
				var hasResults = false;
				var sumVisible = 0;
				if (sumTotal > 0) {
					hasResults = true;
					sumVisible = this.getVisibleResults();
				}

				return {
					results : hasResults,
					sortedBy : sortByLabel,
					sumVisible : sumVisible,
					sumTotal : sumTotal
				};
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getHeaderPropertyIdList = function() {
				var propertyList = [];

				for (var i = 0; i < _UIObjectState.headers.columns.length; i++) {
					var columnObject = _UIObjectState.headers.columns[i];
					propertyList.push(columnObject.properties);
				}

				return propertyList;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.showMoreResults = function(numResultsToShow) {
				if (numResultsToShow <= 0) {
					return;
				}

				var localNumResultsToShow = numResultsToShow;
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					localNumResultsToShow = _UIObjectState.children[i].showMoreResults(localNumResultsToShow);

					if (localNumResultsToShow <= 0) {
						return;
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getChildren = function() {
				return _.clone(_UIObjectState.children);
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getNumChildren = function() {
				return _UIObjectState.children.length;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.setSelected = function(xfId, isSelected) {
				if (_UIObjectState.xfId === xfId) {
					aperture.util.forEach(_UIObjectState.children, function(child) {
						child.setSelected(child.getXfId(), isSelected);
					});
				} else {
					aperture.util.forEach(_UIObjectState.children, function(child) {
						child.setSelected(xfId, isSelected);
					});
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getSelectedDataIds = function() {
				var dataIds = [];
				aperture.util.forEach(_UIObjectState.children, function(child) {
					aperture.util.forEach(child.getSelectedDataIds(), function(dataId) {
						dataIds.push(dataId);
					});
				});

				return dataIds;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getSelectedSpecs = function() {
				var specs = [];
				aperture.util.forEach(_UIObjectState.children, function(child) {
					aperture.util.forEach(child.getSelectedSpecs(), function(result) {
						specs.push(result);
					});
				});

				return specs;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.setExpanded = function(xfId, isExpanded) {
				aperture.util.forEach(_UIObjectState.children, function(child) {
					child.setExpanded(xfId, isExpanded);
				});
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
