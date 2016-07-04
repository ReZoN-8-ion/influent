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
		'lib/communication/applicationChannels',
		'lib/communication/flowViewChannels',
		'lib/constants',
		'lib/layout/xfLayoutProvider',
		'lib/models/xfCard',
		'lib/models/xfClusterBase',
		'lib/models/xfColumn',
		'lib/models/xfFile',
		'lib/models/xfImmutableCluster',
		'lib/models/xfLink',
		'lib/models/xfMutableCluster',
		'lib/models/xfSummaryCluster',
		'lib/models/xfWorkspace',
		'lib/module',
		'lib/plugins',
		'lib/sandbox',
		'lib/toolbar/infToolbar',
		'lib/ui/toolbarOperations',
		'lib/ui/xfLinkType',
		'lib/ui/xfModalDialog',
		'lib/util/duration',
		'lib/util/GUID',
		'lib/util/iconUtil',
		'lib/util/infTagUtilities',
		'lib/util/xfUtil',
		'modules/infHeader',
		'modules/infWorkspace',
		'modules/infRest',
		'views/infView',
		'hbs!templates/flowView/flowView'
	],
	function (
		appChannel,
		flowChannel,
		constants,
		xfLayoutProvider,
		xfCard,
		xfClusterBase,
		xfColumn,
		xfFile,
		xfImmutableCluster,
		xfLink,
		xfMutableCluster,
		xfSummaryCluster,
		xfWorkspace,
		modules,
		plugins,
		Sandbox,
		infToolbar,
		toolbarOp,
		xfLinkType,
		xfModalDialog,
		duration,
		guid,
		iconUtil,
		tagUtil,
		xfUtil,
		infHeader,
		infWorkspace,
		infRest,
		infView,
		flowViewTemplate
	) {

		var VIEW_NAME = constants.VIEWS.FLOW.NAME;
		var VIEW_LABEL = constants.VIEWS.FLOW.LABEL || VIEW_NAME;
		var ICON_CLASS = constants.VIEWS.FLOW.ICON;

		var MAX_PATTERN_SEARCH_RESULTS = aperture.config.get()['influent.config']['searchResultsPerPage'];
		var DEFAULT_SORT_FUNCTION = xfUtil.bothDescendingSort;
		var OBJECT_DEGREE_WARNING_COUNT = aperture.config.get()['influent.config']['objectDegreeWarningCount'] || 1000;
		var OBJECT_DEGREE_LIMIT_COUNT = aperture.config.get()['influent.config']['objectDegreeLimitCount'] || 10000;
		var DEFAULT_GRAPH_SCALE = (aperture.config.get()['influent.config']['defaultGraphScale'] != null) ? aperture.config.get()['influent.config']['defaultGraphScale'] : 0;
		var NUMBER_FORMATTER = aperture.Format.getNumberFormat(1);

		var _UIObjectState = {
			canvas: null,
			subscriberTokens: {},
			viewToolbar: null,
			moduleManager: null,
			focus: null,
			showDetails: true,
			footerDisplay: 'none',
			dates: {startDate: '', endDate: '', numBuckets: 0, duration: ''},
			singleton: undefined,
			selectedUIObject: null,
			graphSearchActive: null,
			isInFlowView: false,
			scrollStates: []
		};

		_UIObjectState.moduleManager = modules.createManager(function (spec) {
			spec.state = {};
			return new Sandbox(spec);

		});




		//--------------------------------------------------------------------------------------------------------------
		//
		// INITIALIZATION AND COMMUNICATION METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _pubsubHandler = function (eventChannel, data) {

			var renderCallback = function () {

				if (data == null || !data.noRender) {
					aperture.pubsub.publish(
						appChannel.RENDER_UPDATE_REQUEST,
						{
							UIObject: _UIObjectState.singleton,
							layoutRequest: _getLayoutUpdateRequestMsg()
						}
					);
				}
			};

			var _logActivity = function (activity) {
				logActivity(activity, eventChannel);
			};

			switch (eventChannel) {

				case appChannel.ADD_FILES_TO_WORKSPACE_REQUEST:
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_ENRICH,
						activity: 'add_to_workspace',
						description: 'Adding filed entities to Flow View from another view',
						data: {
							files: data.files,
							fromView: data.fromView
						}
					});
					_onAddFilesToWorkspaceFromOtherViews(eventChannel, data);
					break;
				case appChannel.SEARCH_ON_CARD:
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_CREATE,
						activity: 'open_modal_tools',
						description: 'Open the advanced search modal dialog'
					});
					_onSearchOnCard(eventChannel, data);
					break;
				// expand and collapse events
				case appChannel.EXPAND_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						activity: 'expand_data',
						description: 'Expand stack and show members',
						data: {
							UIObjectId: data.xfId
						}
					});
					_onExpandEvent(eventChannel, data, renderCallback);
					break;
				case appChannel.COLLAPSE_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						activity: 'collapse_data',
						description: 'Collapse stack and hide members',
						data: {
							UIObjectId: data.xfId
						}
					});
					_onCollapseEvent(eventChannel, data, renderCallback);
					break;

				// branching events
				case appChannel.BRANCH_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_GETDATA,
						activity: 'execute_visual_filter',
						description: 'Branch on a card or stack of cards for related links',
						data: {
							UIObjectId: data.xfId,
							direction: data.direction
						}
					});
					_onBranchRequest(eventChannel, data, renderCallback);
					break;
				case appChannel.BRANCH_RESULTS_RETURNED_EVENT :
					_logActivity({
						type: aperture.log.draperType.SYSTEM,
						description: 'Branch results returned'
					});
					break;

				// hover events
				case appChannel.HOVER_START_EVENT :
				case appChannel.HOVER_END_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						description: (eventChannel === appChannel.HOVER_START_EVENT) ?
							'Hovering over a UI element' :
							'Stopped hovering over a UI element',
						data: {
							element: data.element
						}
					});
					break;
				case appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST :
					_onHoverChangeRequest(eventChannel, data);
					break;
				// tooltip events
				case appChannel.TOOLTIP_START_EVENT :
				case appChannel.TOOLTIP_END_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						description: (eventChannel === appChannel.TOOLTIP_START_EVENT) ?
							'Displaying a tooltip' :
							'Stopped displaying a tooltip',
						data: {
							tooltip: data.element
						}
					});
					break;

				// pattern search events
				case flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS :
					_onHighlightPatternSearchArguments(eventChannel, data);
					break;
				case flowChannel.PATTERN_SEARCH_REQUEST :
					_onPatternSearchRequest(eventChannel, renderCallback);
					break;
				case flowChannel.SEARCH_RESULTS_RETURNED_EVENT :
					_logActivity({
						type: aperture.log.draperType.SYSTEM,
						description: 'Search results returned',
						data: {
							shownMatches: data.shownMatches,
							totalMatches: data.totalMatches
						}
					});
					break;
				case flowChannel.PREV_SEARCH_PAGE_REQUEST :
				case flowChannel.NEXT_SEARCH_PAGE_REQUEST :
				case flowChannel.SET_SEARCH_PAGE_REQUEST :
					if (eventChannel === flowChannel.PREV_SEARCH_PAGE_REQUEST ||
						eventChannel === flowChannel.NEXT_SEARCH_PAGE_REQUEST
						) {
						_logActivity({
							workflow: aperture.log.draperWorkflow.WF_EXPLORE,
							description: (eventChannel === flowChannel.PREV_SEARCH_PAGE_REQUEST) ?
								'Page to previous set of search results' :
								'Page to next set of search results',
							data: {
								UIObjectId: data.xfId,
								page: data.page
							}
						});
					}
					_onPageSearch(eventChannel, data, renderCallback);
					break;

				// focus events
				case appChannel.FOCUS_CHANGE_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						activity: 'highlight_data',
						description: 'Highlight a card or stack of cards',
						data: {
							UIObjectId: data.xfId
						}
					});
					_onFocusChangeRequest(eventChannel, data);
					break;
				case appChannel.FOCUS_CHANGE_EVENT :
					_onFocusChangeEvent(eventChannel, data, renderCallback);
					break;

				// selection event
				case appChannel.SELECTION_CHANGE_REQUEST :
					if (data.xfId != null) {
						_logActivity({
							workflow: aperture.log.draperWorkflow.WF_EXPLORE,
							activity: 'show_data_info',
							description: 'Select a card or stack of cards',
							data: {
								UIObjectId: data.xfId
							}
						});
					}
					_onSelectionChangeRequest(eventChannel, data);
					break;
				case appChannel.UPDATE_DETAILS_PROMPT_STATE:
					_onUpdateDetailsPromptState(eventChannel, data);
					break;

				// file events
				case appChannel.CREATE_FILE_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_ENRICH,
						activity: 'create_workspace',
						description: 'Create a new file',
						data: {
							UIObjectId: data.xfId,
							requestedFromColumn: data.isColumn ? data.isColumn : 'false'
						}
					});
					_onCreateFileRequest(eventChannel, data, renderCallback);
					break;
				case appChannel.ADD_TO_FILE_REQUEST :
				case appChannel.DROP_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_ENRICH,
						activity: 'add_to_workspace',
						description: 'Add one or more account cards into a file',
						data: {
							UIObjectId: data.cardId,
							UIContainerId: data.containerId,
							fromDragDropEvent: (eventChannel === appChannel.DROP_EVENT) ? 'true' : 'false'
						}
					});
					_onAddCardToContainer(eventChannel, data, data.renderCallback ? data.renderCallback : renderCallback);
					break;
				case appChannel.CHANGE_FILE_TITLE :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_ENRICH,
						description: 'Change title of a file',
						data: {
							fileId: data.xfId
						}
					});
					_onChangeFileTitle(eventChannel, data);
					break;

				// object removal events
				case appChannel.REMOVE_REQUEST :
					if (data.userRequested) {
						if (data.isMatchCard) {
							_logActivity({
								workflow: aperture.log.draperWorkflow.WF_CREATE,
								activity: 'hide_tools',
								description: 'Remove a match card from a file',
								data: {
									UIObjectIds: data.xfIds
								}
							});
						} else {
							_logActivity({
								workflow: aperture.log.draperWorkflow.WF_ENRICH,
								activity: 'remove_from_workspace',
								description: 'Remove a card or stack of cards from the workspace',
								data: {
									UIObjectIds: data.xfIds
								}
							});
						}
					}
					_onRemoveRequest(eventChannel, data, renderCallback);
					break;

				// inter-module communication events
				case appChannel.REQUEST_CURRENT_STATE :
					_onCurrentStateRequest(eventChannel);
					break;
				case appChannel.REQUEST_ENTITY_DETAILS_INFORMATION :
					_onEntityDetailsRequest(eventChannel, data);
					break;

				// date range evants
				case appChannel.FILTER_DATE_PICKER_CHANGE_EVENT:
					if (data.userRequested) {
						_logActivity({
							workflow: aperture.log.draperWorkflow.WF_GETDATA,
							activity: 'select_filter_menu_option',
							description: 'Change date range menu options',
							data: {
								startDate: data.startDate,
								endDate: data.endDate,
								numBuckets: data.numBuckets,
								duration: data.duration
							}
						});
					}
					_onFilterChangeEvent(eventChannel, data, renderCallback);
					break;

				// card details events
				case appChannel.CARD_DETAILS_CHANGE :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_CREATE,
						activity: 'select_view',
						description: (data.showDetails) ?
							'View both account holder and activity information for all visible cards and stacks of cards' :
							'View account holder information only for all visible cards and stacks of cards',
						data: {
							showDetails: data.showDetails
						}
					});
					_onDetailsChangeRequest(eventChannel, data, renderCallback);
					break;
				case appChannel.UPDATE_CHART_REQUEST :
					_onUpdateCharts(eventChannel, data);
					break;

				// workspace management events
				case appChannel.NEW_WORKSPACE_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_CREATE,
						activity: 'create_workspace',
						description: 'Create new empty workspace'
					});
					_onNewWorkspace(eventChannel, renderCallback);
					break;
				case appChannel.CLEAN_WORKSPACE_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_CREATE,
						activity: 'clear_workspace',
						description: 'Clean the workspace of all but the given xfIds'   //TODO: Finish me
					});
					_onCleanWorkspaceRequest(eventChannel, data, renderCallback);
					break;
				case appChannel.CLEAN_COLUMN_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_ENRICH,
						activity: 'clear_workspace',
						description: 'Clear any unfiled cards or stacks of cards from a column',
						data: {
							UIObjectId: data.xfId
						}
					});
					_onCleanColumnRequest(eventChannel, data, renderCallback);
					break;
				case appChannel.SORT_COLUMN_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						activity: 'sort',
						description: (data.sortDescription === constants.SORT_FUNCTION.INCOMING) ?
							'Sort all cards and stacks of cards in a column by volume of flow in' :
							(data.sortDescription === constants.SORT_FUNCTION.OUTGOING) ?
								'Sort all cards and stacks of cards in a column by volume of flow out' :
								'Sort all cards and stacks of cards in a column by volume of flow in and out',
						data: {
							UIObjectId: data.xfId,
							sortDescription: data.sortDescription
						}
					});
					_onSortColumnRequest(eventChannel, data, renderCallback);
					break;
				case appChannel.SCROLL_VIEW_EVENT :
					_onScrollView(eventChannel, data);
					break;
				case appChannel.SWITCH_VIEW :
					_onSwitchView(eventChannel, data);
					break;
				case appChannel.FOOTER_CHANGE_DATA_VIEW_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_CREATE,
						activity: (data.tab === 'tableTab') ?
							'show_table' :
							'show_chart',
						description: 'Moving between data view tabs in the entity details panel'
					});
					break;

				// transaction table events
				case appChannel.TRANSACTIONS_FILTER_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_GETDATA,
						activity: 'select_filter_menu_option',
						description: 'Change transaction table highlight filter',
						data: {
							filterHighlighted: data.filterHighlighted
						}
					});
					break;
				case appChannel.TRANSACTIONS_PAGE_CHANGE_EVENT :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_GETDATA,
						activity: 'select_filter_menu_option',
						description: 'Change transaction table page'
					});
					break;
				// import and export graph events
				case appChannel.EXPORT_GRAPH_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_OTHER,
						activity: 'export_data',
						description: 'Export a chart of all filed content from the local computer'
					});
					_onExportGraph(eventChannel);
					break;
				case appChannel.IMPORT_GRAPH_REQUEST :
					_logActivity({
						workflow: aperture.log.draperWorkflow.WF_OTHER,
						activity: 'import_data',
						description: 'Import a chart of all filed content from the local computer'
					});
					_onAddFilesToWorkspaceFromFile(eventChannel);
					break;

				default :
					break;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param activity
		 * @param eventChannel
		 */
		var logActivity = function (activity, eventChannel) {
			var activityData = {
				type: null,
				workflow: null,
				activity: eventChannel,
				description: null,
				data: {}
			};

			_.extend(activityData, activity);

			// If a draper workflow is defined, assume it's a draper user event
			if (activityData.workflow in aperture.log.draperWorkflow) {
				activityData.type = aperture.log.draperType.USER;
			}

			aperture.log.log(activityData);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param data
		 * @private
		 */
		var _createWorkspace = function(data) {
			var workspaceSpec = null;
			var workspaceUIObj = null;

			if (data == null || data.length < 1) {

				// Set the flag for displaying/hiding charts.
				var show = aperture.config.get()['influent.config']['defaultShowDetails'];

				_UIObjectState.showDetails = show != null ? show : true;

				workspaceSpec = xfWorkspace.getSpecTemplate();
				workspaceUIObj = xfWorkspace.createInstance(workspaceSpec);
				_UIObjectState.singleton = workspaceUIObj;

				// Create 3 empty columns containers and add to the workspace
				var columnSpec = xfColumn.getSpecTemplate();
				var columnUIObj = _createColumn(columnSpec);
				_UIObjectState.singleton.insert(columnUIObj, null);

				columnUIObj = _createColumn(columnSpec);
				_UIObjectState.singleton.insert(columnUIObj, null);

				columnUIObj = _createColumn(columnSpec);
				_UIObjectState.singleton.insert(columnUIObj, null);

			} else {

				var restoreState = JSON.parse(data);

				workspaceSpec = xfWorkspace.getSpecTemplate();
				workspaceUIObj = xfWorkspace.createSingleton(workspaceSpec);
				_UIObjectState.singleton = workspaceUIObj;

				_UIObjectState.singleton.cleanState();
				_UIObjectState.singleton.restoreVisualState(restoreState);
				_UIObjectState.singleton.restoreHierarchy(restoreState, _UIObjectState.singleton);
			}

			aperture.pubsub.publish(appChannel.INIT_SANKEY_REQUEST);

			_pruneColumns();
			_checkPatternSearchState();
			aperture.pubsub.publish(
				appChannel.RENDER_UPDATE_REQUEST,
				{
					UIObject: _UIObjectState.singleton,
					layoutRequest: _getLayoutUpdateRequestMsg()
				}
			);
		};

		/**
		 *
		 * @param callback
		 * @private
		 */
		var _initWorkspaceState = function (callback) {

			infRest.request('/restorestate')
				.withData({sessionId: infWorkspace.getSessionId()})
				.then(function (response) {

					_createWorkspace(response.data);

					if (callback) {
						callback();
					}
				});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param sourceContextId
		 * @param targetContextId
		 * @param editStr
		 * @param entityIds
		 * @param responseCallback
		 * @private
		 */
		var _modifyContext = function (sourceContextId, targetContextId, editStr, entityIds, responseCallback) {

			infRest.request('/modifycontext').inContext(targetContextId).withData({
				sessionId: infWorkspace.getSessionId(),
				sourceContextId: sourceContextId,
				targetContextId: targetContextId,
				edit: editStr,
				entityIds: entityIds
			}).then(responseCallback);
			//}).then(function(response) {console.log(JSON.stringify(response)); responseCallback(response);});
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// GRAPH IMPORT/EXPORT METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @private
		 */
		var _onExportGraph = function(eventChannel) {

			if (eventChannel !== appChannel.EXPORT_GRAPH_REQUEST) {
				aperture.log.error('_onExportGraph: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onExportGraph: view not initialized');
				return false;
			}

			var callback = function(response) {

				var exportCallback = function() {
					$.blockUI({
						theme: true,
						title: 'Export In Progress',
						message: '<img src="' + constants.AJAX_SPINNER_FILE + '" style="display:block;margin-left:auto;margin-right:auto"/>'
					});

					var timestamp = (new Date().getTime());

					var exportState = _UIObjectState.singleton.saveState();

					infRest.request('/export').withData({

						sessionId: infWorkspace.getSessionId(),
						queryId: timestamp,
						data: (exportState) ? JSON.stringify(exportState) : ''

					}).then(function (response) {

						var a = document.createElement('a');
						a.href = aperture.store.url(response, 'pop', 'influent-saved.infml');

						document.body.appendChild(a);

						setTimeout(
							function() {
								$(window).unbind('beforeunload');
								a.click();
								document.body.removeChild(a);
								$.unblockUI();
								xfModalDialog.createInstance({
									title : 'Success',
									contents : 'Export successful!',
									buttons : {
										'Ok' : function() {}
									}
								});
							},
							0
						);
					});
				};

				if (response === 'NONE' || response === 'ERROR') {
					// we could not save the state... warn the user
					xfModalDialog.createInstance({
						title : 'Warning',
						contents : 'There was an issue when saving the application state to the server. The resulting export may not represent the current state. Do you wish to continue?',
						buttons : {
							'Continue' : exportCallback,
							'Cancel' : function() {}
						}
					});
				} else {
					exportCallback();
				}
			};

			_saveState(callback);

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// WORKSPACE AND COLUMN MANAGEMENT METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param renderCallback
		 * @private
		 */
		var _onNewWorkspace = function (eventChannel, renderCallback) {

			if (eventChannel !== appChannel.NEW_WORKSPACE_REQUEST ||
				!_UIObjectState.singleton) {
				return;
			}

			window.open(window.location.href, '_blank');
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onCleanWorkspaceRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.CLEAN_WORKSPACE_REQUEST) {
				aperture.log.error('_onCleanWorkspaceRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onCleanWorkspaceRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.exceptXfIds == null
			) {
				aperture.log.error('_onCleanWorkspaceRequest: function called with invalid data');
				return false;
			}

			var columnExtents = _getMinMaxColumnIndex();

			var callback = function(i) {
				if (i === columnExtents.max) {
					_pruneColumns();

					if (renderCallback) {
						renderCallback();
					}
				}
			};

			for (var i = columnExtents.min; i <= columnExtents.max; i++) {
				var column = _getColumnByIndex(i);
				var contextId = column.getXfId();
				var dataIds = column.cleanColumn(false, data.exceptXfIds);
				if (dataIds.length > 0) {
					_modifyContext(contextId, contextId, 'remove', dataIds, callback(i));
				}
			}

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onCleanColumnRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.CLEAN_COLUMN_REQUEST) {
				aperture.log.error('_onCleanColumnRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onCleanColumnRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onCleanColumnRequest: function called with invalid data');
				return false;
			}

			var columnUIObject = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);

			var contextId = columnUIObject.getXfId();
			var dataIds = columnUIObject.cleanColumn(true);
			if (dataIds.length > 0) {
				_modifyContext(contextId, contextId, 'remove', dataIds);

				if (renderCallback) {
					renderCallback();
				}
			}

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onSortColumnRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.SORT_COLUMN_REQUEST) {
				aperture.log.error('_onSortColumnRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onSortColumnRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null ||
				data.sortFunction == null
			) {
				aperture.log.error('_onSortColumnRequest: function called with invalid data');
				return false;
			}

			var columnUIObject = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			columnUIObject.sortChildren(data.sortFunction);

			renderCallback();

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onScrollView = function (eventChannel, data) {

			if (eventChannel !== appChannel.SCROLL_VIEW_EVENT) {
				aperture.log.error('_onScrollView: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onScrollView: view not initialized');
				return false;
			}

			if (data == null ||
				data.div == null
			) {
				aperture.log.error('_onScrollView: function called with invalid data');
				return false;
			}

			// Handle logging of scrolling events
			var div = data.div;
			var divId = div.id;

			// Collate all scrolling events in a given time frame
			var collateEvery = 500; // ms

			var state = _UIObjectState.scrollStates[divId];
			if (!state) {
				state = {
					topCurrent: 0,
					leftCurrent: 0
				};
			}

			if (!state.timer) {

				state.timer = setTimeout(function () {

					logActivity({
						workflow: aperture.log.draperWorkflow.WF_EXPLORE,
						description: 'Scrolling view',
						data: {
							view: divId,
							topStart: state.topStart,
							leftStart: state.leftStart,
							topEnd: state.topCurrent,
							leftEnd: state.leftCurrent
						}
					}, eventChannel);

					state.timer = null;
				}, collateEvery);

				state.topStart = state.topCurrent;
				state.leftStart = state.leftCurrent;
				state.topCurrent = div.scrollTop;
				state.leftCurrent = div.scrollLeft;
			} else {
				state.topCurrent = div.scrollTop;
				state.leftCurrent = div.scrollLeft;
			}

			_UIObjectState.scrollStates[divId] = state;

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onHighlightPatternSearchArguments = function(eventChannel, data) {

			if (eventChannel !== flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS) {
				aperture.log.error('_onHighlightPatternSearchArguments: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onHighlightPatternSearchArguments: view not initialized');
				return false;
			}

			if (data == null ||
				data.isHighlighted == null
			) {
				aperture.log.error('_onHighlightPatternSearchArguments: function called with invalid data');
				return false;
			}

			var files = _getAllFiles();

			// highlight files
			aperture.util.forEach(files, function(file) {
				var hi = data.isHighlighted && file.getChildren().length !== 0;

				file.setMatchHighlighted(hi);
				aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject : file});
			});

			// highlight file links
			aperture.util.forEach(_UIObjectState.singleton.getLinks(), function(link) {
				if(link.getType() === xfLinkType.FILE) {
					var hi = data.isHighlighted
						&& link.getSource().getChildren().length !== 0
						&& link.getDestination().getChildren().length !== 0;

					link.setSelected(hi);
				}
			});

			// hmmm. heavyweight
			var layoutUpdateRequestMsg = _getLayoutUpdateRequestMsg();		// rerender the sankeys
			aperture.pubsub.publish(
				appChannel.UPDATE_SANKEY_EVENT,
				{
					workspace : layoutUpdateRequestMsg.layoutInfo.workspace,
					layoutProvider : layoutUpdateRequestMsg.layoutProvider
				}
			);

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSwitchView = function (eventChannel, data) {

			if (eventChannel !== appChannel.SWITCH_VIEW) {
				aperture.log.error('_onSwitchView: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				//aperture.log.error('_onSwitchView: view not initialized');
				return false;
			}

			if (data == null ||
				data.title == null
			) {
				aperture.log.error('_onSwitchView: function called with invalid data');
				return false;
			}

			// Update the workspace (but don't re-render) when we switch view
			aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, { UIObject: _UIObjectState.singleton, updateOnly: true });

			return true;
		};


		//--------------------------------------------------------------------------------------------------------------
		//
		// DATE RANGE METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onFilterChangeEvent = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.FILTER_DATE_PICKER_CHANGE_EVENT) {
				aperture.log.error('_onFilterChangeEvent: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.startDate == null ||
				data.endDate == null ||
				data.numBuckets == null ||
				data.duration == null
			) {
				aperture.log.error('_onFilterChangeEvent: function called with invalid data');
				return false;
			}

			_UIObjectState.dates.startDate = data.startDate;
			_UIObjectState.dates.endDate = data.endDate;
			_UIObjectState.dates.numBuckets = data.numBuckets;
			_UIObjectState.dates.duration = data.duration;

			if (!_UIObjectState.singleton) {
				return false;
			}

			if (_UIObjectState.showDetails) {
				// If we are showing details then we need to update all the charts
				var specs = _UIObjectState.singleton.getSpecs(false);
				_updateCardsWithCharts(specs);
			}

			// Update the Sankeys.
			_updateAllColumnSankeys(renderCallback);

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// INTER-MODULE COMMUNICATION METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @private
		 */
		var _onCurrentStateRequest = function (eventChannel) {

			if (eventChannel !== appChannel.REQUEST_CURRENT_STATE) {
				aperture.log.error('_onCurrentStateRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				return false;
			}

			var currentState = {
				sessionId: infWorkspace.getSessionId(),
				focusData: _UIObjectState.focus,
				dates: _UIObjectState.dates,
				workspace: _UIObjectState.singleton
			};

			if (_UIObjectState.selectedUIObject != null) {
				currentState.selectedEntity = {
					entityType: _UIObjectState.selectedUIObject.uiType,
					contextId: _UIObjectState.selectedUIObject.contextId,
					dataId: _UIObjectState.selectedUIObject.dataId,
					label: _UIObjectState.selectedUIObject.label,
					count: _UIObjectState.selectedUIObject.count,
					xfId: _UIObjectState.selectedUIObject.xfId,
					promptForDetails: _UIObjectState.selectedUIObject.promptForDetails
				};
			} else {
				currentState.selectedEntity = null;
			}

			aperture.pubsub.publish(
				appChannel.CURRENT_STATE,
				currentState
			);

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onEntityDetailsRequest = function (eventChannel, data) {

			if (eventChannel !== appChannel.REQUEST_ENTITY_DETAILS_INFORMATION) {
				aperture.log.error('_onEntityDetailsRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onEntityDetailsRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onEntityDetailsRequest: function called with invalid data');
				return false;
			}

			var uiObject = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);

			if (uiObject == null) {
				return false;
			}

			var specs = uiObject.getSpecs(false);
			if (specs.length !== 1) {
				return false;
			}

			var entityDetailsInformation = {
				xfId: uiObject.getXfId(),
				uiType: uiObject.getUIType(),
				contextId: xfUtil.getContextByUIObject(uiObject).getXfId(),
				spec: specs[0]
			};

			aperture.pubsub.publish(
				appChannel.ENTITY_DETAILS_INFORMATION,
				entityDetailsInformation
			);

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// OBJECT REMOVAL METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onRemoveRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.REMOVE_REQUEST) {
				aperture.log.error('_onRemoveRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onRemoveRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfIds == null ||
				data.dispose == null
			) {
				aperture.log.error('_onRemoveRequest: function called with invalid data');
				return false;
			}

			var deletedFocusedObject = false;

			var numberOfIds = data.xfIds.length;
			var counter = 0;
			var counterCallback = function () {
				counter++;
				if (counter === numberOfIds) {

					if (deletedFocusedObject) {
						aperture.pubsub.publish(
							appChannel.FOCUS_CHANGE_REQUEST,
							{xfId: null}
						);
					}

					if (renderCallback) {
						renderCallback();
					}
				}
			};

			aperture.util.forEach(data.xfIds, function (xfId) {

				if (_UIObjectState.focus != null &&
					_UIObjectState.focus.xfId === xfId
					) {
					deletedFocusedObject = true;
				}

				// Temporarily hide the card before it is removed
				_UIObjectState.singleton.setHidden(xfId, true);

				_removeObject(
					_UIObjectState.singleton.getUIObjectByXfId(xfId),
					eventChannel,
					data.dispose,
					counterCallback
				);
			});

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param objToRemove
		 * @param eventChannel
		 * @param dispose
		 * @param renderCallback
		 * @private
		 */
		var _removeObject = function (objToRemove, eventChannel, dispose, renderCallback) {

			if (objToRemove === null || objToRemove.getVisualInfo() == null) {
				// Object no longer exists, or it has been disposed

				if (renderCallback) {
					renderCallback();
				}

				return;
			}

			var dataId = objToRemove.getDataId();
			var xfId = objToRemove.getXfId();

			// Find the context ID of the object to be removed
			var contextObj = xfUtil.getContextByUIObject(objToRemove);

			// find the column ID of the object to be removed
			var sourceColumn = _getColumnByUIObject(objToRemove);

			var removeObj;
			var callback;

			// if the object is a column, then we have to delete the column on the server. We check to ensure that
			// the column is removed on the server and then remove the column from the client.
			if (objToRemove.getUIType() === constants.MODULE_NAMES.COLUMN) {

				callback = function () {

					_UIObjectState.singleton.removeChild(xfId, true, false, false);

					// technically we only need to check when files are involved but this check is lightweight
					_checkPatternSearchState();

					if (renderCallback) {
						renderCallback();
					}
				};

				_modifyContext(
					sourceColumn.getDataId(),
					sourceColumn.getDataId(),
					'delete',
					[dataId],
					callback
				);
			}

			// if the object is a match card, then we remove the match card (and all children) from
			// the client. We do not need to notify the server.
			else if (objToRemove.getUIType() === constants.MODULE_NAMES.MATCH) {

				removeObj = function () {
					objToRemove.remove(eventChannel, dispose);
				};

				_removeObjectAndWiring(
					removeObj,
					dispose,
					objToRemove
				);

				if (renderCallback) {
					renderCallback();
				}
			}

			// if the object is a file, then we have to delete the file from its parent column. We check to ensure that
			// the file is removed on the server and then remove the file from the client.
			else if (objToRemove.getUIType() === constants.MODULE_NAMES.FILE) {

				var containedIds = objToRemove.getVisibleDataIds();
				callback = function () {
					removeObj = function () {
						objToRemove.remove(eventChannel, dispose);
					};

					_removeObjectAndWiring(
						removeObj,
						dispose,
						objToRemove
					);

					// check to see if this remove operation removed any duplicates
					_updateDuplicates(containedIds);

					// technically we only need to check when files are involved but this check is lightweight
					_checkPatternSearchState();

					if (_pruneColumns()) {
						if (renderCallback) {
							renderCallback();
						}
					} else {
						_renderObjectAndLinks(sourceColumn);
					}
				};

				_modifyContext(
					sourceColumn.getDataId(),
					sourceColumn.getDataId(),
					'delete',
					[dataId],
					callback
				);
			}

			// if the object is inside a matchcard file, then we just remove the object from the client.
			// We do not need to notify the server.
			else if (xfUtil.isUITypeDescendant(objToRemove, constants.MODULE_NAMES.MATCH)) {
				removeObj = function () {
					objToRemove.remove(eventChannel, dispose);
				};

				_removeObjectAndWiring(
					removeObj,
					dispose,
					objToRemove
				);

				if (renderCallback) {
					renderCallback();
				}
			}

			// if the object is a root object then we have to remove the object from its parent. We check to ensure that
			// the file is removed on the server and then remove the file from the client.
			else if (objToRemove.getParent().getXfId() === contextObj.getXfId()) {

				callback = function (response) {
					if (!response.hasOwnProperty('contextId') ||
						response.contextId !== contextObj.getDataId()
						) {
						aperture.log.error(
								'_removeObject: ' +
								'server responded with invalid context ID'
						);
						return;
					}

					if (!response.hasOwnProperty('sessionId') ||
						response.sessionId !== infWorkspace.getSessionId()
						) {
						aperture.log.error(
								'_removeObject: ' +
								'server responded with invalid session ID'
						);
						return;
					}

					if (!response.hasOwnProperty('targets')) {
						aperture.log.error(
								'_removeObject: ' +
								'server responded with no cluster information'
						);
						return;
					}

					removeObj = function () {
						objToRemove.remove(eventChannel, dispose);
					};

					_removeObjectAndWiring(
						removeObj,
						dispose,
						objToRemove
					);

					// technically we only need to check when files are involved but this check is lightweight
					_checkPatternSearchState();

					_pruneColumns();
					if (renderCallback) {
						renderCallback();
					}
				};

				_modifyContext(
					contextObj.getDataId(),
					contextObj.getDataId(),
					'remove',
					[dataId],
					callback
				);
			}

			// otherwise, we need to remove the object on the server and update the client based on the response
			// contents
			else {

				callback = function (response) {
					if (!response.hasOwnProperty('contextId') ||
						response.contextId !== contextObj.getDataId()
						) {
						aperture.log.error(
								'_removeObject: ' +
								'server responded with invalid context ID'
						);
						return;
					}

					if (!response.hasOwnProperty('sessionId') ||
						response.sessionId !== infWorkspace.getSessionId()
						) {
						aperture.log.error(
								'_removeObject: ' +
								'server responded with invalid session ID'
						);
						return;
					}

					if (!response.hasOwnProperty('targets')) {
						aperture.log.error(
								'_removeObject: ' +
								'server responded with no cluster information'
						);
						return;
					}

					if (response.targets.length === 0) {

						var rootNode = xfUtil.getTopLevelEntity(objToRemove);
						var children = rootNode.getChildren();
						if (children.length > 0) {
							aperture.util.forEach(children, function (child) {
								if (child.getXfId() === xfId) {
									rootNode.removeChild(child.getXfId(), true, false, false);
								} else {
									rootNode.removeChild(child.getXfId(), false, true, false);
									contextObj.insert(child);
								}
							});
						}

						if (rootNode != null) {
							// If the root was the focus, unset the focus
							if (_UIObjectState.focus != null &&
								_UIObjectState.focus.xfId === rootNode.getXfId()) {

								aperture.pubsub.publish(
									appChannel.FOCUS_CHANGE_REQUEST,
									{xfId: null}
								);
							}

							rootNode.getParent().removeChild(rootNode.getXfId(), true, false, false);
						}

						_checkPatternSearchState();

						// check to see if this remove operation removed any duplicates
						if (dataId != null) {
							_updateDuplicates([dataId]);
						}

						if (renderCallback) {
							renderCallback();
						}

					} else {

						var visibleDataIds = objToRemove.getVisibleDataIds();

						var i;
						var specs = [];
						for (i = 0; i < response.targets.length; i++) {
							var target = response.targets[i];
							if (contextObj.getUIType() === constants.MODULE_NAMES.FILE && !target.isRoot
								) {
								specs = specs.concat(_getPopulatedSpecsFromData([target], contextObj.getClusterUIObject()));
							} else {
								specs = specs.concat(_getPopulatedSpecsFromData([target], contextObj));
							}
						}

						var addedCards = [];

						for (i = 0; i < specs.length; i++) {
							var uiObjects = contextObj.getUIObjectsByDataId(specs[i].dataId);
							for (var j = 0; j < uiObjects.length; j++) {
								var updateResult = uiObjects[j].update(specs[i]);
								if (updateResult != null && updateResult.length > 0) {
									for (var k = 0; k < updateResult.length; k++) {
										addedCards.push(updateResult[k]);
									}
								}

								// Check to see if the spec update caused us to invalidate our focus.
								// This probably means we just had it deleted by the server. Unset it now.
								if (_UIObjectState.focus != null && _UIObjectState.singleton.getUIObjectByXfId(_UIObjectState.focus.xfId) == null) {
									aperture.pubsub.publish(appChannel.FOCUS_CHANGE_REQUEST, {
										xfId: null
									});
								}
							}
						}

						if (addedCards.length > 0) {
							infRest.request('/entities').inContext(contextObj.getDataId()).withData({

								sessionId: infWorkspace.getSessionId(),
								entities: addedCards,
								contextid: contextObj.getDataId()

							}).then(function (response) {

								var specs = _getPopulatedSpecsFromData(response.data, contextObj);

								for (var i = 0; i < specs.length; i++) {
									var childSpec = specs[i];

									// we don't want to set the parent on this update so we delete it
									delete childSpec.parent;

									var children = contextObj.getUIObjectsByDataId(childSpec.dataId);
									if (_.isEmpty(children)) {
										aperture.log.error('_populateExpandResults: Unable to find child for spec');
									} else {
										for (var j = 0; j < children.length; j++) {
											children[j].update(childSpec);
											children[j].highlightId((_UIObjectState.focus == null) ? null : _UIObjectState.focus.xfId);
										}
									}
								}

								// if we are showing card details then we need to populate the card specs with chart data
								if (_UIObjectState.showDetails) {
									_updateCardsWithCharts(specs);
								}

								// technically we only need to check when files are involved but this check is lightweight
								_checkPatternSearchState();

								if (renderCallback) {
									renderCallback();
								}
							});

						} else {
							// technically we only need to check when files are involved but this check is lightweight
							_checkPatternSearchState();

							if (renderCallback) {
								renderCallback();
							}
						}

						_updateDuplicates(visibleDataIds);

					}
				};

				_modifyContext(
					contextObj.getDataId(),
					contextObj.getDataId(),
					'remove',
					[dataId],
					callback
				);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param removalFunction
		 * @param dispose
		 * @param eventChannel
		 * @param sourceColumn
		 * @param objToRemove
		 * @param dataId
		 * @private
		 */
		var _removeObjectAndWiring = function (removalFunction, dispose, objToRemove) {

			if (dispose &&
				_UIObjectState.selectedUIObject != null &&
				(_UIObjectState.selectedUIObject.xfId === objToRemove.getXfId() ||
					objToRemove.getUIObjectByXfId(_UIObjectState.selectedUIObject.xfId) != null)
				) {
				aperture.pubsub.publish(appChannel.SELECTION_CHANGE_REQUEST, {
					xfId: null,
					selected: true,
					noRender: true
				});
			}

			var visibleDataIds = objToRemove.getVisibleDataIds();

			// Remove this object from the position map before it's disposed.
			xfLayoutProvider.removeUIObject(objToRemove);

			// remove the object using the removal function
			removalFunction();

			// check to see if this remove operation removed any duplicates
			_updateDuplicates(visibleDataIds);
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// FILE METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onCreateFileRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.CREATE_FILE_REQUEST) {
				aperture.log.error('_onCreateFileRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onCreateFileRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onCreateFileRequest: function called with invalid data');
				return false;
			}

			var sourceObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			var columnUIObj;

			if (!data.isColumn) {
				columnUIObj = xfUtil.getContextByUIObject(sourceObj);
			} else {
				columnUIObj = sourceObj;
			}

			// Create a new file uiObject.
			var fileSpec = xfFile.getSpecTemplate();
			var fileUIObj = xfFile.createInstance(fileSpec);
			fileUIObj.showDetails(_UIObjectState.singleton.showDetails());
			fileUIObj.showSpinner(data.showSpinner);
			// Add the file to the very top of the column.
			var topObj = null;
			if (columnUIObj.getVisualInfo().children.length > 0) {
				topObj = columnUIObj.getVisualInfo().children[0];
			}
			columnUIObj.insert(fileUIObj, topObj);

			// Link it to all files to the columns to the left and right of our column
			_addFileLinks(fileUIObj, columnUIObj, true, true);

			_modifyContext(
				fileUIObj.getXfId(),
				columnUIObj.getXfId(),
				'create'
			);

			if (!data.isColumn) {

				var pubData = {
					containerId: fileUIObj.getXfId(),
					cardId: sourceObj.getXfId()
				};

				aperture.pubsub.publish(appChannel.ADD_TO_FILE_REQUEST, pubData);
			}

			if (data.isColumn && _pruneColumns()) {
				renderCallback();
			} else {
				_renderObjectAndLinks(columnUIObj);
			}

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onAddCardToContainer = function (eventChannel, data) {

			if (eventChannel !== appChannel.DROP_EVENT &&
				eventChannel !== appChannel.ADD_TO_FILE_REQUEST) {

				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Handler does not support this event: ' +
						eventChannel
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {});
				return;
			}

			if (!data.cardId || !data.containerId
				) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Invalid data parameter: Required parameter was either missing or null.'
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {});
				return;
			}

			if (!_UIObjectState.singleton) {
				return;
			}

			var addCard = _UIObjectState.singleton.getUIObjectByXfId(data.cardId);
			var targetContainer = _UIObjectState.singleton.getUIObjectByXfId(data.containerId);

			if (!addCard || !targetContainer) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Invalid data parameter: Source or destination object could not be found.'
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {});
				return;

			}

			var cardParent = addCard.getParent();

			// Determine if the resulting target cluster should be expanded or not
			var targetExpanded = cardParent.getUIType() === constants.MODULE_NAMES.FILE &&
				cardParent.hasCluster() ?
				cardParent.getClusterUIObject().getVisualInfo().isExpanded :
				targetContainer.hasCluster() ?
					targetContainer.getClusterUIObject().getVisualInfo().isExpanded :
					true;

			if (addCard == null) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Unable to locate card with id ' +
						data.cardId
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {
					fileId: targetContainer.getXfId(),
					objectId: data.cardId
				});
				return;
			} else if (targetContainer == null) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Unable to locate container with id ' +
						data.containerId
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {
					fileId: null,
					objectId: addCard.getXfId()
				});
				return;
			} else if (cardParent == null) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Unable to locate parent of card ' +
						data.cardId
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {
					fileId: targetContainer.getXfId(),
					objectId: addCard.getXfId()
				});
				return;
			}

			var contextObj = xfUtil.getContextByUIObject(addCard);
			var targetContextObj = xfUtil.getContextByUIObject(targetContainer);

			if (contextObj == null) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Unable to determine context id of card ' +
						data.cardId
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {
					fileId: targetContextObj.getXfId(),
					objectId: addCard.getXfId()
				});
				return;
			}
			else if (targetContextObj == null) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Unable to determine context id of card ' +
						data.containerId
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {
					fileId: targetContextObj.getXfId(),
					objectId: addCard.getXfId()
				});
				return;
			} else if (targetContextObj.getUIType() !== constants.MODULE_NAMES.FILE) {
				aperture.log.error(
						'_onAddCardToContainer: ' +
						'Target context object should be of type ' +
						constants.MODULE_NAMES.FILE +
						', not of type ' +
						targetContextObj.getUIType()
				);
				aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT_FAILED, {
					fileId: targetContextObj.getXfId(),
					objectId: addCard.getXfId()
				});
				return;
			}

			var insertedCard = addCard;

			// We need to add children of mutable clusters individually because mutable clusters are not
			// saved on the server and we can not, therefore, send the cluster id to the server to obtain
			// its children.
			var insertedCardDataIds = [];
			if (insertedCard.getUIType() === constants.MODULE_NAMES.MUTABLE_CLUSTER) {
				var children = insertedCard.getChildren();
				for (var i = 0; i < children.length; i++) {
					insertedCardDataIds.push(children[i].getDataId());
				}
			} else {
				insertedCardDataIds.push(insertedCard.getDataId());
			}

			// Start the spinner on the target file
			targetContextObj.showSpinner(true);

			// If this card is the current focus, set the focus after it is moved on the server
			var requiresFocusChange = false;
			if (_UIObjectState.focus != null) {
				if (_UIObjectState.focus.xfId === insertedCard.getXfId()) {
					requiresFocusChange = true;
				}
			}

			// Temporarily hide the original card before it is removed.
			_UIObjectState.singleton.setHidden(data.cardId, true);

			// Update the server side cache with the new cluster hierarchy.
			_modifyContext(
				contextObj.getDataId(),
				targetContextObj.getDataId(),
				'insert',
				insertedCardDataIds,
				// Callback to be performed after the modify context operation has completed.
				function (response) {

					var afterRemoveOldObjectCallback = function () {

						// Render the change in the old context after the addCard has been removed
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: contextObj});


						// Update the target container with the new cluster hierarchy.
						var specs = _getPopulatedSpecsFromData(response.targets, targetContextObj);

						if (specs.length !== 1) {
							aperture.log.error(
									'_onAddCardToContainer: ' +
									'Invalid number of entity specs returned from server: expected 1, received ' +
									specs.length
							);
							return;
						}

						var uiObject = xfImmutableCluster.createInstance(specs[0]);

						// Give the file a title if it doesn't already have one
						if (!targetContextObj.getVisualInfo().titleInitialized) {

							var initialFileTitle = '';

							var label = uiObject.getLabel().trim();
							var dataId = uiObject.getDataId().trim();

							if (label.length !== 0) {
								initialFileTitle = label;
							} else if (dataId.length !== 0) {
								initialFileTitle = dataId;
							}

							if (initialFileTitle != null && initialFileTitle.length !== 0) {
								if (initialFileTitle.indexOf(')', this.length - 1) !== -1) {
									initialFileTitle = initialFileTitle.substring(0, initialFileTitle.lastIndexOf('(')).trim();
								}

								targetContextObj.setLabel(initialFileTitle);
							}
						}

						uiObject.updateToolbar(
							{
								'allowFile': false,
								'allowClose': true,
								'allowFocus': true,
								'allowSearch': true
							},
							true
						);

						uiObject.showDetails(_UIObjectState.showDetails);
						uiObject.showToolbar(true);

						targetContextObj.setClusterUIObject(uiObject);

						// Expand the new file cluster if necessary
						if (targetExpanded) {
							aperture.pubsub.publish(appChannel.EXPAND_EVENT, { xfId: uiObject.getXfId() });
						} else {
							_updateLinks(
								true,
								true,
								[uiObject],
								null,
								[uiObject]
							);
						}

						if (requiresFocusChange) {
							aperture.pubsub.publish(appChannel.FOCUS_CHANGE_REQUEST, {
								xfId: uiObject.getXfId()
							});
						}

						// if we are showing card details then we need to populate the card specs with chart data
						if (_UIObjectState.showDetails) {
							_updateCardsWithCharts(specs);
						}

						targetContextObj.showSpinner(false);

						if (data.hasOwnProperty('onAddedCallback')) {
							data.onAddedCallback();
						}

						// pattern search may now be valid if files had no content before.
						_checkPatternSearchState();

						aperture.pubsub.publish(appChannel.ADD_TO_FILE_EVENT, {
							fileId: targetContextObj.getXfId(),
							objectId: uiObject.getXfId()
						});

						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: targetContextObj});

					};

					// remove old card
					_removeObject(
						addCard,
						appChannel.REMOVE_REQUEST,
						true,
						afterRemoveOldObjectCallback
					);
				}
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onChangeFileTitle = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.CHANGE_FILE_TITLE ||
				_UIObjectState.singleton == null
				) {
				return;
			}

			var file = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			if (file) {
				file.setLabel(data.newTitleText);
				aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {	UIObject: file });
			}
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// SELECTION METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSelectionChangeRequest = function (eventChannel, data) {

			if (eventChannel !== appChannel.SELECTION_CHANGE_REQUEST) {
				aperture.log.error('_onSelectionChangeRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onSelectionChangeRequest: view not initialized');
				return false;
			}

			if (data == null || !data.hasOwnProperty('xfId')) {
				aperture.log.error('_onSelectionChangeRequest: function called with invalid data');
				return false;
			}

			var objectToBeSelected = data.xfId && _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			var previousSelection = null;

			if (_UIObjectState.selectedUIObject != null) {
				previousSelection = _UIObjectState.singleton.getUIObjectByXfId(_UIObjectState.selectedUIObject.xfId);
			}

			//no reason to do anything if we're picking the same item
			if (objectToBeSelected === previousSelection && data.bForce !== true) {
				return true;
			}

			if (objectToBeSelected == null) {
				_UIObjectState.selectedUIObject = null;
				_UIObjectState.singleton.setSelection(null);

			} else {

				_UIObjectState.selectedUIObject = {
					xfId: objectToBeSelected.getXfId(),
					dataId: objectToBeSelected.getDataId(),
					label: objectToBeSelected.getLabel(),
					count: objectToBeSelected.getVisualInfo().spec.count,
					uiType: objectToBeSelected.getUIType(),
					accountType: objectToBeSelected.getAccountType(),
					contextId: xfUtil.getContextByUIObject(objectToBeSelected).getXfId(),
					promptForDetails: objectToBeSelected.getPromptState()
				};

				// Add owner ID for summary clusters and owner clusters
				if (xfUtil.isClusterTypeFromObject(objectToBeSelected)) {
					_UIObjectState.selectedUIObject.ownerId = objectToBeSelected.getOwnerId();
				}

				_UIObjectState.singleton.setSelection(objectToBeSelected.getXfId());

				// Call any selection plugins
				var extensions = plugins.get('cards');
				var plugin = aperture.util.find(extensions, function (e) {
					return e.select !== undefined;
				});

				if (plugin) {

					plugin.select({
						dataId: _UIObjectState.selectedUIObject.dataId,
						type: _UIObjectState.selectedUIObject.accountType,
						label: _UIObjectState.selectedUIObject.label,
						numMembers: _UIObjectState.selectedUIObject.count,

						// is the entity flagged PROMPT_FOR_DETAILS?
						shouldPrompt: _UIObjectState.selectedUIObject.promptForDetails,

						// Include mouse details in the event
						mouseButton: data.clickEvent.which,
						mouseX: data.clickEvent.pageX,
						mouseY: data.clickEvent.pageY
					});
				}
			}

			aperture.pubsub.publish(appChannel.SELECTION_CHANGE_EVENT, _UIObjectState.selectedUIObject);

			if (previousSelection !== null) {
				aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: previousSelection});
			}

			if (objectToBeSelected !== null) {
				aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: objectToBeSelected});
			}

			var expand = objectToBeSelected != null;

			// expand footer only if something selected. this will trigger an event when done.
			// should we just listen to selection here?
			window.setTimeout(function () {
				aperture.pubsub.publish(appChannel.FOOTER_STATE_REQUEST, {selection: objectToBeSelected, expand: expand});
			}, 100);

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onUpdateDetailsPromptState = function(eventChannel, data) {

			if (eventChannel !== appChannel.UPDATE_DETAILS_PROMPT_STATE) {
				aperture.log.error('_onUpdateDetailsPromptState: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onUpdateDetailsPromptState: view not initialized');
				return false;
			}

			if (data == null ||
				data.dataId == null ||
				data.state == null
			) {
				aperture.log.error('_onUpdateDetailsPromptState: function called with invalid data');
				return false;
			}

			_UIObjectState.singleton.updatePromptState(data.dataId, data.state);

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// FOCUS METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onFocusChangeRequest = function (eventChannel, data) {

			if (eventChannel !== appChannel.FOCUS_CHANGE_REQUEST) {
				aperture.log.error('_onFocusChangeRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onFocusChangeRequest: view not initialized');
				return false;
			}

			if (data == null || data.xfId == null) {
				aperture.pubsub.publish(appChannel.FOCUS_CHANGE_EVENT, {focus: null});
				return true;
			}

			var xfUiObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			var focusData;

			if (xfUiObj == null) {
				_UIObjectState.focus = null;
				focusData = null;
			}
			else {
				var contextObj = xfUtil.getContextByUIObject(xfUiObj);

				focusData = {
					xfId: xfUiObj.getXfId(),
					dataId: xfUiObj.getDataId(),
					entityType: xfUiObj.getUIType(),
					entityLabel: xfUiObj.getLabel(),
					entityCount: xfUiObj.getVisualInfo().spec.count,
					contextId: contextObj ? contextObj.getXfId() : null,
					sessionId: infWorkspace.getSessionId()
				};
			}

			aperture.pubsub.publish(appChannel.FOCUS_CHANGE_EVENT, {focus: focusData});

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onFocusChangeEvent = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.FOCUS_CHANGE_EVENT) {
				aperture.log.error('_onFocusChangeEvent: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onFocusChangeEvent: view not initialized');
				return false;
			}

			var xfId = null;
			if (data == null || data.focus == null) {
				_UIObjectState.focus = null;
			}
			else {
				_UIObjectState.focus = _.clone(data.focus);
				xfId = _UIObjectState.focus.xfId;
			}

			_UIObjectState.singleton.setFocus(xfId);

			if (_UIObjectState.showDetails) {
				// If we are showing details then we need to update all the charts
				_collectAndShowDetails(false);
			}

			renderCallback();

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// HOVER AND TOOLTIP METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onHoverChangeRequest = function (eventChannel, data) {

			if (eventChannel !== appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST) {
				aperture.log.error('_onHoverChangeRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onHoverChangeRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onHoverChangeRequest: function called with invalid data');
				return false;
			}

			_UIObjectState.singleton.setHovering(data.xfId);

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// BRANCHING METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onBranchRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.BRANCH_REQUEST) {
				aperture.log.error('_onBranchRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onBranchRequest: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null ||
				data.direction == null
			) {
				aperture.log.error('_onBranchRequest: function called with invalid data');
				return false;
			}

			var uiObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			_verifyBranchRequest(uiObj, data.direction, function () {
				_branchRequestHandler(eventChannel, data, renderCallback);
			});

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param uiObject
		 * @param direction
		 * @param onOk
		 * @param onCancel
		 * @private
		 */
		var _verifyBranchRequest = function (uiObject, direction, onOk, onCancel) {
			var degree = direction === 'left' ? uiObject.getInDegree() : uiObject.getOutDegree();
			var sdegree = NUMBER_FORMATTER.format(degree);

			if (uiObject.getUIType() !== constants.MODULE_NAMES.SUMMARY_CLUSTER &&
				OBJECT_DEGREE_LIMIT_COUNT > 0 && degree > OBJECT_DEGREE_LIMIT_COUNT) {
				xfModalDialog.createInstance({
					title: 'Sorry! Try a More Focused Branch',
					contents: 'This branch operation would retrieve ' + sdegree + ' accounts, which is more than ' +
						'the configured limit of ' + NUMBER_FORMATTER.format(OBJECT_DEGREE_LIMIT_COUNT) + '.',
					buttons: {
						'Ok': function () {
							if (onCancel) {
								onCancel();
							}
						}
					}
				});

			} else if (uiObject.getUIType() !== constants.MODULE_NAMES.SUMMARY_CLUSTER &&
				OBJECT_DEGREE_WARNING_COUNT > 0 && degree > OBJECT_DEGREE_WARNING_COUNT) {
				xfModalDialog.createInstance({
					title: 'Warning!',
					contents: 'This branch operation will retrieve ' + sdegree + ' linked accounts. Are you ' +
						'sure you want to retrieve ALL of them?',
					buttons: {
						'Branch': function () {
							if (onOk) {
								onOk();
							}
						},
						'Cancel': function () {
							if (onCancel) {
								onCancel();
							}
						}
					}
				});

			} else {
				if (onOk) {
					onOk();
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _branchRequestHandler = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.BRANCH_REQUEST) {
				aperture.log.error('Branch request handler does not support this event: ' + eventChannel);
				return;
			}

			var sourceObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			var isBranchRight = data.direction === 'right';
			var sourceEntity = sourceObj.getDataId();
			var column = _getColumnByUIObject(sourceObj);

			if (isBranchRight) {
				sourceObj.setRightOperation(toolbarOp.WORKING);
			} else {
				sourceObj.setLeftOperation(toolbarOp.WORKING);
			}
			aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject : sourceObj, updateOnly: true});

			//Figure out the target column.  If it exists, use it as the target context id
			//If it doesn't create an id for it to use as the target context id, and then
			//assign that id to the created column in the response.
			var targetColumn;
			if (isBranchRight) {
				targetColumn = _getNextColumn(column);
			} else {
				targetColumn = _getPrevColumn(column);
			}

			if (targetColumn == null) {
				targetColumn = _createColumn();
			}

			var srcContext = xfUtil.getUITypeAncestor(sourceObj, constants.MODULE_NAMES.FILE);
			if (!srcContext) {
				srcContext = column;
			}

			var srcContextId = srcContext.getDataId();
			var tarContextId = targetColumn.getDataId();

			infRest.request('/relatedlinks').inContext(tarContextId).withData({

				sessionId: infWorkspace.getSessionId(),
				entity: sourceEntity,
				targets: [],
				linktype: isBranchRight ? 'source' : 'destination',
				type: 'FINANCIAL',
				aggregate: 'FLOW',
				startdate: _UIObjectState.dates.startDate,
				enddate: _UIObjectState.dates.endDate,
				srcContextId: srcContextId,
				tarContextId: tarContextId

			}).then(function (response) {

				if (_UIObjectState.singleton.getUIObjectByXfId(data.xfId) != null) {

					var newUIObjects = _handleBranchingServerResponse(response, sourceObj, isBranchRight, targetColumn);

					if (isBranchRight) {
						sourceObj.setRightOperation(toolbarOp.BRANCH);
					} else {
						sourceObj.setLeftOperation(toolbarOp.BRANCH);
					}

					_updateLinks(true, true, newUIObjects, function () {
						targetColumn.sortChildren(DEFAULT_SORT_FUNCTION);

						if (renderCallback) {
							renderCallback();
						}
					}, newUIObjects);
				} else {
					renderCallback();
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param serverResponse
		 * @param sourceObj
		 * @param isBranchRight
		 * @param prebuiltTargetColumn
		 * @returns {Array}
		 * @private
		 */
		var _handleBranchingServerResponse = function (serverResponse, sourceObj, isBranchRight, prebuiltTargetColumn) {

			var i;

			var entities = serverResponse.targets;
			var createdUIObjects = [];

			if (entities == null) {
				return createdUIObjects;
			}

			// Find the source column.
			var sourceColumn = _getColumnByUIObject(sourceObj);

			// Check if there is an existing target column, if not, create one.
			var targetColumn = isBranchRight ? _getNextColumn(sourceColumn) : _getPrevColumn(sourceColumn);

			if (targetColumn == null) {
				targetColumn = prebuiltTargetColumn;
				_UIObjectState.singleton.insert(prebuiltTargetColumn, isBranchRight ? null : sourceColumn);
			} else {
				targetColumn.prepareColumnForServerUpdate();
			}

			var specs = _getPopulatedSpecsFromData(entities, targetColumn);

			var firstUiObject = null;

			var dataIds = [];

			var toCollapseIds = [];

			var adjacentInfo = xfUtil.getAdjacentObjectInfo(xfLayoutProvider.getPositionMap(), sourceObj, targetColumn);
			var adjacentObj = adjacentInfo.adjacentObj;
			var parentObj = null;
			if (adjacentObj != null) {
				parentObj = adjacentObj.getParent();
			}
			else {
				parentObj = targetColumn;
			}

			for (i = 0; i < specs.length; i++) {
				var uiObject = {};

				//Check to see if there is an existing object in this column
				uiObject = targetColumn.getUIObjectsByDataId(specs[i].dataId)[0];

				if (!uiObject) {
					if (specs[i].type === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
						uiObject = xfSummaryCluster.createInstance(specs[i]);
					} else if (xfUtil.isClusterTypeFromSpec(specs[i])) {
						uiObject = xfImmutableCluster.createInstance(specs[i]);
					} else {
						uiObject = xfCard.createInstance(specs[i]);
					}

					uiObject.updateToolbar(
						{
							'allowFile': true,
							'allowClose': true,
							'allowFocus': true,
							'allowSearch': true
						},
						true
					);

					uiObject.showDetails(_UIObjectState.showDetails);
					uiObject.showToolbar(true);
					parentObj.insert(uiObject, adjacentObj);
				} else {
					if (xfUtil.isClusterTypeFromObject(uiObject)) {
						uiObject.update(specs[i]);

						toCollapseIds.push(uiObject.getXfId());
					}
				}
				createdUIObjects.push(uiObject);

				if (firstUiObject == null) {
					firstUiObject = uiObject;
				}

				var dataId = uiObject.getDataId();
				if (dataId != null) {
					dataIds.push(dataId);
				}
			}

			// if we are showing card details then we need to populate the card specs with chart data
			if (_UIObjectState.showDetails) {
				_updateCardsWithCharts(specs);
			}

			_pruneColumns();
			// check to see if our branching produced duplicates
			_updateDuplicates(dataIds);

			for (i = 0; i < toCollapseIds.length; i++) {
				aperture.pubsub.publish(appChannel.COLLAPSE_EVENT, {xfId: toCollapseIds[i]});
			}

			aperture.pubsub.publish(appChannel.BRANCH_RESULTS_RETURNED_EVENT);

			return createdUIObjects;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// CLUSTER EXPAND/COLLAPSE METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onExpandEvent = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.EXPAND_EVENT) {
				aperture.log.error('_onExpandEvent: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onExpandEvent: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onExpandEvent: function called with invalid data');
				return false;
			}

			var uiObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			var contextId = xfUtil.getContextByUIObject(uiObj).getXfId();

			if (!xfUtil.isClusterTypeFromObject(uiObj)) {
				aperture.log.error('Expand request for a non cluster object');
			}

			if (uiObj.isExpanded()) {
				if (renderCallback) {
					renderCallback();
				}
				return true;
			}

			// if the cluster is selected we deselect it
			if (uiObj.isSelected) {
				aperture.pubsub.publish(
					appChannel.SELECTION_CHANGE_REQUEST,
					{
						xfId: null,
						selected: true,
						noRender: true
					}
				);
			}

			uiObj.expand();

			aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: uiObj, layoutRequest: _getLayoutUpdateRequestMsg()});

			//*********************************
			// REST call to get actual card data
			//*********************************
			infRest.request('/entities').inContext(contextId).withData({

				sessionId: infWorkspace.getSessionId(),
				entities: uiObj.getVisibleDataIds(),
				contextid: contextId

			}).then(function (response) {

				_populateExpandResults(uiObj, response, renderCallback);

			});

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param clusterObj
		 * @param serverResponse
		 * @param renderCallback
		 * @private
		 */
		var _populateExpandResults = function (clusterObj, serverResponse, renderCallback) {

			var entities = serverResponse.data;
			var specs = _getPopulatedSpecsFromData(entities, clusterObj);

			for (var i = 0; i < specs.length; i++) {
				var childSpec = specs[i];
				var children = clusterObj.getUIObjectsByDataId(childSpec.dataId);
				if (_.isEmpty(children)) {
					aperture.log.error('_populateExpandResults: Unable to find child for spec');
				} else {
					for (var j = 0; j < children.length; j++) {
						children[j].update(childSpec);
						// Update the highlight state of any children.
						children[j].highlightId((_UIObjectState.focus == null) ? null : _UIObjectState.focus.xfId);
					}
				}
			}

			var visibleDataIds = clusterObj.getVisibleDataIds();
			_updateDuplicates(visibleDataIds);

			clusterObj.showSpinner(false);
			clusterObj.showToolbar(true);

			// if we are showing card details then we need to populate the card specs with chart data
			if (_UIObjectState.showDetails) {
				_updateCardsWithCharts(specs);
			}

			var affectedObjects = xfUtil.getLinkableChildren(clusterObj);
			affectedObjects.push(clusterObj);
			_updateLinks(true, true, xfUtil.getLinkableChildren(clusterObj), function () {
				clusterObj.sortChildren(DEFAULT_SORT_FUNCTION);

				_renderObjectAndLinks(clusterObj);

			}, affectedObjects);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onCollapseEvent = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.COLLAPSE_EVENT) {
				aperture.log.error('_onCollapseEvent: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onCollapseEvent: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onCollapseEvent: function called with invalid data');
				return false;
			}

			var uiObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);

			if (uiObj.getUIType() !== constants.MODULE_NAMES.FILE && !xfUtil.isClusterTypeFromObject(uiObj)) {
				aperture.log.error('Collapse request for a non cluster or file object');
			}

			var affectedObjects = xfUtil.getLinkableChildren(uiObj);
			affectedObjects.push(uiObj);
			var visibleDataIds = uiObj.getVisibleDataIds();

			if (!uiObj.isExpanded()) {

				renderCallback();
				return true;
			}

			if (uiObj.hasSelectedChild()) {
				aperture.pubsub.publish(
					appChannel.SELECTION_CHANGE_REQUEST,
					{
						xfId: null,
						selected: true,
						noRender: true
					}
				);
			}

			uiObj.collapse();

			aperture.pubsub.publish(
				appChannel.RENDER_UPDATE_REQUEST,
				{
					UIObject: uiObj,
					layoutRequest: _getLayoutUpdateRequestMsg()
				}
			);

			if (_UIObjectState.showDetails) {
				_updateCardsWithCharts(uiObj.getSpecs(false));
			}

			_updateLinks(true, true, [uiObj], function() {
				_renderObjectAndLinks(uiObj);
			}, affectedObjects);

			_updateDuplicates(visibleDataIds);

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// RENDER AND LAYOUT METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param uiObj
		 * @private
		 */
		var _renderObjectAndLinks = function(uiObj) {
			aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: uiObj});

			aperture.pubsub.publish(
				appChannel.RENDER_UPDATE_REQUEST,
				{
					UIObject: _UIObjectState.singleton,
					layoutRequest: _getLayoutUpdateRequestMsg(),
					updateOnly: true
				}
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Constructs the object required for triggering an update of the
		 * calculated layout positions and Sankey links.
		 * @returns {{layoutInfo: {type: string, workspace: {}}, layoutProvider: *}}
		 * @private
		 */
		var _getLayoutUpdateRequestMsg = function () {
			return xfUtil.constructLayoutRequest('update', _UIObjectState.singleton, xfLayoutProvider);
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// SANKEY METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param performCascadeRight
		 * @param performCascadeLeft
		 * @param linkingObjects
		 * @param callback
		 * @param affectedObjects
		 * @private
		 */
		var _updateLinks = function (performCascadeRight, performCascadeLeft, linkingObjects, callback, affectedObjects) {

			// remove all links from the affected object and determine
			// dataIds for duplication calculations
			var affectedDataIds = [];
			for (var i = 0; i < affectedObjects.length; i++) {
				affectedObjects[i].removeAllLinks(xfLinkType.FLOW);
				affectedDataIds.push(affectedObjects[i].getDataId());
			}

			var numberOfCascades = 0;
			if (performCascadeRight && performCascadeLeft) {
				numberOfCascades = 2;
			} else if (performCascadeRight || performCascadeLeft) {
				numberOfCascades = 1;
			}

			// create a counter callback so we only call our passed in call back after we have completed
			// links to both sides of the column
			var counter = 0;
			var counterCallback = function () {
				counter++;
				if (counter === numberOfCascades) {
					if (callback) {
						callback(affectedDataIds);
					}
				}
			};

			// determine new links
			if (performCascadeRight && performCascadeLeft) {
				_handleCascadingLinks(linkingObjects, true, counterCallback);
				_handleCascadingLinks(linkingObjects, false, counterCallback);
			} else if (performCascadeRight) {
				_handleCascadingLinks(linkingObjects, true, counterCallback);
			} else if (performCascadeLeft) {
				_handleCascadingLinks(linkingObjects, false, counterCallback);
			} else {
				if (callback) {
					callback(affectedDataIds);
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param cardObjectList
		 * @param cascadeRight
		 * @param renderCallback
		 * @private
		 */
		var _handleCascadingLinks = function (cardObjectList, cascadeRight, renderCallback) {

			if (cardObjectList == null || cardObjectList.length === 0) {
				renderCallback();
				return;
			}

			// Get all cards and clusters in column to the right/left of uiObj.  Must look not only for 'dangling'
			// UI objects, but also anything that is in a search result (ie/ inside a match card)
			var column = _getColumnByUIObject(cardObjectList[0]);           // all objects in objectList are in the same column
			var adjacentColumn = cascadeRight ? _getNextColumn(column) : _getPrevColumn(column);
			var adjacentChildren = xfUtil.getLinkableChildren(adjacentColumn);

			// Early out
			if (adjacentChildren.length === 0) {
				if (renderCallback) {
					renderCallback();
				}
				return;
			}

			// remove old links
			for (var i = 0; i < cardObjectList.length; i++) {
				var cardObject = cardObjectList[i];
				var cardObjectLinks = cardObject.getLinks();
				for (var linkId in cardObjectLinks) {
					if (cardObjectLinks.hasOwnProperty(linkId)) {
						var link = cardObjectLinks[linkId];
						if (cascadeRight) {
							if (link.getSource().getXfId() === cardObject.getXfId()) {
								link.remove();
							}
						} else {
							if (link.getDestination().getXfId() === cardObject.getXfId()) {
								link.remove();
							}
						}
					}
				}
			}

			var contextObjectMap = _getContextObjectMap(cardObjectList, adjacentChildren);

			// create a couter callback so we only call our passed in call back after we have completed
			// links to boths sides of the column
			var numberOfContexts = _.size(contextObjectMap.src) * _.size(contextObjectMap.tar);
			var counter = 0;
			var counterCallback = function () {
				counter++;
				if (counter === numberOfContexts) {
					if (renderCallback) {
						renderCallback();
					}
				}
			};

			aperture.util.forEach(contextObjectMap.src, function (srcContext, srcContextId) {
				aperture.util.forEach(contextObjectMap.tar, function (tarContext, tarContextId) {
					// Fetch related links between the unlinked objects
					infRest.request('/aggregatedlinks').inContext(srcContextId).withData({

						sessionId: infWorkspace.getSessionId(),
						sourceIds: srcContext,
						targetIds: tarContext,
						linktype: cascadeRight ? 'source' : 'destination',
						type: 'FINANCIAL',
						aggregate: 'FLOW',
						startdate: _UIObjectState.dates.startDate,
						enddate: _UIObjectState.dates.endDate,
						contextId: srcContextId,
						targetContextId: tarContextId

					}).then(function (response) {

						_handleCascadingLinksResponse(
							response,
							cascadeRight ? 'source' : 'destination',
							column.getXfId(),
							adjacentColumn.getXfId(),
							counterCallback
						);
					});
				});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param serverResponse
		 * @param branchType
		 * @param sourceColumnId
		 * @param targetColumnId
		 * @param renderCallback
		 * @private
		 */
		var _handleCascadingLinksResponse = function (serverResponse, branchType, sourceColumnId, targetColumnId, renderCallback) {
			for (var dataId in serverResponse.data) {
				if (serverResponse.data.hasOwnProperty(dataId)) {
					var serverLinks = serverResponse.data[dataId];
					for (var i = 0; i < serverLinks.length; i++) {
						var serverLink = serverLinks[i];
						var sourceDataId = serverLink.source;
						var destDataId = serverLink.target;
						var linkAmount = tagUtil.getValueByTag(serverLink, 'AMOUNT');
						var linkCount = tagUtil.getValueByTag(serverLink, 'CONSTRUCTED');

						// Figure out the left and right column based on the branch type.   UILinks always
						// flow left to right
						var rightColumn = null, leftColumn = null;
						if (branchType === 'destination') {
							rightColumn = _UIObjectState.singleton.getUIObjectByXfId(sourceColumnId);
							leftColumn = _UIObjectState.singleton.getUIObjectByXfId(targetColumnId);
						} else {
							rightColumn = _UIObjectState.singleton.getUIObjectByXfId(targetColumnId);
							leftColumn = _UIObjectState.singleton.getUIObjectByXfId(sourceColumnId);
						}


						var sourceUIObjects = leftColumn.getUIObjectsByDataId(sourceDataId);
						var destUIObjects = rightColumn.getUIObjectsByDataId(destDataId);

						// Create links between all pairs in sourceUIObjects and destUIObjects
						for (var sourceIdx = 0; sourceIdx < sourceUIObjects.length; sourceIdx++) {
							for (var destIdx = 0; destIdx < destUIObjects.length; destIdx++) {
								var sourceObj = sourceUIObjects[sourceIdx];
								var destObj = destUIObjects[destIdx];

								xfLink.createInstance(sourceObj, destObj, linkAmount, linkCount);
							}
						}
					}
				}
			}

			if (renderCallback) {
				renderCallback();
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param srcObjects
		 * @param tarObjects
		 * @returns {{src: {}, tar: {}}}
		 * @private
		 */
		var _getContextObjectMap = function (srcObjects, tarObjects) {

			var i;
			var contextObjectMap = {
				'src': {},
				'tar': {}
			};

			for (i = 0; i < srcObjects.length; i++) {
				var srcObj = srcObjects[i];
				var srcContext = xfUtil.getContextByUIObject(srcObj).getXfId();
				if (contextObjectMap.src.hasOwnProperty(srcContext)) {
					contextObjectMap.src[srcContext].push(srcObj.getDataId());
				} else {
					contextObjectMap.src[srcContext] = [srcObj.getDataId()];
				}
			}

			for (i = 0; i < tarObjects.length; i++) {
				var tarObj = tarObjects[i];
				var tarContext = xfUtil.getContextByUIObject(tarObj).getXfId();
				if (contextObjectMap.tar.hasOwnProperty(tarContext)) {
					contextObjectMap.tar[tarContext].push(tarObj.getDataId());
				} else {
					contextObjectMap.tar[tarContext] = [tarObj.getDataId()];
				}
			}

			return contextObjectMap;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param fileObject
		 * @param sourceColumn
		 * @param linkLeft
		 * @param linkRight
		 * @private
		 */
		var _addFileLinks = function (fileObject, sourceColumn, linkLeft, linkRight) {
			var sourceColumnIdx = _getColumnIndex(sourceColumn);

			if (linkLeft) {
				var leftColumn = _getColumnByIndex(sourceColumnIdx - 1);
				if (leftColumn) {
					leftColumn.addFileLinksTo(fileObject, false);
				}
			}

			if (linkRight) {
				var rightColumn = _getColumnByIndex(sourceColumnIdx + 1);
				if (rightColumn) {
					rightColumn.addFileLinksTo(fileObject, true);
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param renderCallback
		 * @private
		 */
		var _updateAllColumnSankeys = function (renderCallback) {

			var columns = _UIObjectState.singleton.getChildren();
			if (columns.length > 3) {

				for (var i = 1; i < columns.length - 2; i++) {
					var currentColumn = columns[i];
					var cardObjects = xfUtil.getLinkableChildren(currentColumn);
					_updateLinks(true, false, cardObjects, renderCallback, cardObjects);
				}
			} else {
				if (renderCallback) {
					renderCallback();
				}
			}
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// VIEW CHANGE METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		var _onAddFilesToWorkspaceFromOtherViews = function(eventChannel, data) {

			if (eventChannel !== appChannel.ADD_FILES_TO_WORKSPACE_REQUEST) {
				aperture.log.error('_onAddFilesToWorkspaceFromOtherViews: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onAddFilesToWorkspaceFromOtherViews: view not initialized');
				return false;
			}

			if (data == null ||
				data.contexts == null
			) {
				aperture.log.error('_onAddFilesToWorkspaceFromOtherViews: function called with invalid data');
				return false;
			}

			_onAddFilesToWorkspace(data.contexts);

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onAddFilesToWorkspaceFromFile = function(eventChannel) {

			if (eventChannel !== appChannel.IMPORT_GRAPH_REQUEST) {
				aperture.log.error('_onAddFilesToWorkspaceFromFile: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onAddFilesToWorkspaceFromFile: view not initialized');
				return false;
			}

			aperture.pubsub.publish(appChannel.FILE_UPLOAD_REQUEST, {
				action: '/import',
				filter: '.infml',

				preCallback: function () {
					aperture.pubsub.publish(appChannel.REQUEST_FLOW_VIEW, {});

					$.blockUI({
						theme: true,
						title: 'Import In Progress',
						message: '<img src="' + constants.AJAX_SPINNER_FILE + '" style="display:block;margin-left:auto;margin-right:auto"/>'
					});
				},
				postCallback: function (data) {

					setTimeout(
						function () {
							$.unblockUI();
						},
						0
					);

					var restoreState = JSON.parse(data);

					if (restoreState.message && !restoreState.ok) {
						aperture.log.error('Server Error' + (restoreState ? (' : ' + JSON.stringify(restoreState)) : ''));
					}

					_UIObjectState.singleton.removeAllChildren();
					_pruneColumns();
					_checkPatternSearchState();

					_onAddFilesToWorkspace(_convertImportState(restoreState));
				}
			});

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _convertImportState = function(restoredState) {

			var contexts = [];

			var getContainedEntityIds = function(containedIds, object) {
				if (object.UIType === constants.MODULE_NAMES.FILE) {
					if (object.clusterUIObject != null) {
						getContainedEntityIds(containedIds, object.clusterUIObject);
					}
				} else if (object.UIType === constants.MODULE_NAMES.IMMUTABLE_CLUSTER) {
					if (object.spec.hasOwnProperty('ownerId') &&
						object.spec.ownerId !== '' &&
						!$.isEmptyObject(object.spec.ownerId)
					) {
						containedIds.push(object.spec.ownerId);
					} else {
						aperture.util.forEach(object.children, function(child) {
							getContainedEntityIds(containedIds, child);
						});
					}
				} else if (object.UIType === constants.MODULE_NAMES.SUMMARY_CLUSTER) {
					if (object.spec.hasOwnProperty('ownerId') &&
						object.spec.ownerId !== '' &&
						!$.isEmptyObject(object.spec.ownerId)
					) {
						containedIds.push(object.spec.ownerId);
					}
				} else if (object.UIType === constants.MODULE_NAMES.ENTITY) {
					containedIds.push(object.spec.dataId);
				}

				return containedIds;
			};

			for (var i = 0; i < restoredState.children.length; i++) {
				var restoredFiles = restoredState.children[i];
				if (restoredFiles.children.length > 0) {
					var files = [];
					for (var j = 0; j < restoredFiles.children.length; j++) {
						var entityIds = [];
						getContainedEntityIds(entityIds, restoredFiles.children[j]);
						files.push({
							title: restoredFiles.children[j].title,
							entityIds: entityIds
						});
					}
					contexts.push({files:files});
				}
			}

			return contexts;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onAddFilesToWorkspace = function(contexts) {

			var numFiles = 0;
			aperture.util.forEach(contexts, function(files) {
				var fileList = files.files;
				aperture.util.forEach(fileList, function(file) {
					numFiles++;
				});
			});


			// final callback that sets focus if needed and adds a popover dialog if needed
			var fileCounter = 0;
			var onCardsAddedCallback = function(columnUIObj) {

				fileCounter++;
				if (fileCounter === numFiles) {
					if (focusSet &&
						focusFileObject != null &&
						focusFileContextIndex != null &&
						focusFileFileIndex != null
					) {
						// set focus on the first incoming file's clusterUIObject
						if (contexts[focusFileContextIndex].files[focusFileFileIndex].entityIds.length > 1) {
							var fileCluster = focusFileObject.getClusterUIObject();
							if ( fileCluster ) {
								aperture.pubsub.publish(appChannel.FOCUS_CHANGE_REQUEST, {xfId: fileCluster.getXfId()});
							}
						} else if (contexts[focusFileContextIndex].files[focusFileFileIndex].entityIds.length === 1) {
							var focusObjList = focusFileObject.getUIObjectsByDataId(contexts[focusFileContextIndex].files[focusFileFileIndex].entityIds[0]);
							if (focusObjList.length === 1) {
								aperture.pubsub.publish(appChannel.FOCUS_CHANGE_REQUEST, {xfId: focusObjList[0].getXfId()});
							}
						}
					}

					aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: _UIObjectState.singleton});

					// Add a popover to the first incoming file if the workspace isn't empty,
					// tell the popover about all the files involved.
					if (addPopover) {
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: focusFileObject, popoverData: fileXfIds});
						addPopover = false;
					}
				}
			};

			// Clean-up any unused columns
			_pruneColumns();

			// determine if we are adding files into an already populated workspace, in which case, we need to add a popover to
			// the first file in the first context
			var addPopover = false;
			var columnExtents = _getMinMaxColumnIndex();
			for (var i = columnExtents.min; i <= columnExtents.max; i++) {
				if (_getColumnByIndex(i).getChildren().length > 0) {
					addPopover = true;
				}
			}

			// figure out where to place the new files. If there is a selected object then we used that column.
			// Otherwise, we determine where the middle column is (rounded down) and used that column as the starting point.
			var targetCol = 0;
			if (_UIObjectState.selectedUIObject) {
				var selectedObj = _UIObjectState.singleton.getUIObjectByXfId(_UIObjectState.selectedUIObject.xfId);
				targetCol = _getColumnIndex(_getColumnByUIObject(selectedObj));
			} else {
				var minMax = _getMinMaxColumnIndex();
				targetCol = Math.floor(minMax.min + ((minMax.max - minMax.min) / 2));
			}

			var focusSet = false;
			var focusFileObject = null;
			var focusFileContextIndex = null;
			var focusFileFileIndex = null;

			var fileXfIds = [];

			aperture.util.forEach(contexts, function(files, contextIndex) {

				var fileList = files.files;
				aperture.util.forEach(fileList, function(file, fileIndex) {

					var columnUIObj = _getColumnByIndex(targetCol + contextIndex);

					// Create a new file uiObject.
					var fileSpec = xfFile.getSpecTemplate();
					var fileUIObj = xfFile.createInstance(fileSpec);

					if (file.title) {
						fileUIObj.setLabel(file.title);
					}

					fileXfIds.push(fileUIObj.getXfId());

					if (!focusSet &&
						file.entityIds.length > 0
					) {
						focusSet = true;
						focusFileObject = fileUIObj;
						focusFileContextIndex = contextIndex;
						focusFileFileIndex = fileIndex;
					}

					// Add the file to the very top of the column.
					var topObj = null;
					if (columnUIObj.getVisualInfo().children.length > 0) {
						topObj = columnUIObj.getVisualInfo().children[0];
					}
					columnUIObj.insert(fileUIObj, topObj);
					_addFileLinks(fileUIObj, columnUIObj, true, true);

					var onFileAddedCallback = function () {
						if (file.entityIds && file.entityIds.length > 0) {
							_modifyContext(
								null,
								fileUIObj.getDataId(),
								'insert',
								file.entityIds,
								function (response) {
									_populateFileFromResponse(response, function () {
										onCardsAddedCallback(columnUIObj);
									});
								}
							);
						} else {
							onCardsAddedCallback(columnUIObj);
						}
					};

					_modifyContext(
						fileUIObj.getDataId(),
						columnUIObj.getDataId(),
						'create',
						null,
						onFileAddedCallback
					);
				});

				// Clean-up any unused columns, we call this each time through the contexts because prune columns
				// adds buffers columns if need be.
				_pruneColumns();
			});
		};


		//--------------------------------------------------------------------------------------------------------------
		//
		// ENTITY POPULATION AND DISPLAY METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param response
		 * @param renderCallback
		 * @private
		 */
		var _populateFileFromResponse = function(response, renderCallback) {

			var fileObjs = _UIObjectState.singleton.getUIObjectsByDataId(response.contextId);
			if (fileObjs.length !== 1 || fileObjs[0].getUIType() !== constants.MODULE_NAMES.FILE) {
				aperture.log.error(
						'_populateFileFromResponse: ' +
						'Invalid file object returned from server.'
				);
				return;
			}

			var fileObj = fileObjs[0];

			var specs = _getPopulatedSpecsFromData(response.targets, fileObj);

			if (specs.length !== 1) {
				aperture.log.error(
						'_populateFileFromResponse: ' +
						'Invalid number of entity specs returned from server: expected 1, received ' +
						specs.length
				);
				return;
			}

			var clusterObj = xfImmutableCluster.createInstance(specs[0]);

			clusterObj.updateToolbar(
				{
					'allowFile': false,
					'allowClose': true,
					'allowFocus': true,
					'allowSearch': true
				},
				true
			);

			clusterObj.showDetails(_UIObjectState.showDetails);
			clusterObj.showToolbar(true);

			fileObj.setClusterUIObject(clusterObj);

			aperture.pubsub.publish(appChannel.EXPAND_EVENT, { xfId: clusterObj.getXfId() });

			if (_UIObjectState.showDetails) {
				_updateCardsWithCharts(specs);
			}

			if (renderCallback) {
				renderCallback();
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param specs
		 * @private
		 */
		var _updateCardsWithCharts = function(specs) {

			if(specs.length === 0) {
				return;
			}

			_invalidateCardCharts(specs);

			var updates = [];
			var focus = _UIObjectState.focus;

			getMaxDebitCredit(
				focus,
				function(focusMDC) {
					for (var i = 0; i < specs.length; i++) {

						var objects = _UIObjectState.singleton.getUIObjectsByDataId(specs[i].dataId);

						if (objects.length > 0) {
							for (var j = 0; j < objects.length; j++) {
								var specUIObj = objects[j];

								var contextObj = xfUtil.getContextByUIObject(specUIObj);

								updates.push({
									dataId : specs[i].dataId,
									contextId : contextObj.getXfId()
								});
							}
						}
					}

					updateCardTypeWithCharts(focus, focusMDC, updates);
				}
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param specs
		 * @private
		 */
		var _invalidateCardCharts = function(specs) {

			for (var i = 0; i < specs.length; i++) {

				var spec = specs[i];
				if (!spec.graphUrl) {
					continue;
				}

				var objects = _UIObjectState.singleton.getUIObjectsByDataId(spec.dataId);
				for (var j = 0; j < objects.length; j++) {
					var object = objects[j];
					object.update({
						graphUrl : ''
					});
					aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject : object});
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param focus
		 * @param onReturn
		 */
		function getMaxDebitCredit(focus, onReturn) {

			if (focus == null) {
				onReturn(DEFAULT_GRAPH_SCALE);
				return;
			}

			var focusId = focus.dataId;

			var entity = {
				contextId : focus.contextId,
				dataId : focusId
			};

			// Separate call for files?
			infRest.request('/chart').inContext( entity.contextId ).withData({

				sessionId: infWorkspace.getSessionId(),
				entities: [entity],
				startDate: _UIObjectState.dates.startDate,
				endDate: _UIObjectState.dates.endDate,
				numBuckets: _UIObjectState.dates.numBuckets,
				focusId: [focus.dataId],
				focusMaxDebitCredit: '',
				focuscontextid: focus.contextId

			}).then(function (response) {

				var responseData = response[focusId];
				var maxCreditDebit = responseData ?
						responseData.maxDebit > responseData.maxCredit ?
					responseData.maxDebit : responseData.maxCredit : null;

				onReturn(maxCreditDebit);
			});
		}

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param focus
		 * @param focusMDC
		 * @param entityIdArray
		 */
		function updateCardTypeWithCharts(focus, focusMDC, entityIdArray) {

			if ( entityIdArray.length === 0 ) {
				return;
			}


			if (!_.isEmpty(entityIdArray)){
				var entityByContext = [];
				for (var i = 0; i < entityIdArray.length; i++) {
					if (!entityByContext[entityIdArray[i].contextId]) {
						entityByContext[entityIdArray[i].contextId] = [];
					}

					entityByContext[entityIdArray[i].contextId].push(entityIdArray[i]);
				}


				for (var context in entityByContext) {
					if (entityByContext.hasOwnProperty(context)) {

						infRest.request('/chart').inContext( context ).withData({

							sessionId: infWorkspace.getSessionId(),
							entities: entityByContext[context],
							startDate: _UIObjectState.dates.startDate,
							endDate: _UIObjectState.dates.endDate,
							numBuckets: _UIObjectState.dates.numBuckets,
							focusId: (focus == null) ? null : [focus.dataId],
							focusMaxDebitCredit: focusMDC,
							focuscontextid: (focus == null) ? null : focus.contextId

						}).then( _updateCard );
					}
				}
			}
		}

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param response
		 * @private
		 */
		function _updateCard(response) {

			var parents = {};
			for (var dataId in response) {
				if (response.hasOwnProperty(dataId)) {
					var cards = _UIObjectState.singleton.getUIObjectsByDataId(dataId);
					for (var i = 0; i < cards.length; i++) {

						var card = cards[i];

						// Store the parent in the map.
						var parent = card.getParent();
						parents[parent.getXfId()] = parent;

						card.showDetails(_UIObjectState.showDetails);
						card.update({
								graphUrl : aperture.io.restUrl('/chart?hash=' + xfUtil.getSafeURI(response[dataId].imageHash)),
								flow : {flowIn: response[dataId].totalCredit, flowOut: response[dataId].totalDebit}}
						);

						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject : card, updateOnly: true});

					}
				}
			}
		}

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param data
		 * @param parent
		 * @returns {Array}
		 * @private
		 */
		var _getPopulatedSpecsFromData = function (data, parent) {

			var specs = [];

			for (var i = 0; i < data.length; i++) {
				var entity = data[i];

				var spec = {};
				spec.showSpinner = false;
				var accounttype = xfUtil.getAccountTypeFromDataId(entity.uid);
				if (accounttype === constants.ACCOUNT_TYPES.CLUSTER || accounttype === constants.ACCOUNT_TYPES.ACCOUNT_OWNER) {
					spec = xfClusterBase.getSpecTemplate();
				} else if (accounttype === constants.ACCOUNT_TYPES.CLUSTER_SUMMARY) {
					spec = xfSummaryCluster.getSpecTemplate();
				} else if (accounttype === constants.ACCOUNT_TYPES.ENTITY) {
					spec = xfCard.getSpecTemplate();
				} else {
					aperture.log.error('Unable to determine UI object from account type');
				}

				_populateSpecWithData(entity, spec);

				if (spec.hasOwnProperty('parent')) {
					spec['parent'] = parent;
				} else {
					aperture.log.error('Spec does not contain "parent" element');
				}

				specs.push(spec);
			}

			return specs;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param elementData
		 * @param spec
		 * @private
		 */
		var _populateSpecWithData = function(elementData, spec) {

			if (elementData == null) {
				return;
			}

			if (spec.hasOwnProperty('confidenceInSrc') && elementData.uncertainty) {
				spec.confidenceInSrc = elementData.uncertainty.confidence;

				var doubleEncode = aperture.config.get()['influent.config'].doubleEncodeSourceUncertainty;

				if (doubleEncode != null && !doubleEncode) {
					spec.confidenceInAge = elementData.uncertainty.currency != null?
						elementData.uncertainty.currency : 1.0;
				} else {
					spec.confidenceInAge = spec.confidenceInSrc < 1.0? 0.0: 1.0;
				}
			}

			var type = xfUtil.getAccountTypeFromDataId(elementData.uid);
			if (type === constants.ACCOUNT_TYPES.ENTITY) {
				_processEntity(type, elementData, spec);
			} else {
				_processEntityCluster(type, elementData, spec);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param type
		 * @param elementData
		 * @param spec
		 * @private
		 */
		var _processEntityCluster = function(type, elementData, spec) {

			var stubMembers = [];
			var i=0;
			var memberSpec;
			for (i = 0; i < elementData.members.length; i++) {
				memberSpec = xfCard.getSpecTemplate();
				memberSpec.dataId = elementData.members[i];
				memberSpec.graphUrl = '';
				stubMembers.push(memberSpec);
			}

			for (i = 0; i < elementData.subclusters.length; i++) {
				memberSpec = xfClusterBase.getSpecTemplate();
				memberSpec.dataId = elementData.subclusters[i];
				memberSpec.graphUrl = '';
				stubMembers.push(memberSpec);
			}

			var entityCount = tagUtil.getEntityCount(elementData);
			var label = tagUtil.getValueByTag(elementData, 'LABEL');

			spec.dataId = elementData.uid;
			spec.accounttype = type;
			spec.members = stubMembers;
			spec.icons = iconUtil.getClusterIcons(elementData, entityCount);
			spec.count = entityCount;
			spec.label = label;
			spec.unbranchable = _.contains(elementData.entitytags, 'UNBRANCHABLE');
			spec.inDegree = tagUtil.getValueByTag(elementData, 'INFLOWING');
			spec.outDegree = tagUtil.getValueByTag(elementData, 'OUTFLOWING');
			spec.promptForDetails = elementData.promptForDetails;

			if (type === constants.ACCOUNT_TYPES.ACCOUNT_OWNER) {
				spec.ownerId = spec.dataId;
			} else {
				spec.ownerId = tagUtil.getValueByTag(elementData, 'ACCOUNT_OWNER');

				// FIXME: Temp fix to protect against incoming null tags
				if (spec.ownerId === null) {
					spec.ownerId = '';
				}
			}
		};

		//----------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param type
		 * @param elementData
		 * @param spec
		 * @private
		 */
		var _processEntity = function(type, elementData, spec) {

			spec.dataId = elementData.uid;
			spec.accounttype = type;
			spec.label = tagUtil.getValueByTag(elementData, 'LABEL');
			spec.unbranchable = _.contains(elementData.entitytags, 'UNBRANCHABLE');
			spec.inDegree = tagUtil.getValueByTag(elementData, 'INFLOWING');
			spec.outDegree = tagUtil.getValueByTag(elementData, 'OUTFLOWING');
			spec.promptForDetails = elementData.promptForDetails;
			spec.icons = [];

			// do icons
			var iconMap = aperture.config.get()['influent.config'].iconMap;
			var tag = '';
			var tagMap;
			var property;
			var properties;
			var i, j;
			var count;
			var limit = 4;
			var values;
			var icon;

			for (tag in iconMap) {
				if (iconMap.hasOwnProperty(tag)) {
					properties = tagUtil.getPropertiesByTag(elementData, tag, true);

					if (properties.length) {
						tagMap = iconMap[tag];
						count = 0;

						for (i=0; i< properties.length; i++) {
							property = properties[i];

							if (property.range && property.range.values) {
								values = property.range.values;
							} else if (property.range && property.range.distribution) {
								values = property.range.distribution;
							} else {
								values = [property.value];
							}

							for (j=0; j< values.length; j++) {
								var score = null;
								if (typeof values[j] === 'object' && values[j].range) {
									icon = tagMap.map(property.key, values[j].range);
									score = values[j].frequency;
								} else {
									icon = tagMap.map(property.key, values[j]);
								}

								if (icon) {
									var visualIconSpec = {
										type: tag,
										imgUrl: icon.icon? aperture.palette.icon(icon.icon) : icon.css? ('class:' + icon.css) : icon.url,
										title: score === null ? icon.title : (icon.title + '(' + score + ')'),
										friendlyName: property.friendlyText
									};
									if (score != null) {
										visualIconSpec.score = score;
									}
									spec.icons.push(visualIconSpec);

									if ((tagMap.limit && ++count === tagMap.limit) || spec.icons.length === limit) {
										break;
									}
								}
							}
						}
					}

					if (spec.icons.length === limit) {
						break;
					}
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param dataIds
		 * @private
		 */
		var _updateDuplicates = function (dataIds) {

			for (var i = 0; i < dataIds.length; i++) {

				var objectsFromDataId = _UIObjectState.singleton.getUIObjectsByDataId(dataIds[i]);
				if (objectsFromDataId.length > 0) {
					for (var j = 0; j < objectsFromDataId.length; j++) {
						var currentObject = objectsFromDataId[j];
						currentObject.setDuplicateCount(objectsFromDataId.length);
					}
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param bOnlyEmptySpecs
		 * @private
		 */
		var _collectAndShowDetails = function (bOnlyEmptySpecs) {
			// If we are showing details then we need to update all the charts that do not already have
			// chart info
			var specs = _UIObjectState.singleton.getSpecs(bOnlyEmptySpecs);
			_updateCardsWithCharts(specs);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onDetailsChangeRequest = function (eventChannel, data, renderCallback) {

			if (eventChannel !== appChannel.CARD_DETAILS_CHANGE ||
				_UIObjectState.singleton == null
				) {
				return;
			}

			_UIObjectState.showDetails = data.showDetails;

			if (_UIObjectState.showDetails) {
				_collectAndShowDetails();
			}

			_UIObjectState.singleton.showDetails(_UIObjectState.showDetails);

			// Now issue a rendering request to update the cards of the workspace to
			// reflect the new "showDetails" state.
			renderCallback();
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onUpdateCharts = function (eventChannel, data) {

			if (eventChannel !== appChannel.UPDATE_CHART_REQUEST ||
				_UIObjectState.singleton == null
				) {
				return;
			}

			var id = data.xfId;
			if (id) {
				var card = _UIObjectState.singleton.getUIObjectByXfId(id);
				if (card) {
					var specs = card.getSpecs();
					if (specs) {
						_updateCardsWithCharts(specs);
					}
				}
			}
		};


		//--------------------------------------------------------------------------------------------------------------
		//
		// SEARCH METHODS
		//
		//--------------------------------------------------------------------------------------------------------------


		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSearchOnCard = function(eventChannel, data) {

			if (eventChannel !== appChannel.SEARCH_ON_CARD) {
				aperture.log.error('_onSearchOnCard: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onSearchOnCard: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null
			) {
				aperture.log.error('_onSearchOnCard: function called with invalid data');
				return false;
			}

			var uiObj = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			if (uiObj == null) {
				return false;
			}

			var children = xfUtil.getChildrenByType(uiObj, constants.MODULE_NAMES.ENTITY);
			if (children == null) {
				return false;
			}

			var dataIds = [];
			for (var i = 0; i < children.length; i++) {
				dataIds.push(children[i].getDataId());
			}

			aperture.pubsub.publish(appChannel.SELECT_VIEW, {
				title: constants.VIEWS.ACCOUNTS.NAME,
				queryParams:{
					query : null
				}
			});

			// Let the view change before trying to open a modal dialog. Otherwise it'll get closed immediately.
			setTimeout(function() {
				aperture.pubsub.publish(appChannel.ADVANCED_SEARCH_REQUEST, {
					view: constants.VIEWS.ACCOUNTS.NAME,
					dataIds : dataIds
				});
			}, 0);

			return true;
		};


		//--------------------------------------------------------------------------------------------------------------
		//
		// PATTERN SEARCH METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onPatternSearchRequest = function (eventChannel, renderCallback) {

			if (eventChannel !== flowChannel.PATTERN_SEARCH_REQUEST) {
				aperture.log.error('_onPatternSearchRequest: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onPatternSearchRequest: view not initialized');
				return false;
			}

			// get files.
			var files = _getAllFiles();
			var fileSets = [];

			// open and populate match cards for any file with valid examples in it.
			aperture.util.forEach(files, function (file) {
				if (file.hasCluster()) {
					fileSets.push({
						contextId: file.getDataId(),
						entities: [file.getClusterUIObject().getDataId()]
					});
				}
			});

			if (fileSets.length > 0) {
				var onEntityResolution = function (data) {
					var matchCardObjs = [];
					var closeTheseFiles = [];

					aperture.util.forEach(data, function (fileData) {
						var file = _UIObjectState.singleton.getUIObjectByXfId(fileData.contextId);

						if (file) {
							if (fileData.entities.length !== 0) {
								file.showSearchControl(true, 'like:' + fileData.entities.toString());
								matchCardObjs.push(file.getMatchUIObject());

							} else {
								closeTheseFiles.push(file);
							}

							aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {	UIObject: file, updateOnly: true });
						}
					});

					// to do: prompt to proceed if there are any closures?

					// if nothing to query, have to exit out.
					if (matchCardObjs.length === 0) {
						window.alert('Too many model accounts to search? Try again with less.');
						if (renderCallback) {
							renderCallback();
						}
						return true;
					}


					// close anything not involved in the search.
					aperture.util.forEach(closeTheseFiles, function (file) {
						file.showSearchControl(false);
					});

					// set involved matchcards in a search state
					var removedIds = [];
					aperture.util.forEach(_getAllMatchCards(), function (mcard) {
						removedIds = removedIds.concat(mcard.getVisibleDataIds());
						mcard.removeAllChildren();
						mcard.setSearchState('searching');
						aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: mcard});
					});
					_updateDuplicates(removedIds);


					// issue queries.


					// Create groups of pattern searches and basic searches
					var columnExtents = _getMinMaxColumnIndex();
					var columnFiles = '';

					// to do: there is only the possibility of one pattern group using this logic.
					var patternGroups = [];
					var currentPatternGroup = [];
					var i, j;

					for (i = columnExtents.min; i <= columnExtents.max; i++) {
						columnFiles = xfUtil.getChildrenByType(_getColumnByIndex(i), constants.MODULE_NAMES.FILE);
						var columnMatchcards = [];
						for (j = 0; j < columnFiles.length; j++) {
							if (columnFiles[j].hasMatchCard()) {
								columnMatchcards.push(columnFiles[j].getMatchUIObject());
							}
						}

						var columnQBE = [];
						for (j = 0; j < columnMatchcards.length; j++) {
							if (columnMatchcards[j].getSearchTerm().length > 0) {
								columnQBE.push(columnMatchcards[j]);
							}
						}
						currentPatternGroup = currentPatternGroup.concat(columnQBE);
						if (columnQBE.length === 0 && currentPatternGroup.length > 0) {
							patternGroups.push(currentPatternGroup);
							currentPatternGroup = [];
						}
					}

					if (currentPatternGroup.length > 0) {
						patternGroups.push(currentPatternGroup);
					}

					for (i = 0; i < patternGroups.length; i++) {
						_searchByExample(_gatherPatternSearchTerm(patternGroups[i]), renderCallback);
					}
				};

				infRest.request('/containedentities').withData({

					sessionId: infWorkspace.getSessionId(),
					entitySets: fileSets,
					details: false

				}).then(function (response) {

					onEntityResolution(response.data);
				});
			}

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param term
		 * @param renderCallback
		 * @private
		 */
		var _searchByExample = function (term, renderCallback) {

			infRest.request('/patternsearch').withData({
				sessionId: infWorkspace.getSessionId(),
				term: term,
				startDate: _UIObjectState.dates.startDate,
				endDate: _UIObjectState.dates.endDate,
				cluster: false,
				limit: MAX_PATTERN_SEARCH_RESULTS,
				useAptima: (_getAllMatchCards().length > 3)
			}).then(function (response, restInfo) {
				var parsedResponse = aperture.util.viewOf(response);

				if (!restInfo.success) {
					_populateEmptyResults(_getAllMatchCards());
					if (renderCallback) {
						renderCallback();
					}

					return;
				}

				var newUIObjects = _populatePatternResults(parsedResponse, renderCallback);

				var counter = 0;
				var callback = function (dataIds) {
					counter++;
					if (counter === newUIObjects.length) {
						if (renderCallback) {
							renderCallback();
						}
					}
				};

				for (var i = 0; i < newUIObjects.length; i++) {
					_updateLinks(true, true, newUIObjects[i], callback, newUIObjects[i]);
				}
			});

			// DRAPER Instrumentation for logging a pattern search.
			// Search terms omitted from log for privacy concerns.
			logActivity({
				workflow: aperture.log.draperWorkflow.WF_TRANSFORM,
				activity: 'execute-pattern-search',
				description: 'Execute query by example to find accounts with a similar pattern of activity',
				data: {
					startDate: _UIObjectState.dates.startDate,
					endDate: _UIObjectState.dates.endDate
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param matchGroup
		 * @returns {*}
		 * @private
		 */
		var _gatherPatternSearchTerm = function (matchGroup) {
			var patternSearchObject = {};
			patternSearchObject.uid = guid.generateGuid();
			patternSearchObject.name = 'Pattern Search Descriptor';
			patternSearchObject.description = null;
			patternSearchObject.entities = [];

			// Create entities.   Each file is an entity with its children being exemplars
			// TODO:  right now we only get xfCards.   Need to extract data ids of all cards contained in a cluster
			for (var i = 0; i < matchGroup.length; i++) {
				var matchCard = matchGroup[i];
				var psEntity = {};
				psEntity.uid = matchCard.getParent().getXfId();
				psEntity.role = {
					'string': matchCard.getSearchTerm()
				};
				psEntity.entities = null;
				psEntity.tags = null;
				psEntity.properties = null;

				var matchCardDataIds = null;
				if (matchCard.getSearchTerm().indexOf('like:') !== -1) {
					matchCardDataIds = _parseDataIds(matchCard.getSearchTerm(), 'like:');
				} else {
					aperture.log.error('Unable to determine QuBE search type from search term: ' + matchCard.getSearchTerm());
				}

				psEntity.examplars = {
					array: matchCardDataIds
				};

				psEntity.constraint = null;
				patternSearchObject.entities.push(psEntity);
			}

			// Create links
			var workspaceLinks = _UIObjectState.singleton.getLinks();
			patternSearchObject.links = [];
			for (var linkId in workspaceLinks) {
				if (workspaceLinks.hasOwnProperty(linkId)) {
					var link = workspaceLinks[linkId];
					if (link.getType() === xfLinkType.FILE) {
						link.uid = guid.generateGuid();
						link.source = {
							string: link.getSource().getXfId()
						};
						link.target = {
							string: link.getDestination().getXfId()
						};
						link.role = {
							string: link.getSource().getLabel() + '->' + link.getDestination().getLabel()
						};
						link.properties = null;
						link.stage = -1;
						link.constraint = null;
						link.linkTypes = null;

						patternSearchObject.links.push(link);
					}
				}
			}

			return JSON.stringify(patternSearchObject);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param matchcardObjects
		 * @private
		 */
		var _populateEmptyResults = function (matchcardObjects) {

			for (var i = 0; i < matchcardObjects.length; i++) {

				var matchcard = matchcardObjects[i];

				if (matchcard.getUIType() !== constants.MODULE_NAMES.MATCH) {
					continue;
				}

				matchcard.setSearchState('results');
				matchcard.setTotalMatches(0);
				matchcard.setShownMatches(0);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param serverResponse
		 * @param renderCallback
		 * @returns {Array}
		 * @private
		 */
		var _populatePatternResults = function (serverResponse, renderCallback) {

			var j, k;

			// For each match entity (file) get a set of unique entities that belong in that file
			var workspaceFiles = xfUtil.getChildrenByType(_UIObjectState.singleton, constants.MODULE_NAMES.FILE);

			//Create an xfCard for each entity in each file
			var newMatchResults = [];
			for (k = 0; k < serverResponse.roleResults.length; k++) {
				var roleResult = serverResponse.roleResults[k];
				var fileId = roleResult.uid;

				for (j = 0; j < workspaceFiles.length; j++) {
					if (fileId === workspaceFiles[j].getXfId() && workspaceFiles[j].hasMatchCard()) {

						// Remove children in case a response arrived before this one.
						workspaceFiles[j].getMatchUIObject().removeAllChildren();

						workspaceFiles[j].showSearchControl(true, workspaceFiles[j].getMatchUIObject().getSearchTerm()); // pull from previous

						var resultUIObjects = _populateMatchResults(
							workspaceFiles[j].getMatchUIObject(),
							roleResult,
							true,
							renderCallback
						);

						newMatchResults.push(resultUIObjects);
					}
				}
			}

			return newMatchResults;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param parent
		 * @param serverResponse
		 * @param noRemove
		 * @param renderCallback
		 * @returns {Array}
		 * @private
		 */
		var _populateMatchResults = function (parent, serverResponse, noRemove, renderCallback) {

			var createdUIObjects = [];

			var entities = serverResponse.results;
			var firstSearchObject = null;
			var specs = _getPopulatedSpecsFromData(entities, parent);
			var dataIds = [];

			var shownMatches = 0;
			var totalMatches = 0;

			for (var i = 0; i < specs.length; i++) {

				var UIObject = {};

				if (specs[i].accounttype === constants.ACCOUNT_TYPES.ENTITY) {
					UIObject = xfCard.createInstance(specs[i]);
				}
				else if (specs[i].accounttype === constants.ACCOUNT_TYPES.CLUSTER_SUMMARY) {
					UIObject = xfSummaryCluster.createInstance(specs[i]);
				}
				else if (specs[i].accounttype === constants.ACCOUNT_TYPES.ACCOUNT_OWNER) {
					UIObject = xfImmutableCluster.createInstance(specs[i]);
				}
				else if (specs[i].accounttype === constants.ACCOUNT_TYPES.CLUSTER) {
					UIObject = xfMutableCluster.createInstance(specs[i]);
				} else {
					aperture.log.error('Failed to determine UI object from account type');
				}

				UIObject.showDetails(_UIObjectState.showDetails);
				// determine what the first search object is
				if (i === 0) {
					firstSearchObject = UIObject;
				}

				parent.insert(UIObject, null);

				var dataId = UIObject.getDataId();
				if (dataId != null) {
					dataIds.push(dataId);
				}
				createdUIObjects.push(UIObject);
			}

			shownMatches = parent.getChildren().length;
			totalMatches = serverResponse.totalResults != null ? serverResponse.totalResults : shownMatches;

			//Set the total number of matches, to display
			if (parent.setTotalMatches) {
				parent.setTotalMatches(totalMatches);
			}
			if (parent.setShownMatches) {
				parent.setShownMatches(shownMatches);
			}

			aperture.pubsub.publish(flowChannel.SEARCH_RESULTS_RETURNED_EVENT, {
				shownMatches: shownMatches,
				totalMatches: totalMatches
			});

			// if we are showing card details then we need to populate the card specs with chart data
			if (_UIObjectState.showDetails) {
				_updateCardsWithCharts(specs);
			}

			if (renderCallback) {
				renderCallback();
			}

			_updateDuplicates(dataIds);

			if (parent.getUIType() === constants.MODULE_NAMES.MATCH) {
				parent.setSearchState('results');
				aperture.pubsub.publish(appChannel.RENDER_UPDATE_REQUEST, {UIObject: parent});
			}

			return createdUIObjects;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param searchTerm
		 * @param splitString
		 * @returns {Array|*}
		 * @private
		 */
		var _parseDataIds = function(searchTerm, splitString) {
			var termPieces = searchTerm.split(splitString);
			var dataIds = termPieces[1].split(',');
			for (var j = 0; j < dataIds.length; j++) {
				dataIds[j] = dataIds[j].split('\'').join(' ').trim();
			}
			return dataIds;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @private
		 */
		var _checkPatternSearchState = function () {
			var active = aperture.util.forEachUntil(_getAllFiles(), function (file) {
				return file.getChildren().length !== 0;
			}, true);

			if (_UIObjectState.graphSearchActive !== active) {
				_UIObjectState.graphSearchActive = active;
				aperture.pubsub.publish(appChannel.GRAPH_SEARCH_STATE_CHANGE,
					{graphSearchActive: active});
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @returns {Array}
		 * @private
		 */
		var _getAllFiles = function () {
			var columnExtents = _getMinMaxColumnIndex();
			var columnFiles = [];
			var i;

			// Do a preliminary scan to see if it's basic or not
			for (i = columnExtents.min; i <= columnExtents.max; i++) {
				columnFiles = columnFiles.concat(xfUtil.getChildrenByType(_getColumnByIndex(i), constants.MODULE_NAMES.FILE));
			}

			return columnFiles;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @returns {Array}
		 * @private
		 */
		var _getAllMatchCards = function () {
			var columnExtents = _getMinMaxColumnIndex();
			var columnFiles = '';
			var matchcardObjects = [];
			var i, j;

			// Do a preliminary scan to see if it's basic or not
			for (i = columnExtents.min; i <= columnExtents.max; i++) {
				columnFiles = xfUtil.getChildrenByType(_getColumnByIndex(i), constants.MODULE_NAMES.FILE);
				for (j = 0; j < columnFiles.length; j++) {
					if (columnFiles[j].hasMatchCard()) {
						var matchCardObject = columnFiles[j].getMatchUIObject();
						matchcardObjects.push(matchCardObject);
					}
				}
			}

			return matchcardObjects;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @param renderCallback
		 * @private
		 */
		var _onPageSearch = function (eventChannel, data, renderCallback) {

			if ((eventChannel !== flowChannel.PREV_SEARCH_PAGE_REQUEST &&
				eventChannel !== flowChannel.NEXT_SEARCH_PAGE_REQUEST &&
				eventChannel !== flowChannel.SET_SEARCH_PAGE_REQUEST)
			) {
				aperture.log.error('_onPageSearch: function called with illegal event channel');
				return false;
			}

			if (!_UIObjectState.singleton) {
				aperture.log.error('_onPageSearch: view not initialized');
				return false;
			}

			if (data == null ||
				data.xfId == null ||
				data.page == null
			) {
				aperture.log.error('_onPageSearch: function called with invalid data');
				return false;
			}

			var matchObject = _UIObjectState.singleton.getUIObjectByXfId(data.xfId);
			if (eventChannel === flowChannel.PREV_SEARCH_PAGE_REQUEST) {
				matchObject.pageLeft();
			} else if (eventChannel === flowChannel.NEXT_SEARCH_PAGE_REQUEST) {
				matchObject.pageRight();
			} else if (eventChannel === flowChannel.SET_SEARCH_PAGE_REQUEST) {
				matchObject.setPage(data.page);
				return true;
			}
			var syncUpdateCallback = function () {
				renderCallback();

				if (_UIObjectState.showDetails) {
					_updateCardsWithCharts(matchObject.getSpecs());
				}
			};

			_updateLinks(true, true, matchObject.getChildren(), syncUpdateCallback, matchObject.getChildren());

			return true;
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// COLUMN MANAGEMENT METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @returns {{min: number, max: number}}
		 * @private
		 */
		var _getMinMaxColumnIndex = function () {
			var minIndex = 0;
			var maxIndex = 0;
			var col = _getColumnByIndex(0);
			while (_getNextColumn(col)) {
				col = _getNextColumn(col);
				maxIndex++;
			}
			col = _getColumnByIndex(0);
			while (_getPrevColumn(col)) {
				col = _getPrevColumn(col);
				minIndex--;
			}
			return {
				min: minIndex + 1,           // there are always 'empty' columns on the edges
				max: maxIndex - 1
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Returns the column to the right of the given one, if it exists; otherwise returns NULL.
		 *
		 * @param columnObj
		 * @returns {null}
		 * @private
		 */
		var _getNextColumn = function (columnObj) {
			var columnIndex = _getColumnIndex(columnObj);
			var nextColumn = _UIObjectState.singleton.getChildren()[columnIndex + 1];
			return (columnIndex === -1 || nextColumn == null) ? null : nextColumn;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Returns the column to the left of the given one, if it exists; otherwise returns NULL.
		 *
		 * @param columnObj
		 * @returns {null}
		 * @private
		 */
		var _getPrevColumn = function (columnObj) {
			var columnIndex = _getColumnIndex(columnObj);
			var prevColumn = _UIObjectState.singleton.getChildren()[columnIndex - 1];
			return (columnIndex === -1 || prevColumn == null) ? null : prevColumn;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param index
		 * @returns {*}
		 * @private
		 */
		var _getColumnByIndex = function (index) {
			if (0 <= _UIObjectState.singleton.getChildren().length && index < _UIObjectState.singleton.getChildren().length) {
				return _UIObjectState.singleton.getChildren()[index];
			} else {
				return null;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Returns the index of the given column if it exists; otherwise returns -1.
		 *
		 * @param columnObj
		 * @returns {number}
		 * @private
		 */
		var _getColumnIndex = function (columnObj) {
			for (var i = 0; i < _UIObjectState.singleton.getChildren().length; i++) {
				var nextColumnObj = _UIObjectState.singleton.getChildren()[i];
				if (columnObj.getXfId() === nextColumnObj.getXfId()) {
					return i;
				}
			}
			return -1;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Returns the column that the UIObject belongs to.
		 *
		 * @param uiObject
		 * @returns {*}
		 * @private
		 */
		var _getColumnByUIObject = function (uiObject) {
			var columnObj = xfUtil.getUITypeAncestor(uiObject, constants.MODULE_NAMES.COLUMN);
			if (columnObj == null) {
				aperture.log.error('The UIObjectId: ' + uiObject.getXfId() + ' does not have a valid parent column.');
			}
			return columnObj;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @returns {boolean}
		 * @private
		 */
		var _pruneColumns = function () {

			var i;

			var changed = false;
			var workspace = _UIObjectState.singleton;
			var columns = workspace.getChildren();

			var columnSpec = xfColumn.getSpecTemplate();
			var column;

			if (columns.length === 0) {
				for (i = 0; i < 3; i++) {
					column = _createColumn(columnSpec);
					_UIObjectState.singleton.insert(column, null);
				}

				changed = true;
			} else if (columns.length === 1) {
				column = _createColumn(columnSpec);
				_UIObjectState.singleton.insert(column, columns[0]);

				column = _createColumn(columnSpec);
				_UIObjectState.singleton.insert(column, null);

				changed = true;
			} else if (columns.length === 2) {
				if (!columns[0].isEmpty()) {
					column = _createColumn(columnSpec);
					_UIObjectState.singleton.insert(column, null);
				} else {
					column = _createColumn(columnSpec);
					_UIObjectState.singleton.insert(column, columns[0]);
				}

				changed = true;
			} else {

				for (i = 1; i < columns.length - 1; i++) {
					if (columns[i].isEmpty()) {
						_UIObjectState.singleton.removeChild(columns[i].getXfId());
						changed = true;
					}
				}

				var columnNumber = workspace.getChildren().length;
				if (columnNumber < 3) {
					if (columnNumber < 2) {
						aperture.log.error('_pruneColumns: too many columns were removed during pruning');
					}

					column = _createColumn(columnSpec);
					_UIObjectState.singleton.insert(column, null);
					changed = true;
				}

				// we should always have an empty column to the far left.
				if (!columns[0].isEmpty()) {
					column = _createColumn(columnSpec);
					_UIObjectState.singleton.insert(column, columns[0]);
					changed = true;
				}

				// same for right.
				if (!columns[columns.length - 1].isEmpty()) {
					column = _createColumn(columnSpec);
					_UIObjectState.singleton.insert(column);
					changed = true;
				}
			}

			return changed;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param columnSpec
		 * @returns {*}
		 * @private
		 */
		var _createColumn = function (columnSpec) {
			return xfColumn.createInstance(_.isEmpty(columnSpec) ? '' : columnSpec);
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// PERSISTENCE METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param callback
		 * @private
		 */
		var _saveState = function (callback) {

			var currentState = _UIObjectState.singleton.saveState();

			infRest.request('/savestate', 'POST').withData({

				sessionId: infWorkspace.getSessionId(),
				data: (currentState) ? JSON.stringify(currentState) : ''

			}).then(function (response) {

				if (callback != null) {
					callback(response.persistenceState);
				}

			});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @returns {{width: number, height: number}}
		 * @private
		 */
		var _getCaptureDimensions = function () {
			var viewDiv = _UIObjectState.canvas.find('#workspace');
			var width = viewDiv[0].scrollWidth;
			var height = viewDiv[0].scrollHeight;

			return {
				width: width,
				height: height
			};
		};




		//--------------------------------------------------------------------------------------------------------------
		//
		// VIEW REGISTRATION METHODS
		//
		//--------------------------------------------------------------------------------------------------------------




		/**
		 *
		 * @param sandbox
		 * @private
		 */
		var _registerView = function (sandbox) {
			infView.registerView({
				title: VIEW_NAME,
				label: VIEW_LABEL,
				icon: ICON_CLASS,
				headerSpec: [infHeader.FLOW_VIEW],
				getCaptureDimensions: _getCaptureDimensions,
				saveState: _saveState
			}, sandbox);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onViewRegistered = function(eventChannel, data) {
			if (data.name === VIEW_NAME) {
				_UIObjectState.canvas = data.canvas;
			}
		};


		/**
		 *
		 * @param sandbox
		 * @private
		 */
		var _init = function(sandbox) {
			// Add the view toolbar
			var viewToolbarContainer = $('<div/>').appendTo(_UIObjectState.canvas);

			var widgets = [ infToolbar.DATE_PICKER() ];

			// Add pattern search button if pattern search is supported
			if (aperture.config.get()['influent.config']['usePatternSearchInFlowView']) {
				widgets.push(infToolbar.PATTERN_SEARCH());
			}

			_UIObjectState.viewToolbar = infToolbar.createInstance(
				VIEW_NAME,
				viewToolbarContainer,
				{
					widgets: widgets
				}
			);

			_UIObjectState.canvas.append(flowViewTemplate());

			var workspaceDiv = $('#workspace');
			workspaceDiv.click(function(event) {
				// deselect?
				if (xfUtil.isWorkspaceWhitespace(event.target)) {
					aperture.pubsub.publish(
						appChannel.SELECTION_CHANGE_REQUEST,
						{
							xfId: null,
							selected : true,
							noRender: false
						}
					);
				}
			}).scroll(function(event) {
				aperture.pubsub.publish(appChannel.SCROLL_VIEW_EVENT, {
					div : event.target
				});
			});

			_initWorkspaceState();

			aperture.pubsub.publish(appChannel.START_FLOW_VIEW, {});
			aperture.pubsub.publish(appChannel.VIEW_INITIALIZED, {name: VIEW_NAME});
		};

		//--------------------------------------------------------------------------------------------------------------

		modules.register('inf' + VIEW_NAME + 'View', function (sandbox) {
			return {
				start: function () {
					var subTokens = {};
					subTokens[appChannel.ALL_MODULES_STARTED] = aperture.pubsub.subscribe(appChannel.ALL_MODULES_STARTED, function() { _init(sandbox); });
					subTokens[appChannel.VIEW_REGISTERED] = aperture.pubsub.subscribe(appChannel.VIEW_REGISTERED, _onViewRegistered);

					subTokens[appChannel.ADD_FILES_TO_WORKSPACE_REQUEST] = aperture.pubsub.subscribe(appChannel.ADD_FILES_TO_WORKSPACE_REQUEST, _pubsubHandler);
					subTokens[appChannel.SEARCH_ON_CARD] = aperture.pubsub.subscribe(appChannel.SEARCH_ON_CARD, _pubsubHandler);

					// expand and collapse events
					subTokens[appChannel.EXPAND_EVENT] = aperture.pubsub.subscribe(appChannel.EXPAND_EVENT, _pubsubHandler);
					subTokens[appChannel.COLLAPSE_EVENT] = aperture.pubsub.subscribe(appChannel.COLLAPSE_EVENT, _pubsubHandler);

					// branching events
					subTokens[appChannel.BRANCH_REQUEST] = aperture.pubsub.subscribe(appChannel.BRANCH_REQUEST, _pubsubHandler);
					subTokens[appChannel.BRANCH_RESULTS_RETURNED_EVENT] = aperture.pubsub.subscribe(appChannel.BRANCH_RESULTS_RETURNED_EVENT, _pubsubHandler);

					// hover events
					subTokens[appChannel.HOVER_START_EVENT] = aperture.pubsub.subscribe(appChannel.HOVER_START_EVENT, _pubsubHandler);
					subTokens[appChannel.HOVER_END_EVENT] = aperture.pubsub.subscribe(appChannel.HOVER_END_EVENT, _pubsubHandler);
					subTokens[appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.UI_OBJECT_HOVER_CHANGE_REQUEST, _pubsubHandler);

					// tooltip events
					subTokens[appChannel.TOOLTIP_START_EVENT] = aperture.pubsub.subscribe(appChannel.TOOLTIP_START_EVENT, _pubsubHandler);
					subTokens[appChannel.TOOLTIP_END_EVENT] = aperture.pubsub.subscribe(appChannel.TOOLTIP_END_EVENT, _pubsubHandler);

					// pattern search events
					subTokens[flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS] = aperture.pubsub.subscribe(flowChannel.HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS, _pubsubHandler);
					subTokens[flowChannel.PATTERN_SEARCH_REQUEST] = aperture.pubsub.subscribe(flowChannel.PATTERN_SEARCH_REQUEST, _pubsubHandler);
					subTokens[flowChannel.SEARCH_RESULTS_RETURNED_EVENT] = aperture.pubsub.subscribe(flowChannel.SEARCH_RESULTS_RETURNED_EVENT, _pubsubHandler);
					subTokens[flowChannel.PREV_SEARCH_PAGE_REQUEST] = aperture.pubsub.subscribe(flowChannel.PREV_SEARCH_PAGE_REQUEST, _pubsubHandler);
					subTokens[flowChannel.NEXT_SEARCH_PAGE_REQUEST] = aperture.pubsub.subscribe(flowChannel.NEXT_SEARCH_PAGE_REQUEST, _pubsubHandler);
					subTokens[flowChannel.SET_SEARCH_PAGE_REQUEST] = aperture.pubsub.subscribe(flowChannel.SET_SEARCH_PAGE_REQUEST, _pubsubHandler);

					// focus events
					subTokens[appChannel.FOCUS_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.FOCUS_CHANGE_REQUEST, _pubsubHandler);
					subTokens[appChannel.FOCUS_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FOCUS_CHANGE_EVENT, _pubsubHandler);

					// selection events
					subTokens[appChannel.SELECTION_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.SELECTION_CHANGE_REQUEST, _pubsubHandler);
					subTokens[appChannel.UPDATE_DETAILS_PROMPT_STATE] = aperture.pubsub.subscribe(appChannel.UPDATE_DETAILS_PROMPT_STATE, _pubsubHandler);

					// file events
					subTokens[appChannel.CREATE_FILE_REQUEST] = aperture.pubsub.subscribe(appChannel.CREATE_FILE_REQUEST, _pubsubHandler);
					subTokens[appChannel.ADD_TO_FILE_REQUEST] = aperture.pubsub.subscribe(appChannel.ADD_TO_FILE_REQUEST, _pubsubHandler);
					subTokens[appChannel.DROP_EVENT] = aperture.pubsub.subscribe(appChannel.DROP_EVENT, _pubsubHandler);
					subTokens[appChannel.CHANGE_FILE_TITLE] = aperture.pubsub.subscribe(appChannel.CHANGE_FILE_TITLE, _pubsubHandler);

					// object removal events
					subTokens[appChannel.REMOVE_REQUEST] = aperture.pubsub.subscribe(appChannel.REMOVE_REQUEST, _pubsubHandler);

					// inter-module communication events
					subTokens[appChannel.REQUEST_CURRENT_STATE] = aperture.pubsub.subscribe(appChannel.REQUEST_CURRENT_STATE, _pubsubHandler);
					subTokens[appChannel.REQUEST_ENTITY_DETAILS_INFORMATION] = aperture.pubsub.subscribe(appChannel.REQUEST_ENTITY_DETAILS_INFORMATION, _pubsubHandler);

					// date range events
					subTokens[appChannel.FILTER_DATE_PICKER_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT, _pubsubHandler);

					// card details events
					subTokens[appChannel.CARD_DETAILS_CHANGE] = aperture.pubsub.subscribe(appChannel.CARD_DETAILS_CHANGE, _pubsubHandler);
					subTokens[appChannel.UPDATE_CHART_REQUEST] = aperture.pubsub.subscribe(appChannel.UPDATE_CHART_REQUEST, _pubsubHandler);

					// workspace management events
					subTokens[appChannel.NEW_WORKSPACE_REQUEST] = aperture.pubsub.subscribe(appChannel.NEW_WORKSPACE_REQUEST, _pubsubHandler);
					subTokens[appChannel.CLEAN_WORKSPACE_REQUEST] = aperture.pubsub.subscribe(appChannel.CLEAN_WORKSPACE_REQUEST, _pubsubHandler);
					subTokens[appChannel.CLEAN_COLUMN_REQUEST] = aperture.pubsub.subscribe(appChannel.CLEAN_COLUMN_REQUEST, _pubsubHandler);
					subTokens[appChannel.SORT_COLUMN_REQUEST] = aperture.pubsub.subscribe(appChannel.SORT_COLUMN_REQUEST, _pubsubHandler);
					subTokens[appChannel.SCROLL_VIEW_EVENT] = aperture.pubsub.subscribe(appChannel.SCROLL_VIEW_EVENT, _pubsubHandler);
					subTokens[appChannel.FOOTER_CHANGE_DATA_VIEW_EVENT] = aperture.pubsub.subscribe(appChannel.FOOTER_CHANGE_DATA_VIEW_EVENT, _pubsubHandler);
					subTokens[appChannel.SWITCH_VIEW] = aperture.pubsub.subscribe(appChannel.SWITCH_VIEW, _pubsubHandler);

					// transaction table events
					subTokens[appChannel.TRANSACTIONS_FILTER_EVENT] = aperture.pubsub.subscribe(appChannel.TRANSACTIONS_FILTER_EVENT, _pubsubHandler);
					subTokens[appChannel.TRANSACTIONS_PAGE_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.TRANSACTIONS_PAGE_CHANGE_EVENT, _pubsubHandler);

					// import and export graph events
					subTokens[appChannel.EXPORT_GRAPH_REQUEST] = aperture.pubsub.subscribe(appChannel.EXPORT_GRAPH_REQUEST, _pubsubHandler);
					subTokens[appChannel.IMPORT_GRAPH_REQUEST] = aperture.pubsub.subscribe(appChannel.IMPORT_GRAPH_REQUEST, _pubsubHandler);

					_UIObjectState.subscriberTokens = subTokens;

					_registerView(sandbox);
				},
				end: function () {
					// unsubscribe to all channels
					for (var token in _UIObjectState.subscriberTokens) {
						if (_UIObjectState.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_UIObjectState.subscriberTokens[token]);
						}
					}

					_UIObjectState.subscriberTokens = {};
				}
			};
		});

		//--------------------------------------------------------------------------------------------------------------

		if (constants.UNIT_TESTS_ENABLED) {
			return {
				name: function () {
					return VIEW_NAME;
				},
				icon: function () {
					return ICON_CLASS;
				},
				_UIObjectState: function() { return _UIObjectState; },
				_init: _init,
				_createWorkspace: _createWorkspace,
				_modifyContext: _modifyContext,
				_getMinMaxColumnIndex: _getMinMaxColumnIndex,
				_getColumnByIndex: _getColumnByIndex,
				_onAddFilesToWorkspace: _onAddFilesToWorkspace,
				_removeObject: _removeObject,
				_onBranchRequest: _onBranchRequest,
				_onExpandEvent: _onExpandEvent,
				_onCollapseEvent: _onCollapseEvent,
				_onAddCardToContainer: _onAddCardToContainer,
				_onCreateFileRequest: _onCreateFileRequest,
				_onCleanColumnRequest: _onCleanColumnRequest,
				_pubsubHandler: _pubsubHandler,
				_onSelectionChangeRequest: _onSelectionChangeRequest,
				_onFocusChangeRequest: _onFocusChangeRequest,
				_onNewWorkspace: _onNewWorkspace,
				_onCleanWorkspaceRequest: _onCleanWorkspaceRequest,
				_onPatternSearchRequest: _onPatternSearchRequest,
				_onHighlightPatternSearchArguments: _onHighlightPatternSearchArguments,
				_getLayoutUpdateRequestMsg: _getLayoutUpdateRequestMsg,
				debugCleanState: function() {
					_UIObjectState = {
						canvas: null,
						subscriberTokens: {},
						viewToolbar: null,
						moduleManager: null,
						focus: null,
						showDetails: true,
						footerDisplay: 'none',
						dates: {startDate: '', endDate: '', numBuckets: 0, duration: ''},
						singleton: undefined,
						selectedUIObject: null,
						graphSearchActive: null,
						isInFlowView: false,
						scrollStates: []
					};
				},
				debugSetState: function(key, value) {
					_UIObjectState[key] = value;
				}
			};
		} else {
			return {
				name: function () {
					return VIEW_NAME;
				},
				icon: function () {
					return ICON_CLASS;
				}
			};
		}
	}
);

