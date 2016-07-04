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
		'lib/models/xfCard', 'lib/models/xfClusterBase', 'lib/models/xfSummaryCluster', 'lib/constants',
		'underscore'],
	function(
		xfUIObject, appChannel, guid, xfUtil,
		xfCard, xfClusterBase, xfSummaryCluster, constants
	) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = constants.MODULE_NAMES.MUTABLE_CLUSTER;

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var xfMutableCluster = {};

		//--------------------------------------------------------------------------------------------------------------

		xfMutableCluster.createInstance = function(spec){

			var _UIObjectState = {
				xfId                : 'mutable_' + guid.generateGuid(),
				UIType              : MODULE_NAME,
				spec                : _.clone(spec),
				toolbarSpec         : xfClusterBase.getToolbarSpecTemplate(),
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

			var _createChildrenFromSpec = function(showSpinner, showToolbar) {

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].dispose();
					_UIObjectState.children[i] = null;
				}
				_UIObjectState.children.length = 0;

				for (i = 0; i < _UIObjectState.spec.members.length; i++) {

					var childMemberSpec = _UIObjectState.spec.members[i];

					var uiObject = {};
					if (childMemberSpec.type === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
						uiObject = xfSummaryCluster.createInstance(childMemberSpec);
					} else if (xfUtil.isClusterTypeFromSpec(childMemberSpec)) {
						uiObject =  xfMutableCluster.createInstance(childMemberSpec);
					} else if (childMemberSpec.type === constants.MODULE_NAMES.ENTITY) {
						uiObject = xfCard.createInstance(childMemberSpec);
					}
					uiObject.showDetails(_UIObjectState.showDetails);
					uiObject.showSpinner(showSpinner);

					// we set the children's toolbar state base on our toolbar state. However,
					// we need to specifically set our children to allow close
					uiObject.updateToolbar(
						{
							allowFile: _UIObjectState.toolbarSpec.allowFile,
							allowFocus: _UIObjectState.toolbarSpec.allowFocus,
							allowSearch: _UIObjectState.toolbarSpec.allowSearch,
							allowClose: true
						},
						true
					);

					uiObject.showToolbar(showToolbar);

					// Add the child to the cluster.
					uiObject.setParent(xfClusterInstance);
					_UIObjectState.children.push(uiObject);
				}
			};

			//---------------
			// public methods
			//---------------

			// Create a data id for this object.
			if (!spec.dataId) {
				_UIObjectState.spec.dataId =  'f.data_mutable_' + guid.generateGuid();
			}
			// create new object instance
			var xfClusterInstance = xfClusterBase.createInstance(_UIObjectState);

			// create child placeholder cards from spec
			_createChildrenFromSpec(true, false);

			//----------
			// Overrides
			//----------

			xfClusterInstance.clone = function() {

				// create cloned object
				var clonedObject = xfMutableCluster.createInstance(_UIObjectState.spec);

				// add cloned children
				for (var i = 0; i < _UIObjectState.children.length; i++) {
					clonedObject.insert(_UIObjectState.children[i].clone());
				}

				// add necessary UI state
				clonedObject.showDetails(_UIObjectState.showDetails);
				if (_UIObjectState.isExpanded) {
					clonedObject.expand();
				} else {
					clonedObject.collapse();
				}

				// make the cloned object an orphan
				clonedObject.setParent(null);

				// return cloned object
				return clonedObject;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.removeChild = function(xfId, disposeObject, preserveLinks, removeIfEmpty) {

				var i, linkId=null, link;

				for (i = 0; i < _UIObjectState.children.length; i++) {
					if (_UIObjectState.children[i].getXfId() === xfId) {

						var links = [];
						if (preserveLinks) {
							links = _UIObjectState.children[i].getLinks();
						}

						// Update the in/out degree in the spec
						_UIObjectState.spec.inDegree -= _UIObjectState.children[i].getInDegree();
						_UIObjectState.spec.outDegree -= _UIObjectState.children[i].getOutDegree();

						_UIObjectState.spec.count -= _UIObjectState.children[i].getCount();

						_UIObjectState.children[i].setParent(null);

						if (disposeObject) {
							_UIObjectState.children[i].dispose();
							_UIObjectState.children[i] = null;

							for (linkId in links) {
								if (links.hasOwnProperty(linkId)) {
									link = links[linkId];
									if (link.getSource().getXfId() !== xfId) {
										link.getSource().addLink(link);
									} else if (link.getDestination().getXfId() !== xfId) {
										link.getDestination().addLink(link);
									}
								}
							}
						}

						_UIObjectState.children.splice(i, 1);
						_UIObjectState.spec.members.splice(i, 1);

						break;
					}
				}

				if (_UIObjectState.children.length === 0 &&
					removeIfEmpty
				) {
					aperture.pubsub.publish(
						appChannel.REMOVE_REQUEST,
						{
							xfIds : [_UIObjectState.xfId],
							dispose : true
						}
					);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.removeAllChildren = function() {

				if (_UIObjectState.children.length === 0) {
					return;
				}

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					_UIObjectState.children[i].dispose();
					_UIObjectState.children[i] = null;
				}

				_UIObjectState.children.length = 0;
				_UIObjectState.spec.members.length = 0;

				// Update the in/out degree in the spec
				_UIObjectState.spec.inDegree = 0;
				_UIObjectState.spec.outDegree = 0;
			};

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.insert = function(xfUIObj, beforeXfUIObj00) {

				var memberSpec = {};
				$.extend(true, memberSpec, xfUIObj.getVisualInfo().spec);
				memberSpec.parent = this;

				if (beforeXfUIObj00 == null) {
					_UIObjectState.children.push(xfUIObj);
					// Update the member spec list.
					_UIObjectState.spec.members.push(memberSpec);
				} else {
					var inserted = false;
					var childCount = _UIObjectState.children.length;
					for (var i = 0; i < childCount; i++) {
						if (_UIObjectState.children[i].getXfId() === beforeXfUIObj00.getXfId()) {
							_UIObjectState.children.splice(i, 0, xfUIObj);
							// Update the member spec list.
							_UIObjectState.spec.members.splice(i, 0, memberSpec);

							inserted = true;
							break;
						}
					}
					if (!inserted) {
						_UIObjectState.children.push(xfUIObj);
					}
				}

				// Update the in/out degree in the spec
				_UIObjectState.spec.inDegree += memberSpec.inDegree;
				_UIObjectState.spec.outDegree += memberSpec.outDegree;
				_UIObjectState.spec.count += (memberSpec.count) ? memberSpec.count : 1;

				xfUIObj.setParent(this);

				// we set the children's toolbar state base on our toolbar state. However,
				// we need to specifically set our children to allow close
				xfUIObj.updateToolbar(_UIObjectState.toolbarSpec);
				xfUIObj.updateToolbar({'allowClose': true});
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
				_UIObjectState.spec.promptForDetails = state.spec.promptForDetails;
				// No need to restore the inDegree / outDegree it is computed during insert

				_UIObjectState.children = [];
				var childCount = state.children.length;
				var cardSpec, cardUIObj;
				var clusterSpec, clusterUIObj;
				for (var i = 0; i < childCount; i++) {
					if (state.children[i].UIType === constants.MODULE_NAMES.ENTITY) {
						cardSpec = xfCard.getSpecTemplate();
						cardUIObj = xfCard.createInstance(cardSpec);
						cardUIObj.cleanState();
						cardUIObj.restoreVisualState(state.children[i]);
						this.insert(cardUIObj, null);
					} else if (state.children[i].UIType === constants.MODULE_NAMES.MUTABLE_CLUSTER) {
						clusterSpec = xfMutableCluster.getSpecTemplate();
						clusterUIObj = xfMutableCluster.createInstance(clusterSpec);
						clusterUIObj.cleanState();
						clusterUIObj.restoreVisualState(state.children[i]);
						this.insert(clusterUIObj, null);
					} else if (state.children[i].UIType === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
						clusterSpec = xfSummaryCluster.getSpecTemplate();
						clusterUIObj = xfSummaryCluster.createInstance(clusterSpec);
						clusterUIObj.cleanState();
						clusterUIObj.restoreVisualState(state.children[i]);
						this.insert(clusterUIObj, null);
					} else {
						aperture.log.error(
							'cluster children should only be of type ' +
							constants.MODULE_NAMES.ENTITY + ', ' +
							constants.MODULE_NAMES.SUMMARY_CLUSTER + ' or ' +
							constants.MODULE_NAMES.MUTABLE_CLUSTER + '.'
						);
					}
				}
			};

			//----------------------------------------
			// Mutable Cluster Specific Implementation
			//----------------------------------------

			//----------------------------------------------------------------------------------------------------------

			xfClusterInstance.getContainedCardDataIds = function() {
				var containedIds = [];

				for (var i = 0; i < _UIObjectState.children.length; i++) {
					var child = _UIObjectState.children[i];
					if ((child.getUIType() === constants.MODULE_NAMES.ENTITY ||
						child.getUIType() === constants.MODULE_NAMES.SUMMARY_CLUSTER) &&
						child.getDataId() != null
					) {
						containedIds.push(child.getDataId());
					} else if (child.getUIType() === constants.MODULE_NAMES.MUTABLE_CLUSTER) {
						containedIds = containedIds.concat(child.getContainedCardDataIds());
					}
				}

				return containedIds;
			};

			//----------------------------------------------------------------------------------------------------------

			return xfClusterInstance;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfMutableCluster.getSpecTemplate = function() {
			var spec = xfClusterBase.getSpecTemplate();
			spec.type = MODULE_NAME;
			return spec;
		};

		//--------------------------------------------------------------------------------------------------------------

		xfMutableCluster.getModuleName = function() {
			return MODULE_NAME;
		};

		//--------------------------------------------------------------------------------------------------------------

		return xfMutableCluster;
	}
);
