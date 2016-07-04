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
define([
		'lib/communication/applicationChannels',
		'lib/plugins',
		'views/infView',
		'lib/search',
		'lib/util/infDescriptorUtilities'
	],
	function(
		appChannel,
		plugins,
		infView,
		search,
		descriptorUtil
		) {

		var _UIObjectState = {
			subscriberTokens : null,
			views : {},
			searchParams : {},
			visibleView : null
		};

		//--------------------------------------------------------------------------------------------------------------

		var _startViews = function() {
			_UIObjectState.subscriberTokens = {};
			_UIObjectState.subscriberTokens[appChannel.VIEW_REGISTERED] = aperture.pubsub.subscribe(appChannel.VIEW_REGISTERED, _onViewRegistered);
			_UIObjectState.subscriberTokens[appChannel.ALL_MODULES_STARTED] = aperture.pubsub.subscribe(appChannel.ALL_MODULES_STARTED, _initViews);
			_UIObjectState.subscriberTokens[appChannel.VIEW_PARAMS_CHANGED] = aperture.pubsub.subscribe(appChannel.VIEW_PARAMS_CHANGED, _onViewParametersChanged);
			_UIObjectState.subscriberTokens[appChannel.SEARCH_PARAMS_EVENT] = aperture.pubsub.subscribe(appChannel.SEARCH_PARAMS_EVENT, _onSearchParams);
			_UIObjectState.subscriberTokens[appChannel.SWITCH_VIEW] = aperture.pubsub.subscribe(appChannel.SWITCH_VIEW, _onSwitchView);

			var views = plugins.get('views');
			aperture.util.forEach(views, function(view) {

				var _getCaptureDimensions = function() {
					var viewDiv = _UIObjectState[view.key].canvas.find('.simpleViewContentsContainer');
					return {
						width : viewDiv[0].scrollWidth,
						height : viewDiv[0].scrollHeight
					};
				};

				_UIObjectState.views[view.key] = view;
				infView.registerView({
					title: view.key,
					label: view.label,
					icon: view.icon,
					getCaptureDimensions : _getCaptureDimensions,
					saveState : function(callback){ callback(true); },
					queryParams : function() { return {query: view.query}; }
				});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _buildContainerAPI = function(view, type) {
			var stateChange = function(propertyMatchDescriptors) {
				if (view.stateless) {
					var query = descriptorUtil.getQueryFromDescriptors(propertyMatchDescriptors, type, _UIObjectState.searchParams);
					if (view.query !== query) {
						view.query = query;
						aperture.pubsub.publish(appChannel.SELECT_VIEW, {
							title: view.key,
							queryParams: {
								query: view.query
							}
						});
					}
				}
			};

			var container = {
				search : {
					entities : search.entities,
					links : search.links
				},
				events : {
					stateChange : stateChange
				},
				canvas : view.canvas
			};
			return container;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addSpecToList = function(specs, view, type, getDescriptors) {
			var containerAPI = _buildContainerAPI(view, type);

			specs.push({
				icon: view.icon,
				switchesTo: view.key,
				title: view.tooltip,
				requiresSelection: true,

				callback: function () {
					var selectViewData = {
						title : view.key
					};

					if (view.stateless) {
						selectViewData.queryParams = {
							query: descriptorUtil.getQueryFromDescriptors(getDescriptors(), type, _UIObjectState.searchParams)
						};
					} else {
						setTimeout(
							function () {
								if (typeof view.onShow === 'function') {
									view.onShow(view.canvas);
								}
								view.onData(type, getDescriptors(), containerAPI);
							},
							0
						);
					}

					aperture.pubsub.publish(appChannel.SELECT_VIEW, selectViewData);
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _isMatch = function(sendDescs, view, type) {
			return (view.receives.hasOwnProperty(type) && view.receives[type] &&
				sendDescs.hasOwnProperty(type) && sendDescs[type]);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addButtonSpec = function(sendDescs, buttonSpecs, getDescriptors) {
			aperture.util.forEach(_UIObjectState.views, function(view) {
				if (_isMatch(sendDescs, view, 'entities')) {
					_addSpecToList(buttonSpecs, view, 'entities', getDescriptors);
				}
				if (_isMatch(sendDescs, view, 'links')) {
					_addSpecToList(buttonSpecs, view, 'links', getDescriptors);
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getOpsBarButtonSpecForView = function(sendDescs, getDescriptors) {
			var buttonSpecs = [];

			_addButtonSpec(sendDescs, buttonSpecs, getDescriptors);

			return buttonSpecs;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSwitchView = function(eventChannel, data) {
			if (eventChannel !== appChannel.SWITCH_VIEW) {
				aperture.log.error('_onSwitchView: function called with illegal event channel');
				return false;
			}

			if (data == null || data.title == null) {
				aperture.log.error('_onSwitchView: function called with invalid data');
				return false;
			}

			if (_UIObjectState.visibleView !== null && _UIObjectState.visibleView.key !== data.title) {
				_UIObjectState.visibleView.onHide(_UIObjectState.visibleView.canvas);
			}

			aperture.util.forEach(_UIObjectState.views, function(view) {
				if (view.key === data.title) {
					_UIObjectState.visibleView = view;
					if (typeof view.onShow === 'function') {
						view.onShow(view.canvas);
					}

					return false;
				}
			});

			if (_UIObjectState.visibleView !== null && _UIObjectState.visibleView.key !== data.title) {
				_UIObjectState.visibleView = null;
			}
		};

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onViewParametersChanged = function(eventChannel, data) {

			if (eventChannel !== appChannel.VIEW_PARAMS_CHANGED) {
				aperture.log.error('_onViewParametersChanged: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.title == null ||
				data.all == null
				) {
				aperture.log.error('_onViewParametersChanged: function called with invalid data');
				return false;
			}

			aperture.util.forEach(_UIObjectState.views, function(view) {
				if (view.key === data.title) {
					if (data.all.query !== view.query) {
						view.query = data.all.query;
						_UIObjectState.visibleView = view;

						setTimeout(
							function () {
								if (typeof view.onShow === 'function') {
									view.onShow(view.canvas);
								}
								view.query = data.all.query;
								var descriptorObj = descriptorUtil.getDescriptorsFromQuery(view.query, _UIObjectState.searchParams);
								view.onData(descriptorObj.searchType, descriptorObj.matchDescriptorMap, _buildContainerAPI(view, descriptorObj.searchType));
							},
							0
						);
					}

					return false;
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onViewRegistered = function(eventChannel, data) {
			if (eventChannel !== appChannel.VIEW_REGISTERED) {
				aperture.log.error('_onViewRegistered: function called with illegal event channel');
				return false;
			}

			aperture.util.forEach(_UIObjectState.views, function(view) {
				if (view.key === data.name) {
					view.canvas = data.canvas;
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSearchParams = function(eventChannel, data) {
			if (eventChannel !== appChannel.SEARCH_PARAMS_EVENT) {
				aperture.log.error('_onSearchParams: function called with illegal event channel');
				return false;
			}

			_UIObjectState.searchParams[data.paramsType] = data.searchParams;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _initViews = function(eventChannel) {
			if (eventChannel !== appChannel.ALL_MODULES_STARTED) {
				aperture.log.error('_initViews: function called with illegal event channel');
				return false;
			}

			aperture.util.forEach(_UIObjectState.views, function(view) {
				if (typeof view.onInit === 'function') {
					view.onInit(view.canvas);
				}
				aperture.pubsub.publish(appChannel.VIEW_INITIALIZED, {name: view.key});
			});
		};

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var viewPluginModule = {
			startViews : _startViews,
			getOpsBarButtonSpecForView : _getOpsBarButtonSpecForView
		};

		return viewPluginModule;
	}
);
