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
		'modules/infTransactionTable',
		'lib/constants',
		'modules/infRest',
		'lib/communication/applicationChannels',
		'lib/module',
		'hbs!templates/footer/footer'
	],
	function(
		fixture,
		constants,
		infRest,
		appChannel,
		modules,
		footerTemplate
	)
	{
		var state = fixture._transactionsState;

		var noResults = {
			"totalRecords":0,
			"columns":[
				{},{},{"colLabel":"Inflowing"},{"colLabel":"Outflowing"}
			],
			"tableData":[]
		};

		var results = {
			"totalRecords":10,
			"columns":[
				{"colLabel":"Date"},{"colLabel":"Comment"},{"colLabel":"In (USD)"},{"colLabel":"Out (USD)"}
			],
			"tableData":[
				[1,"Sep 30, 2012","status: paid; repayed: 24989 (in KES)","-","$296.74","a.loan.b377279","a.partner.p203-377278","3993005"],
				[2,"Aug 31, 2012","status: paid; repayed: 6668 (in KES)","-","$79.19","a.loan.b377279","a.partner.p203-377278","3993004"],
				[3,"Jul 31, 2012","status: paid; repayed: 7668 (in KES)","-","$91.06","a.loan.b377279","a.partner.p203-377278","3993003"],
				[4,"Jun 30, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3993002"],
				[5,"May 31, 2012","status: paid; repayed: 8335 (in KES)","-","$98.98","a.loan.b377279","a.partner.p203-377279","3993001"],
				[6,"Apr 30, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3993000"],
				[7,"Mar 31, 2012","status: paid; repayed: 9002 (in KES)","-","$106.90","a.loan.b377279","a.partner.p203-377279","3992999"],
				[8,"Feb 29, 2012","status: paid; repayed: 3334 (in KES)","-","$39.59","a.loan.b377279","a.partner.p203-377279","3992998"],
				[9,"Jan 31, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3992997"],
				[10,"Dec 14, 2011","status: paid; loan: 80k (in KES)","$950.00","-","a.partner.p203-377279","a.loan.b377279","477052"]
			]
		};

		var dateChangeResults = {
			"totalRecords":10,
			"columns":[
				{"colLabel":"Date"},{"colLabel":"Comment"},{"colLabel":"In (USD)"},{"colLabel":"Out (USD)"}
			],
			"tableData":[
				[1,"Apr 30, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3993000"],
				[2,"Mar 31, 2012","status: paid; repayed: 9002 (in KES)","-","$106.90","a.loan.b377279","a.partner.p203-377279","3992999"],
				[3,"Feb 29, 2012","status: paid; repayed: 3334 (in KES)","-","$39.59","a.loan.b377279","a.partner.p203-377279","3992998"],
				[4,"Jan 31, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3992997"],
				[5,"Dec 14, 2011","status: paid; loan: 80k (in KES)","$950.00","-","a.partner.p203-377279","a.loan.b377279","477052"]
			]
		};

		var page1Results = {
			"totalRecords":10,
			"columns":[
				{"colLabel":"Date"},{"colLabel":"Comment"},{"colLabel":"In (USD)"},{"colLabel":"Out (USD)"}
			],
			"tableData":[
				[1,"Sep 30, 2012","status: paid; repayed: 24989 (in KES)","-","$296.74","a.loan.b377279","a.partner.p203-377279","3993005"],
				[2,"Aug 31, 2012","status: paid; repayed: 6668 (in KES)","-","$79.19","a.loan.b377279","a.partner.p203-377279","3993004"],
				[3,"Jul 31. 2012","status: paid; repayed: 7668 (in KES)","-","$91.06","a.loan.b377279","a.partner.p203-377279","3993003"],
				[4,"Jun 30, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3993002"],
				[5,"May 31, 2012","status: paid; repayed: 8335 (in KES)","-","$98.98","a.loan.b377279","a.partner.p203-377279","3993001"]
			]
		};

		var page2Results = {
			"totalRecords":10,
			"columns":[
				{"colLabel":"Date"},{"colLabel":"Comment"},{"colLabel":"In (USD)"},{"colLabel":"Out (USD)"}
			],
			"tableData":[
				[1,"Apr 30, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3993000"],
				[2,"Mar 31, 2012","status: paid; repayed: 9002 (in KES)","-","$106.90","a.loan.b377279","a.partner.p203-377279","3992999"],
				[3,"Feb 29, 2012","status: paid; repayed: 3334 (in KES)","-","$39.59","a.loan.b377279","a.partner.p203-377279","3992998"],
				[4,"Jan 31, 2012","status: paid; repayed: 6668 (in KES)","-","$79.18","a.loan.b377279","a.partner.p203-377279","3992997"],
				[5,"Dec 14, 2011","status: paid; loan: 80k (in KES)","$950.00","-","a.partner.p203-377279","a.loan.b377279","477052"]
			]
		};

		var highlightOnlyResults = {
			"totalRecords":10,
			"columns":[
				{"colLabel":"Date"},{"colLabel":"Comment"},{"colLabel":"In (USD)"},{"colLabel":"Out (USD)"}
			],
			"tableData":[
				[1,"Sep 30, 2012","status: paid; repayed: 24989 (in KES)","-","$296.74","a.loan.b377279","a.partner.p203-377278","3993005"],
				[2,"Aug 31, 2012","status: paid; repayed: 6668 (in KES)","-","$79.19","a.loan.b377279","a.partner.p203-377278","3993004"],
				[3,"Jul 31. 2012","status: paid; repayed: 7668 (in KES)","-","$91.06","a.loan.b377279","a.partner.p203-377278","3993003"],
			]
		};

		var requestObj = {
			"xfId":"",
			"dataId":"a.loan.b146773",
			"label":"",
			"uiType":"xfEntity",
			"contextId":""
		};

		var dateChange = {
			"view":"Flow",
			"startDate": {
				getUTCFullYear: function() { return "2011"; },
				getUTCMonth: function() { return "12"; },
				getUTCDate: function() { return '01'; }
			},
			"endDate": {
				getUTCFullYear: function() { return "2012"; },
				getUTCMonth: function() { return "04"; },
				getUTCDate: function() { return '31'; }
			},
			"duration":"P4Y",
			"numBuckets":16
		};


		var _moduleManager = modules.createManager();

		// -------------------------------------------------------------------------------------------------------------

		describe('infTransactionTable initialization', function () {
			beforeEach(function() {
				document.body.innerHTML = window.__html__['influent-clientjs/test/test-specs/html/infTransactionTableSpec.html'];
			});

			it('Has testing enabled', function () {
				expect(constants.UNIT_TESTS_ENABLED).toBeTruthy();
			});

			it('Ensures the infTransactionTable fixture is defined', function () {
				expect(fixture).toBeDefined();
			});

			it('expects pub subsubs to be subscribed and unsubscribed on start and end events', function () {

				var hasAllOwnProperties = function (object, list) {
					for (var i = 0; i < list.length; i++) {
						if (!object.hasOwnProperty(list[i])) {
							return false;
						}
					}
					return true;
				};

				_moduleManager.start('infTransactionTable', {});

				expect(hasAllOwnProperties(state.subscriberTokens, _subscribedChannels)).toBe(true);

				_moduleManager.end('infTransactionTable');

				expect($.isEmptyObject(state.subscriberTokens)).toBe(true);
			});

			it('expects click handlers to be set during initialization', function () {
				var footer = $('#footer');
				var buttonContext = {
					transactionsIconClass : constants.VIEWS.TRANSACTIONS.ICON,
					transactionsSwitchesTo : constants.VIEWS.TRANSACTIONS.NAME,
					transactionsTitle : 'View transactions for selected transactions'
				};
				footer.append(footerTemplate(buttonContext));
				fixture._initializeModule();

				var switchViewButton = footer.find('#transactions-button');

				var spyEvent = spyOnEvent(switchViewButton, 'click');
				switchViewButton.trigger('click');

				expect('click').toHaveBeenTriggeredOn(switchViewButton);
				expect(spyEvent).toHaveBeenTriggered();
			});
		});

		describe('Transactions Table shows transactions for a given entity', function() {
			it('Handles entity with no transacitons', function () {
				state.table = ($('#transactions-table'));

				//set fake dates
				state.startDate = '2010-01-01';
				state.endDate = '2011-01-01';

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, noResults);});

				state.table.css('visibility', 'visible');
				fixture._onUpdate('selection-change-event', requestObj);

				var table = $('#transactions-table-body');
				expect(table.text().trim()).toEqual('');

				var label = state.table.find('#transactions-table-pagination-label');
				expect(label.text()).toEqual('0 results');


			});

			it('Handles entity with multiple transactions', function () {
				state.table = $('#transactions-table');

				//set fake dates
				state.startDate = '2010-01-01';
				state.endDate = '2011-01-01';

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, results);});

				state.table.css('visibility', 'visible');
				fixture._onUpdate('selection-change-event', requestObj);

				var numRows = $('#transactions-table-body tr').length;
				expect(numRows).toEqual(10);

				var label = $('#transactions-table-pagination-label');
				expect(label.text()).toEqual('Showing 1 - 10 of 10');

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Sep 30, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 24989 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$296.74');

				var cells = $(dataRows[9]).find('td');
				expect($(cells[0]).text()).toEqual('10');
				expect($(cells[1]).text()).toEqual('Dec 14, 2011');
				expect($(cells[2]).text()).toEqual('status: paid; loan: 80k (in KES)');
				expect($(cells[3]).text()).toEqual('$950.00');
				expect($(cells[4]).text()).toEqual('-');
			});

			it('Handles page next', function () {
				var footer = $('#footer');
				var buttonContext = {
					transactionsIconClass : constants.VIEWS.TRANSACTIONS.ICON,
					transactionsSwitchesTo : constants.VIEWS.TRANSACTIONS.NAME,
					transactionsTitle : 'View transactions for selected transactions'
				};
				footer.append(footerTemplate(buttonContext));
				fixture._initializeModule();

				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(page1Results);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Sep 30, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 24989 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$296.74');

				var cells = $(dataRows[4]).find('td');
				expect($(cells[0]).text()).toEqual('5');
				expect($(cells[1]).text()).toEqual('May 31, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 8335 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$98.98');

				var nextButton = footer.find('#transactions-next-page');

				var spyEvent = spyOnEvent(nextButton, 'click');

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, page2Results);});
				nextButton.trigger('click');

				expect('click').toHaveBeenTriggeredOn(nextButton);
				expect(spyEvent).toHaveBeenTriggered();

				table = $('#transactions-table-body');

				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Apr 30, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 6668 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$79.18');

				var cells = $(dataRows[4]).find('td');
				expect($(cells[0]).text()).toEqual('5');
				expect($(cells[1]).text()).toEqual('Dec 14, 2011');
				expect($(cells[2]).text()).toEqual('status: paid; loan: 80k (in KES)');
				expect($(cells[3]).text()).toEqual('$950.00');
				expect($(cells[4]).text()).toEqual('-');

				spyOn(aperture.pubsub, 'publish');

				$(dataRows[1]).trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(appChannel.SELECT_VIEW, {
					title: constants.VIEWS.TRANSACTIONS.NAME,
					queryParams: {
						query:'ID:"3992999"'
					}
				});
			});

			it('Handles page previous', function () {
				var footer = $('#footer');
				var buttonContext = {
					transactionsIconClass : constants.VIEWS.TRANSACTIONS.ICON,
					transactionsSwitchesTo : constants.VIEWS.TRANSACTIONS.NAME,
					transactionsTitle : 'View transactions for selected transactions'
				};
				footer.append(footerTemplate(buttonContext));
				fixture._initializeModule();

				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(page2Results);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);

				var table = $('#transactions-table-body');

				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Apr 30, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 6668 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$79.18');

				var cells = $(dataRows[4]).find('td');
				expect($(cells[0]).text()).toEqual('5');
				expect($(cells[1]).text()).toEqual('Dec 14, 2011');
				expect($(cells[2]).text()).toEqual('status: paid; loan: 80k (in KES)');
				expect($(cells[3]).text()).toEqual('$950.00');
				expect($(cells[4]).text()).toEqual('-');

				var previousButton = footer.find('#transactions-previous-page');

				var spyEvent = spyOnEvent(previousButton, 'click');

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, page1Results);});
				previousButton.trigger('click');

				expect('click').toHaveBeenTriggeredOn(previousButton);
				expect(spyEvent).toHaveBeenTriggered();

				table = $('#transactions-table-body');

				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Sep 30, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 24989 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$296.74');

				var cells = $(dataRows[4]).find('td');
				expect($(cells[0]).text()).toEqual('5');
				expect($(cells[1]).text()).toEqual('May 31, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 8335 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$98.98');
			});


			it('Handles date picker change', function () {
				var footer = $('#footer');
				var buttonContext = {
					transactionsIconClass : constants.VIEWS.TRANSACTIONS.ICON,
					transactionsSwitchesTo : constants.VIEWS.TRANSACTIONS.NAME,
					transactionsTitle : 'View transactions for selected transactions'
				};
				footer.append(footerTemplate(buttonContext));
				fixture._initializeModule();

				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(results);

				var numRows = $('#transactions-table-body tr').length;
				expect(numRows).toEqual(10);

				var label = $('#transactions-table-pagination-label');
				expect(label.text()).toEqual('Showing 1 - 10 of 10');

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Sep 30, 2012');

				//Now change the date
				//set fake dates
				state.startDate = '2010-01-01';
				state.endDate = '2011-01-01';

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, dateChangeResults);});

				state.table.css('visibility', 'visible');
				fixture._onFilter('filter-date-picker-change-event', dateChange);

				var numRows = $('#transactions-table-body tr').length;
				expect(numRows).toEqual(5);

				var label = $('#transactions-table-pagination-label');
				expect(label.text()).toEqual('Showing 1 - 5 of 10');

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(5);
				var cells = $(dataRows[0]).find('td');
				expect($(cells[0]).text()).toEqual('1');
				expect($(cells[1]).text()).toEqual('Apr 30, 2012');
				expect($(cells[2]).text()).toEqual('status: paid; repayed: 6668 (in KES)');
				expect($(cells[3]).text()).toEqual('-');
				expect($(cells[4]).text()).toEqual('$79.18');

				var cells = $(dataRows[4]).find('td');
				expect($(cells[0]).text()).toEqual('5');
				expect($(cells[1]).text()).toEqual('Dec 14, 2011');
				expect($(cells[2]).text()).toEqual('status: paid; loan: 80k (in KES)');
				expect($(cells[3]).text()).toEqual('$950.00');
				expect($(cells[4]).text()).toEqual('-');
			});

		});

		describe('Changing focus card', function() {

			it('Handles all rows focused', function () {
				var focusId = 'a.loan.b377279';
				var REST_RESPONSE_focus = {"data":[{"entities":[focusId],"contextId":""}],"sessionId":""};

				//set focus by faking rest call
				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, REST_RESPONSE_focus);});

				fixture._onFocusChange('channel name', {focus: 'fakeId'});

				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(results);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);

				for (var i = 0; i < dataRows.length; i++) {
					var highlight = $(dataRows[i]).hasClass('transactionsHighlight-1') || $(dataRows[i]).hasClass('transactionsHighlight-0');
					expect(highlight).toBe(true);
				}
			});

			it('Handles no rows focused', function () {
				var focusId = 'fakeId';
				var REST_RESPONSE_focus = {"data":[{"entities":[focusId],"contextId":""}],"sessionId":""};

				//set focus by faking rest call
				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, REST_RESPONSE_focus);});

				fixture._onFocusChange('channel name', {focus: 'fakeId'});

				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(results);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);

				for (var i = 0; i < dataRows.length; i++) {
					var highlight = $(dataRows[i]).hasClass('transactionsHighlight-1') || $(dataRows[i]).hasClass('transactionsHighlight-0');
					expect(highlight).toBe(false);
				}
			});

			it('Handles focus object changing', function () {
				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(results);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);

				for (var i = 0; i < dataRows.length; i++) {
					var highlight = $(dataRows[i]).hasClass('transactionsHighlight-1') || $(dataRows[i]).hasClass('transactionsHighlight-0');
					expect(highlight).toBe(false);
				}

				var REST_RESPONSE_focus = {"data":[{"entities":["a.partner.p203-377278"],"contextId":""}],"sessionId":""};

				//set focus by faking rest call
				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, REST_RESPONSE_focus);});

				fixture._onFocusChange('channel name', {focus: 'fakeId'});

				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);

				for (var i = 0; i < 3; i++) {
					var highlight = $(dataRows[i]).hasClass('transactionsHighlight-1') || $(dataRows[i]).hasClass('transactionsHighlight-0');
					expect(highlight).toBe(true);
				}

				for (var i = 3; i < dataRows.length; i++) {
					var highlight = $(dataRows[i]).hasClass('transactionsHighlight-1') || $(dataRows[i]).hasClass('transactionsHighlight-0');
					expect(highlight).toBe(false);
				}
			});

			it('Handles focus object changing', function () {
				var footer = $('#footer');
				var buttonContext = {
					transactionsIconClass : constants.VIEWS.TRANSACTIONS.ICON,
					transactionsSwitchesTo : constants.VIEWS.TRANSACTIONS.NAME,
					transactionsTitle : 'View transactions for selected transactions'
				};
				footer.append(footerTemplate(buttonContext));
				fixture._initializeModule();

				state.table = ($('#transactions-table'));
				fixture._handleTransactionsResult(results);

				var table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(10);

				var filterButton = footer.find('#filterHighlighted');

				var spyEvent = spyOnEvent(filterButton, 'click');

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, highlightOnlyResults);});
				$('#filterHighlighted').prop('checked', true);
				filterButton.trigger('click');

				expect('click').toHaveBeenTriggeredOn(filterButton);
				expect(spyEvent).toHaveBeenTriggered();

				table = $('#transactions-table-body');
				var dataRows = table.find('tr');
				expect(dataRows.length).toEqual(3);

				for (var i = 0; i < dataRows.length; i++) {
					var highlight = $(dataRows[i]).hasClass('transactionsHighlight-1') || $(dataRows[i]).hasClass('transactionsHighlight-0');
					expect(highlight).toBe(true);
				}
			});
		});

		var _fakeRestResponse = function(resource, resources) {
			var request = {
				resource: resource
			};
			request.inContext = function (contextId) {
				this.contextId = contextId;
				return this;
			};

			request.withData = function (data, contentType) {
				this.data = data;
				return this;
			};

			request.then = function (callback) {
				callback(resources, {status: 'success'});

				return this;
			};

			return request;
		};

		var _subscribedChannels = [
			appChannel.SELECTION_CHANGE_EVENT,
			appChannel.FOCUS_CHANGE_EVENT,
			appChannel.FILTER_DATE_PICKER_CHANGE_EVENT,
			appChannel.START_FLOW_VIEW
		];
	}
);
