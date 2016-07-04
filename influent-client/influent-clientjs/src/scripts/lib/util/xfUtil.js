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
	['lib/constants', 'lib/communication/applicationChannels'],
	function(constants, appChannel) {

		// Note that the use of ((http|ftp|https)://)* means that this also includes valid hash keys for charts, not just general URIs
		var VALID_URI_REGEX = new RegExp('((http|ftp|https)://)*[a-z0-9\\-_]+(\\.[a-z0-9\\-_]+)+([a-z0-9\\-\\.,@\\?^=%&;:/~\\+#]*[a-z0-9\\-@\\?^=%&;/~\\+#])?', 'i');
		var COLUMN_CLASS = 'columnContainer';

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Returns true if the given dom target is in whitespace, else false.
		 */
		function _isWorkspaceWhitespace(elem) {
			var clicked = $(elem);

			// anything but a descendent of column class
			return $.contains(document.documentElement, elem) &&
				(clicked.hasClass(COLUMN_CLASS) || !clicked.parents().hasClass(COLUMN_CLASS) || clicked.hasClass('clusterExpanded'));
		}

		/**
		 * Returns true if the visualInfo from a given
		 * uiObject is a descendant of the given uiType.
		 * @param visualInfo
		 * @param uiType
		 * @returns {boolean}
		 */
		var _isUITypeDescendant = function(uiObject, uiType){
			var parentObj = uiObject.getParent();
			if (_.isEmpty(parentObj) // Parent has not been set - newly created item.
					|| parentObj.getUIType() === constants.MODULE_NAMES.COLUMN){
				return false;
			}
			if (parentObj.getUIType() === uiType){
				return true;
			}
			return _isUITypeDescendant(parentObj, uiType);
		};

		/**
		 * Returns the first ancestor of the given UIType, if any.
		 * @param uiObject
		 * @param uiType
		 * @returns {xfUIObject}
		 * @private
		 */
		var _getUITypeAncestor = function(uiObject, uiType){
			var parentObj = uiObject.getParent();
			if (_.isEmpty(parentObj) // Parent has not been set - newly created item.
				|| uiObject.getUIType() === constants.MODULE_NAMES.COLUMN){
				return null;
			}
			if (parentObj.getUIType() === uiType){
				return parentObj;
			}
			return _getUITypeAncestor(parentObj, uiType);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Returns the uiObject in the targetColumn that is positionally
		 * closest to the source uiObject.
		 * @param positionMap
		 * @param sourceObj
		 * @param targetParent
		 */
		var _getAdjacentObjectInfo = function(positionMap, sourceObj, targetParent){
			var sPos = positionMap[sourceObj.getXfId()];
			var tPos = {left:0, top:0};
			var positionMapTargetPosition;
			// Now iterate through all the children of the target parent
			// and find the closest UI object.
			var children = targetParent.getChildren();
			if (children.length === 0){
				positionMapTargetPosition = positionMap[targetParent.getXfId()];
				if (positionMapTargetPosition != null) {
					tPos = positionMapTargetPosition;
				}
				return {
					uiObject : targetParent,
					position : tPos,
					adjacentObj : null
				};
			}
			var minDelta = 1e7;
			var minObj = null;
			var minAdjacentObj = null;
			var minPos = {left:0, top:0};
			for (var i=0; i < children.length; i++){
				var targetObj = children[i];
				// If this is a match card, skip to the next object.
				if (targetObj.getUIType() !== constants.MODULE_NAMES.MATCH){
					var nextTarget = i+1 < children.length ? children[i+1] : null;
					// If the current target is a file and the next target is a matchcard,
					// we don't want to separate the two, so we get the next child.
					if (nextTarget != null && nextTarget.getUIType() === constants.MODULE_NAMES.MATCH){
						nextTarget = i+2 < children.length ? children[i+2] : null;
					}

					positionMapTargetPosition = positionMap[targetObj.getXfId()];
					if (positionMapTargetPosition != null) {
						tPos = positionMapTargetPosition;
					}

					if (_isClusterTypeFromObject(targetObj) && targetObj.isExpanded()){
						var neighbourInfo = _getAdjacentObjectInfo(positionMap, sourceObj, targetObj);
						// We don't want to insert a uiObject side an expanded cluster hierarchy.
						// We can only insert above, or below the topmost cluster element.
						// Determine whether or not the insertion point is closer to the current
						// target or the next target.
						if (Math.abs(sPos.top - neighbourInfo.position.top) > Math.abs(sPos.top - tPos.top)){
							nextTarget = targetObj;
						}
						else {
							// If the insertion point is closer to the next target, update
							// the position accordingly.
							tPos = neighbourInfo.position;
						}
					}
					else if (nextTarget == null){
						if (sPos.top < tPos.top){
							nextTarget = targetObj;
						}
					}
					var delta = Math.abs(tPos.top-sPos.top);
					if (delta < minDelta){
						minDelta = delta;
						minObj = targetObj;
						minPos = tPos;
						minAdjacentObj = nextTarget;
					}
				}
			}
			return {
				uiObject : minObj,
				position : minPos,
				adjacentObj : minAdjacentObj
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Constructs the corresponding layout request based on type.
		 * refInfo and targetInfo are objects with the following members:
		 * {
		 *      uiObject (XFUIObject - required),
		 *      columnObject (XFUIObject - Used by: 'insert'),
		 *      columnIndex (Number - Used by: 'insert')
		 * }
		 *
		 * @param type
		 * @param workspace
		 * @param xfLayoutProvider
		 * @param refInfo
		 * @param targetInfo
		 * @returns {{layoutInfo: {type: *, workspace: *}, layoutProvider: *}}
		 * @private
		 */
		var _constructLayoutRequest = function(type, workspace, xfLayoutProvider, refInfo, targetInfo){
			var request = {
				layoutInfo : {
					type : type,
					workspace : workspace
				},
				layoutProvider : xfLayoutProvider
			};
			if (type === 'insert'){
				request.layoutInfo.refInfo = refInfo;
				request.layoutInfo.targetInfo = targetInfo;
				return request;
			}
			else if (type === 'zoomTo'){
				request.layoutInfo.refInfo = refInfo;
				return request;
			}
			else if (type === 'update'){
				return request;
			}
			// If the request type is unrecognized, report the error.
			aperture.log.error('Unrecognized layout request type: ' + type);
			return null;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Ensures the passed in string is returned as a valid URI
		 * by calling encodeURI and logging a warning if something is wrong with it.
		 *
		 * @param toCheck the URI to check
		 * @returns {*} the safe URI
		 * @private
		 */
		var _getSafeURI = function(toCheck) {
			if(toCheck === null || toCheck.length === 0 || VALID_URI_REGEX.test(toCheck)) {
				return toCheck;
			}
			else {
				aperture.log.warn('Cannot parse URI; the URI syntax is invalid: ' + toCheck);
				return encodeURI(toCheck);
			}
		};

		/**
		 * Returns a url for the view represented by the given view id
		 *
		 * @param viewId the id of the view
		 * @returns {*} url for the given viewID
		 * @private
		 */
		var _getViewURL = function(viewId) {
			var url = window.location.pathname + '#/';
			if (viewId === constants.VIEWS.TRANSACTIONS.NAME) {
				return url + 'transactions';
			} else if (viewId === constants.VIEWS.ACCOUNTS.NAME) {
				return url + 'accounts';
			} else if (viewId === constants.VIEWS.FLOW.NAME) {
				return url + 'flow';
			} else {
				return '';
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Ensures the passed in string is returned as a valid URI
		 * by calling encodeURI and logging a warning if something is wrong with it.
		 *
		 * @param UI object
		 * @returns the context object that the UI object belongs to (will be a FILE or COLUMN)
		 * @private
		 */
		var _getContextByUIObject = function(uiObject){

			if (uiObject.getUIType() === constants.MODULE_NAMES.FILE ||
				uiObject.getUIType() === constants.MODULE_NAMES.COLUMN
				) {
				return uiObject;
			}

			var contextObj = null;
			if (uiObject.getParent() != null &&
				_getUITypeAncestor(uiObject, constants.MODULE_NAMES.MATCH) == null
			) {
				contextObj = _getUITypeAncestor(uiObject, constants.MODULE_NAMES.FILE);
			}

			if (contextObj == null) {
				contextObj = _getUITypeAncestor(uiObject, constants.MODULE_NAMES.COLUMN);

				if (contextObj == null) {
					aperture.log.error('The UIObjectId: ' + uiObject.getXfId() + ' does not have a valid context.');
				}
			}

			return contextObj;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getContainedCardDataIds = function(visualInfo) {
			var containedIds = [];

			if (visualInfo.UIType === constants.MODULE_NAMES.FILE) {
				if (visualInfo.clusterUIObject != null) {
					containedIds.push(visualInfo.clusterUIObject.getDataId());
				}

			} else if (visualInfo.UIType === constants.MODULE_NAMES.MUTABLE_CLUSTER) {

				if (visualInfo.spec.hasOwnProperty('ownerId') && visualInfo.spec.ownerId !== '') {
					containedIds.push(visualInfo.spec.ownerId);
				} else {
					for (var i = 0; i < visualInfo.children.length; i++) {
						var child = visualInfo.children[i];

						if (_isClusterTypeFromObject(child) && child.getOwnerId() !== '') {
							containedIds.push(child.getOwnerId());
						} else {
							if (child.getUIType() === constants.MODULE_NAMES.ENTITY && child.getDataId() != null) {
								containedIds.push(child.getDataId());
							} else if (child.getUIType() === constants.MODULE_NAMES.MUTABLE_CLUSTER) {
								containedIds = containedIds.concat(child.getContainedCardDataIds());
							}
						}
					}
				}

			} else if (visualInfo.UIType === constants.MODULE_NAMES.IMMUTABLE_CLUSTER) {

				if (visualInfo.spec.hasOwnProperty('ownerId') && visualInfo.spec.ownerId !== '') {
					containedIds.push(visualInfo.spec.ownerId);
				} else {
					containedIds.push(visualInfo.spec.dataId);
				}

			} else if (visualInfo.UIType === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
				if (visualInfo.spec.hasOwnProperty('ownerId') && visualInfo.spec.ownerId !== '') {
					containedIds.push(visualInfo.spec.ownerId);
				}

			} else if (visualInfo.UIType === constants.MODULE_NAMES.ENTITY) {
				containedIds.push(visualInfo.spec.dataId);
			}

			return containedIds;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getChildrenByType = function(target, uiType) {
			var toReturn = [];
			var acceptedTypes = [uiType];

			if (Object.prototype.toString.call( uiType ) === '[object Array]') {
				acceptedTypes = uiType;
			}

			if(acceptedTypes.indexOf(target.getUIType()) !== -1) {
				toReturn.push(target);
			}

			if (target.getUIType() === constants.MODULE_NAMES.FILE){
				if (target.getMatchUIObject() != null){
					toReturn = toReturn.concat(_getChildrenByType(target.getMatchUIObject(), acceptedTypes));
				}
				if (target.getClusterUIObject() != null){
					toReturn = toReturn.concat(_getChildrenByType(target.getClusterUIObject(), acceptedTypes));
				}
			}
			else {
				var targetChildren = target.getChildren();
				var currChildrenByType;
				for (var i = 0; i < targetChildren.length; i++) {
					currChildrenByType = _getChildrenByType(targetChildren[i], acceptedTypes);
					if(currChildrenByType.length > 0) {
						toReturn.push.apply(toReturn, currChildrenByType);
					}
				}
			}

			return toReturn;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getLinkableChildren = function(target) {
			var toReturn = [];

			if (target.getUIType() === constants.MODULE_NAMES.ENTITY ||
				target.getUIType() === constants.MODULE_NAMES.SUMMARY_CLUSTER ||
				(target.getUIType() === constants.MODULE_NAMES.IMMUTABLE_CLUSTER && !target.isExpanded())
			) {

				return [target];

			} else {

				if (target.getUIType() === constants.MODULE_NAMES.FILE) {

					if (target.hasCluster()) {
						var clusterChildren = _getLinkableChildren(target.getClusterUIObject());
						if(clusterChildren.length > 0) {
							toReturn.push.apply(toReturn, clusterChildren);
						}
					}

					if (target.hasMatchCard()) {
						var matchChildren = _getLinkableChildren(target.getMatchUIObject());
						if(matchChildren.length > 0) {
							toReturn.push.apply(toReturn, matchChildren);
						}
					}

				} else {

					var targetChildren = target.getChildren();
					for (var i = 0; i < targetChildren.length; i++) {
						var linkableChildren = _getLinkableChildren(targetChildren[i]);
						if(linkableChildren.length > 0) {
							toReturn.push.apply(toReturn, linkableChildren);
						}
					}

				}
			}

			return toReturn;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _stringToBoolean = function(string) {
			if (aperture.util.isString(string)) {
				switch(string.toLowerCase()) {
					case 'false': case 'no': case '0': case '' : return false;
				}
			} else if (string === true || string === false) {
				return string;
			}

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _clearMouseListeners = function(element, selectedListeners){
			var listeners = _.isEmpty(selectedListeners)?['click', 'dblclick','mouseenter', 'mouseexit', 'mousedown', 'mouseover', 'hover']:selectedListeners;
			for (var i=0; i < listeners.length; i++){
				element.unbind(listeners[i]);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getTopLevelEntity = function(uiObj){
			if (uiObj == null ||
				typeof uiObj.getUIType !== 'function' ||
				uiObj.getUIType() === constants.MODULE_NAMES.WORKSPACE ||
				uiObj.getUIType() === constants.MODULE_NAMES.COLUMN ||
				uiObj.getUIType() === constants.MODULE_NAMES.FILE ||
				uiObj.getUIType() === constants.MODULE_NAMES.MATCH
			) {
				return null;
			}

			if (uiObj.getParent().getUIType() === constants.MODULE_NAMES.COLUMN ||
				uiObj.getParent().getUIType() === constants.MODULE_NAMES.FILE ||
				uiObj.getParent().getUIType() === constants.MODULE_NAMES.MATCH
			) {
				return uiObj;
			} else {
				return _getTopLevelEntity(uiObj.getParent());
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _isClusterTypeFromObject = function(uiObject) {
			return (
				uiObject.getUIType() === constants.MODULE_NAMES.IMMUTABLE_CLUSTER ||
				uiObject.getUIType() === constants.MODULE_NAMES.MUTABLE_CLUSTER ||
				uiObject.getUIType() === constants.MODULE_NAMES.SUMMARY_CLUSTER
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _isClusterTypeFromSpec = function(spec) {

			if (spec.type != null) {
				return (
					spec.type === constants.MODULE_NAMES.IMMUTABLE_CLUSTER ||
					spec.type === constants.MODULE_NAMES.MUTABLE_CLUSTER ||
					spec.type === constants.MODULE_NAMES.SUMMARY_CLUSTER ||
					spec.type === constants.MODULE_NAMES.CLUSTER_BASE
				);
			}

			return false;
		};

		//--------------------------------------------------------------------------------------------------------------

		function _localShiftedDate(utc) {
			return new Date(
				utc.getUTCFullYear(),
				utc.getUTCMonth(),
				utc.getUTCDate()
			);
		}

		//--------------------------------------------------------------------------------------------------------------

		function _utcShiftedDate(localDate) {
			return new Date(Date.UTC(
				localDate.getFullYear(),
				localDate.getMonth(),
				localDate.getDate()
			));
		}

		//--------------------------------------------------------------------------------------------------------------

		function _dayBefore(date) {
			return new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate() - 1
			);
		}

		//--------------------------------------------------------------------------------------------------------------

		function _dayAfter(date) {
			return new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate() + 1
			);
		}

		var _checkFileSort = function(a,b) {
			if (a.getUIType() === constants.MODULE_NAMES.FILE) {
				return -1;
			}

			if (b.getUIType() === constants.MODULE_NAMES.FILE) {
				if (a.getUIType() === constants.MODULE_NAMES.FILE) {
					return -1;
				} else {
					return 1;
				}
			}

			return 0;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _incomingDescendingSort = function(a,b) {

			var fileCheck = _checkFileSort(a,b);
			if (fileCheck !== 0) {
				return fileCheck;
			}

			return b.getTotalLinkAmount(true, false) - a.getTotalLinkAmount(true, false);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _incomingAscendingSort = function(a,b) {

			var fileCheck = _checkFileSort(a,b);
			if (fileCheck !== 0) {
				return fileCheck;
			}

			return a.getTotalLinkAmount(true, false) - b.getTotalLinkAmount(true, false);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _outgoingDescendingSort = function(a,b) {

			var fileCheck = _checkFileSort(a,b);
			if (fileCheck !== 0) {
				return fileCheck;
			}

			return b.getTotalLinkAmount(false, true) - a.getTotalLinkAmount(false, true);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _outgoingAscendingSort = function(a,b) {

			var fileCheck = _checkFileSort(a,b);
			if (fileCheck !== 0) {
				return fileCheck;
			}

			return a.getTotalLinkAmount(false, true) - b.getTotalLinkAmount(false, true);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _bothDescendingSort = function(a,b) {

			var fileCheck = _checkFileSort(a,b);
			if (fileCheck !== 0) {
				return fileCheck;
			}

			return b.getTotalLinkAmount(true, true) - a.getTotalLinkAmount(true, true);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _bothAscendingSort = function(a,b) {

			var fileCheck = _checkFileSort(a,b);
			if (fileCheck !== 0) {
				return fileCheck;
			}

			return a.getTotalLinkAmount(true, true) - b.getTotalLinkAmount(true, true);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getAccountTypeFromDataId = function(dataId) {

			if (!dataId) {
				return null;
			}

			var type = dataId.split('.')[0];

			switch(type)
			{
				case 'a':
					return constants.ACCOUNT_TYPES.ENTITY;
				case 'o':
					return constants.ACCOUNT_TYPES.ACCOUNT_OWNER;
				case 'c':
					return constants.ACCOUNT_TYPES.CLUSTER;
				case 's':
					return constants.ACCOUNT_TYPES.CLUSTER_SUMMARY;
				case 'f':
					return constants.ACCOUNT_TYPES.FILE;
				default:
					return null;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _propertyMapToDisplayOrderArray = function( properties ) {
			var propertyArray = [];
			var prop= null;
			
			for (var key in properties) {
				if (properties.hasOwnProperty(key)) {
					prop = properties[key];
					if (prop.key == null) {
						prop.key = key;
					}

					//Don't display hidden properties
					if (prop.displayOrder >= 0 && !prop.isHidden) {
						propertyArray.push(prop);
					}
				}
			}
			propertyArray.sort(function(ob1,ob2) {
				return (ob1.displayOrder || 0) - (ob2.displayOrder || 0);
			});

			return propertyArray;
		};

		//--------------------------------------------------------------------------------------------------------------

		function _makeButton(title, icon, text, classType, id) {

			var button = $('<button></button>');

			if (title != null) {
				button.text(title);
			}

			if (classType != null) {
				button.addClass(classType);
			}

			if (id != null) {
				button.attr('id', id);
			}

			if (icon != null) {
				button.button({text: false,
					icons: {primary : icon}
				});
			} else if (text != null) {
				button.button({label: text});
			} else {
				button.button();
			}

			if (title != null) {
				_makeTooltip(button, title);
			}

			return button;
		}

		//--------------------------------------------------------------------------------------------------------------

		function _makeTooltip(element, tooltipText, elementFriendlyDesc) {

			if (!element) {
				return;
			}

			// Assign text to the tooltip
			if (tooltipText) {
				element.attr('title', tooltipText);
			}

			// Find a friendly way to describe the element
			var elementDesc = elementFriendlyDesc ?
				elementFriendlyDesc : tooltipText;

			var timer = null;

			element.hover(
				function() {
					aperture.pubsub.publish(appChannel.HOVER_START_EVENT, {
						element : elementDesc
					});

					timer = setTimeout(
						function() {
							aperture.pubsub.publish(appChannel.TOOLTIP_START_EVENT, {
								element : elementDesc
							});
							timer = null;
						},
						1000
					);
				},
				function() {
					if (timer) {
						clearTimeout(timer);
						timer = null;
					} else {
						aperture.pubsub.publish(appChannel.TOOLTIP_END_EVENT, {
							element : elementDesc
						});
					}


					aperture.pubsub.publish(appChannel.HOVER_END_EVENT, {
						element : elementDesc
					});
				}
			);
		}

		//--------------------------------------------------------------------------------------------------------------
		function _resizeIcon(url, width, height) {
			// ick.
			return url.replace(/iconWidth=[0-9]+/, 'iconWidth='+ width)
					.replace(/iconHeight=[0-9]+/, 'iconHeight=' + height);
		}
		
		//--------------------------------------------------------------------------------------------------------------

		var _stripHtml = function(textIn) {
			textIn = textIn.replace(/<br>/gm, ' ').trim();
			var tmp = document.createElement('div');
			tmp.innerHTML = textIn;
			return tmp.textContent || tmp.innerText || '';
		};

		//--------------------------------------------------------------------------------------------------------------

		var _removeSpecialCharacters = function(str, html) {

			if (!str) {
				return str;
			}

			if (html) {
				return _stripHtml(str).replace(/(\\r\\n|\\n|\\r|\\t|\r\n|\r|\n|\t|\s+)/gm, ' ');
			} else {
				return str.replace(/(\\r\\n|\\n|\\r|\\t|\r\n|\r|\n|\t|\s+)/gm, ' ');
			}
		};
		
		return {
			isUITypeDescendant : _isUITypeDescendant,
			getUITypeAncestor : _getUITypeAncestor,
			getAdjacentObjectInfo : _getAdjacentObjectInfo,
			constructLayoutRequest : _constructLayoutRequest,
			getSafeURI : _getSafeURI,
			getChildrenByType : _getChildrenByType,
			getLinkableChildren : _getLinkableChildren,
			stringToBoolean : _stringToBoolean,
			clearMouseListeners : _clearMouseListeners,
			getTopLevelEntity : _getTopLevelEntity,
			isClusterTypeFromObject : _isClusterTypeFromObject,
			isClusterTypeFromSpec : _isClusterTypeFromSpec,
			dayBefore : _dayBefore,
			dayAfter : _dayAfter,
			localShiftedDate : _localShiftedDate,
			utcShiftedDate : _utcShiftedDate,
			incomingDescendingSort :  _incomingDescendingSort,
			incomingAscendingSort : _incomingAscendingSort,
			outgoingDescendingSort : _outgoingDescendingSort,
			outgoingAscendingSort : _outgoingAscendingSort,
			bothDescendingSort : _bothDescendingSort,
			bothAscendingSort : _bothAscendingSort,
			isWorkspaceWhitespace : _isWorkspaceWhitespace,
			getContextByUIObject : _getContextByUIObject,
			getContainedCardDataIds : _getContainedCardDataIds,
			getAccountTypeFromDataId : _getAccountTypeFromDataId,
			makeButton : _makeButton,
			makeTooltip : _makeTooltip,
			resizeIcon : _resizeIcon,
			propertyMapToDisplayOrderArray : _propertyMapToDisplayOrderArray,
			removeSpecialCharacters : _removeSpecialCharacters,
			stripHtml : _stripHtml,
			getViewURL : _getViewURL
		};
	}
);
