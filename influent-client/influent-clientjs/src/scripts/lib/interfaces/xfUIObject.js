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

define(['lib/module', 'lib/communication/applicationChannels'], function(modules, appChannel) {
	var module = {};

	var unimpMethod = 'Unimplemented Method';

	module.implementedBy = function(implementingObject, implementingObjectModuleName) {

		implementingObject.clone = function() {
			aperture.log.error(unimpMethod + ': "clone" by module ' + implementingObjectModuleName);
		};

		implementingObject.getXfId = function() {
			aperture.log.error(unimpMethod + ': "getXfId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getDataId = function() {
			aperture.log.error(unimpMethod + ': "getDataId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getUIType = function() {
			aperture.log.error(unimpMethod + ': "getUIType" by module ' + implementingObjectModuleName);
		};

		implementingObject.getLabel = function() {
			aperture.log.error(unimpMethod + ': "getLabel" by module ' + implementingObjectModuleName);
		};

		implementingObject.getUIObjectByXfId = function(xfId) {
			aperture.log.error(unimpMethod + ': "getUIObjectByXfId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getUIObjectsByDataId = function(dataId) {
			aperture.log.error(unimpMethod + ': "getUIObjectByDataId" by module ' + implementingObjectModuleName);
		};

		implementingObject.getParent = function() {
			aperture.log.error(unimpMethod + ': "getParent" by module ' + implementingObjectModuleName);
		};

		implementingObject.setParent = function(xfUIObj) {
			aperture.log.error(unimpMethod + ': "setParent" by module ' + implementingObjectModuleName);
		};

		implementingObject.getLinks = function() {
			aperture.log.error(unimpMethod + ': "getLinks" by module ' + implementingObjectModuleName);
		};

		implementingObject.getIncomingLinks = function() {
			aperture.log.error(unimpMethod + ': "getIncomingLinks" by module ' + implementingObjectModuleName);
		};

		implementingObject.getOutgoingLinks = function() {
			aperture.log.error(unimpMethod + ': "getOutgoingLinks" by module ' + implementingObjectModuleName);
		};

		implementingObject.addLink = function(link) {
			aperture.log.error(unimpMethod + ': "addLink" by module ' + implementingObjectModuleName);
			return false;
		};

		implementingObject.removeLink = function(xfId) {
			aperture.log.error(unimpMethod + ': "removeLink" by module ' + implementingObjectModuleName);
			return false;
		};

		implementingObject.removeAllLinks = function() {
			aperture.log.error(unimpMethod + ': "removeAllLinks" by module ' + implementingObjectModuleName);
		};

		implementingObject.collapseLinks = function(direction, deleteAfterCollapse) {
			aperture.log.error(unimpMethod + ': "collapseLinks" by module ' + implementingObjectModuleName);
		};

		implementingObject.isLinkedTo = function(uiObject) {
			aperture.log.error(unimpMethod + ': "isLinkedTo" by module ' + implementingObjectModuleName);
		};

		implementingObject.remove = function(eventChannel, dispose) {
			aperture.log.error(unimpMethod + ': "remove" by module ' + implementingObjectModuleName);
		};

		implementingObject.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {
			aperture.log.error(unimpMethod + ': "removeChild" by module ' + implementingObjectModuleName);
		};

		implementingObject.removeAllChildren = function() {
			aperture.log.error(unimpMethod + ': "removeAllChildren" by module ' + implementingObjectModuleName);
		};

		implementingObject.insert = function(xfUIObj, beforeXfUIObj00) {
			aperture.log.error(unimpMethod + ': "insert" by module ' + implementingObjectModuleName);
		};

		implementingObject.update = function(spec) {
			aperture.log.error(unimpMethod + ': "update" by module ' + implementingObjectModuleName);
		};

		implementingObject.showDetails = function(bShow) {
			aperture.log.error(unimpMethod + ': "showDetails" by module ' + implementingObjectModuleName);
			return false;
		};

		implementingObject.getSpecs = function(bOnlyEmptySpecs) {
			aperture.log.error(unimpMethod + ': "getSpecs" by module ' + implementingObjectModuleName);
		};

		implementingObject.getVisualInfo = function() {
			aperture.log.error(unimpMethod + ': "getVisualInfo" by module ' + implementingObjectModuleName);
		};

		implementingObject.setFocus = function(data) {
			aperture.log.error(unimpMethod + ': "setFocus" by module ' + implementingObjectModuleName);
		};

		implementingObject.isSelected = function() {
			aperture.log.error(unimpMethod + ': "isSelected" by module ' + implementingObjectModuleName);
		};

		implementingObject.setSelection = function(xfId) {
			aperture.log.error(unimpMethod + ': "setSelection" by module ' + implementingObjectModuleName);
		};

		implementingObject.setHovering = function(xfId) {
			aperture.log.error(unimpMethod + ': "setHovering" by module ' + implementingObjectModuleName);
		};

		implementingObject.setHidden = function(xfId, state) {
			aperture.log.error(unimpMethod + ': "setHidden" by module ' + implementingObjectModuleName);
		};

		implementingObject.expand = function() {
			aperture.log.error(unimpMethod + ': "expand" by module ' + implementingObjectModuleName);
		};

		implementingObject.collapse = function() {
			aperture.log.error(unimpMethod + ': "collapse" by module ' + implementingObjectModuleName);
		};

		implementingObject.setDuplicateCount = function(count) {
			aperture.log.error(unimpMethod + ': "setDuplicateCount" by module ' + implementingObjectModuleName);
		};

		implementingObject.getVisibleDataIds = function() {
			aperture.log.error(unimpMethod + ': "getVisibleDataIds" by module ' + implementingObjectModuleName);
		};

		implementingObject.getLabel = function() {
			aperture.log.error(unimpMethod + ': "getLabel" by module ' + implementingObjectModuleName);
		};

		implementingObject.allowHover = function(bAllowHover) {
			aperture.log.error(unimpMethod + ': "allowHover" by module ' + implementingObjectModuleName);
		};

		implementingObject.cleanState = function() {
			aperture.log.error(unimpMethod + ': "cleanState" by module ' + implementingObjectModuleName);
		};

		implementingObject.exportState = function() {
			aperture.log.error(unimpMethod + ': "exportState" by module ' + implementingObjectModuleName);
		};

		implementingObject.saveState = function() {
			aperture.log.error(unimpMethod + ': "saveState" by module ' + implementingObjectModuleName);
		};

		implementingObject.restoreVisualState = function(state) {
			aperture.log.error(unimpMethod + ': "restoreState" by module ' + implementingObjectModuleName);
		};

		implementingObject.restoreHierarchy = function(state, workspace) {
			aperture.log.error(unimpMethod + ': "restoreHierarchy" by module ' + implementingObjectModuleName);
		};

		implementingObject.dispose = function() {
			aperture.log.error(unimpMethod + ': "dispose" by module ' + implementingObjectModuleName);
		};

		implementingObject.sortChildren = function(sortFunction) {
			aperture.log.error(unimpMethod + ': "sortChildren" by module ' + implementingObjectModuleName);
		};

		implementingObject.getTotalLinkAmount = function(includeIncoming, includeOutgoing) {
			aperture.log.error(unimpMethod + ': "getTotalLinkAmount" by module ' + implementingObjectModuleName);
		};

		implementingObject.updateToolbar = function(spec, recursiveUpdate) {
			aperture.log.error(unimpMethod + ': "updateToolbar" by module ' + implementingObjectModuleName);
		};

		implementingObject.updatePromptState = function(dataId, state) {
			aperture.log.error(unimpMethod + ': "updatePromptState" by module ' + implementingObjectModuleName);
		};

		implementingObject.getPromptState = function(xfId) {
			aperture.log.error(unimpMethod + ': "getPromptState" by module ' + implementingObjectModuleName);
		};
	};

	return module;
});
