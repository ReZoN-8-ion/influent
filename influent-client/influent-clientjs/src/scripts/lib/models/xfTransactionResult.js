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
		'lib/models/xfResultBase',
		'lib/util/infTagUtilities',
		'lib/util/GUID',
		'lib/util/xfUtil'
	],
	function(
		constants,
		accountsChannel,
		xfResultBase,
		tagUtil,
		guid,
		util
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.TRANSACTION_RESULT;

		var MAX_NUM_DISPLAY_LINKS = 2;

		var resultSpecTemplate = {
			dataId     : '',
			source     : '',
			target     : '',
			properties : {}
		};

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfResultModule = {};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.createInstance = function(spec){

			//----------------------------------------------------------------------------------------------------------
			// Initialization
			//----------------------------------------------------------------------------------------------------------

			var _UIObjectState = {
				xfId    : '',
				UIType  : MODULE_NAME,
				spec    : {},
				isVisible : false,
				isSelected : false
			};

			// set the xfId
			_UIObjectState.xfId = 'result_' + guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					if (key === 'uid') {
						_UIObjectState.spec.dataId = spec[key];
					}
					_UIObjectState.spec[key] = spec[key];
				}
			}

			// create new object instance
			var xfInstance = xfResultBase.createInstance(_UIObjectState);

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getVisualInfo = function(headerInfo, dedupDetails) {

				var i;
				var details = aperture.util.extend({}, _UIObjectState.spec.properties);

				var visualInfo = {
					columns: [],
//					details: details,
					properties: details,
					detailsSpan: 0,
					promptForDetails: _UIObjectState.spec.promptForDetails
				};

				var numNonImageProperties = headerInfo.columns.length;
				for (i = 0; i < headerInfo.columns.length; i++) {
					if (headerInfo.columns[i].isImage) {
						numNonImageProperties--;
					}
				}

				// create summary information
				for (i = 0; i < headerInfo.columns.length; i++) {

					var columnHeader = headerInfo.columns[i];
					var column = {};
					column.isImage = columnHeader.isImage;
					column.columnWidth = columnHeader.columnWidth;
					column.numFormat = columnHeader.numFormat;

					var property = _UIObjectState.spec.properties[columnHeader.property.key];

					if (!property) {
						var typeVal = _UIObjectState.spec.type;
						var mappedKey = columnHeader.property.typeMappings[typeVal];

						if (mappedKey) {
							property = _UIObjectState.spec.properties[mappedKey];
						}
					}

					if (property) {
						if (columnHeader.property.key === 'FROM') {
							if (property.range) {
								column.text = tagUtil.getFormattedValue(property, _UIObjectState.spec.source, MAX_NUM_DISPLAY_LINKS);
							} else {
								column.text = tagUtil.getFormattedValue(property, _UIObjectState.spec.source);
							}
							property.link = _UIObjectState.spec.source;
						} else if (columnHeader.property.key === 'TO') {
							if (property.range) {
								column.text = tagUtil.getFormattedValue(property, _UIObjectState.spec.target, MAX_NUM_DISPLAY_LINKS);
							} else {
								column.text = tagUtil.getFormattedValue(property, _UIObjectState.spec.target);
							}
							property.link = _UIObjectState.spec.target;
						} else if (tagUtil.getTagFromProperty(property, 'TO_LABEL')) {
							column.text = tagUtil.getFormattedValue(property, _UIObjectState.spec.target);
							property.link = _UIObjectState.spec.target;
						} else if (tagUtil.getTagFromProperty(property, 'FROM_LABEL')) {
							column.text = tagUtil.getFormattedValue(property, _UIObjectState.spec.source);
							property.link = _UIObjectState.spec.source;
						} else {
							column.text = tagUtil.getFormattedValue(property);
						}

						column.key = property.key;
						
						if (dedupDetails) {
							delete details[property.key];
						}
					}

					visualInfo.columns.push(column);
				}

				visualInfo.detailsSpan = numNonImageProperties;

				return visualInfo;
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.getLinkMap = function() {

				var source = [];
				var target = [];

				if (_UIObjectState.isSelected) {
					source.push(_UIObjectState.spec.source);

					// target might be multiple so we need to check data type
					if (_UIObjectState.spec.target instanceof Array) {
						target = _UIObjectState.spec.target;
					} else {
						target.push(_UIObjectState.spec.target);
					}
				}

				return {
					source : source,
					target : target
				};
			};

			//----------------------------------------------------------------------------------------------------------

			xfInstance.updateSpec = function(transaction) {
				_UIObjectState.spec.properties = transaction.properties;
				_UIObjectState.spec.source = transaction.source;
				_UIObjectState.spec.target = transaction.target;
			};


			//----------------------------------------------------------------------------------------------------------

			return xfInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.getSpecTemplate = function() {

			var specTemplate = {};
			$.extend(true, specTemplate, resultSpecTemplate);

			return specTemplate;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfResultModule.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfResultModule;
	}
);
