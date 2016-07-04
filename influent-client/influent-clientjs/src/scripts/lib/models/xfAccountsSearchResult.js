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
		'lib/models/xfSearchResultBase',
		'lib/models/xfEntityResultCluster',
		'lib/models/xfEntityResult',
		'lib/util/GUID'
	],
	function(
		constants,
		accountsChannel,
		xfSearchResultBase,
		clusterModel,
		resultModel,
		guid
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.ACCOUNTS_SEARCH_RESULT;

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfResultModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.createInstance = function(searchResult, searchParams){

			//----------------------------------------------------------------------------------------------------------
			// Initialization
			//----------------------------------------------------------------------------------------------------------

			var _UIObjectState = {
				xfId     : '',
				UIType   : MODULE_NAME,
				children : [],
				headers  : {},
				totalResults : 0,
				matchScores : {}
			};

			// set the xfId
			_UIObjectState.xfId = 'search_result_' + guid.generateGuid();

			for (var i = 0; i < searchResult.data.length; i++) {
				if (searchResult.data[i].hasOwnProperty('groupKey')) {
					_UIObjectState.children.push(clusterModel.createInstance(searchResult.data[i]));
				} else {
					for (var j = 0; j < searchResult.data[i].items.length; j++) {
						_UIObjectState.children.push(resultModel.createInstance(searchResult.data[i].items[j]));
					}
				}
			}

			_UIObjectState.headers = searchResult.headers;

			_UIObjectState.totalResults = searchResult.totalResults;

			_UIObjectState.matchScores = searchResult.matchScores;

			_UIObjectState.levelOfDetail = searchResult.detailLevel;

			// create new object instance
			var xfInstance = xfSearchResultBase.createInstance(_UIObjectState, searchParams);

			//----------------------------------------------------------------------------------------------------------
			// Public methods
			//----------------------------------------------------------------------------------------------------------

			xfInstance.getHeaderInformation = function() {
				var columnInfo = [];
				var i, property;

				var numNonImageHeaders = 0;
				for (i = 0; i < _UIObjectState.headers.properties.length; i++) {
					property = _UIObjectState.headers.properties[i];
					if (property.propertyType !== 'IMAGE') {
						numNonImageHeaders++;
					}
				}

				var colWidth = (100 / Math.max(1,numNonImageHeaders)) + '%';

				var orderFunc = function(orderBy) {
					if (orderBy.propertyKey === property.key) {
						if (orderBy.ascending) {
							orderAsc = true;
						} else {
							orderDesc = true;
						}
						return true;
					}
				};

				// get column and sortBy labels
				for (i = 0; i < _UIObjectState.headers.properties.length; i++) {
					property = _UIObjectState.headers.properties[i];

					var orderAsc = false;
					var orderDesc = false;
					aperture.util.forEachUntil(_UIObjectState.headers.orderBy, orderFunc);
					
					var isImage = (property.propertyType === 'IMAGE');

					var numFormat = false;
					switch (property.propertyType) {
					case 'INTEGER':
					case 'FLOAT':
					case 'DOUBLE':
					case 'LONG':
					case 'DATE':
						numFormat = true;
					}
					
					columnInfo.push({
						isImage : isImage,
						columnWidth : isImage ? '100px' : colWidth,
						orderAsc : orderAsc,
						orderDesc : orderDesc,
						property: property,
						numFormat: numFormat
					});
				}

				return {
					columns : columnInfo
				};
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getDetailLevel = function() {
				return _UIObjectState.levelOfDetail;
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
