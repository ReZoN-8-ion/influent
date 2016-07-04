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
		'modules/infRest',
		'lib/module',
		'lib/communication/applicationChannels',
		'lib/constants',
		'lib/util/xfUtil',
		'lib/util/infTagUtilities',
		'lib/util/iconUtil',
		'lib/plugins',
		'lib/viewPlugins',
		'lib/util/infDescriptorUtilities',
		'modules/infWorkspace',
		'hbs!templates/footer/infEntityDetails'
	],

	function(
		infRest,
		modules,
		appChannel,
		constants,
		xfUtil,
		tagUtil,
		iconUtil,
		plugins,
		viewPlugins,
		descriptorUtil,
		infWorkspace,
		entityDetailsTemplate
		) {

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var MODULE_NAME = 'infEntityDetails';

		var _UIObjectState = {
			UIType : MODULE_NAME,
			properties : {},
			parentId : '',
			subscriberTokens : null,
			lastRequestedObject : null,
			canvas : null,
			buttonSpecList : null,
			searchParams : null
		};

		var _renderDefaults = {
			SCORE_BAR_WIDTH     : 28,
			SCORE_BAR_HEIGHT    : 4
		};

		//--------------------------------------------------------------------------------------------------------------
		// Private Methods
		//--------------------------------------------------------------------------------------------------------------

		var _onSearch = function(channel, data) {
			_UIObjectState.canvas.empty();
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSelect = function(channel, data) {

			if (channel !== appChannel.SELECTION_CHANGE_EVENT) {
				return;
			}

			if (data != null) {

				if (data.xfId === _UIObjectState.lastRequestedObject) {
					return;
				}

				_UIObjectState.lastRequestedObject = data.xfId;

				aperture.pubsub.publish(
					appChannel.REQUEST_ENTITY_DETAILS_INFORMATION,
					{
						xfId: _UIObjectState.lastRequestedObject
					}
				);
			} else {
				_UIObjectState.lastRequestedObject = null;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onUpdate = function(channel, data) {

			if (channel !== appChannel.ENTITY_DETAILS_INFORMATION) {
				return;
			}

			// Only retrieve details for xfCluster and xfCard objects.
			_UIObjectState.canvas.empty();

			if (data.uiType === constants.MODULE_NAMES.ENTITY) {
				// get details for entity here
				infRest.request('/entitydetails')
					.withData({entityId : data.spec.dataId})
					.inContext( data.xfId)
					.then( function (response) {

						_createEntityDetails(data.xfId, data.spec, response);
					}
				);
			} else if (data.spec.hasOwnProperty('ownerId') && data.spec.ownerId !== '') {

				// get details for entity here
				infRest.request('/entitydetails')
					.withData({entityId : data.spec.ownerId})
					.inContext( data.xfId)
					.then( function (response) {

						_createEntityDetails(data.xfId, data.spec, response, true);
					}
				);
			} else {
				// get the entities that make up the cluster
				infRest.request( '/containedentities' ).inContext( data.contextId ).withData({

					sessionId : infWorkspace.getSessionId(),
					queryId: (new Date()).getTime(),
					entitySets : [{
						contextId : data.contextId,
						entities : [data.spec.dataId]
					}],
					details : true

				}).then(function (response) {
					_createClusterDetails(data.xfId, data.uiType, data.spec, response);
				});
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onAccountsView = function(dataId) {
			var term = 'ENTITY:"' + dataId + '"';

			aperture.pubsub.publish(appChannel.SELECT_VIEW, {
				title:require('views/infAccountsView').name(),
				queryParams:{
					query : term
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSearchParams = function(eventChannel, data) {
			if (eventChannel !== appChannel.SEARCH_PARAMS_EVENT) {
				aperture.log.error('_onSearchParams: function called with illegal event channel');
				return false;
			}

			if (data.paramsType === 'entities') {
				_UIObjectState.searchParams = data.searchParams;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getEntityDetailsContext = function(xfId, spec, response, imageUrls, properties, includeClusterSummary) {
			var context = {};

			context.entityDetails = true;

			_UIObjectState.buttonSpecList = [
				{
					icon : constants.VIEWS.ACCOUNTS.ICON,
					title : 'View accounts for selected entity',
					switchesTo : constants.VIEWS.ACCOUNTS.NAME,
					callback : function() {
						_onAccountsView(response.uid);
					}
				}
			];

			Array.prototype.push.apply(_UIObjectState.buttonSpecList, viewPlugins.getOpsBarButtonSpecForView({entities: true}, function () {
				return descriptorUtil.getIdDescriptors([{dataId : response.uid, type : response.type}], _UIObjectState.searchParams, 'ENTITY');
			}));

			context.buttons = _UIObjectState.buttonSpecList;

			context.title = 'Account';

			var label = tagUtil.getValueByTag(response, 'LABEL');

			// append cluster count
			if (spec.count && spec.count > 1) {
				label += ' (+' + (spec.count - 1) + ')';
			}

			context.label = label;
			context.properties = [];

			var ordered = xfUtil.propertyMapToDisplayOrderArray(response.properties);

			var i;
			for (i=0; i< ordered.length; i++) {
				var labelValue = _getPropertyLabelValue(ordered[i]);
				if (labelValue) {
					context.properties.push(labelValue);
					properties.push(ordered[i]);
				}
			}

			if (includeClusterSummary) {
				context.clusterSummaryDetails = _getClusterSummaryDetailsContext(xfId, spec);
			}

			return context;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addEventHandlers = function(properties, includeClusterSummary) {
			if (includeClusterSummary) {
				_UIObjectState.canvas.find('.detailsValueBlock').each(function() {
					xfUtil.makeTooltip($(this).find('.detailsValueIcon img'), $(this).find('.detailsValueValue').html());
					xfUtil.makeTooltip($(this).find('.detailsValueScoreBar'), $(this).find('.detailsValueScore').html(), 'entity details score bar');
				});
			}

			aperture.util.forEach(_UIObjectState.buttonSpecList, function(button) {
				_UIObjectState.canvas.find('#' + button.switchesTo).click(function() {
					button.callback();
				});
			});

			_UIObjectState.canvas.find('.detailsIcon').each(function() {
				xfUtil.makeTooltip($(this), $(this).attr('title'));
			});

			_UIObjectState.canvas.find('.propertyValue').each(function(i) {
				if (i > 0) {	//ignore first row (uid)
					_addPropertyTableRowHandlers($(this), properties[i - 1]);
				}
			});

			_UIObjectState.canvas.find('.detailsValueBlock').each(function() {
				xfUtil.makeTooltip($(this).find('.detailsValueIcon img'), $(this).find('.detailsValueValue').html());
				xfUtil.makeTooltip($(this).find('.detailsValueScoreBar'), $(this).find('.detailsValueScore').html(), 'entity details score bar');
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createEntityDetails = function(xfId, spec, response, includeClusterSummary) {
			var imageUrls = [];
			var properties = [];
			var context = _getEntityDetailsContext(xfId, spec, response, imageUrls, properties, includeClusterSummary);

			_UIObjectState.canvas.append(entityDetailsTemplate(context));

			_addEventHandlers(properties, includeClusterSummary);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getClusterSummaryDetailsContext = function(xfId, spec) {

			var context = {};
			context.title = 'Owner';

			var label = spec.label;

			// append cluster count
			if (spec.count && spec.count > 1) {
				label += ' (+' + (spec.count - 1) + ')';
			}

			context.label = label;

			var iconClassOrder = aperture.config.get()['influent.config'].iconOrder;
			var iconClassMap = aperture.config.get()['influent.config'].iconMap;

			context.detailsBlocks = [];
			for(var i = 0; i < iconClassOrder.length; i++) {
				context.detailsBlocks = context.detailsBlocks.concat(_getPropertyBlock(iconClassOrder[i], iconClassMap, spec));
			}
			return context;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _createClusterDetails = function(xfId, uiType, spec, response) {
			var context = {};

			var entities = [];
			var i;
			if (response.data.length > 0) {
				for (i = 0; i < response.data[0].entities.length; i++) {
					entities.push({dataId: response.data[0].entities[i].uid, type: response.data[0].entities[i].type});
				}

				_UIObjectState.buttonSpecList = viewPlugins.getOpsBarButtonSpecForView({entities: true}, function () {
					return descriptorUtil.getIdDescriptors(entities, _UIObjectState.searchParams, 'ENTITY');
				});

				context.buttons = _UIObjectState.buttonSpecList;
			}

			context.clusterDetails = {};

			context.clusterDetails.title = 'Cluster';

			var label = spec.label;

			// append cluster count
			if (spec.count && spec.count > 1) {
				label += ' (+' + (spec.count - 1) + ')';
			}
			context.clusterDetails.label = label;

			var iconClassOrder = aperture.config.get()['influent.config'].iconOrder;
			var iconClassMap = aperture.config.get()['influent.config'].iconMap;

			context.clusterDetails.detailsBlocks = [];
			for(i = 0; i < iconClassOrder.length; i++) {
				context.clusterDetails.detailsBlocks = context.clusterDetails.detailsBlocks.concat(_getPropertyBlock(iconClassOrder[i], iconClassMap, spec));
			}

			_UIObjectState.canvas.append(entityDetailsTemplate(context));

			_addEventHandlers(null, false);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getPropertyBlock = function(iconClass, iconClassMap, spec) {
			var context = [];

			if (iconClassMap[iconClass]) {
				for (var j = 0; j < spec.icons.length; j++) {
					var propertyBlockContext = {};

					var icon = spec.icons[j];
					if (icon.type === iconClass) {
						propertyBlockContext.header = icon.friendlyName;

						var imgUrl = icon.imgUrl;

						if (imgUrl) {
							if (imgUrl.substr(0, 6) === 'class:') {
								propertyBlockContext.cssicon = imgUrl.substr(6);
							} else {
								// ick.
								propertyBlockContext.image =
									imgUrl.replace(/iconWidth=[0-9]+/, 'iconWidth=28')
										.replace(/iconHeight=[0-9]+/, 'iconHeight=28');
							}
						}

						propertyBlockContext.value = icon.title;

						var score = '' + Math.round(icon.score * 100) + '%';

						propertyBlockContext.backgroundWidth = _renderDefaults.SCORE_BAR_WIDTH;
						propertyBlockContext.backgroundHeight = _renderDefaults.SCORE_BAR_HEIGHT;
						propertyBlockContext.foregroundWidth = (_renderDefaults.SCORE_BAR_WIDTH - 1) * icon.score;
						propertyBlockContext.foregroundHeight = _renderDefaults.SCORE_BAR_HEIGHT;

						propertyBlockContext.valueScore = score;

						context.push(propertyBlockContext);
					}
				}
			}
			return context;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getPropertyLabelValue = function(property) {
			if (!property.friendlyText) {
				return;
			}

			var friendlyText = property.friendlyText+ ':';
			var value = tagUtil.getFormattedValue(property);
			var ishtml = false;

			if (property.propertyType !== 'IMAGE') {
				value = xfUtil.removeSpecialCharacters(value, true);
			} else {
				ishtml = true;
			}

			var label = {name: friendlyText, value: value, isHTML: ishtml};
			var icon = iconUtil.getIconForProperty(property, {width: 20, height: 20});

			if (icon) {
				if (icon.imgUrl && icon.imgUrl.substr(0, 6) === 'class:') {
					label.cssicon = icon.imgUrl.substr(6);
				} else {
					label.image = icon.imgUrl;
				}
			}
			return label;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addPropertyTableRowHandlers = function(valueCell, property) {
			var extensions = plugins.get('details');
			var clickPlugin = aperture.util.find(extensions, function(e) {
				return e.propertyClick !== undefined;
			});
			if (clickPlugin) {
				var onClick = clickPlugin.propertyClick(property);
				if (onClick) {
					valueCell.click(function(e) { onClick(e); });
					var image = $('<img>').appendTo(valueCell);
					image.attr('src', 'img/info_icon.png');
					image.css('margin-left', '5px');
				}
			}

			var hoverPlugin = aperture.util.find(extensions, function(e) {
				return e.propertyHover !== undefined;
			});
			var onHover = null;
			if (hoverPlugin) {
				onHover = hoverPlugin.propertyHover(property);
			}

			if (onHover) {
				if (onHover.fnIn) {
					valueCell.mouseover(function (e) {
						onHover.fnIn(e);
					});
				}

				if (onHover.fnOut) {
					valueCell.mouseout(function (e) {
						onHover.fnOut(event);
					});
				}
			} else {

				// Add tooltip to show uncertainty and provenance
				var uncertainty = property.uncertainty;
				var provenance = property.provenance;
				var tooltipString = '';

				if (uncertainty) {
					tooltipString += 'Uncertainty: ' + uncertainty + '\n';
				}
				if (provenance) {
					tooltipString += 'Provenance: ' + provenance + '\n';
				}

				valueCell.attr('title', tooltipString);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _initializeModule = function() {
			_UIObjectState.canvas = $('#details');
		};

		//--------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('infEntityDetails', function() {
			return {
				start : function() {
					var subTokens = {};
					subTokens[appChannel.SELECTION_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.SELECTION_CHANGE_EVENT, _onSelect);
					subTokens[appChannel.SEARCH_REQUEST] = aperture.pubsub.subscribe(appChannel.SEARCH_REQUEST, _onSearch);
					subTokens[appChannel.ENTITY_DETAILS_INFORMATION] = aperture.pubsub.subscribe(appChannel.ENTITY_DETAILS_INFORMATION, _onUpdate);
					subTokens[appChannel.START_FLOW_VIEW] = aperture.pubsub.subscribe(appChannel.START_FLOW_VIEW, _initializeModule);
					subTokens[appChannel.SEARCH_PARAMS_EVENT] = aperture.pubsub.subscribe(appChannel.SEARCH_PARAMS_EVENT, _onSearchParams);
					_UIObjectState.subscriberTokens = subTokens;
				},
				end : function(){
					for (var token in _UIObjectState.subscriberTokens) {
						if (_UIObjectState.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_UIObjectState.subscriberTokens[token]);
						}
					}
					_UIObjectState.subscriberTokens = {};
				}
			};
		});


		if (constants.UNIT_TESTS_ENABLED) {
			return {
				_UIObjectState : _UIObjectState,
				_createEntityDetails : _createEntityDetails,
				_onUpdate : _onUpdate
			};
		}
	}
);
