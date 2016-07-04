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
		'lib/communication/applicationChannels','lib/render/cardRenderer', 'lib/render/matchRenderer',
		'lib/render/clusterRenderer', 'lib/render/toolbarRenderer', 'lib/ui/xfModalDialog', 'lib/constants',
		'hbs!templates/flowView/file', 'hbs!templates/flowView/fileDropDialog'
	],
	function(
		appChannel, cardRenderer, matchRenderer,
		clusterRenderer, toolbarRenderer, xfModalDialog, constants,
		fileTemplate, fileDropDialogTemplate
	) {

		var _cardDefaults = cardRenderer.getRenderDefaults();
		var MARGIN_HOR = 10;

		var _renderDefaults = {
			MARGIN_LEFT : 5,
			MARGIN_TOP : 5,
			MARGIN_BOTTOM : 2,
			HEADER_HEIGHT : 38,
			FOOTER_HEIGHT : 14,
			FILE_WIDTH : _cardDefaults.CARD_WIDTH + 2*_cardDefaults.MARGIN + MARGIN_HOR,
			TITLE_HEIGHT : 18,
			TITLE_MAX_CHAR_LENGTH : 20
		};

		// Private -----------------------------------------------------------------------------------------------------

		var _insertIcons = function(iconList, canvas) {
			var defaults = cardRenderer.getRenderDefaults();

			var iconContainer = $('<div></div>');
			iconContainer.css('position','relative');
			iconContainer.width(defaults.CARD_WIDTH);
			iconContainer.height(defaults.ICON_HEIGHT + defaults.ELEMENT_PADDING);
			iconContainer.css('padding-top', _renderDefaults.MARGIN_TOP);

			canvas.append(iconContainer);

			if (iconList && iconList.length > 0 ) {
				var left = defaults.MARGIN;
				for (var i = 0; i < iconList.length; i++) {

					var iconDiv = $('<div></div>');
					iconDiv.css('position','absolute');
					iconDiv.css('top',0);
					iconDiv.css('left',left);
					iconDiv.width(defaults.ICON_WIDTH).height(defaults.ICON_HEIGHT);
					iconContainer.append(iconDiv);

					// TODO: pull out the translation from here
					var iconImg = $('<img/>');
					iconImg.attr('src', aperture.palette.icon({type: iconList[i].imgUrl, width:defaults.ICON_WIDTH, height:defaults.ICON_HEIGHT}));
					iconDiv.append(iconImg);

					left += defaults.ICON_WIDTH + defaults.ELEMENT_PADDING;
				}
			}

			return defaults.ICON_HEIGHT + 2*defaults.ELEMENT_PADDING;
		};

		var _processChildren = function(visualInfo, parentCanvas, updateOnly){
			var childCluster = visualInfo.clusterUIObject;

			if (childCluster != null) {
				visualInfo = childCluster.getVisualInfo();

				var element = clusterRenderer.renderElement(visualInfo, parentCanvas, updateOnly);
				if (element){
					element.css('left', _cardDefaults.CARD_LEFT);
				}
			}
		};

		var _getFileHeight = function(showDetails){
			return cardRenderer.getCardHeight(showDetails) +
					_renderDefaults.MARGIN_TOP +
					_renderDefaults.MARGIN_BOTTOM +
					_renderDefaults.HEADER_HEIGHT +
					_renderDefaults.FOOTER_HEIGHT +
					_renderDefaults.TITLE_HEIGHT;
		};



		var _constructNewContentControls = function(visualInfo, canvas, popoverData) {

			// Element that the popover is anchored to
			var anchorElement = canvas.find('.fileFooter');

			// Hide any other popovers on other anchors
			$('#workspace-content').find('.popover').remove();

			var isMultiple = popoverData.length > 1;

			var templateData = {
				isMultiple: isMultiple
			};

			// Attach the popover
			anchorElement.popover({
				animation: true,
				trigger: 'manual',
				placement: 'bottom',
				html: true,
				content: fileDropDialogTemplate(templateData)
			});

			// Initially show the popover
			anchorElement.popover('show');

			// Get the popover as a jquery element.
			var $popover = $('#workspace-content').find('.popover'); //
			$popover.addClass('influent-flow-drop-menu-popover');
			if (isMultiple) {

				// Position the left arrow
				var leftArrow = $popover.find('.arrow');
				leftArrow.css('left', '10%');

				// Add a new right arrow and position it
				var rightArrow = leftArrow.clone().appendTo($popover);
				rightArrow.css('left', '90%');

				// Offset the whole popover between the two files
				var leftOffset = parseInt($popover.css('left'), 10);
				$popover.css('left', leftOffset + 146);
			}

			// Don't dismiss the popover if it is clicked
			$popover.click(function(e) { e.stopPropagation(); });

			var dismissPopover = function() {

				// Remove the popover and publish a name change
				anchorElement.popover('hide');

				//$popover.remove();
				$('#workspace').unbind('click', dismissPopover);

				aperture.pubsub.publish(appChannel.CHANGE_FILE_TITLE, {
					xfId: visualInfo.xfId,
					newTitleText: visualInfo.title
				});
			};

			// On click on popover close
			$popover.find('#influent-flow-drop-menu-file-close').click(function () {
				dismissPopover();
			});

			// On click on "remove all but this" button
			$popover.find('#influent-flow-drop-menu-clear').click(function(e) {
				var affectedXfIds = [];
				aperture.util.forEach(popoverData, function(xfId) {
					affectedXfIds.push(xfId);
				});

				aperture.pubsub.publish(appChannel.CLEAN_WORKSPACE_REQUEST, {exceptXfIds: affectedXfIds});

				dismissPopover();
			});

			// Clicking outside of the popover dismisses it
			$('#workspace').bind('click', dismissPopover);
		};



		var _constructFile = function(visualInfo, state) {

			// Attach selection listener to the file header.
			var fileHeader = $('.fileHeader', state.canvas);
			fileHeader.click(state.onClick);

			// Attach selection listener to the empty file placeholder.
			var fileEmpty = $('.fileEmpty', state.canvas);
			fileEmpty.click(state.onClick);

			var fileBody = $('.fileBody', state.canvas);

			// Attach selection listener to the file footer.
			var fileFooter = $('.fileFooter', state.canvas);
			fileFooter.click(state.onClick);

			var top = _cardDefaults.MARGIN;
			var iconList = state.spec['icons'];
			if ( iconList ) {
				top += _insertIcons(iconList, fileBody);
			}

			// Create card controls.
			toolbarRenderer.createControls(visualInfo, state.canvas, _renderDefaults.HEADER_HEIGHT + _renderDefaults.FOOTER_HEIGHT + fileBody.height());
			toolbarRenderer.hideControls(state.canvas);

			var enterFunction = function() {
				aperture.pubsub.publish(appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST, {
					xfId : visualInfo.xfId
				});
				return false;
			};

			// add drop function to the core 'file' parts of the canvas.
			var dropFunction = function( event, ui ) {
				var dropId = visualInfo.xfId;
				var dragId = ui.draggable.data('xfId');

				// TODO should have card reordering (ie if we're dropping in the same file in a different position,
				// alter the order of the cards). Add animations to the reordering for bonus points.

				if (visualInfo.clusterUIObject != null) {

					// first, check to see the draggable is already here; if so, we can essentially do nothing
					if (visualInfo.clusterUIObject.getVisualInfo() == null || visualInfo.clusterUIObject.getUIObjectByXfId(dragId) != null) {
						ui.draggable.draggable('disable');    // make the dropped card/cluster no longer draggable until the animation is done

						ui.draggable.animate({	top: 0, left: ui.draggable.data('origPosition').left}, // animate the card/cluster back to it's original position
												'slow',
												'swing',
												function() {
													if (ui.draggable.data('ui-draggable')) {
														ui.draggable.draggable('enable');
													}
												}
						);
						return;
					}
				}

				var dropSpec = {
						containerId : dropId,
						cardId: dragId,
						showSpinner: true
					};

				setTimeout(function() {
					ui.draggable.detach();    // make the dropped card/cluster no longer draggable, at least until the drop goes through
					aperture.pubsub.publish(appChannel.DROP_EVENT, dropSpec);
				}.bind(ui.draggable),50);
			};

			fileHeader.droppable( {drop: dropFunction} );
			fileBody.droppable( {drop: dropFunction} );
			fileFooter.droppable( {drop: dropFunction} );

			fileHeader.mouseenter(enterFunction);
			fileBody.mouseenter(enterFunction);
			fileFooter.mouseenter(enterFunction);

			var fileTitle = state.canvas.find('.fileTitle');
			var fileTitleTextNode = state.canvas.find('.fileTitleTextNode');

			function startEditingTitle() {
				var editableTitle = $('<input />');
				if (visualInfo.title) {
					editableTitle.val(visualInfo.title);
				}

				fileTitleTextNode.hide();
				editableTitle.appendTo(fileTitle);

				editableTitle.focus();

				// clicking outside, double-clicking, or special keypresses end editing
				editableTitle.blur(doneEditingTitle);
				editableTitle.keypress(function(e) {
					switch (e.keyCode){
						case 9:
						case 13:
						case 27:
							doneEditingTitle();
							break;
					}
				});
			}

			function doneEditingTitle() {
				var editableTitle = fileTitle.find('input');

				editableTitle.remove();
				fileTitleTextNode.show();

				var editedText = editableTitle.val();

				aperture.pubsub.publish(appChannel.CHANGE_FILE_TITLE, {
					xfId: visualInfo.xfId,
					newTitleText: editedText
				});

				fileTitleTextNode.text(editedText);
			}

			fileTitleTextNode.dblclick(startEditingTitle);
		};

		// End (Private Functions) --------------------------------------------------------------------------

		var fileRenderer = {};

		fileRenderer.renderElement = function(visualInfo, updateOnly, popoverData) {
			var spec = visualInfo.spec;
			var canvas = $('#' + visualInfo.xfId);

			if (!updateOnly) {

				var renderedFile = $(fileTemplate({
					id: visualInfo.xfId,
					highlighted: visualInfo.isHighlighted,
					selected: visualInfo.isSelected || visualInfo.isMatchHighlighted,
					fileWidth: _renderDefaults.FILE_WIDTH,
					titleHeight: _renderDefaults.TITLE_HEIGHT,
					title: visualInfo.title,
					bodyWidth: _renderDefaults.FILE_WIDTH,
					bodyEmptyWidth: _renderDefaults.FILE_WIDTH - _renderDefaults.MARGIN_LEFT * 2 - 2,
					bodyEmptyHeight: cardRenderer.getCardHeight(visualInfo.showDetails) + _renderDefaults.MARGIN_TOP * 2 - 3,
					marginTop: _renderDefaults.MARGIN_TOP,
					marginLeft: _renderDefaults.MARGIN_LEFT,
					cardHeight: cardRenderer.getCardHeight(visualInfo.showDetails),
					showspinner: visualInfo.showSpinner
				}));

				// If the title is empty
				if (!visualInfo.title) {
					var fileTitleTextNode = renderedFile.find('.fileTitleTextNode');
					fileTitleTextNode.text('(empty title)');
					fileTitleTextNode.addClass('fileTitleEmpty');
				}

				if (canvas.length > 0) {
					// DO NOT remove the match card container, as it has it's own renderer and will be re-created if needed
					canvas.children().not('.matchCardContainer').remove();
					canvas.prepend(renderedFile.html());
				} else {
					canvas = renderedFile;
				}

				canvas.width(_renderDefaults.FILE_WIDTH);

				var _onClick = function () {
					return !visualInfo.isSelected;
				};

				var _instanceState = {
					xfId: visualInfo.xfId,
					canvas: canvas,
					spec: _.clone(spec),
					onClick: _onClick
				};

				_constructFile(visualInfo, _instanceState);
			}


			// Update visibility
			if (visualInfo.isHidden) {
				canvas.hide();
			} else {
				canvas.show();
			}

			// Attach selection listener to the empty file placeholder.
			var fileEmpty = $('.fileEmpty', canvas);
			var fileBody = $('.fileBody', canvas);

			// create all the cards for memberIds
			if ( visualInfo.clusterUIObject != null &&
				!visualInfo.clusterUIObject.getVisualInfo().isHidden) {
				fileEmpty.hide();
				_processChildren(visualInfo, fileBody);
			}else {
				fileEmpty.show();
			}

			if (visualInfo.isHovered) {
				toolbarRenderer.showControls(canvas);
			} else {
				toolbarRenderer.hideControls(canvas);
			}

			// Determine if an xfMatch object needs to be renderered; if highlighted, the appropriate match will already exist
			if (visualInfo.matchUIObject != null && !visualInfo.isMatchHighlighted){
				var matchCanvas = matchRenderer.renderElement(visualInfo.matchUIObject.getVisualInfo());
				canvas.append(matchCanvas);
			}

			if (popoverData) {
				// Create popover for files containing incoming content from other views
				_constructNewContentControls(visualInfo, canvas, popoverData);
			}

			return canvas;
		};

		fileRenderer.getRenderDefaults = function(){
			return _renderDefaults;
		};

		fileRenderer.getFileHeight = _getFileHeight;

		return fileRenderer;
	}
);
