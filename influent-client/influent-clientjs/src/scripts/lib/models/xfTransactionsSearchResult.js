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
		'lib/models/xfTransactionResultCluster',
		'lib/models/xfTransactionResult',
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

		var MODULE_NAME = constants.MODULE_NAMES.TRANSACTIONS_SEARCH_RESULT;

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

				var sortByLabel = null;
				var columnInfo = [];
				var i, property;

				var colWidth = (100 / _UIObjectState.headers.properties.length) + '%';

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
					sortByLabel : sortByLabel,
					columns : columnInfo
				};
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getLinkMap = function() {

				var i, j;

				var sourceObject = {};
				var targetObject = {};

				for (i = 0; i < _UIObjectState.children.length; i++) {
					var childObject = _UIObjectState.children[i].getLinkMap();
					for (j = 0; j < childObject.source.length; j++) {
						sourceObject[childObject.source[j]] = true;
					}
					for (j = 0; j < childObject.target.length; j++) {
						targetObject[childObject.target[j]] = true;
					}
				}

				var sources = [];
				var targets = [];

				aperture.util.forEach(sourceObject, function(val, key) {
					sources.push(key);
				});
				aperture.util.forEach(targetObject, function(val, key) {
					targets.push(key);
				});

				return {
					source : sources,
					target : targets
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
