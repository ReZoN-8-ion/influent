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
		'lib/communication/applicationChannels', 'lib/util/xfUtil', 'lib/ui/toolbarOperations', 'lib/ui/xfModalDialog', 'lib/constants', 'lib/util/currency', 'lib/plugins'
	],
	function(
		appChannel, xfUtil, toolbarOp, xfModalDialog, constants, currency, plugins
	) {
		var DIV_IDS = {
			toolbar : '.toolbarDiv',
			leftOp :'.leftOp',
			rightOp : '.rightOp',
			cardToolbar : '.cardToolbar',
			matchToolbar : '.matchToolbar'
		};

		var _renderDefaults = {
			TOOLBAR_BTN_HEIGHT : 20,
			CARD_BUTTON_HEIGHT : 24
		};

		//--------------------------------------------------------------------------------------------------------------

		var _isVisualDescendant = function(visualInfo, uiType){
			var parentObj = visualInfo.spec.parent;
			if (_.isEmpty(parentObj) // Parent has not been set - newly created item.
				|| parentObj.getUIType() === constants.MODULE_NAMES.COLUMN){
				return false;
			}
			if (parentObj.getUIType() === uiType){
				return true;
			}
			return _isVisualDescendant(parentObj.getVisualInfo(), uiType);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getVisualAncestor = function(visualInfo, uiType){
			var parentObj = visualInfo.spec.parent;
			if (_.isEmpty(parentObj) // Parent has not been set - newly created item.
				|| visualInfo.UIType === constants.MODULE_NAMES.COLUMN){
				return null;
			}
			if (parentObj.getUIType() === uiType){
				return parentObj;
			}
			return _getVisualAncestor(parentObj.getVisualInfo(), uiType);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _resetControls = function(canvas){

			aperture.util.forEach(DIV_IDS, function(id) {
				var element = _getElement(canvas, id);
				if (element){
					element.remove();
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _showControls = function(canvas){
			aperture.util.forEach(DIV_IDS, function(id) {
				var element = _getElement(canvas, id);
				if (element){
					element.show();
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _hideControls = function(canvas){
			aperture.util.forEach(DIV_IDS, function(id) {
				var element = _getElement(canvas, id);
				if (element){
					element.hide();
				}
			});

		};

		//--------------------------------------------------------------------------------------------------------------

		var _getElement = function(canvas, selector){
			var element = canvas.children(selector).first();
			return (element.length === 0) ? null : element;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getDegreeLabel = function(
			unbranchable,
			degree,
			shownDegree,
			isSource,
			linkDescription,
			info
		) {

			var degreeString = '';

			if (degree === 0) {
				degreeString = 'no' + '<br>';
				if (isSource) {
					degreeString = degreeString + 'destinations ';
				} else {
					degreeString = degreeString + ' sources';
				}
				return degreeString;
			}

			if (degree == null) {
				return degreeString;
			}

			var d = parseInt(degree, 10);
			if (isNaN(d)) {
				return degreeString;
			}

			if (unbranchable) {
				degreeString = currency.formatNumber(d) + '<br>';
				if (isSource) {
					degreeString = degreeString + 'destinations ' + info + ' ' + linkDescription;
				} else {
					degreeString = degreeString + linkDescription + ' ' + info + ' sources';
				}
				return degreeString;
			}

			degreeString = 'showing ' + currency.formatNumber(shownDegree) + '/' + currency.formatNumber(d) + '<br>';
			if (isSource) {
				degreeString = degreeString + 'destinations ' + linkDescription;
			} else {
				degreeString = degreeString + linkDescription + ' sources';
			}
			return degreeString;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createBranchControls = function(visualInfo, canvas, cardHeight){

			var leftOpDiv = _getElement(canvas, DIV_IDS.leftOp);
			var leftImg = null;
			var unbranchable = visualInfo.spec.unbranchable;
			var inDegree = (visualInfo.spec.inDegree != null ? visualInfo.spec.inDegree : 0);
			var outDegree = (visualInfo.spec.outDegree != null ? visualInfo.spec.outDegree : 0);
			var shownInDegree = 0;
			var shownOutDegree = 0;

			// compute the shown in/out degree
			for (var xfId in visualInfo.links) {
				if (visualInfo.links.hasOwnProperty(xfId)) {
					var link = visualInfo.links[xfId];
					if (link.getDestination().getXfId() === visualInfo.xfId) {
						shownInDegree+= link.getLinkCount();
					} else {
						shownOutDegree+= link.getLinkCount();
					}
				}
			}

			if (leftOpDiv == null) {
				leftOpDiv = $('<div class="leftOp"></div>')
					.appendTo(canvas);

				if (inDegree !== 0 && !unbranchable) {
					leftImg = xfUtil.makeButton('branch left to inflowing sources', 'expand', null, 'card-button', null)
						.addClass('branch-button')
						.appendTo(leftOpDiv);
				}

				$('<div class="opDegree leftOpDegree"></div>').html(
					_getDegreeLabel(
						unbranchable,
						inDegree,
						shownInDegree,
						false,
						'<img src="img/sources.png" alt="<">',
						'<img src="img/info-small.png" alt="(?)" title="Cannot branch any further on this large summary of accounts">'
					)
				).appendTo(leftOpDiv);
			} else {
				leftImg = $(leftOpDiv.children()[0]);
			}

			var requestedLeftOp = visualInfo.spec.leftOperation;

			if (leftImg != null) {
				leftImg.unbind('click');
				leftImg.removeClass('button-branching');
				if (requestedLeftOp === toolbarOp.BRANCH) {
					leftImg.click(
							function(event) {
								publishBranchRequest('left');
								event.stopImmediatePropagation();
							}
					);
				} else if (requestedLeftOp === toolbarOp.WORKING) {
					leftImg.addClass('button-branching');
				}
			}
			leftOpDiv.css('top', (cardHeight - _renderDefaults.CARD_BUTTON_HEIGHT)/2);

			var rightOpDiv = _getElement(canvas, DIV_IDS.rightOp);
			var rightImg = null;
			if (rightOpDiv == null) {
				rightOpDiv = $('<div class="rightOp"></div>')
					.appendTo(canvas);

				if (outDegree !== 0 && !unbranchable) {
					rightImg = xfUtil.makeButton('branch right to outflowing destinations', 'expand', null, 'card-button', null)
						.addClass('branch-button')
						.appendTo(rightOpDiv);
				}

				$('<div class="opDegree rightOpDegree"></div>').html(
					_getDegreeLabel(
						unbranchable,
						outDegree,
						shownOutDegree,
						true,
						'<img src="img/destinations.png" alt=">">',
						'<img src="img/info-small.png" alt="(?)" title="Cannot branch any further on this large summary of accounts">'
					)
				).appendTo(rightOpDiv);

			} else {
				rightImg = $(rightOpDiv.children()[0]);
			}

			var requestedRightOp = visualInfo.spec.rightOperation;

			if (rightImg != null) {
				rightImg.unbind('click');
				rightImg.removeClass('button-branching');
				if (requestedRightOp === toolbarOp.BRANCH) {
					rightImg.click(
							function(event) {
								publishBranchRequest('right');
								event.stopImmediatePropagation();
							}
					);
				} else if (requestedRightOp === toolbarOp.WORKING ) {
					rightImg.addClass('button-branching');
				}
			}
			rightOpDiv.css('top', (cardHeight - _renderDefaults.CARD_BUTTON_HEIGHT)/2);

			var publishBranchRequest = function(direction) {
				aperture.pubsub.publish(
					appChannel.BRANCH_REQUEST,
					{
						xfId : visualInfo.xfId,
						direction : direction
					}
				);
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createToolbar = function(visualInfo, canvas) {
			// Create toolbar buttons.
			var toolbarDiv = _getElement(canvas, DIV_IDS.cardToolbar);
			var buttonItemList = [];

			if (toolbarDiv == null){
				toolbarDiv = $('<div class="cardToolbar"></div>');

				canvas.append(toolbarDiv);

				// If this card is a branch result, show
				// the additional controls like the
				// new file folder button, etc.
				if (visualInfo.showToolbar){
					// File button
					var bFileable = visualInfo.toolbarSpec['allowFile'];
					if (bFileable === true) {
						var isCopy =
							visualInfo.spec.parent.getUIType() === constants.MODULE_NAMES.IMMUTABLE_CLUSTER;

						var fileButton = xfUtil.makeButton(isCopy? 'copy to new file':'move to new file', 'new-file', null, 'card-button', null).click(
							function() {
								aperture.pubsub.publish(appChannel.CREATE_FILE_REQUEST, {xfId : visualInfo.xfId, showSpinner : true});
								return false;
							});
						fileButton.addClass('infFileButton');

						buttonItemList.push(fileButton);
					}

					var bSearchable = visualInfo.toolbarSpec['allowSearch'];
					var bFocusable = visualInfo.toolbarSpec['allowFocus'];

					if (bSearchable === true) {
						var searchTip = visualInfo.UIType === constants.MODULE_NAMES.FILE?
								'search for accounts to add' : 'search for similar accounts';

						var searchButton = xfUtil.makeButton(searchTip, 'search-small', null, 'card-button', null).click(
							function() {
								if (visualInfo.UIType === constants.MODULE_NAMES.FILE) {
									//Switch to accounts view with blank search term
									aperture.pubsub.publish(appChannel.CLEAR_VIEW, {
										title : constants.VIEWS.ACCOUNTS.NAME
									});
									aperture.pubsub.publish(appChannel.SELECT_VIEW, {
										title: constants.VIEWS.ACCOUNTS.NAME
									});
								} else {
									aperture.pubsub.publish(appChannel.SEARCH_ON_CARD, {xfId: visualInfo.xfId});
								}
								return false;
							});
						searchButton.addClass('infSearchButton');

						buttonItemList.push(searchButton);
					}

					// Focus button
					if ( bFocusable === true) {
						var highlightButton = xfUtil.makeButton('highlight flow', 'highlight-flow', null, 'card-button', null).click(
							function() {
								aperture.pubsub.publish(appChannel.FOCUS_CHANGE_REQUEST, {xfId : visualInfo.xfId});
								return false;
							});
						highlightButton.addClass('infFocusButton');

						buttonItemList.push(highlightButton);
					}

					// xfFile objects require different positioning due to the asymmetrical shape of the file tabs.
					if (visualInfo.UIType === constants.MODULE_NAMES.FILE){
						toolbarDiv.css('top', -0.5*_renderDefaults.CARD_BUTTON_HEIGHT - 5);
						toolbarDiv.css('right', 10);
					}
					else {
						toolbarDiv.css('top', -_renderDefaults.CARD_BUTTON_HEIGHT - 5);
						toolbarDiv.css('right', 0);
					}
				}
				else {
					toolbarDiv.css('right', 5);
					toolbarDiv.css('top', 5);
				}

				// Add default Close button
				var bCloseable = visualInfo.toolbarSpec.allowClose;
				if ( bCloseable === true || bCloseable === undefined ) {
					var closeButton = xfUtil.makeButton('remove', 'remove', null, 'card-button', null).click(
						function() {
							if (visualInfo.UIType === constants.MODULE_NAMES.FILE){

								var title = visualInfo.title ? visualInfo.title : 'Unnamed File';
								xfModalDialog.createInstance({
									title : 'Remove File?',
									contents : 'Are you sure you want to remove "<b>' + title + '"</b>?',
									buttons : {
										'Remove' : function() {
											aperture.pubsub.publish(
												appChannel.REMOVE_REQUEST,
												{
													xfIds : [visualInfo.xfId],
													dispose : true,
                                                    userRequested : true
												}
											);
										},
										'Cancel' : function() {}
									}
								});
							}
							else {
								aperture.pubsub.publish(
									appChannel.REMOVE_REQUEST,
									{
										xfIds : [visualInfo.xfId],
										dispose : true,
                                        userRequested : true
									}
								);
							}
							return false;
						}
					);

					closeButton.addClass('infCloseButton');

					buttonItemList.push(closeButton);

				}

				_createPluginButtons(visualInfo, buttonItemList);
			}

			for (var i=0; i < buttonItemList.length; i++){
				toolbarDiv.append(buttonItemList[i]);
			}

		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Creates custom controls for the search results
		 * contained within a xfMatch uiObject.
		 * @param visualInfo
		 * @param cardHeight
		 * @private
		 */
		var _createMatchControls = function(visualInfo, canvas){
			var matchDiv = _getElement(canvas, DIV_IDS.matchToolbar);
			var buttonItemList = [];

			if (matchDiv == null){
				matchDiv = $('<div class="matchToolbar"></div>');
				canvas.append(matchDiv);

				// Focus button
				var bFocusable = visualInfo.toolbarSpec['allowFocus'];
				if ( bFocusable === true) {
					var focusBtn = xfUtil.makeButton('highlight flow', 'highlight-flow', null, 'card-button', null)
						.click(function() {
							aperture.pubsub.publish(appChannel.FOCUS_CHANGE_REQUEST, {xfId : visualInfo.xfId});
							return false;
						});

					buttonItemList.push(focusBtn);

				}

				// Add move-to-file button.
				// Find the parent xfFile for this xfMatch.
				var fileObj = _getVisualAncestor(visualInfo, constants.MODULE_NAMES.FILE);
				if (fileObj != null){
					var fileBtn = xfUtil.makeButton('add to file', 'add-to-file', null, 'card-button', null)
						.click(function(){
							aperture.pubsub.publish(appChannel.ADD_TO_FILE_REQUEST, {
								containerId : fileObj.getXfId(),
								cardId: visualInfo.xfId
							});
							return false;
						});
					buttonItemList.push(fileBtn);
				}
				else {
					aperture.log.error('There is no parent xfFile associated with the xfMatch: ' + visualInfo.xfId);
				}

				// Add close button.
				var closeBtn = xfUtil.makeButton('remove', 'remove', null, 'card-button', null)
					.click(
						function() {
							aperture.pubsub.publish(
								appChannel.REMOVE_REQUEST,
								{
									xfIds : [visualInfo.xfId],
									dispose : true
								}
							);
							return false;
						}
					);

				buttonItemList.push(closeBtn);

				_createPluginButtons(visualInfo, buttonItemList);
			}

			for (var i=0; i < buttonItemList.length; i++){
				matchDiv.append(buttonItemList[i]);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createControls = function(visualInfo, canvas, cardHeight) {
			_resetControls(canvas);

			// Create the toolbar buttons.
			//_toolbarState.canvas = parentCanvas;

			// If this is an xfMatch object, we want to use a
			// custom button layout, otherwise use the default
			// toolbar.
			if (_isVisualDescendant(visualInfo, constants.MODULE_NAMES.MATCH)){
				_createMatchControls(visualInfo, canvas);
			}
			else {
				_createToolbar(visualInfo, canvas);
			}

			// Add expand right/left buttons.
			if (!(_isVisualDescendant(visualInfo, constants.MODULE_NAMES.MATCH) ||
				visualInfo.UIType === constants.MODULE_NAMES.FILE)){
				_createBranchControls(visualInfo, canvas, cardHeight);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createPluginButtons = function(visualInfo, buttonItemList) {
			var extensions = plugins.get('cards');
			aperture.util.forEach(extensions, function(e) {
				if (e.toolbar) {
					var cardspec = {
						dataId : visualInfo.spec.dataId,
						type : visualInfo.spec.accounttype
					};

					var ebuttons = e.toolbar(cardspec);
					if (ebuttons) {
						if (!aperture.util.isArray(ebuttons)) {
							ebuttons = [ebuttons];
						}

						aperture.util.forEach(ebuttons, function(ebutton) {
							buttonItemList.splice(0,0,
								xfUtil.makeButton(ebutton.title || '', ebutton.icon, null, 'card-button', null).click(
									function() {
										if (ebutton.click) {
											return ebutton.click(arguments);
										}
									})
							);
						});
					}
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		return {
			createControls : _createControls,
			showControls : _showControls,
			hideControls : _hideControls,
			getRenderDefaults : function(){
				return _.clone(_renderDefaults);
			}
		};
	}
);
