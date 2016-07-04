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

define(['lib/module', 'lib/communication/applicationChannels'], function() {
	var module = {};

	var unimpMethod = 'Unimplemented Method';

	module.implementedBy = function(implementingObject, implementingObjectModuleName) {

		implementingObject.getXfId = function() {
			aperture.log.error(unimpMethod + ': "getXfId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getDataId = function() {
			aperture.log.error(unimpMethod + ': "getDataId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getResultByXfId = function(xfId) {
			aperture.log.error(unimpMethod + ': "getResultByXfId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getResultByDataId = function(dataId) {
			aperture.log.error(unimpMethod + ': "getResultByDataId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getUIType = function() {
			aperture.log.error(unimpMethod + ': "getUIType" by module ' + implementingObjectModuleName);
		};

		implementingObject.update = function() {
			aperture.log.error(unimpMethod + ': "update" by module ' + implementingObjectModuleName);
		};

		implementingObject.getSpecs = function() {
			aperture.log.error(unimpMethod + ': "getSpecs" by module ' + implementingObjectModuleName);
		};

		implementingObject.dispose = function() {
			aperture.log.error(unimpMethod + ': "dispose" by module ' + implementingObjectModuleName);
		};

		implementingObject.setVisibility = function(isVisible, notify) {
			aperture.log.error(unimpMethod + ': "setVisibility" by module ' + implementingObjectModuleName);
		};

		implementingObject.numVisible = function() {
			aperture.log.error(unimpMethod + ': "numVisible" by module ' + implementingObjectModuleName);
		};

		implementingObject.numResults = function() {
			aperture.log.error(unimpMethod + ': "numResults" by module ' + implementingObjectModuleName);
		};

		implementingObject.showMoreResults = function(numResultsToShow) {
			aperture.log.error(unimpMethod + ': "showMoreResults" by module ' + implementingObjectModuleName);
		};

		implementingObject.setSelected = function(xfId, isSelected) {
			aperture.log.error(unimpMethod + ': "setSelected" by module ' + implementingObjectModuleName);
		};

		implementingObject.getSelectedDataIds = function() {
			aperture.log.error(unimpMethod + ': "getSelectedDataIds" by module ' + implementingObjectModuleName);
		};

		implementingObject.getSelectedSpecs = function() {
			aperture.log.error(unimpMethod + ': "getSelectedSpecs" by module ' + implementingObjectModuleName);
		};

		implementingObject.setExpanded = function(xfId, isExpanded) {
			aperture.log.error(unimpMethod + ': "setExpanded" by module ' + implementingObjectModuleName);
		};
	};

	return module;
});
