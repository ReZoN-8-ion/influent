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
		'lib/plugins',
		'views/infFlowView',
		'lib/viewPlugins',
		'lib/util/infDescriptorUtilities',
		'moment',
		'hbs!templates/footer/footer'
	],
	function(
		infRest,
		modules,
		appChannel,
		constants,
		plugins,
		infFlowView,
		viewPlugins,
		descriptorUtil,
		moment,
		footerTemplate
	) {

		var transactionsConstructor = function(sandbox) {

			var _transactionsState = {
				capture : sandbox.spec.capture,
				subscriberTokens : null,
				userSelectedTab: 'tableTab',
				filterHighlighted: false,
				autoSelecting: false,
				curEntity: null,
				focusEntity: null,
				startDate: null,
				endDate: null,
				buttonSpecList : null,
				searchParams : null,
				linkType : null
			};

			//----------------------------------------------------------------------------------------------------------

			var _onTransactionsView = function() {
				var start = moment(_transactionsState.startDate).utc().format(constants.QUERY_DATE_FORMAT);
				var end = moment(_transactionsState.endDate).utc().format(constants.QUERY_DATE_FORMAT);

				var term = 'DATE:[' + start + ' TO ' + end + '] ENTITY:"' + _transactionsState.curEntity + '" ';
				if (_transactionsState.filterHighlighted &&
					_transactionsState.focusEntity !== _transactionsState.curEntity) {
					term += 'LINKED:"' + _transactionsState.focusEntity +'" ';
				}
				term += 'MATCH:all ORDER:DATE';

				aperture.pubsub.publish(appChannel.SELECT_VIEW, {
					title:require('views/infTransactionsView').name(),
					queryParams:{
						query : term
					}
				});
			};

			//----------------------------------------------------------------------------------------------------------
			var _onFilter = function (channel, data) {
				_transactionsState.startDate = data.startDate;
				_transactionsState.endDate = data.endDate;
			};

			//----------------------------------------------------------------------------------------------------------

			var _onFilterHighlight = function (channel, data) {
				_transactionsState.filterHighlighted = data.filterHighlighted;
			};

			//----------------------------------------------------------------------------------------------------------

			var _onUpdate = function(channel, data) {
				var footerContentDiv = $('#footer-content');
				_transactionsState.curEntity = data && data.dataId;

				if (data) {

					if (aperture.config.get()['influent.config'].promptForDetailsInFooter) {

						// Check if overlay already exists
						footerContentDiv.find('.footer-overlay').remove();

						if (data.promptForDetails) {

							// Add overlay
							var overlay = $('<div></div>');
							overlay.addClass('footer-overlay');
							footerContentDiv.append(overlay);

							// Add prompt
							var prompt = $('<div></div>');
							prompt.addClass('footer-textbox');

							var html = 'Press OK to view details';

							// Override with plugin
							var extensions = plugins.get('details');
							var plugin = aperture.util.find(extensions, function(e) {
								return e.prompt !== undefined;
							});

							if (plugin) {
								html = plugin.prompt({
									dataId: data.dataId,
									type: data.accountType,
									label: data.label,
									numMembers: data.count
								});
							}

							prompt.html(html);

							prompt.append('<br><br>');
							overlay.append(prompt);

							// Add OK Button
							var button = $('<button></button>');
							button.text('OK');
							prompt.append(button);
							button.click({container: footerContentDiv},
								function (e) {

									// Remove overlay
									e.data.container
										.find('.footer-overlay')
										.fadeOut(150, function () {
											this.remove();
										});

									e.stopImmediatePropagation();

									aperture.pubsub.publish(
										appChannel.UPDATE_DETAILS_PROMPT_STATE,
										{
											dataId: data.dataId,
											state: false
										}
									);
									data.promptForDetails = false;
									aperture.pubsub.publish(appChannel.SELECTION_CHANGE_EVENT, data);
								}
							);
						}
					}

					//Show last user selected tab. Disable table tab if we don't have an entity.
					if (data.uiType === constants.MODULE_NAMES.ENTITY) {
						if ($('ul#transaction-tabs li.active').hasClass('chartTab') !== _transactionsState.userSelectedTab) {
							$('#transaction-tabs a[href="#' + _transactionsState.userSelectedTab + '"]').tab('show');
						}
						$('.tableTab').removeClass('disabled');
						$('.detailsButton').show();
					} else {
						if ($('ul#transaction-tabs li.active').hasClass('tableTab')) {
							$('#transaction-tabs a[href="#chartTab"]').tab('show');
						}
						$('.tableTab').addClass('disabled');
						$('.detailsButton').hide();
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			var _onFocusChange = function (channel, data) {
				_transactionsState.focusEntity = data && data.focus && data.focus.dataId;
			};

			//----------------------------------------------------------------------------------------------------------

			var isExpanded = false;
			//----------------------------------------------------------------------------------------------------------

			function _onStateRequest(channel, data) {

				if (isExpanded !== data.expand) {
					isExpanded = data.expand;
					if (isExpanded && !_transactionsState.capture) {
						//Show Footer
						$('#footer').collapse('show');

						//Calculate how much to scroll workspace so selected div is shown after footer expands
						var footerHeight = $('#footer-content').height();
						var workspace = $('#workspace');
						var workspaceTop = workspace.scrollTop();
						var selectedObject = $('#' + data.selection.getXfId());
						if (selectedObject.length !== 0) {
							var objectPos = selectedObject.offset().top + selectedObject.height();
							var footerPos = (workspace.height() + $('#header-content').height()) - footerHeight;
							if (objectPos > footerPos) {
								workspaceTop = workspace.scrollTop() + (objectPos - footerPos);
							}
						}
						workspace.css('bottom', footerHeight);
						workspace.scrollTop(workspaceTop);
						if ($('#chartTab').is(':visible')) {
							aperture.pubsub.publish(appChannel.GRAPH_VISIBLE, {});
						}
					} else {
						//Hide Footer
						$('#footer').collapse('hide');
						$('#workspace').css('bottom', 0);
					}
				}
			}

			//----------------------------------------------------------------------------------------------------------

			var _onSearchParams = function(eventChannel, data) {
				if (eventChannel !== appChannel.SEARCH_PARAMS_EVENT) {
					aperture.log.error('_onSearchParams: function called with illegal event channel');
					return false;
				}

				if (data.paramsType === 'links') {
					_transactionsState.searchParams = data.searchParams;

					//Hack to get the type.
					var typeMap = _transactionsState.searchParams.getTypeMap();
					for (var typeKey in typeMap) {
						if (typeMap.hasOwnProperty(typeKey)) {
							_transactionsState.linkType = typeMap[typeKey].key;
						}
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			var initialize = function() {
				var footer = $('#footer');

				_transactionsState.buttonSpecList = [
					{
						icon : constants.VIEWS.TRANSACTIONS.ICON,
						title : 'View transactions for selected entity',
						switchesTo : constants.VIEWS.TRANSACTIONS.NAME,
						callback : function() {
							_onTransactionsView();
						}
					}
				];

				Array.prototype.push.apply(_transactionsState.buttonSpecList, viewPlugins.getOpsBarButtonSpecForView({links: true}, function () {
					//return descriptorUtil.getIdDescriptors([{dataId : _transactionsState.detailsResponse.uid, type : _transactionsState.detailsResponse.type}], _transactionsState.searchParams, 'ENTITY');

					return descriptorUtil.getLinkIdDescriptors([{dataId : _transactionsState.curEntity, type : _transactionsState.linkType}], _transactionsState.searchParams);
				}));

				footer.append(footerTemplate({buttons : _transactionsState.buttonSpecList}));

				aperture.util.forEach(_transactionsState.buttonSpecList, function(button) {
					$('#' + button.switchesTo).click(function() {
						button.callback();
					});
				});

				aperture.util.forEach(_transactionsState.buttonSpecList, function(button) {
					footer.find('#transactions-button').click(function() {
						button.callback();
					});
				});

				$('#transaction-tabs a').click(function (e) {
					var parentClass = $(this).parent().attr('class');
					if ($(this).attr('href') === '#chartTab' && (parentClass === undefined || parentClass === '')) {
						aperture.pubsub.publish(appChannel.REQUEST_CURRENT_STATE);
					}
				});

				footer.find('.nav li a').on('click', function(e) {
					if ($(this).parent().hasClass('disabled')) {
						e.preventDefault();
						return false;
					} else {
						_transactionsState.userSelectedTab = $(this).parent().attr('class');
						if (_transactionsState.userSelectedTab === 'chartTab') {
							aperture.pubsub.publish(appChannel.GRAPH_VISIBLE, {});
						}
					}
				});
			};

			//----------------------------------------------------------------------------------------------------------

			var _initializeModule = function(eventChannel) {

				if (eventChannel !== appChannel.START_FLOW_VIEW) {
					return;
				}

				aperture.log.debug('_initializeModule infFooter');
				initialize();
			};

			//----------------------------------------------------------------------------------------------------------

			var _start = function() {
				var subTokens = {};

				subTokens[appChannel.SELECTION_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.SELECTION_CHANGE_EVENT, _onUpdate);
				subTokens[appChannel.FOCUS_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FOCUS_CHANGE_EVENT, _onFocusChange);
				subTokens[appChannel.START_FLOW_VIEW] = aperture.pubsub.subscribe(appChannel.START_FLOW_VIEW, _initializeModule);
				subTokens[appChannel.FOOTER_STATE_REQUEST] = aperture.pubsub.subscribe(appChannel.FOOTER_STATE_REQUEST, _onStateRequest);
				subTokens[appChannel.FILTER_DATE_PICKER_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT, _onFilter);
				subTokens[appChannel.TRANSACTIONS_FILTER_EVENT] = aperture.pubsub.subscribe(appChannel.TRANSACTIONS_FILTER_EVENT, _onFilterHighlight);
				subTokens[appChannel.SEARCH_PARAMS_EVENT] = aperture.pubsub.subscribe(appChannel.SEARCH_PARAMS_EVENT, _onSearchParams);

				_transactionsState.subscriberTokens = subTokens;
			};

			//--------------------------------------------------------------------------------------------------------------

			var _end = function() {
				for (var token in _transactionsState.subscriberTokens) {
					if (_transactionsState.subscriberTokens.hasOwnProperty(token)) {
						aperture.pubsub.unsubscribe(_transactionsState.subscriberTokens[token]);
					}
				}
			};

			//--------------------------------------------------------------------------------------------------------------

			return {
				start : _start,
				end : _end
			};
		};

		modules.register('infFooter', transactionsConstructor);
	}
);
