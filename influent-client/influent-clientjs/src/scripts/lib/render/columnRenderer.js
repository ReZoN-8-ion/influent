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
		'lib/communication/applicationChannels', 'lib/util/xfUtil', 'lib/render/cardRenderer', 'lib/render/fileRenderer',
		'lib/render/clusterRenderer', 'lib/ui/xfModalDialog', 'lib/constants',
		'hbs!templates/flowView/column'
	],
	function(
		appChannel, xfUtil, cardRenderer, fileRenderer,
		clusterRenderer, xfModalDialog, constants,
		columnTemplate
	) {
		var columnRenderer = {};

		var _cardDefaults = cardRenderer.getRenderDefaults();
		var _renderDefaults = {
			COLUMN_DISTANCE : 300 // 300px between columns
		};
		var _processChildren = function(childObjects, parentCanvas, updateOnly){
			for (var i=0; i < childObjects.length; i++){
				var visualInfo = childObjects[i].getVisualInfo();
				var element = null;
				switch(childObjects[i].getUIType()){
					case constants.MODULE_NAMES.FILE : {
						element = fileRenderer.renderElement(visualInfo, updateOnly);
						break;
					}
					case constants.MODULE_NAMES.IMMUTABLE_CLUSTER :
					case constants.MODULE_NAMES.MUTABLE_CLUSTER :
					case constants.MODULE_NAMES.SUMMARY_CLUSTER : {
						element = clusterRenderer.renderElement(visualInfo, null, updateOnly);
						element.css('left', _cardDefaults.CARD_LEFT);
						break;
					}
					case constants.MODULE_NAMES.ENTITY : {
						element = cardRenderer.renderElement(visualInfo, updateOnly);
						element.css('left', _cardDefaults.CARD_LEFT);
						break;
					}
					default : {
						aperture.log.error('Attempted to add an unsupported UIObject type to column: ' + childObjects[i].getUIType());
					}
				}

				if (!updateOnly && element){
					parentCanvas.append(element);
				}
			}
		};

		columnRenderer.renderElement = function(visualInfo, hint, updateOnly) {

			var canvas = $('#' + visualInfo.xfId);

			function showHeader() {
				if ($('.columnHeader', canvas).css('display') === 'none' &&
					$('.columnOverlay', canvas).css('display') === 'none') {

					// hide all, just in case we didn't get a leave event
					$('.columnHeader').css('display', 'none');

					// show just me
					$('.columnHeader', canvas).css('display', '');
				}
			}

			if (!updateOnly || canvas.length === 0) {

				if (canvas.length > 0) {
					canvas.empty();
				} else {
					canvas = $('<div class="column" id="' + visualInfo.xfId + '"></div>');
				}

				canvas.append(
					$(columnTemplate({
						id: visualInfo.xfId,
						hint: hint
					}))
				);

				var header = $('.columnHeader', canvas);
				var spinnerContainer = $('.columnOverlaySpinner', canvas);

				var fileBtn = xfUtil.makeButton('add new file to top of column', 'new-file', null, 'column-button', null).appendTo(header);
				fileBtn.click(function () {
					aperture.pubsub.publish(appChannel.CREATE_FILE_REQUEST, {xfId: visualInfo.xfId, isColumn: true});
					return false;
				});

				var cleanColumnBtn = xfUtil.makeButton('clear column of unfiled content', 'column-clear', null, 'column-button', null).appendTo(header);
				cleanColumnBtn.click(function () {
					xfModalDialog.createInstance({
						title: 'Clear Column?',
						contents: 'Clear all unfiled cards? Everything but file folders and match results will be removed.',
						buttons: {
							Clear: function () {
								aperture.pubsub.publish(
									appChannel.CLEAN_COLUMN_REQUEST,
									{
										xfId: visualInfo.xfId
									}
								);
							},
							Cancel: function () {
							}
						}
					});
					return false;
				});

				var sortColumnBtn = xfUtil.makeButton('sort column by visible flow', 'column-sort', null, 'column-button', null).appendTo(header);

				var sortOptions = $('<ul></ul>');
				sortOptions.attr('id', 'sort-options');
				sortOptions.addClass('nocapture');
				sortOptions.css('z-index', 1000);
				header.append(sortOptions);

				var inSortOption = $('<li></li>');
				var inSort = $('<a></a>');
				inSort.attr('id', 'incoming-descending');
				inSort.attr('href', '#');
				inSort.html('Incoming Flow');
				inSortOption.append(inSort);
				sortOptions.append(inSortOption);

				var outSortOption = $('<li></li>');
				var outSort = $('<a></a>');
				outSort.attr('id', 'outgoing-descending');
				outSort.attr('href', '#');
				outSort.html('Outgoing Flow');
				outSortOption.append(outSort);
				sortOptions.append(outSortOption);

				var bothSortOption = $('<li></li>');
				var bothSort = $('<a></a>');
				bothSort.attr('id', 'both-descending');
				bothSort.attr('href', '#');
				bothSort.html('Both');
				bothSortOption.append(bothSort);
				sortOptions.append(bothSortOption);

				sortColumnBtn.click(
					function () {

						sortOptions.hide();

						var menu = sortOptions.show().position(
							{
								my: 'right top',
								at: 'right bottom',
								of: this
							}
						);

						$(document).one(
							'click',
							function () {
								menu.hide();
							}
						);

						return false;
					}
				);

				sortOptions.menu();

				inSort.click(
					function (e) {
						e.preventDefault();

						aperture.pubsub.publish(
							appChannel.SORT_COLUMN_REQUEST,
							{
								xfId: visualInfo.xfId,
								sortDescription: constants.SORT_FUNCTION.INCOMING,
								sortFunction: xfUtil.incomingDescendingSort

							}
						);
					}
				);

				outSort.click(
					function (e) {
						e.preventDefault();

						aperture.pubsub.publish(
							appChannel.SORT_COLUMN_REQUEST,
							{
								xfId: visualInfo.xfId,
								sortDescription: constants.SORT_FUNCTION.OUTGOING,
								sortFunction: xfUtil.outgoingDescendingSort
							}
						);
					}
				);

				bothSort.click(
					function (e) {
						e.preventDefault();

						aperture.pubsub.publish(
							appChannel.SORT_COLUMN_REQUEST,
							{
								xfId: visualInfo.xfId,
								sortDescription: constants.SORT_FUNCTION.BOTH,
								sortFunction: xfUtil.bothDescendingSort
							}
						);
					}
				);

				// show when hovering or when clicked.
				canvas.click(showHeader);
				canvas.mousemove(showHeader);
				canvas.mouseleave(function () {
					$('.columnHeader', canvas).css('display', 'none');
				});

				$('#workspace').scroll(function () {
					spinnerContainer.css('top', $(this).scrollTop());
				});

				$(window).resize(function () {
					spinnerContainer.height($(window).height());
				});
			}

			var container = $('.columnContainer', canvas);
			_processChildren(visualInfo.children, container, updateOnly);

			return canvas;
		};
		
		columnRenderer.getHeight = function(element) {
			var cc = element.children('.columnContainer');

			return cc.position().top + cc.height();
		};
		
		columnRenderer.getRenderDefaults = function(){
			return _.clone(_renderDefaults);
		};
		
		return columnRenderer;
	}
);
