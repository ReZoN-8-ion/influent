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
		'lib/module', 'lib/communication/applicationChannels', 'lib/render/cardRenderer', 'lib/render/fileRenderer',
		'lib/render/clusterRenderer', 'lib/util/xfUtil', 'lib/ui/xfLinkType', 'lib/constants'
	],
	function(
		modules, appChannel, cardRenderer, fileRenderer,
		clusterRenderer, xfUtil, xfLinkType, constants
		){

		var _cardDefaults = cardRenderer.getRenderDefaults();
		var _fileDefaults = fileRenderer.getRenderDefaults();
		var _clusterDefaults = clusterRenderer.getRenderDefaults();

		var _sankeyState = {
			plot : {},
			linkLayer : {},
			links : [],
			isFirst : true,
			sandbox : undefined,
			amountDistribution : [],
			minSankeyWidth : 1,
			maxSankeyWidth : 20,
			targetOffsetY : 0,//5, // This value is to add just a little more curvature to otherwise straight links.
			capture : false,
			subscriberTokens : null
		};

		// Private Functions -----------------------------------------------------------------------------------------------

		var _resetSankeyState = function(){
			_sankeyState.isFirst = true;
			_sankeyState.links = [];
			_sankeyState.selection.clear();
			_sankeyState.linkLayer.all(null).redraw();
			_sankeyState.amountDistribution = [];
		};

		//------------------------------------------------------------------------------------------------------------------

		var _getWidthForLink = function(linkObj, maxAmount) {
			if (linkObj.getType() === xfLinkType.FILE) {
				return 2;
			} else if (linkObj.getType() === xfLinkType.TPS) {
				return 2;
			} else {
				return Math.max((linkObj.getAmount()/maxAmount) * _sankeyState.maxSankeyWidth, _sankeyState.minSankeyWidth);
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _addStyleFromSpecs = function(style, linkType, linkSelected) {
			switch(linkType) {
				case xfLinkType.FILE:
					style['sankey-style'] = 'dotted';
					if(linkSelected) {
						style['sankey-color'] = '#359EB8';
					}
					else {
						style['sankey-color'] = '#8F8263';
					}
					break;
				case xfLinkType.TPS:
					style['sankey-style'] = 'solid';
					style['sankey-color'] = '#8F8263';
					break;
				case xfLinkType.FLOW:
				/*falls through*/
				default:
					style['sankey-style'] = 'solid';
					style['sankey-color'] = '#C4BDAD';
					break;
			}
			return style;
		};

		//------------------------------------------------------------------------------------------------------------------

		/**
		 * Returns the correct UIObject width based on the uiType and its
		 * expansion state.
		 * @param sourceObj
		 * @returns {*}
		 * @private
		 */
		var _getCardMetrics = function(sourceObj){
			var uiType = sourceObj.getUIType();
			var isDescendantOfFile = xfUtil.isUITypeDescendant(sourceObj, constants.MODULE_NAMES.FILE);
			if (uiType === constants.MODULE_NAMES.FILE || isDescendantOfFile){
				return {
					width : _fileDefaults.FILE_WIDTH,
					offset : isDescendantOfFile ? _fileDefaults.FILE_WIDTH - _cardDefaults.CARD_LEFT : _fileDefaults.FILE_WIDTH
				};
			}
			else if (
				uiType === constants.MODULE_NAMES.IMMUTABLE_CLUSTER ||
				uiType === constants.MODULE_NAMES.MUTABLE_CLUSTER ||
				uiType === constants.MODULE_NAMES.SUMMARY_CLUSTER
				){
				// If this card is a child of a file or matchcard, we want to use the width of the parent.
				var isExpanded = sourceObj.isExpanded();
				var clusterWidth = isExpanded ? _cardDefaults.CARD_WIDTH : _cardDefaults.CARD_WIDTH + ((_clusterDefaults.STACK_COUNT-1)*_clusterDefaults.STACK_WIDTH);
				return {
					width : clusterWidth,
					offset : clusterWidth
				};
			}
			else if (uiType === constants.MODULE_NAMES.ENTITY) {
				return {
					width : _cardDefaults.CARD_WIDTH,
					offset : _cardDefaults.CARD_WIDTH
				};
			}
			else if (uiType === constants.MODULE_NAMES.MATCH) {
				aperture.log.error('Matchcards do not currently support branching operations and should not contain any links');
			}
			else {
				aperture.log.error('Unable to determine value of Sankey source-offset for card of type: ' + uiType);
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		/**
		 * This is a temp HACK!!!
		 * Parse source and target ids in case they are from file clusters.
		 */
		var _getNormalizedXfId = function(uiObject){
			var xfId = uiObject.getXfId();
			return xfId.indexOf('face_') === 0?xfId.slice('face_'.length):xfId;
		};

		//------------------------------------------------------------------------------------------------------------------

		/**
		 * Performs any calculations that are required for
		 * link spec creation (e.g. finding the max AMOUNT
		 * value).
		 * @param workspaceObject
		 */
		var _processLinkInfo = function(workspaceObject){
			var linkMap = {};
			var workspaceLinks = workspaceObject.getLinks();
			for (var linkId in workspaceLinks){
				if (workspaceLinks.hasOwnProperty(linkId)) {
					var linkObj = workspaceLinks[linkId];
					_sankeyState.amountDistribution.push(linkObj.getAmount());
					var sObj = linkObj.getSource();
					var tObj = linkObj.getDestination();

					// Get the normalized XfId. This is only
					// necessary as a workaround for the HACK
					// that enables xfFiles to be clusters.
					// Should be removed once that architecture
					// is redone with a more correct solution.
					var sourceId = _getNormalizedXfId(sObj);
					var targetId = _getNormalizedXfId(tObj);

					// Get the outgoing links.
					var incidentLinks = linkMap[sourceId];
					if (incidentLinks == null){
						incidentLinks = {
							incoming : {},
							outgoing : {}
						};
					}

					incidentLinks.outgoing[targetId] = linkObj;
					linkMap[sourceId] = incidentLinks;

					// Get the incoming links.
					incidentLinks = linkMap[targetId];
					if (incidentLinks == null){
						incidentLinks = {
							incoming : {},
							outgoing : {}
						};
					}
					incidentLinks.incoming[sourceId] = linkObj;
					linkMap[targetId] = incidentLinks;
				}
			}
			return linkMap;
		};

		//------------------------------------------------------------------------------------------------------------------

		/**
		 * Creates a map of all the incoming/outgoing links for a given link endpoint.
		 * This is required so that the Sankey layer in Aperture can arrange the flows
		 * in a vertically stacked layout.
		 * @param linkMap
		 * @param xfId
		 * @param type
		 * @returns {Array}
		 * @private
		 */
		var _getIncidentLinks = function(linkMap, xfId, type){
			var links = [];
			var incidentLinks = linkMap[xfId];
			var maxAmount = Math.max(_.max(_sankeyState.amountDistribution), _sankeyState.minSankeyWidth);
			var linkStyle;
			if (type === 'outgoing'){
				for (var tId in incidentLinks.outgoing) {
					if (incidentLinks.outgoing.hasOwnProperty(tId)) {
						linkStyle = {
							'id' : incidentLinks.outgoing[tId].getXfId(),
							'sankey-width' : Math.max((incidentLinks.outgoing[tId].getAmount()/maxAmount) * _sankeyState.maxSankeyWidth, _sankeyState.minSankeyWidth)
						};

						linkStyle = _addStyleFromSpecs(linkStyle, incidentLinks.outgoing[tId].getType(), incidentLinks.outgoing[tId].isSelected());
						links.push(linkStyle);
					}
				}
			}
			else {
				for (var sId in incidentLinks.incoming) {
					if (incidentLinks.incoming.hasOwnProperty(sId)) {
						linkStyle = {
							'id' : incidentLinks.incoming[sId].getXfId(),
							'sankey-width' : Math.max((incidentLinks.incoming[sId].getAmount()/maxAmount) * _sankeyState.maxSankeyWidth, _sankeyState.minSankeyWidth)
						};

						linkStyle = _addStyleFromSpecs(linkStyle, incidentLinks.incoming[sId].getType(), incidentLinks.incoming[sId].isSelected());
						links.push(linkStyle);
					}
				}
			}
			return links;
		};

		//--------------------------------------------------------------------------------------------------------------

		var createLinkId = function(uiObject) {
			var column = xfUtil.getUITypeAncestor(uiObject, constants.MODULE_NAMES.COLUMN);

			return column.getXfId() + '__' + uiObject.getDataId();
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createLinkSpecs = function(positionMap, workspaceObject, linkMap){
			var changedIds = [];
			var workspaceLinks = workspaceObject.getLinks();
			var maxAmount = Math.max(_.max(_sankeyState.amountDistribution), _sankeyState.minSankeyWidth);

			aperture.util.forEach(
				workspaceLinks,
				function(linkObj) {

					var linkId = linkObj.getXfId();

					var sourceObj = linkObj.getSource();
					var targetObj = linkObj.getDestination();

					if (sourceObj.getVisualInfo().isHidden || targetObj.getVisualInfo().isHidden) {
						return;
					}

					var sourceId = _getNormalizedXfId(sourceObj);
					var sourceHeight = sourceObj.getUIType() === constants.MODULE_NAMES.FILE ?
						fileRenderer.getFileHeight(sourceObj.getVisualInfo().showDetails) :
						cardRenderer.getCardHeight(sourceObj.getVisualInfo().showDetails);

					var targetId = _getNormalizedXfId(targetObj);
					var targetHeight = targetObj.getUIType() === constants.MODULE_NAMES.FILE ?
						fileRenderer.getFileHeight(targetObj.getVisualInfo().showDetails) :
						cardRenderer.getCardHeight(targetObj.getVisualInfo().showDetails);

					var isHighlighted = sourceObj.isHighlighted() || targetObj.isHighlighted();

					if (sourceObj.getUIType() === constants.MODULE_NAMES.FILE && sourceObj.getClusterUIObject() != null){
						if (sourceObj.getClusterUIObject().isHighlighted()){
							isHighlighted = true;
						}
					}
					else if (targetObj.getUIType() === constants.MODULE_NAMES.FILE && targetObj.getClusterUIObject() != null){
						if (targetObj.getClusterUIObject().isHighlighted()){
							isHighlighted = true;
						}
					}

					if (isHighlighted){
						_sankeyState.selection.add(linkId);
					}

					var sMetric = _getCardMetrics(sourceObj);
					var tMetric = _getCardMetrics(targetObj);

					var sIncident = _getIncidentLinks(linkMap, sourceId, 'outgoing');
					var tIncident = _getIncidentLinks(linkMap, targetId, 'incoming');

					if(positionMap[sourceId] == null || positionMap[targetId] == null) {
						var missingId = (positionMap[sourceId] == null) ? sourceId : targetId;
						aperture.log.warn('Position map is missing value for ' +
							((positionMap[sourceId] == null) ? 'source' : 'target') + ' key ' + missingId);
						return;
					}

					var linkSpec = {
						id : linkObj.getXfId(),
						source : {
							uid : sourceId,
							id : createLinkId(sourceObj),
							x : positionMap[sourceId].left,
							y : positionMap[sourceId].top + sourceHeight/2,
							width : sMetric.width,
							height : sourceHeight,
							links : sIncident,
							'source-offset' : sMetric.offset
						},
						target : {
							uid : targetId,
							id : createLinkId(targetObj),
							x : positionMap[targetId].left,
							y : positionMap[targetId].top + targetHeight/2 + _sankeyState.targetOffsetY,
							width : tMetric.width,
							height : targetHeight,
							links : tIncident,
							'source-offset' : 0
						},
						'sankey-width' : _getWidthForLink(linkObj, maxAmount)
					};

					_addStyleFromSpecs(linkSpec, linkObj.getType(), linkObj.isSelected());
					changedIds.push(linkSpec.id);
					_sankeyState.links.push(linkSpec);
				}
			);

//			for (var linkId in workspaceLinks){
//				if (workspaceLinks.hasOwnProperty(linkId)) {
//					var linkObj = workspaceLinks[linkId];
//					var sourceObj = linkObj.getSource();
//					var targetObj = linkObj.getDestination();
//
//					// Skip links to/from hidden objects
//					if (sourceObj.getVisualInfo().isHidden || targetObj.getVisualInfo().isHidden) {
//						continue;
//					}
//
//					var sourceId = _getNormalizedXfId(sourceObj);
//					var sourceHeight = sourceObj.getUIType() === constants.MODULE_NAMES.FILE ?
//										fileRenderer.getFileHeight(sourceObj.getVisualInfo().showDetails) :
//										cardRenderer.getCardHeight(sourceObj.getVisualInfo().showDetails);
//
//					var targetId = _getNormalizedXfId(targetObj);
//					var targetHeight = targetObj.getUIType() === constants.MODULE_NAMES.FILE ?
//										fileRenderer.getFileHeight(targetObj.getVisualInfo().showDetails) :
//										cardRenderer.getCardHeight(targetObj.getVisualInfo().showDetails);
//
//					// Check to see if the link is selected.
//					// TODO: This logic needs to change to
//					// accommodate the logic for brokers.
//					var isHighlighted = sourceObj.isHighlighted() || targetObj.isHighlighted();
//
//					// Logic to enable highlighting of a files internal cluster.
//					if (sourceObj.getUIType() === constants.MODULE_NAMES.FILE && sourceObj.getClusterUIObject() != null){
//						if (sourceObj.getClusterUIObject().isHighlighted()){
//							isHighlighted = true;
//						}
//					}
//					else if (targetObj.getUIType() === constants.MODULE_NAMES.FILE && targetObj.getClusterUIObject() != null){
//						if (targetObj.getClusterUIObject().isHighlighted()){
//							isHighlighted = true;
//						}
//					}
//
//					if (isHighlighted){
//						_sankeyState.selection.add(linkId);
//					}
//
//					var sMetric = _getCardMetrics(sourceObj);
//					var tMetric = _getCardMetrics(targetObj);
//
//					var sIncident = _getIncidentLinks(linkMap, sourceId, 'outgoing');
//					var tIncident = _getIncidentLinks(linkMap, targetId, 'incoming');
//
//					if(positionMap[sourceId] == null || positionMap[targetId] == null) {
//						var missingId = (positionMap[sourceId] == null) ? sourceId : targetId;
//						aperture.log.warn('Position map is missing value for ' +
//								((positionMap[sourceId] == null) ? 'source' : 'target') + ' key ' + missingId);
//						continue;
//					}
//
//					var linkSpec = {
//						id : linkObj.getXfId(),
//						source : {
//							id : sourceId,
//							x : positionMap[sourceId].left,
//							y : positionMap[sourceId].top + sourceHeight/2,
//							width : sMetric.width,
//							height : sourceHeight,
//							links : sIncident,
//							'source-offset' : sMetric.offset
//						},
//						target : {
//							id : targetId,
//							x : positionMap[targetId].left,
//							y : positionMap[targetId].top + targetHeight/2 + _sankeyState.targetOffsetY,
//							width : tMetric.width,
//							height : targetHeight,
//							links : tIncident,
//							'source-offset' : 0
//						},
//						'sankey-width' : _getWidthForLink(linkObj, maxAmount)
//					};
//					_addStyleFromSpecs(linkSpec, linkObj.getType(), linkObj.isSelected());
//					changedIds.push(linkSpec.id);
//					_sankeyState.links.push(linkSpec);
//				}
//			}
			return changedIds;
		};

		//------------------------------------------------------------------------------------------------------------------

		/**
		 * Updates links in response to a change in data
		 */
		var	_updateLinks = function( channel, data ) {
			_resetSankeyState();

			var sankey = $('#' + _sankeyState.divId);

			if (data != null){
				// Hide the Sankey canvas.
				sankey.hide();

				var workspaceObj = data.workspace;
				var layoutProvider = data.layoutProvider;

				var linkMap = _processLinkInfo(workspaceObj);
				// Calculate the positions for everything in the workspace.
				var changedIds = _createLinkSpecs(layoutProvider.getPositionMap(), workspaceObj, linkMap);

				if (_sankeyState.isFirst){
					_sankeyState.isFirst = false;
					_sankeyState.linkLayer.all(_sankeyState.links, function(){
						return this.id;
					}).redraw();
				}
				else {
					_sankeyState.linkLayer.join(_sankeyState.links, function(){
						return this.id;
					}).where('id', changedIds).redraw();
				}
			}

			if (_sankeyState.capture) {
				sankey.show();
			} else {
				sankey.fadeIn(1000);
			}
		};

		//------------------------------------------------------------------------------------------------------------------

		var _initializeModule = function() {
			// Selection set.
			_sankeyState.selection = new aperture.Set('id');

			// Create the Aperture layers.
			var plot = new aperture.NodeLink(_sankeyState.divId);
			var linkLayer = plot.addLayer( aperture.SankeyPathLayer );

			linkLayer.map('node-uid').from('uid');
			linkLayer.map('node-id').from('id');

			linkLayer.map('node-x').from('x');
			linkLayer.map('node-y').from('y');

			linkLayer.all(_sankeyState.links, 'id');
			linkLayer.map('source').from('source');
			linkLayer.map('target').from('target');

			// Parameterize offsets to use file width.
			linkLayer.map('source-offset').from('source-offset');
			linkLayer.map('target-offset').asValue(0);
			linkLayer.map('stroke').from('sankey-color').filter(_sankeyState.selection.constant('orange'));
			linkLayer.map('stroke-width').from('sankey-width');
			linkLayer.map('stroke-style').from('sankey-style');
			linkLayer.map('sankey-anchor').asValue('middle');
			linkLayer.map('opacity').asValue(0.5);//.filter(highlightedLinks.constant(1));

			//TODO: Will we ever initialize this with flows to draw,
			if (_sankeyState.links.length > 0){
				plot.all().redraw();
			}

			_sankeyState['plot'] = plot;
			_sankeyState['linkLayer'] = linkLayer;
			//		_linkLayer.map('opacity').asValue(0.5).filter(highlightedLinks.constant(1));
		};

		//------------------------------------------------------------------------------------------------------------------

		var _sankeyConstructor = function( sandbox ) {

			_sankeyState.capture = sandbox.spec.capture;
			_sankeyState.divId = sandbox.spec.div;

			var start = function() {
				var subTokens = {};
				subTokens[appChannel.UPDATE_SANKEY_EVENT] = aperture.pubsub.subscribe(appChannel.UPDATE_SANKEY_EVENT, _updateLinks);
				subTokens[appChannel.INIT_SANKEY_REQUEST] = aperture.pubsub.subscribe(appChannel.INIT_SANKEY_REQUEST, _initializeModule);
				_sankeyState.subscriberTokens = subTokens;
			};


			/**
			 * End the module, unhook subscribers
			 */
			var end = function() {
				for (var token in _sankeyState.subscriberTokens) {
					if (_sankeyState.subscriberTokens.hasOwnProperty(token)) {
						aperture.pubsub.unsubscribe(_sankeyState.subscriberTokens[token]);
					}
				}
				$('#' + _sankeyState.divId).remove();
			};

			return {
				start : start,
				end : end
			};
		};

		//------------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('infSankey', _sankeyConstructor );
	}
);
