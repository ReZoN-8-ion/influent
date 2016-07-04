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
		'lib/communication/accountsViewChannels',
		'lib/communication/applicationChannels',
		'lib/constants',
		'lib/models/xfAccountsSearchResult',
		'lib/module',
		'lib/plugins',
		'lib/viewPlugins',
		'lib/toolbar/infToolbar',
		'lib/ui/infOperationsBar',
		'lib/util/infTagUtilities',
		'lib/util/infDescriptorUtilities',
		'lib/util/xfUtil',
		'modules/infWorkspace',
		'views/accounts-view-components/accountsResultClusterComponent',
		'views/accounts-view-components/accountsResultComponent',
		'views/accounts-view-components/accountsResultFooterComponent',
		'views/accounts-view-components/accountsResultHeaderComponent',
		'views/components/resultSingleComponent',
		'views/components/resultSummaryComponent',
		'modules/infRest',
		'lib/ui/xfModalDialog',
		'views/infView',
		'modules/infHeader',
		'lib/advanced-search/infSearchParams',
		'hbs!templates/accountsView/accountsView',
		'hbs!templates/searchResults/expandedSearchResults',
		'hbs!templates/loading',
		'hbs!templates/accountsView/emptyHint'
	],
	function(
		accountsChannel,
		appChannel,
		constants,
		xfSearchResult,
		modules,
		plugins,
		viewPlugins,
		infToolbar,
		operationsBar,
		tagUtil,
		descriptorUtil,
		xfUtil,
		infWorkspace,
		resultClusterComponent,
		resultComponent,
		resultFooterComponent,
		resultHeaderComponent,
		resultSingleComponent,
		resultSummaryComponent,
		infRest,
		xfModalDialog,
		infView,
		infHeader,
		infSearchParams,
		accountsViewTemplate,
		expandedSearchResultsTemplate,
		loadingTemplate,
		emptyHintTemplate
	) {

		var config = aperture.config.get()['influent.config'];

		var SEARCH_RESULTS_PER_PAGE = config.searchResultsPerPage;
		
		var VIEW_NAME = constants.VIEWS.ACCOUNTS.NAME;
		var VIEW_LABEL = constants.VIEWS.ACCOUNTS.LABEL || VIEW_NAME;
		var ICON_CLASS = constants.VIEWS.ACCOUNTS.ICON;

//		var TEXT_PROPERTY_CHARACTER_COUNT_LIMIT = config.simpleViewCharacterCountLimit || 1000;

		var MAX_SEARCH_RESULTS = config.maxSearchResults;
		
		var _UIObjectState = {
			canvas : null,
			subscriberTokens: {},
			operationsBar : null,
			transStartDate : null,
			transEndDate : null,
			searchParams : null,
			currentSearchString : null,
			currentSearchResult : null
		};

		//--------------------------------------------------------------------------------------------------------------
		// Display results functions
		//--------------------------------------------------------------------------------------------------------------

		/**
		 * handles the responses from  '/search' rest call. This method cleans and disposes the previous search results
		 * and then populates the _UIObjectState with result models that have been created from the returned specs.
		 *
		 * @param   response
		 * @param   restInfo
		 * @private
		 */
		var _handleSearchResults = function(response, restInfo) {

			if (!restInfo.success) {
				aperture.log.warn('Search request was unsuccessful.');
				return;
			}

			if (response.sessionId !== infWorkspace.getSessionId()) {
				aperture.log.warn('Client and server session ID\'s differ. Unable to process search.');
				return;
			}

			_UIObjectState.currentSearchResult = xfSearchResult.createInstance(response, _UIObjectState.searchParams);
			_UIObjectState.currentSearchResult.showMoreResults(SEARCH_RESULTS_PER_PAGE);

			_drawResultList(true);
		};

		//--------------------------------------------------------------------------------------------------------------
		var _getVisualResultData = function(result, dedupDetails) {
			var headerInfo = _UIObjectState.currentSearchResult.getHeaderInformation();
			var info = result.getVisualInfo(headerInfo, dedupDetails);
			
			return {
				properties: xfUtil.propertyMapToDisplayOrderArray(info.properties),
				terms: _UIObjectState.searchParams ? _UIObjectState.searchParams.getMatchingTerms(_UIObjectState.currentSearchString, info) : []
			};
		};
		//--------------------------------------------------------------------------------------------------------------
		var _getSnippetMatches = function(result) {
			var data = _getVisualResultData(result, true);

			return tagUtil.getPropertyTermMatches(data.properties, data.terms, {plainText: true});
		};
		//--------------------------------------------------------------------------------------------------------------
		var _getFullDetailMatches = function(result) {
			var data = _getVisualResultData(result, false);
			
			return tagUtil.getPropertyTermMatches(data.properties, data.terms);
		};
		
		//--------------------------------------------------------------------------------------------------------------
		
		/**
		 *
		 * @param reset
		 * @private
		 */
		var _drawResultList = function(reset) {
			var $resultsHeaderContainer = _UIObjectState.canvas.find('#infAccountSearchResultsHeader');
			var $resultsContainer = _UIObjectState.canvas.find('#infAccountSearchResults');
			if (reset) {
				resultHeaderComponent.setSearchResultsHeader(
					_UIObjectState.currentSearchResult.getXfId(),
					$resultsHeaderContainer,
					$resultsContainer,
					_UIObjectState.currentSearchResult.getHeaderInformation(),
					_UIObjectState.currentSearchResult.getSummaryInformation().sumTotal,
					_UIObjectState.currentSearchString
				);
			}

			var $resultsSummaryContainer = _UIObjectState.canvas.find('#infSearchResultSummary');
			resultSummaryComponent.setSearchSummaryStats(
				$resultsSummaryContainer,
				_UIObjectState.currentSearchResult.getSummaryInformation()
			);

			if (reset) {
				$resultsContainer.empty();
			}

			var results = _UIObjectState.currentSearchResult.getChildren();
			for (var i = 0; i < results.length; i++) {
				var childResult = results[i];
				var $resultContainer;
				if (childResult.getUIType() === constants.MODULE_NAMES.ENTITY_RESULT_CLUSTER &&
					childResult.numVisible() > 0
				) {
					var clusterContainer = $resultsContainer.find('#' + childResult.getXfId());
					if (clusterContainer.length === 0) {
						clusterContainer = resultClusterComponent.addSearchResultCluster(
							childResult.getXfId(),
							$resultsContainer,
							{
								clusterLabel: childResult.getClusterLabel()
							}
						);
					}

					$resultContainer = clusterContainer.find('#infSearchResultTable');

					var clusterChildren = childResult.getChildren();
					for (var j = 0; j < clusterChildren.length; j++) {
						var clusterChildResult = clusterChildren[j];
						if (clusterChildResult.isVisible()) {
							if ($resultContainer.find('#summary_' + clusterChildResult.getXfId()).length === 0) {

								// if the cluster is collapsed, the expand it
								_expandCluster(clusterContainer);

								resultComponent.addSearchResult(
									clusterChildResult.getXfId(),
									$resultContainer,
									_UIObjectState.currentSearchResult.getHeaderInformation(),
									clusterChildResult,
									_getSnippetMatches(clusterChildResult)
								);
							}
						}
					}
				} else if (
					childResult.getUIType() === constants.MODULE_NAMES.ENTITY_RESULT &&
					childResult.numVisible() > 0
				) {
					$resultContainer = $resultsContainer.find('#' + childResult.getXfId());
					if ($resultContainer.length === 0) {
						$resultContainer = resultSingleComponent.addSearchResultSingle(
							childResult.getXfId(),
							$resultsContainer
						);
					}

					var $tableContainer = $resultContainer.find('#infSearchResultTable');
					if ($resultContainer.find('#summary_' + childResult.getXfId()).length === 0) {
						resultComponent.addSearchResult(
							childResult.getXfId(),
							$tableContainer,
							_UIObjectState.currentSearchResult.getHeaderInformation(),
							childResult,
							_getSnippetMatches(childResult)
						);

						$resultsContainer.append($resultContainer);
					}
				}
			}

			var $resultsFooterContainer = _UIObjectState.canvas.find('#infAccountSearchResultsFooter');
			if ($resultsFooterContainer != null) {
				resultFooterComponent.setFooter(
					$resultsFooterContainer,
						_UIObjectState.currentSearchResult.getNumResults() > _UIObjectState.currentSearchResult.getVisibleResults()
				);
			}

			if (reset) {
				_createOperationsBar();
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _expandCluster = function(clusterContainer) {
			var cluster = clusterContainer.find('.batchResults');
			if (!$(cluster).hasClass('in')) {
				$(cluster).addClass('in');
				var icon = clusterContainer.find('.infResultClusterAccordionButtonIcon');
				icon.removeClass('glyphicon-chevron-down');
				icon.addClass('glyphicon-chevron-up');
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _hideFullDetails = function(container) {
			container.find('.simpleSearchResultText').css('display','block');
			container.find('.detailedSearchResultText').css('display','none');
			var icon = container.find('#infSearchResultDetailsToggle');
			icon.removeClass('fa-caret-down');
			icon.addClass('fa-caret-right');
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param result
		 * @param graphDivId
		 * @param appendDiv
		 * @private
		 */
		var _generateTextTableElement = function(result, graphDivId, appendDiv) {
			var props = _getFullDetailMatches(result);
			var context = {};
			var tester = $('<p></p>');

			var extensions = plugins.get('details');
			var clickPlugin = aperture.util.find(extensions, function(e) {
				return e.propertyClick !== undefined;
			});
			var hoverPlugin = aperture.util.find(extensions, function(e) {
				return e.propertyHover !== undefined;
			});

			if (props) {
				context.results = [];
				props.forEach(function(prop) {
					var title = prop.friendlyText + ': ';
					var text = (prop.isHTML? tester.html(prop.value).text() : String(prop.value)).trim();
					var doBreak = false;
					
					var longValue = null;
					if (text != null && text.length !== 0) {
						var spaceCount = text.split(' ').length;
						var spaceCharRatio = spaceCount === 0 ? Number.POSITIVE_INFINITY : text.length / spaceCount;
						if (spaceCharRatio > 20) {
							doBreak = true;
						}

						// DJ: Fix. This ignores the fact that some values contain html. Use ellipsis helper instead.
						// If the word count > threshold, abbreviate it and create a link that will pop open
						// a dialog with the full text of the property.
//						if ( text.toString().length > TEXT_PROPERTY_CHARACTER_COUNT_LIMIT) {
//							longValue = value;
//							value = value.substring(0,TEXT_PROPERTY_CHARACTER_COUNT_LIMIT-12) + '... ';
//							var more = $('<div/>').append($('<span/>').html('[more]').addClass('moreLink')).html();
//							value = value + more;
//						}
					}

					var hasPlugin = false;
					var onClick = null;
					var onHover = null;
					if (clickPlugin) {
						onClick = clickPlugin.propertyClick(prop);
						if (onClick) {
							hasPlugin = true;
						}
					}
					if (hoverPlugin) {
						onHover = hoverPlugin.propertyHover(prop);
					}

					var value = prop.isHTML? prop.value : tester.text(prop.value).html();
							
					context.results.push({
						title: title,
						value: value,
						longValue: longValue,
						doBreak: doBreak,
						hasPlugin: hasPlugin,
						onClick: onClick,
						onHover: onHover
					});
				});
				if (_UIObjectState.transStartDate && _UIObjectState.transEndDate) {
					context.graphDivId = graphDivId;
				}
			}
			appendDiv.append(expandedSearchResultsTemplate(context));

			var propRows = appendDiv.find('.infSearchResultProperty');
			for (var i = 0; i < context.results.length; i++) {
				var contextResult = context.results[i];
				if (contextResult.hasPlugin) {
					var propInfo = $(propRows[i]).find('.infSearchResultPropertyInfo');
					if (contextResult.onClick) {
						propInfo.click(contextResult.onClick);
					}
					if (contextResult.onHover) {
						if (contextResult.onHover.fnIn) {
							propInfo.mouseover(contextResult.onHover.fnIn);
						}

						if (contextResult.onHover.fnOut) {
							propInfo.mouseout(contextResult.onHover.fnOut);
						}
					}
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _addTransactionGraph = function(result, xfId) {
			if (_UIObjectState.transStartDate && _UIObjectState.transEndDate) {
				var currentState = {
					canvasId: 'result_graph_' + xfId,
					selectedEntity: result.getSelectedEntityData(),
					focusData: null,
					dates: {
						startDate: _UIObjectState.transStartDate,
						endDate: _UIObjectState.transEndDate
					}
				};
				aperture.pubsub.publish(
					appChannel.SHOW_GRAPH,
					currentState
				);
			}
		};

		/**
		 *
		 * @param channel
		 * @param data
		 * @private
		 */
		var _onClearView = function(eventChannel, data) {

			if (eventChannel !== appChannel.CLEAR_VIEW) {
				aperture.log.error('_onClearView: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.title == null
			) {
				aperture.log.error('_onClearView: function called with invalid data');
				return false;
			}

			if (data.title !== VIEW_NAME) {
				aperture.log.info('_onClearView: view title is not ' + VIEW_NAME);
				return false;
			}

			_clear();
			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @private
		 */
		var _clear = function() {

			aperture.pubsub.publish(appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST, {
				view: VIEW_NAME,
				input: ''
			});

			if (_UIObjectState.currentSearchResult != null) {
				_UIObjectState.currentSearchResult.dispose();
				_UIObjectState.currentSearchResult = null;
			}

			var $headerContainer = _UIObjectState.canvas.find('#infAccountSearchResultsHeader');
			$headerContainer.empty();
			var $resultsContainer = _UIObjectState.canvas.find('#infAccountSearchResults');
			$resultsContainer.empty();
			var $footerContainer = _UIObjectState.canvas.find('#infAccountSearchResultsFooter');
			$footerContainer.empty();
		};

		//--------------------------------------------------------------------------------------------------------------
		// Rest Calls
		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param searchString
		 * @private
		 */
		var _search = function(searchString) {
			_clear();

			var $resultsContainer = _UIObjectState.canvas.find('#infAccountSearchResults');
			var loading = $(loadingTemplate({large: true})).appendTo($resultsContainer);

			aperture.io.rest(
				'/search',
				'POST',
				function(response, restInfo) {
					loading.remove();
					_handleSearchResults(response, restInfo);
				},
				{
					postData : {
						sessionId : infWorkspace.getSessionId(),
						query : searchString,
						limit : MAX_SEARCH_RESULTS
					},
					contentType: 'application/json'
				}
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param term
		 * @private
		 */
		var _executeSearch = function(term) {
			aperture.pubsub.publish(appChannel.SELECT_VIEW, {
				title: VIEW_NAME,
				queryParams : {
					query : term
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------
		// View change functions
		//--------------------------------------------------------------------------------------------------------------

		/**
		 * @param dataIds
		 * @private
		 */
		var _getDescriptorsForPluginView = function(selectedSpecs) {
			var dataIds = [];

			for (var i = 0; i < selectedSpecs.length; i++) {
				dataIds.push({
					dataId : selectedSpecs[i].dataId,
					type : selectedSpecs[i].type
				});
			}

			var descriptors = descriptorUtil.getIdDescriptors(dataIds, _UIObjectState.searchParams, 'ENTITY');
			return descriptors;
		};

		/**
		 *
		 * @param dataIds
		 * @private
		 */
		var _onTransactionsView = function(dataIds) {
			var term = '';

			var insertIds = function(argument) {
				if (term.length > 0) {
					term += ' ';
				}

				term += argument + ':"';
				$.each(dataIds, function(index, value) {
					term += value;
					if (index < dataIds.length - 1) {
						term += ',';
					}
				});
				term += '"';
			};

			if (dataIds.length > 0) {
				insertIds('ENTITY');
			}

			aperture.pubsub.publish(appChannel.SELECT_VIEW, {
				title: constants.VIEWS.TRANSACTIONS.NAME,
				queryParams:{
					query: term
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param dataIds
		 * @private
		 */
		var _onFlowView = function(dataIds) {


			aperture.pubsub.publish(appChannel.ADD_FILES_TO_WORKSPACE_REQUEST, {
				contexts : [ { files : [ { entityIds: dataIds } ] } ],
				fromView: constants.VIEWS.ACCOUNTS.NAME
			});

			aperture.pubsub.publish(appChannel.SELECT_VIEW, {
				title: constants.VIEWS.FLOW.NAME
			});
		};

		/**
		 *
		 * @param searchString
		 * @private
		 */
		var _onExport = function() {
			if (!_UIObjectState.currentSearchString || _UIObjectState.currentSearchString === '') {
				xfModalDialog.createInstance({
					title : 'Warning',
					contents : 'No accounts to export',
					buttons : {
						'Ok' : function() {}
					}
				});
				return;
			}

			$.blockUI({
				theme: true,
				title: 'Export In Progress',
				message: '<img src="' + constants.AJAX_SPINNER_FILE + '" style="display:block;margin-left:auto;margin-right:auto"/>'
			});
			var beforeUnloadEvents = $._data($(window).get(0), 'events').beforeunload;
			var handlers = [];
			if (beforeUnloadEvents !== undefined) {
				beforeUnloadEvents.forEach(function (event) {
					handlers.push(event.handler);
				});
			}

			//TODO do we need this befreunload??
			$(window).unbind('beforeunload');

			infRest.request('/exportentities').withData({
				sessionId : infWorkspace.getSessionId(),
				query : _UIObjectState.currentSearchString
			}).then(function (response) {

				var a = document.createElement('a');
				a.href = aperture.store.url(response, 'pop', _UIObjectState.currentSearchString + '.csv');

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
						handlers.forEach(function (handler) {
							$(window).bind('beforeunload', handler);
						});
					},
					0
				);
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onShowAdvancedSearchDialog = function(specs) {
			aperture.pubsub.publish(appChannel.ADVANCED_SEARCH_REQUEST, {
				view: constants.VIEWS.ACCOUNTS.NAME,
				specs : specs
			});
		};

		//--------------------------------------------------------------------------------------------------------------
		// Pubsub functions
		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSearchFilterChanged = function(eventChannel,data) {
			if (eventChannel !== appChannel.FILTER_SEARCH_CHANGE_EVENT || data.view !== VIEW_NAME) {
				return;
			}
			_executeSearch(data.input);
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param container
		 * @private
		 */
		var _createOperationsBar = function() {

			var $operationsBarContainer = _UIObjectState.canvas.find('.infSearchResultToolbar');
			_UIObjectState.operationsBar = operationsBar.create($operationsBarContainer);

			var buttonSpecList = [
				{
					icon : ICON_CLASS,
//					annotationIcon : 'glyphicon glyphicon-search',
					title : 'Show advanced search dialog for selected accounts',
					requiresSelection: true,
					callback : function() {
						_onShowAdvancedSearchDialog(_UIObjectState.currentSearchResult.getSelectedSpecs());
					}
				},
				{
					icon : constants.VIEWS.TRANSACTIONS.ICON,
//					annotationIcon : 'glyphicon glyphicon-search',
					switchesTo : constants.VIEWS.TRANSACTIONS.NAME,
					title : 'View transactions for selected accounts',
					requiresSelection: true,
					callback : function() {
						_onTransactionsView(_UIObjectState.currentSearchResult.getSelectedDataIds());
					}
				},
				{
					icon : constants.VIEWS.FLOW.ICON,
//					annotationIcon : 'glyphicon glyphicon-plus',
					switchesTo : constants.VIEWS.FLOW.NAME,
					title : 'View selected accounts in Flow View',
					requiresSelection: true,
					callback : function() {
						_onFlowView(_UIObjectState.currentSearchResult.getSelectedDataIds());
					}
				}
			];

			Array.prototype.push.apply(buttonSpecList, viewPlugins.getOpsBarButtonSpecForView({entities: true}, function () {
				return _getDescriptorsForPluginView(_UIObjectState.currentSearchResult.getSelectedSpecs());
			}));

			var extensions = plugins.get('search');
			var plugin = aperture.util.find(extensions, function(e) {
				return e.toolbar !== undefined;
			});

			if (plugin) {
				var buttonSpec = plugin.toolbar();
				buttonSpec.callback = function() {
					var selectedIds = _UIObjectState.currentSearchResult.getSelectedDataIds();
					for (var i = 0; i < selectedIds.length; i++) {
						buttonSpec.callbackFunction(selectedIds[i]);
					}
				};

				buttonSpecList.push(buttonSpec);
			}

			_UIObjectState.operationsBar.buttons(buttonSpecList);

			$operationsBarContainer.append(_UIObjectState.operationsBar.getElement());
		};

		//--------------------------------------------------------------------------------------------------------------

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

			if (data.title !== VIEW_NAME) {
				return false;
			}

			if (!data.all.query) {
				return false;
			}

			if (data.all.query !== _UIObjectState.currentSearchString) {

				_UIObjectState.currentSearchString = data.all.query;

				_search(_UIObjectState.currentSearchString);

				aperture.pubsub.publish(appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST, {
					view: VIEW_NAME,
					input: _UIObjectState.currentSearchString
				});

				return true;
			}

			return false;
		};

		var _onSearchParams = function(searchParams) {

			var resultDiv = _UIObjectState.canvas.find('#infAccountSearchResults');

			var context = {
				appHint : searchParams.searchHint ? searchParams.searchHint : false
			};
			resultDiv.append(emptyHintTemplate(context));
		};

		//--------------------------------------------------------------------------------------------------------------

		var createToolbar = function(onComplete) {
			aperture.io.rest(
				'/searchparams',
				'POST',
				function(response, restInfo) {
					if (restInfo.status === 'success') {
						_UIObjectState.searchParams = infSearchParams.create(response);
						aperture.pubsub.publish(appChannel.SEARCH_PARAMS_EVENT, {
							paramsType : 'entities',
							searchParams : _UIObjectState.searchParams
						});
						var viewToolbarContainer = $('<div/>').appendTo(_UIObjectState.canvas);
						_UIObjectState.viewToolbar = infToolbar.createInstance(
							VIEW_NAME,
							viewToolbarContainer,
							{
								widgets: [
									infToolbar.SEARCH(_UIObjectState.searchParams)
								]
							}
						);
						_onSearchParams(response);
					}
					onComplete();
				},
				{
					postData : {},
					contentType: 'application/json'
				}
			);

		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param sandbox
		 * @private
		 */
		var _init = function(sandbox) {

			var ws = _UIObjectState.canvas;

			var accountsViewElement = $('<div/>').html(accountsViewTemplate());

			ws.append(accountsViewElement);

			// Add the view toolbar
			createToolbar(function() {
				aperture.pubsub.publish(appChannel.VIEW_INITIALIZED, {name:VIEW_NAME});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @returns {{width: number, height: number}}
		 * @private
		 */
		var _getCaptureDimensions = function() {
			var viewDiv = _UIObjectState.canvas.find('.simpleViewContentsContainer');
			var width = viewDiv[0].scrollWidth;
			var height = viewDiv[0].scrollHeight;

			return {
				width : width,
				height : height
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param sandbox
		 * @private
		 */
		var _registerView = function(sandbox) {
			infView.registerView({
				title:VIEW_NAME,
				label:VIEW_LABEL,
				icon:ICON_CLASS,
				headerSpec: [infHeader.ACCOUNTS_VIEW],
				getCaptureDimensions : _getCaptureDimensions,
				saveState : function(callback){ callback(true); },
				queryParams : function() { return {query: _UIObjectState.currentSearchString}; }
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

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onDatasetStats = function(eventChannel, data) {

			if (eventChannel !== appChannel.DATASET_STATS
			) {
				aperture.log.error('_onDatasetStats: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.startDate == null ||
				data.endDate == null
			) {
				aperture.log.error('_onDatasetStats: function called with invalid data');
				return false;
			}

			var date = new Date(data.startDate);
			_UIObjectState.transStartDate = date.toISOString();
			date = new Date(data.endDate);
			_UIObjectState.transEndDate = date.toISOString();

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @private
		 */
		var _onVisibilityChange = function(eventChannel) {

			if (eventChannel !== accountsChannel.RESULT_VISIBILITY_CHANGE) {
				aperture.log.error('_onVisibilityChange: function called with illegal event channel');
				return false;
			}

			_UIObjectState.currentSearchResult.showMoreResults(SEARCH_RESULTS_PER_PAGE);

			_drawResultList(false);

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSelectionChange = function(eventChannel, data) {

			if (eventChannel !== accountsChannel.RESULT_SELECTION_CHANGE) {
				aperture.log.error('_onSelectionChange: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.xfId == null ||
				data.isSelected == null
			) {
				aperture.log.error('_onSelectionChange: function called with invalid data');
				return false;
			}

			_UIObjectState.currentSearchResult.setSelected(data.xfId, data.isSelected);

			_UIObjectState.operationsBar.enableButtons((_UIObjectState.currentSearchResult.getSelectedDataIds().length > 0));

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSortOrderChange = function(eventChannel, data) {

			if (eventChannel !== accountsChannel.RESULT_SORT_ORDER_CHANGE) {
				aperture.log.error('_onSortOrderChange: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.searchString == null
				) {
				aperture.log.error('_onSortOrderChange: function called with invalid data');
				return false;
			}

			aperture.pubsub.publish(appChannel.FILTER_SEARCH_CHANGE_REQUEST, {
				view : VIEW_NAME,
				input : data.searchString
			});

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getEntityDetails = function(result, callback) {
			aperture.io.rest(
					'/entitydetails',
					'POST',
					function(response, restInfo) {
						callback(response, restInfo);
					},
					{
						postData : {
							sessionId : infWorkspace.getSessionId(),
							entityId : result.getDataId()
						},
						contentType: 'application/json'
					}
				);
		};
		
		//--------------------------------------------------------------------------------------------------------------
		
		/**
		 *
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onToggleDetails = function(eventChannel, data) {

			if (eventChannel !== accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW) {
				aperture.log.error('_onToggleDetails: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.xfId == null ||
				data.container == null
			) {
				aperture.log.error('_onToggleDetails: function called with invalid data');
				return false;
			}

			var icon = data.container.find('#infSearchResultDetailsToggle');
			if (icon.hasClass('fa-caret-right')) {
				_showFullDetails(data);
			} else if (icon.hasClass('fa-caret-down')) {
				_hideFullDetails(data.container);
			} else {
				aperture.log.error('_onToggleDetails: unable to toggle details');
				return false;
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _showFullDetails = function(data) {
			var container = data.container.find('.detailedSearchResultText');

			var displayFullDetails = function() {
				data.container.find('.simpleSearchResultText').css('display','none');
				container.css('display','block');
				var icon = data.container.find('#infSearchResultDetailsToggle');
				icon.removeClass('fa-caret-right');
				icon.addClass('fa-caret-down');
				icon.css('display', '');
			};

			// Generate the details if we haven't already
			if (container.children().length === 0) {
				var result = _UIObjectState.currentSearchResult.getResultByXfId(data.xfId);

				if (result == null) {
					aperture.log.warn('_onEntityDetailsChange: unable to find result with specified id');
					return false;
				}

				if (_UIObjectState.currentSearchResult.getDetailLevel() !== 'FULL') {

					var loading = $(loadingTemplate({height: '32px'})).appendTo(container);

					// disable this until details come back.
					data.container.find('#infSearchResultDetailsToggle').css('display','none');

					_getEntityDetails(result, function(entity, status) {
						loading.remove();

						if (entity) {
							result.expandProperties(entity.properties);

							_generateTextTableElement(result, 'result_graph_' + data.xfId, container);

							_addTransactionGraph(result, data.xfId);
						} else {
							container.html('<p>sorry, failed to retrieve entity details.</p>');
						}
						displayFullDetails();
					});
				} else {
					_generateTextTableElement(result, 'result_graph_' + data.xfId, container);
					_addTransactionGraph(result, data.xfId);

					displayFullDetails();
				}

				return true;
			}

			displayFullDetails();

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onResultClusterVisibilityChange = function(eventChannel, data) {

			if (eventChannel !== accountsChannel.RESULT_CLUSTER_VISIBILITY_CHANGE) {
				aperture.log.error('_onResultClusterVisibilityChange: function called with illegal event channel');
				return false;
			}

			if (data == null ||
				data.xfId == null ||
				data.isExpanded == null
			) {
				aperture.log.error('_onResultClusterVisibilityChange: function called with invalid data');
				return false;
			}

			_UIObjectState.currentSearchResult.setExpanded(data.xfId, data.isExpanded);

			return true;
		};

		//--------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('inf' + VIEW_NAME + 'View', function(sandbox) {
			return {
				start: function() {
					var subTokens = {};
					subTokens[appChannel.ALL_MODULES_STARTED] = aperture.pubsub.subscribe(appChannel.ALL_MODULES_STARTED, function() { _init(sandbox); });
					subTokens[appChannel.CLEAR_VIEW] = aperture.pubsub.subscribe(appChannel.CLEAR_VIEW, _onClearView);
					subTokens[appChannel.DATASET_STATS] = aperture.pubsub.subscribe(appChannel.DATASET_STATS, _onDatasetStats);
					subTokens[appChannel.FILTER_SEARCH_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_SEARCH_CHANGE_EVENT, _onSearchFilterChanged);
					subTokens[appChannel.VIEW_PARAMS_CHANGED] = aperture.pubsub.subscribe(appChannel.VIEW_PARAMS_CHANGED, _onViewParametersChanged);
					subTokens[appChannel.VIEW_REGISTERED] = aperture.pubsub.subscribe(appChannel.VIEW_REGISTERED, _onViewRegistered);
					subTokens[appChannel.EXPORT_ACCOUNTS_REQUEST] = aperture.pubsub.subscribe(appChannel.EXPORT_ACCOUNTS_REQUEST, _onExport);

					subTokens[accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW] = aperture.pubsub.subscribe(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW, _onToggleDetails);
					subTokens[accountsChannel.RESULT_SELECTION_CHANGE] = aperture.pubsub.subscribe(accountsChannel.RESULT_SELECTION_CHANGE, _onSelectionChange);
					subTokens[accountsChannel.RESULT_SORT_ORDER_CHANGE] = aperture.pubsub.subscribe(accountsChannel.RESULT_SORT_ORDER_CHANGE, _onSortOrderChange);
					subTokens[accountsChannel.RESULT_VISIBILITY_CHANGE] = aperture.pubsub.subscribe(accountsChannel.RESULT_VISIBILITY_CHANGE, _onVisibilityChange);
					subTokens[accountsChannel.RESULT_CLUSTER_VISIBILITY_CHANGE] = aperture.pubsub.subscribe(accountsChannel.RESULT_CLUSTER_VISIBILITY_CHANGE, _onResultClusterVisibilityChange);

					_UIObjectState.subscriberTokens = subTokens;

					_registerView(sandbox);
				},
				end : function() {
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

		// UNIT TESTING ------------------------------------------------------------------------------------------------
		if (constants.UNIT_TESTS_ENABLED) {
			return {
				name: function () {
					return VIEW_NAME;
				},
				icon: function () {
					return ICON_CLASS;
				},
				_UIObjectState: function() { return _UIObjectState; },
				_clear: _clear,
				_createOperationsBar: _createOperationsBar,
				_generateTextTableElement: _generateTextTableElement,
				_getCaptureDimensions: _getCaptureDimensions,
				_handleSearchResults: _handleSearchResults,
				_init: _init,
				_onClearView: _onClearView,
				_onDatasetStats: _onDatasetStats,
				_onToggleDetails: _onToggleDetails,
				_onFlowView: _onFlowView,
				_onSelectionChange: _onSelectionChange,
				_onShowAdvancedSearchDialog: _onShowAdvancedSearchDialog,
				_onTransactionsView: _onTransactionsView,
				_onViewParametersChanged: _onViewParametersChanged,
				_onVisibilityChange: _onVisibilityChange,
				_hideFullDetails: _hideFullDetails,
				debugCleanState: function() {
					_UIObjectState = {
						canvas : null,
						subscriberTokens: {},
						operationsBar : null,
						transStartDate : null,
						transEndDate : null,
						searchParams : null,
						currentSearchString : null,
						currentSearchResult : null
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

