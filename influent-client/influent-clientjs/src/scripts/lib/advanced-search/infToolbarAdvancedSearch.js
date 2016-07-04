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
		'lib/advanced-search/infToolbarAdvancedMatchCriteria',
		'lib/communication/applicationChannels',
		'lib/constants',
		'hbs!templates/viewToolbar/infToolbarAdvancedSearch'
	],
	function(
		infToolbarAdvancedMatchCriteria,
		appChannel,
		constants,
		infToolbarAdvancedSearchTemplate
	) {
		var module = {};

		module.createInstance = function (view, canvas, searchParams) {

			var instance = {};

			var _UIObjectState = {
				view: view,
				canvas: canvas,
				criteriaContainer: null,
				widget: null,
				subscriberTokens: null,
				matchCriteria: null,
				orderFields : null
			};

			//----------------------------------------------------------------------------------------------------------
			// Private Methods
			//----------------------------------------------------------------------------------------------------------

			var _onAdvancedSearchRequest = function(eventChannel, data) {
				if (data.view !== _UIObjectState.view) {
					return;
				}

				if (data.dataIds != null && !_.isEmpty(data.dataIds)) {
					//_UIObjectState.orderFields = null;
					_UIObjectState.matchCriteria.setFieldsFromDataIds(data.dataIds);
				} else if (data.specs != null && !_.isEmpty(data.specs)) {
					//_UIObjectState.orderFields = null;
					switch (_UIObjectState.view) {
						case require('views/infAccountsView').name():
							_UIObjectState.matchCriteria.setFieldsFromEntitySpecs(data.specs);
							break;
						case require('views/infTransactionsView').name():
							_UIObjectState.matchCriteria.setFieldsFromTransactionSpecs(data.specs);
							break;
					}
				} else {
					//var regex = new RegExp('\\sORDER:\\s*(\\S)+(\\s*(asc|desc))?', 'gi');
					//_UIObjectState.orderFields = data.input.match(regex);
					_UIObjectState.matchCriteria.setFieldsFromString(data.input);
				}

				_UIObjectState.widget.modal('show');
			};

			//----------------------------------------------------------------------------------------------------------

			function onSearchAction() {
				var searchTerm = _UIObjectState.matchCriteria.assembleSearchString();
				//searchTerm = _UIObjectState.orderFields !== null ? searchTerm.trim() + _UIObjectState.orderFields.join(' ') : searchTerm;
				var msgChan = appChannel.FILTER_SEARCH_CHANGE_EVENT;
				aperture.pubsub.publish(msgChan, {
					view: _UIObjectState.view,
					input: searchTerm
				});
			}

			//----------------------------------------------------------------------------------------------------------

			var _initialize = function () {
				_UIObjectState.matchCriteria = infToolbarAdvancedMatchCriteria.createInstance(_UIObjectState.view, _UIObjectState.criteriaContainer, searchParams);
				_UIObjectState.matchCriteria.build();
			};

			//----------------------------------------------------------------------------------------------------------
			// Public
			//----------------------------------------------------------------------------------------------------------

			instance.render = function () {
				if (!_UIObjectState.canvas || !_UIObjectState.canvas instanceof $) {
					throw 'No assigned canvas for rendering view toolbar widget';
				}

				// Plug everything into the template
				var searchDialog = $(infToolbarAdvancedSearchTemplate());
				searchDialog.find('#infAdvancedSearchGo').click(function() {
					onSearchAction();
				});

				_UIObjectState.widget = searchDialog.appendTo(_UIObjectState.canvas);
				_UIObjectState.criteriaContainer = _UIObjectState.widget.find('#criteria-container');

				_initialize();
			};

			// TODO: Do we need to listen to incoming changes?
			var subTokens = {};
			subTokens[appChannel.ADVANCED_SEARCH_REQUEST] = aperture.pubsub.subscribe(appChannel.ADVANCED_SEARCH_REQUEST, _onAdvancedSearchRequest);
			_UIObjectState.subscriberTokens = subTokens;

			// When popping state, hide any modals and remove the fade background
			window.onpopstate = function() {
				$('.modal').modal('hide');
				$('.modal-backdrop').remove();
			};

			// TODO: .. If so, we need to unsubscribe too.

			if (constants.UNIT_TESTS_ENABLED) {
				instance.onAdvancedSearchRequest = _onAdvancedSearchRequest;
				instance.onSearchAction = onSearchAction;
				instance.UIObjectState = _UIObjectState;
			}

			return instance;
		};

		return module;
	}
);
