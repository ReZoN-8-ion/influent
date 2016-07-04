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
		'lib/communication/applicationChannels', 'lib/render/cardRenderer', 'lib/render/columnRenderer',
		'lib/constants',
		'hbs!templates/flowView/branchHint', 'hbs!templates/flowView/emptyHint'
	],
	function(
		appChannel, cardRenderer, columnRenderer,
		constants,
		branchHintTemplate, emptyHintTemplate
	) {

		var config = aperture.config.get()['influent.config'];
		
		/**
		 * the workspace renderer is the top level renderer, managing the dom element for the workspace model.
		 */
		var workspaceRenderer = {};

		//------------------------------------------------------------------------------------------------------------------
		var _renderDefaults = {
			WORKSPACE_MARGIN : 10,
			getStartingColumnPosX : function(numColumns){
				var centerBase =  $('#workspace').width()/2-cardRenderer.getRenderDefaults().CARD_WIDTH/2;      // Subtract half of card size,

				if(numColumns > 1) {
					centerBase = Math.max(this.WORKSPACE_MARGIN, centerBase - (numColumns - 1)*_columnDefaults.COLUMN_DISTANCE/2);
				}

				return centerBase;
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _columnDefaults = columnRenderer.getRenderDefaults();

		//------------------------------------------------------------------------------------------------------------------
		
		function left(element) {
			if (element != null) {
				var l = element.css('left');
				return l? Number(l.replace('px','')) : 0;
			}
		}
		
		//------------------------------------------------------------------------------------------------------------------

		function positionColumns(columns, parentCanvas, updateOnly) {
			
			var x = 0;
			var maxHeight = 0;
			var parentId = '#'+ parentCanvas.attr('id');
			
			var colsn = $();
			var shift = null;

			aperture.util.forEach(columns, function(column, colNum) {
				var visualInfo = column.getVisualInfo();

				// Column hints
				var hint = null;


				if (columns.length === 3) {

					// If this is an empty workspace, add a hint to redirect to Accounts View
					if (columns[1].getVisualInfo().children.length === 0) {
						if (colNum === 1) {
							hint = emptyHintTemplate({aboutFlow: config.aboutFlow});
						}
					}
					// If only one column is filled, add hint to show flow direction
					else if (
						columns[0].getVisualInfo().children.length === 0 &&
						columns[2].getVisualInfo().children.length === 0
					) {
						if (colNum === 0) {
							hint = branchHintTemplate({hintContent: 'FROM ACCOUNTS'});
						} else if (colNum === 2) {
							hint = branchHintTemplate({hintContent: 'TO ACCOUNTS'});
						}
					}
				}

				// create the dom element
				var element = columnRenderer.renderElement(visualInfo, hint, updateOnly);

				// If there is an Accounts View shortcut, link it up here
				element.find('#flowShortcutAccounts').click(function () {
					aperture.pubsub.publish(appChannel.SWITCH_VIEW, {
						title: constants.VIEWS.ACCOUNTS.NAME
					});
				});

				// keep track of these for return
				colsn = colsn.add(element);

				// need one reference point in old and new space if we can find one.
				if (shift == null && !column.isEmpty() && element.parent(parentId).length !== 0) {
					shift = x - left(element);
				}

				if (!updateOnly) {
					parentCanvas.append(element);
				}

				// track the maximum column height
				maxHeight = Math.max(maxHeight, columnRenderer.getHeight(element));

				// position the column.
				element.css('left', x);
				
				x+= _columnDefaults.COLUMN_DISTANCE;
			});
			
			// return data for the result
			return {
				width: x,
				height: maxHeight,
				shift:  shift,
				columns: colsn
			};
		}
		
		//------------------------------------------------------------------------------------------------------------------
		var processColumns = function(columns, parentCanvas, updateOnly) {

			// PROCESS COLUMNS
			// cache list of old children
			var colso = parentCanvas.children();

			// position the active children.
			var cdata = positionColumns(columns, parentCanvas, updateOnly);
			
			// remove any removed children.
			var removed = colso.not(cdata.columns).remove();


			// SIZE CONTAINER
			// resize the container
			var container = $('#workspace-content');
			
			container.css({
				'height': cdata.height + _renderDefaults.WORKSPACE_MARGIN,
				'width': cdata.width
			});
			
			// POSITION CONTAINER: NOTHING TO DO?
			// look for something added
			var firstAdd = cdata.columns.not(colso).first();
			
			// if nothing changed, done.
			if (firstAdd.length === 0 && removed.length === 0) {
				return;
			}

			
			// POSITION CONTAINER: JUST SET IT?
			// old and new insets
			var inset = {
				xo: left(container), 
				xn: _renderDefaults.getStartingColumnPosX(columns.length)
			};
			
			// if nothing old just set it, without animated transition, and we're done.
			if (colso.length === 0) {
				container.css('left', inset.xn);
				return;
			}
			
			// POSITION CONTAINER: ANIMATE IT
			var scrolled = $('#workspace');
			var scroll = {
				xo: scrolled.scrollLeft(), 
				xn: 0
			};

			// manipulating scroll?
			if (inset.xn === _renderDefaults.WORKSPACE_MARGIN && firstAdd.length !== 0) {
				var seex= left(firstAdd) + _renderDefaults.WORKSPACE_MARGIN;
				
				if (seex < scroll.xo) {
					scroll.xn = seex;
				} else {
					seex += _columnDefaults.COLUMN_DISTANCE;
					
					// if already scrolled enough, don't scroll
					scroll.xn = Math.max(scroll.xo, Math.max(0,seex - scrolled.width()));
				}
				
				scrolled.animate({scrollLeft: scroll.xn});
			}
			
			// anything but a wholesale change, try to transition from the same point
			if (cdata.shift != null) {
				
				// shift the old reference point into new space to start the anim
				container.css({left: inset.xo-cdata.shift});
			}

			// animate
			container.animate({left: inset.xn});
		};

        //------------------------------------------------------------------------------------------------------------------

		workspaceRenderer.renderElement = function(visualInfo, capturing, updateOnly) {

			// the column container.
			var canvas = $('#' + visualInfo.xfId);

			if (!updateOnly) {

				if (canvas.length === 0) {
					canvas = $('<div></div>');
					canvas.attr('id', visualInfo.xfId);

					var cardsDiv = $('#cards');
					cardsDiv.empty();
					cardsDiv.append(canvas);

					if (capturing) {
						var workspaceDiv = $('#workspace');
						workspaceDiv.css('overflow', 'visible');
					}
				}
			}

			processColumns(visualInfo.children, canvas, updateOnly);

			return canvas;
		};

		//------------------------------------------------------------------------------------------------------------------
		
		workspaceRenderer.getSize = function() {
			var workspaceDiv = $('#workspace');
			var width = workspaceDiv[0].scrollWidth;
			var height = workspaceDiv[0].scrollHeight;

			return {
				width : width,
				height : height
			};
		};
		
		//------------------------------------------------------------------------------------------------------------------

		workspaceRenderer.getRenderDefaults = function(){
			return _.clone(_renderDefaults);
		};

		return workspaceRenderer;
	}
);
