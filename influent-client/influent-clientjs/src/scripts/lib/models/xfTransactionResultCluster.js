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
		'lib/models/xfResultClusterBase',
		'lib/models/xfTransactionResult',
		'lib/util/GUID'
	],
	function(
		constants,
		accountsChannel,
		xfResultClusterBase,
		resultModel,
		guid
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.TRANSACTION_RESULT_CLUSTER;

		var resultSpecTemplate = {
			groupKey : ''
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
				xfId     : '',
				UIType   : MODULE_NAME,
				spec     : {},
				children : [],
				isExpanded : true,
				isVisible : false
			};

			// set the xfId
			_UIObjectState.xfId = 'result_cluster_' + guid.generateGuid();

			// populate UI object state spec with passed in spec
			_UIObjectState.spec = this.getSpecTemplate();
			for (var key in spec) {
				if ( spec.hasOwnProperty(key) ) {
					if (key === 'items') {

						while(_UIObjectState.children.length > 0) {
							_UIObjectState.children.pop();
						}

						var members = spec.items;
						for (var i = 0; i < members.length; i++) {
							_UIObjectState.children.push(resultModel.createInstance(members[i]));
						}
					} else {
						_UIObjectState.spec[key] = spec[key];
					}
				}
			}

			// create new object instance
			var xfInstance = xfResultClusterBase.createInstance(_UIObjectState);

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
