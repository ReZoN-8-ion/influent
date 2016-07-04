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
		'lib/module',
		'lib/communication/applicationChannels',
		'lib/constants',
		'lib/ui/xfModalDialog',
		'lib/util/xfUtil',
		'modules/infRest',
		'hbs!templates/footer/transactionsTable',
		'moment'
	],
	function(
		modules,
		appChannel,
		constants,
		xfModalDialog,
		xfUtil,
		infRest,
		transactionsTableTemplate,
		moment
	) {

		var MAX_TABLE_ROWS = 100;

		var _transactionsState = {
			table: '',
			curEntity: '',
			curContext: '',
			noDates: false,
			focus: [],
			startDate: null,
			endDate: null,
			subscriberTokens: null,
			bFilterFocused: false,
			canvasId: null,
			computeSummaries: false,
			currentStartRow: 0,
			tableData: null
		};

		var _registerView = function (sandbox) {
			_transactionsState.noDates = sandbox.spec.bSimpleTable ? true : false;
			_transactionsState.canvasId = sandbox.spec.div;
			_transactionsState.computeSummaries = sandbox.spec.bSimpleTable ? true : false;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onUpdate = function (channel, data) {
			//New card selected
			if (data != null) {
				aperture.log.debug('onUpdate transactions : ' + data.dataId);

				if (data.promptForDetails) {
					return;
				}
			}

			_transactionsState.curEntity = data && data.dataId;
			_transactionsState.curContext = data && data.contextId;

			if (data && data.noDates) {
				_transactionsState.noDates = true;
			} else {
				_transactionsState.noDates = false;
			}
			if (data && data.uiType === constants.MODULE_NAMES.ENTITY && _transactionsState.table.css('visibility') !== 'hidden' && $('#tableTab').hasClass('active')) {
				_getTransactions(0);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _drawHighlighting = function() {
			//Apply row highlighting
			if (_transactionsState.table) {
				$('tr', _transactionsState.table.find('#transactions-table-body')).each(function (i, e) {
					var rowData = _transactionsState.tableData[i];
					if (rowData != null && (_transactionsState.focus.indexOf(rowData[5]) !== -1 || _transactionsState.focus.indexOf(rowData[6]) !== -1)) {
						$(e).removeClass('active');
						$(e).addClass('transactionsHighlight-' + (i % 2));
					}
					else {
						$(e).removeClass('transactionsHighlight-' + (i % 2));
						if (i % 2 === 0) {
							$(e).addClass('active');
						}
					}
				});
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var onFocusChange = function (channel, data) {
			//Flow was highlighted
			_transactionsState.focus = [];

			if (data == null || data.focus == null) {
				_drawHighlighting();
			} else {
				// We need to get a list of entities that are focused if this is a file cluster.   Ask the server
				// so they are all treated as 'focused' according to the transaction table
				infRest.request('/containedentities').inContext(data.focus.contextId).withData({

					sessionId: data.focus.sessionId,
					queryId: (new Date()).getTime(),
					entitySets: [
						{
							contextId: data.focus.contextId,
							entities: [data.focus.dataId]
						}
					],
					details: false

				}).then(function (response) {
					// Parse response
					for (var i = 0; i < response.data.length; i++) {
						var entities = response.data[i].entities;
						for (var j = 0; j < entities.length; j++) {
							_transactionsState.focus.push(entities[j]);
						}
					}
					//If the highlight only checkbox is checked, then changing the focus card means we may need to display
					// different transactions. So we need to repopulate the table.
					if (_transactionsState.bFilterFocused) {
						_transactionsState.currentStartRow = 0;
						_getTransactions(_transactionsState.currentStartRow, true);
					} else {
						_drawHighlighting();
					}
				});
			}
		};

		var _onTransactionsView = function(tranId) {
			var term = 'ID:"' + tranId + '"';

			aperture.pubsub.publish(appChannel.SELECT_VIEW, {
				title: constants.VIEWS.TRANSACTIONS.NAME,
				queryParams: {
					query : term
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onFilter = function (channel, data) {
			_transactionsState.startDate = data.startDate;
			_transactionsState.endDate = data.endDate;

			aperture.log.debug('onFilter transactions : ' + _transactionsState.startDate + ' -> ' + _transactionsState.endDate);

			if (!_transactionsState.table) {
				return;
			}

			if (_transactionsState.table.css('visibility') !== 'hidden' || $('#chartTab').css('visibility') !== 'hidden') {
				if (_transactionsState.curEntity && _transactionsState.startDate && _transactionsState.endDate) {
					_getTransactions(0);
				}
			}
		};

		var _getContext = function (response) {
			var context = {};
			context.rows = [];

			if (response.columns) {
				if (response.columns[0].colLabel) {
					context.dateLabel = response.columns[0].colLabel;
				}
				if (response.columns[1].colLabel) {
					context.commentLabel = response.columns[1].colLabel;
				}
				if (response.columns[2].colLabel) {
					context.inFlowLabel = response.columns[2].colLabel;
				}
				if (response.columns[3].colLabel) {
					context.outFlowLabel = response.columns[3].colLabel;
				}
			}

			if (response.tableData.length > 0) {
				var focusIdArray = _transactionsState.focus;

				context.first = _transactionsState.currentStartRow + 1;
				context.last = _transactionsState.currentStartRow + response.tableData.length;
				context.total = response.totalRecords;

				$.each(response.tableData, function (i, item) {
					var rowStyle;
					if (focusIdArray.indexOf(item[5]) !== -1 || focusIdArray.indexOf(item[6]) !== -1) {
						rowStyle = 'transactionsHighlight-' + (i % 2);
					} else {
						rowStyle = (i % 2) === 0 ? 'active' : '';
					}

					var m = moment(new Date(item[1]));
					if (!m.isValid()) {
						m = moment(new Date(parseInt(item[1], 10)));   // If date is invalid, try it as a unix timestamp
					}

					var dateString;
					if (m.hour() || m.minute() || m.second() || m.millisecond()) {
						dateString = m.format(constants.DATE_FORMAT + ' ' + constants.TIME_FORMAT);
					} else {
						dateString = m.format(constants.DATE_FORMAT);
					}

					context.rows.push({rowStyle: rowStyle, rowNum: item[0], date: dateString, comment: item[2], inflowing: item[3], outflowing: item[4]});
				});
			}
			return context;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _handleTransactionsResult = function (response) {
			//Clear table
			_transactionsState.tableData = response.tableData;
			_transactionsState.table.empty();

			//Handler for pagination
			if (_transactionsState.currentStartRow === 0) {
				$('#transactions-previous-page').addClass('disabled');
			} else {
				$('#transactions-previous-page').removeClass('disabled');
			}
			if (response.totalRecords <= _transactionsState.currentStartRow + MAX_TABLE_ROWS) {
				$('#transactions-next-page').addClass('disabled');
			} else {
				$('#transactions-next-page').removeClass('disabled');
			}

			_transactionsState.table.append(transactionsTableTemplate(_getContext(response)));

			//Add Row click handler
			$('tr', _transactionsState.table.find('#transactions-table-body')).each(function (i, e) {
				var rowData = _transactionsState.tableData[i];
				$(e).click(function() {
					_onTransactionsView(rowData[7]);
				});
			});

			$('tr', _transactionsState.table.find('#transactions-table-body')).each(function (i, e) {
				$(e).hover(
					function() {
						$(e).removeClass('active');
					},
					function() {
						//Only add 'active' class if the row is not highlighted
						if (!$(e).hasClass('transactionsHighlight-0') && !$(e).hasClass('transactionsHighlight-1')) {
							if (i % 2 === 0) {
								$(e).addClass('active');
							}
						}
				});
			});
		};

		var _handleFilterHighlight = function () {
			_transactionsState.currentStartRow = 0;
			_getTransactions(_transactionsState.currentStartRow);

			aperture.pubsub.publish(appChannel.TRANSACTIONS_FILTER_EVENT, {
				filterHighlighted: _transactionsState.bFilterFocused
			});
		};

		var _getTransactions = function (startRow, doHighlight) {
			_transactionsState.table.empty();

			var spinner = $('<div/>').css({
				'background': constants.AJAX_SPINNER_BG,
				width : '50px',
				height : '50px',
				margin : 'auto'
			});

			_transactionsState.table.append(spinner);

			var params = {};
			params.entityId = _transactionsState.curEntity;
			params.contextId = _transactionsState.curContext;
			if (!_transactionsState.noDates) {
				params.startDate = moment(_transactionsState.startDate).utc().format(constants.QUERY_DATE_FORMAT);
				params.endDate = moment(_transactionsState.endDate).utc().format(constants.QUERY_DATE_FORMAT);
			}
			if (_transactionsState.computeSummaries) {
				params.computeSummaries = true;
			}

			if (_transactionsState.bFilterFocused &&
				_transactionsState.focus != null &&
				_transactionsState.focus.length > 0 &&
				_transactionsState.curEntity != null &&
				(_transactionsState.focus.length > 1 || _transactionsState.focus[0] !== _transactionsState.curEntity)
				) {
				params.focusIds = _transactionsState.focus;
			}
			params.totalRows = MAX_TABLE_ROWS;
			params.startRow = startRow === undefined ? 0 : startRow;


			infRest.request('/transactions').withData(
				params
			).then(function (response, restInfo) {
				if (restInfo.status === 'success') {
					_transactionsState.currentStartRow = startRow;
					_handleTransactionsResult(response);
					if (doHighlight) {
						_drawHighlighting();
					}
				} else {
					_transactionsState.table.empty();
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _initializeModule = function () {
			aperture.log.debug('_initializeModule transactions');
			_transactionsState.currentStartRow = 0;

			//Add handlers for table controls
			$('#filterHighlighted').click(function () {
				_transactionsState.bFilterFocused = $('#filterHighlighted')[0].checked;
				_handleFilterHighlight();
			});

			$('#transactions-previous-page').click(function (e) {
				_getTransactions(_transactionsState.currentStartRow - MAX_TABLE_ROWS);
			});

			$('#transactions-next-page').click(function (e) {
				_getTransactions(_transactionsState.currentStartRow + MAX_TABLE_ROWS);
			});

			_transactionsState.table = $('#' + _transactionsState.canvasId);
			if (_transactionsState.curEntity && _transactionsState.startDate && _transactionsState.endDate) {
				_getTransactions(0);
			}
		};

		modules.register('infTransactionTable', function (sandbox) {
			return {
				start: function () {
					var subTokens = {};

					//TODO : use the div passed in to place the transactions, instead of hardcoding the div name above.
					subTokens[appChannel.SELECTION_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.SELECTION_CHANGE_EVENT, _onUpdate);
					subTokens[appChannel.FOCUS_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FOCUS_CHANGE_EVENT, onFocusChange);
					subTokens[appChannel.FILTER_DATE_PICKER_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT, _onFilter);
					subTokens[appChannel.START_FLOW_VIEW] = aperture.pubsub.subscribe(appChannel.START_FLOW_VIEW, _initializeModule);
					_registerView(sandbox);
					_transactionsState.subscriberTokens = subTokens;
				},
				end: function () {
					for (var token in _transactionsState.subscriberTokens) {
						if (_transactionsState.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_transactionsState.subscriberTokens[token]);
						}
					}

					_transactionsState.subscriberTokens = {};
				}
			};

		});

		if (constants.UNIT_TESTS_ENABLED) {
			return {
				_transactionsState: _transactionsState,
				_handleTransactionsResult: _handleTransactionsResult,
				_getContext: _getContext,
				_onFocusChange: onFocusChange,
				_handleFilterHighlight: _handleFilterHighlight,
				_onUpdate: _onUpdate,
				_onFilter: _onFilter,
				_initializeModule: _initializeModule,
				_onTransactionsView: _onTransactionsView
			};
		}
	}
);

