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
		'lib/util/xfUtil',
		'lib/util/currency',
		'lib/util/duration',
		'lib/constants',
		'modules/infRest',
		'modules/infWorkspace'
	],
	function (
		modules,
		appChannel,
		xfUtil,
		currency,
		duration,
		constants,
		infRest,
		infWorkspace
	) {
		var DEFAULT_GRAPH_SCALE = (aperture.config.get()['influent.config']['defaultGraphScale'] != null) ? aperture.config.get()['influent.config']['defaultGraphScale'] : 0;

		var transactionGraphConstructor = function (sandbox) {

			var MULTIPLE = 5;

			var _UIObjectState = {
				sessionId: null,
				canvasId: sandbox.spec.div,
				canvas: null,
				newUpdate: null,
				filterDates: null,
				focusData: null,
				selectedEntity: null,
				selectedColumn: null,
				subscriberTokens: null
			};

			var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			var SCREEN_TYPES = {};
			SCREEN_TYPES[constants.MODULE_NAMES.ENTITY] = 'Account';
			SCREEN_TYPES[constants.MODULE_NAMES.MUTABLE_CLUSTER] = 'File';
			SCREEN_TYPES[constants.MODULE_NAMES.CLUSTER_BASE] = 'Cluster';
			SCREEN_TYPES[constants.MODULE_NAMES.IMMUTABLE_CLUSTER] = 'Cluster';
			SCREEN_TYPES[constants.MODULE_NAMES.SUMMARY_CLUSTER] = 'Cluster';
			SCREEN_TYPES[constants.MODULE_NAMES.FILE] = 'File';

			var CHART_COLOR = 'rgb(128, 128, 128)';
			var BASELINE_COLOR = 'rgb(107, 89, 53)';

			var BASE_CREDIT_COLOR = 'rgb(210, 204, 193)';
			var BASE_DEBIT_COLOR = 'rgb(180, 171, 153)';
			var FOCUS_CREDIT_COLOR = 'rgb(246, 140, 13)';
			var FOCUS_DEBIT_COLOR = 'rgb(176, 97, 0)';

			var BASE_CREDIT_STROKE_COLOR = 'rgb(191, 183, 168)';
			var BASE_DEBIT_STROKE_COLOR = 'rgb(162, 151, 128)';
			var FOCUS_CREDIT_STROKE_COLOR = 'rgb(225, 130, 5)';
			var FOCUS_DEBIT_STROKE_COLOR = 'rgb(149, 85, 0)';

			var _numberFormatter = aperture.Format.getNumberFormat(0.01);

			var BAR_ELEMENT_TOOLTIP_ID = 'Transaction Graph Bar Element';

			//----------------------------------------------------------------------------------------------------------

			var _createXAxis = function (plot, order) {
				var axisLayer = plot.xAxis(order);
				axisLayer.map('margin').asValue(40);
				axisLayer.map('visible').asValue(true);
				axisLayer.map('text-anchor').asValue('start');
				axisLayer.map('text-anchor-y').asValue('bottom');
				axisLayer.map('tick-length').asValue(10);
				axisLayer.map('label-offset-y').asValue(4);
				axisLayer.map('label-offset-x').asValue(2);
				axisLayer.map('font-size').asValue(10);
				return axisLayer;
			};

			//----------------------------------------------------------------------------------------------------------

			var _attachTooltip = function (element, isInflowing, selectedObject, focusedObject) {

				var createHTML = function (event, isInflowing, selectedObject, focusedObject) {

					if (event.index === undefined) {
						return;
					}

					var index = event.index[0];
					var baseValue = event.data.data[index].base;
					var focusValue = event.data.data[index].focus;
					var startDate = event.data.data[index].startDate;
					var endDate = xfUtil.dayBefore(event.data.data[index].endDate);
					var selectionXfId = selectedObject.xfId;
					var label = selectedObject.label;
					var count = selectedObject.count;

					// append cluster count to selected entity label
					if (count && count > 1) {
						label += ' (+' + (count - 1) + ')';
					}

					var dataId = selectedObject.entityType === constants.MODULE_NAMES.ENTITY ? selectedObject.dataId.substr(2) : '';
					var entityType = SCREEN_TYPES[selectedObject.entityType];

					if (!isInflowing) {
						baseValue *= -1;
						focusValue *= -1;
					}

					var html = '<div class="influent-tooltip"><B>';
					html += MONTH_NAMES[startDate.getMonth()] + ' ' + startDate.getDate() + ', ' + startDate.getFullYear() + ' ';
					html += '</B>';
					if (startDate.getTime() !== endDate.getTime()) {
						html += 'to<B> ';
						html += MONTH_NAMES[endDate.getMonth()] + ' ' + endDate.getDate() + ', ' + endDate.getFullYear() + ' ';
						html += '</B>';
					}
					html += '<br><br><span class="tooltip-selected-entity">';
					html += entityType + ': ';
					if (dataId) {
						html += dataId + ', ';
					}
					html += label;
					html += '</span><br>';

					if (isInflowing) {
						html += 'Total Inflowing: <B>';
					} else {
						html += 'Total Outflowing: <B>';
					}
					html += _numberFormatter.format(baseValue);
					html += '</B>';

					if (focusedObject) {

						var focusXfId = focusedObject.xfId;
						var focusType = SCREEN_TYPES[focusedObject.entityType];
						var focusLabel = focusedObject.entityLabel;
						var focusCount = focusedObject.entityCount;
						var focusDataId = focusedObject.entityType === constants.MODULE_NAMES.ENTITY ? focusedObject.dataId.substr(2) : '';

						if (focusValue !== 0 && selectionXfId !== focusXfId) {

							// append cluster count to focus label
							if (focusCount && focusCount > 1) {
								focusLabel += ' (+' + (focusCount - 1) + ')';
							}

							html += '<br><br>';
							html += '<span class="tooltip-focus-entity">Subset Involving ';
							html += focusType + ': ';
							if (focusDataId) {
								html += focusDataId + ', ';
							}
							html += focusLabel + '</span><br>';

							if (isInflowing) {
								html += 'Total Inflowing: <B>';
							} else {
								html += 'Total Outflowing: <B>';
							}
							html += _numberFormatter.format(focusValue);
							html += '</B>';
						}
					}

					html += '</div>';

					return html;
				};

				element.on('mouseover', function (event) {
					var html = createHTML(event, isInflowing, selectedObject, focusedObject);
					aperture.tooltip.showTooltip({event: event, html: html});
					aperture.pubsub.publish(appChannel.HOVER_START_EVENT, { element: BAR_ELEMENT_TOOLTIP_ID });
					aperture.pubsub.publish(appChannel.TOOLTIP_START_EVENT, { element: BAR_ELEMENT_TOOLTIP_ID });
					return true;
				});
				element.on('mouseout', function (event) {
					aperture.tooltip.hideTooltip();
					aperture.pubsub.publish(appChannel.HOVER_END_EVENT, { element: BAR_ELEMENT_TOOLTIP_ID });
					aperture.pubsub.publish(appChannel.TOOLTIP_END_EVENT, { element: BAR_ELEMENT_TOOLTIP_ID });
					return true;
				});
			};

			//----------------------------------------------------------------------------------------------------------

			var _createBarChart = function (graphParams) {

				if (!_UIObjectState.canvas) {
					_UIObjectState.canvas = $('#' + _UIObjectState.canvasId);
				}
				_UIObjectState.canvas.empty();
				_UIObjectState.canvas.css('background', 'none');

				var SPACER = 1;
				var BAR_WIDTH = 4 * MULTIPLE;

				var width = _UIObjectState.canvas.width() - 20;
				var height = _UIObjectState.canvas.height();

				if (!graphParams ||
					graphParams === 'blank' ||
					width === 0 ||
					height === 0
					) {
					return;
				}

				var rangeX = new aperture.TimeScalar('date');
				var rangeY = new aperture.Scalar('value');
				rangeY = rangeY.symmetric();

				var units = graphParams.units;

				if (graphParams.credits.length !== graphParams.debits.length) {
					return;
				}

				var dataSources = {
					'series': [
						[
							{
								'type': 'baseCredits',
								'data': []
							}
						],
						[
							{
								'type': 'baseDebits',
								'data': []
							}
						],
						[
							{
								'type': 'focusCredits',
								'data': []
							}
						],
						[
							{
								'type': 'focusDebits',
								'data': []
							}
						]
					]
				};

				var maxAbsoluteFocusValueCredit = Number.NEGATIVE_INFINITY;

				for (var i = 0; i < graphParams.dates.length; i++) {
					var baseCredit = graphParams.credits[i];
					var baseDebit = graphParams.debits[i];
					var focusCredit = graphParams.focusCredits[i];
					var focusDebit = graphParams.focusDebits[i];
					var startDate = new Date(graphParams.dates[i]);
					var endDate = new Date(
						((i + 1) === graphParams.dates.length) ? startDate.getTime() + (startDate.getTime() - graphParams.dates[i - 1])
							: graphParams.dates[i + 1]
					);

					// now shift it for time zone. times come in utc so if we don't shift them they may display a different date in local
					startDate = xfUtil.localShiftedDate(startDate);
					endDate = xfUtil.localShiftedDate(endDate);

					var midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);

					rangeX.expand(startDate);
					rangeX.expand(endDate);

					rangeY.expand(baseCredit);
					rangeY.expand(baseDebit);
					rangeY.expand(focusCredit);
					rangeY.expand(focusDebit);

					if (Math.abs(focusCredit) > maxAbsoluteFocusValueCredit) {
						maxAbsoluteFocusValueCredit = Math.abs(focusCredit);
					}
					if (Math.abs(focusDebit) > maxAbsoluteFocusValueCredit) {
						maxAbsoluteFocusValueCredit = Math.abs(focusDebit);
					}

					dataSources.series[0][0].data.push(
						{
							'bucket': i,
							'startDate': startDate,
							'midDate': midDate,
							'endDate': endDate,
							'base': baseCredit,
							'focus': focusCredit
						}
					);

					dataSources.series[1][0].data.push(
						{
							'bucket': i,
							'startDate': startDate,
							'midDate': midDate,
							'endDate': endDate,
							'base': -baseDebit,
							'focus': -focusDebit
						}
					);

					dataSources.series[2][0].data.push(
						{
							'bucket': i,
							'startDate': startDate,
							'midDate': midDate,
							'endDate': endDate,
							'base': baseCredit,
							'focus': focusCredit
						}
					);

					dataSources.series[3][0].data.push(
						{
							'bucket': i,
							'startDate': startDate,
							'midDate': midDate,
							'endDate': endDate,
							'base': -baseDebit,
							'focus': -focusDebit
						}
					);
				}

				rangeY.expand(0);
				rangeY.expand(-0.5);
				rangeY.expand(0.5);
				var chart = new aperture.chart.Chart(_UIObjectState.canvas[0]);
				chart.all(dataSources);
				chart.map('width').asValue(width);
				chart.map('height').asValue(height);
				chart.map('font-family').asValue('Verdana');

				var bandedX = rangeX.banded(16, false);
				var mapKeyX = bandedX.mapKey([0, 1]);

				var primeXAxis = _createXAxis(chart, 0);
				primeXAxis.all(mapKeyX);
				primeXAxis.map('rule-width').asValue(1);

				var nextOrder = bandedX.formatter().nextOrder();
				if (nextOrder) {
					var secBandedX = bandedX.banded({
						span: 1,
						units: nextOrder
					});

					var secXAxis = _createXAxis(chart, 1);
					secXAxis.all(secBandedX.mapKey([0, 1]));
					secXAxis.map('rule-width').asValue(0);
					secXAxis.map('tick-offset').asValue(10);
					secXAxis.map('tick-first').asValue('edge');
					secXAxis.map('font-outline').asValue('#ffffff');
				}

				chart.map('x').using(mapKeyX);

				rangeY.formatter(aperture.Format.getCurrencyFormat(1));
				chart.map('y').using(rangeY.banded(4).mapKey([1, 0]));

				// Hide the chart border.
				chart.map('border-width').asValue(0);
				chart.map('background-color').asValue('none');

				// Configure and define the main title of the chart.
				chart.map('stroke').asValue(CHART_COLOR);
				chart.map('opacity').asValue(1.0);

				// common to all bars
				chart.map('spacer').asValue(SPACER);
				chart.map('point-count').from('data.length');

				var yAxisLabel;
				if (units != null && units.length > 0) {
					yAxisLabel = units;
				} else {
					yAxisLabel = 'Amount';
				}

				chart.yAxis().mapAll({
					'title': yAxisLabel,
					'margin': 60,
					'tick-length': 6,
					'label-offset-x': 2,
					'rule-width': 1,
					'font-size': 11
				});

				var types = ['baseCredits', 'baseDebits', 'focusCredits', 'focusDebits'];
				var fillKey = new aperture.Ordinal(
					'fill', types
				).mapKey(
					[BASE_CREDIT_COLOR, BASE_DEBIT_COLOR, FOCUS_CREDIT_COLOR, FOCUS_DEBIT_COLOR]
				);
				var strokeKey = new aperture.Ordinal(
					'fill', types
				).mapKey(
					[BASE_CREDIT_STROKE_COLOR, BASE_DEBIT_STROKE_COLOR, FOCUS_CREDIT_STROKE_COLOR, FOCUS_DEBIT_STROKE_COLOR]
				);

				var selection = new aperture.Set('data[]');

				var ruleLayer = chart.ruleLayer(0);
				ruleLayer.map('rule').asValue(0.5);
				ruleLayer.map('axis').asValue('y');
				ruleLayer.map('stroke-width').asValue('1');
				ruleLayer.map('stroke-style').asValue('dotted');
				ruleLayer.map('fill').asValue(BASELINE_COLOR);
				ruleLayer.map('opacity').asValue(1.0);
				ruleLayer.toFront();

				// base credit series
				var baseCreditSeries = chart.addLayer(aperture.chart.BarSeriesLayer);
				baseCreditSeries.all(
					function (data) {
						return data.series[0];
					}
				);
				baseCreditSeries.map('width').asValue(BAR_WIDTH);
				baseCreditSeries.map('x').from('data[].midDate');
				baseCreditSeries.map('y').from('data[].base');
				baseCreditSeries.map('stroke').from('type').using(strokeKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				baseCreditSeries.map('fill').from('type').using(fillKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				_attachTooltip(baseCreditSeries, true, _.clone(_UIObjectState.selectedEntity), _.clone(_UIObjectState.focusData));

				// base debit series
				var baseDebitSeries = chart.addLayer(aperture.chart.BarSeriesLayer);
				baseDebitSeries.all(
					function (data) {
						return data.series[1];
					}
				);
				baseDebitSeries.map('width').asValue(BAR_WIDTH);
				baseDebitSeries.map('x').from('data[].midDate');
				baseDebitSeries.map('y').from('data[].base');
				baseDebitSeries.map('stroke').from('type').using(strokeKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				baseDebitSeries.map('fill').from('type').using(fillKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				_attachTooltip(baseDebitSeries, false, _.clone(_UIObjectState.selectedEntity), _.clone(_UIObjectState.focusData));

				// focus credit series
				var focusCreditSeries = chart.addLayer(aperture.chart.BarSeriesLayer);
				focusCreditSeries.all(
					function (data) {
						return data.series[2];
					}
				);
				focusCreditSeries.map('width').asValue(BAR_WIDTH);
				focusCreditSeries.map('x').from('data[].midDate');
				focusCreditSeries.map('y').from('data[].focus');
				focusCreditSeries.map('stroke').from('type').using(strokeKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				focusCreditSeries.map('fill').from('type').using(fillKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				_attachTooltip(focusCreditSeries, true, _.clone(_UIObjectState.selectedEntity), _.clone(_UIObjectState.focusData));

				// focus debit series
				var focusDebitSeries = chart.addLayer(aperture.chart.BarSeriesLayer);
				focusDebitSeries.all(
					function (data) {
						return data.series[3];
					}
				);
				focusDebitSeries.map('width').asValue(BAR_WIDTH);
				focusDebitSeries.map('x').from('data[].midDate');
				focusDebitSeries.map('y').from('data[].focus');
				focusDebitSeries.map('stroke').from('type').using(strokeKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				focusDebitSeries.map('fill').from('type').using(fillKey).filter(
					selection.constant(
						aperture.palette.color('selected')
					)
				);
				_attachTooltip(focusDebitSeries, false, _.clone(_UIObjectState.selectedEntity), _.clone(_UIObjectState.focusData));

				chart.all().redraw();
			};

			//----------------------------------------------------------------------------------------------------------

			var _updateGraph = function (state) {

				_getMaxDebitCredit(
					state,
					function (focusMDC) {
						_getGraphData(state, focusMDC);
					}
				);
			};

			//----------------------------------------------------------------------------------------------------------

			function _getMaxDebitCredit(state, onReturn) {

				if (state.focusData == null) {
					onReturn(DEFAULT_GRAPH_SCALE);
					return;
				}

				var focusId = state.focusData.dataId;
				var focusEntity = {
					contextId: state.focusData.contextId,
					dataId: focusId
				};

				infRest.request('/bigchart').inContext(focusEntity.contextId).withData({

					sessionId: state.sessionId,
					entities: [focusEntity],
					startDate: state.filterDates.startDate,
					endDate: state.filterDates.endDate,
					focusId: [focusId],
					focusMaxDebitCredit: '',
					focuscontextid: state.focusData.contextId

				}).then(function (response) {

					// pull MDC out of response
					var maxCreditDebit = 0;

					if (response[focusId]) {
						var credit = Math.abs(Number(response[focusId].maxCredit));
						var debit = Math.abs(Number(response[focusId].maxDebit));

						if (credit > maxCreditDebit) {
							maxCreditDebit = credit;
						}
						if (debit > maxCreditDebit) {
							maxCreditDebit = debit;
						}
					}

					onReturn(maxCreditDebit);
				});
			}

			//----------------------------------------------------------------------------------------------------------

			var _getGraphData = function (state, focusMDC) {
				infRest.request('/bigchart').inContext(state.selectedEntity.contextId).withData({

					sessionId: state.sessionId,
					entities: [state.selectedEntity],
					startDate: state.filterDates.startDate,
					endDate: state.filterDates.endDate,
					focusId: (state.focusData == null) ? null : [state.focusData.dataId],
					focusMaxDebitCredit: focusMDC.toString(),
					focuscontextid: (state.focusData == null) ? null : state.focusData.contextId

				}).then(function (response) {

					_createBarChart(response[state.selectedEntity.dataId]);
				});
			};

			//----------------------------------------------------------------------------------------------------------

			var _requestState = function (channel, data) {

				if (channel === appChannel.SELECTION_CHANGE_EVENT && data != null) {
					if (data.promptForDetails) {
						return;
					}
				}

				aperture.pubsub.publish(
					appChannel.REQUEST_CURRENT_STATE,
					{}
				);
			};

			//----------------------------------------------------------------------------------------------------------

			var _createGraph = function (data) {
				_UIObjectState.canvas.empty();
				_UIObjectState.canvas.css('background', 'none');

				if (data == null) {
					aperture.log.warn('current state data is null');
					return;
				}

				_UIObjectState.focusData = (data.focusData == null) ? null : _.clone(data.focusData);
				_UIObjectState.filterDates = (data.dates == null) ? null : _.clone(data.dates);
				_UIObjectState.selectedEntity = (data.selectedEntity == null) ? null : _.clone(data.selectedEntity);

				if (!_.isNull(_UIObjectState.selectedEntity)) {
					_UIObjectState.canvas.empty();
					_UIObjectState.canvas.css('background', constants.AJAX_SPINNER_BG);
					_updateGraph(_.clone(_UIObjectState));
				}
			};

			//----------------------------------------------------------------------------------------------------------

			var _onUpdate = function (eventChannel, data) {

				if (eventChannel !== appChannel.CURRENT_STATE) {
					return;
				}

				_UIObjectState.canvas = $('#' + _UIObjectState.canvasId);
				_UIObjectState.sessionId = data.sessionId;

				if (_UIObjectState.canvas.is(':visible')) {
					_createGraph(data);
				} else {
					_UIObjectState.newUpdate = data;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			var _onVisible = function (eventChannel) {
				if (eventChannel !== appChannel.GRAPH_VISIBLE) {
					return;
				}

				if (_UIObjectState.newUpdate) {
					_createGraph(_UIObjectState.newUpdate);
					_UIObjectState.newUpdate = null;
				}
			};

			//----------------------------------------------------------------------------------------------------------

			var _onShow = function (eventChannel, data) {

				if (eventChannel !== appChannel.SHOW_GRAPH) {
					return;
				}

				_UIObjectState.canvas = $('#' + data.canvasId);
				_UIObjectState.sessionId = infWorkspace.getSessionId();

				_createGraph(data);
			};

			//----------------------------------------------------------------------------------------------------------

			var _initializeBigGraph = function () {

			};

			//----------------------------------------------------------------------------------------------------------

			var _initializeModule = function () {
				aperture.log.debug('_initializeModule xfTransactionGraph');
				_initializeBigGraph();
			};

			//----------------------------------------------------------------------------------------------------------

			var start = function () {
				var subTokens = {};

				subTokens[appChannel.SELECTION_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.SELECTION_CHANGE_EVENT, _requestState);
				subTokens[appChannel.FOCUS_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FOCUS_CHANGE_EVENT, _requestState);
				subTokens[appChannel.SEARCH_REQUEST] = aperture.pubsub.subscribe(appChannel.SEARCH_REQUEST, _requestState);
				subTokens[appChannel.FILTER_DATE_PICKER_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT, _requestState);
				subTokens[appChannel.CURRENT_STATE] = aperture.pubsub.subscribe(appChannel.CURRENT_STATE, _onUpdate);
				subTokens[appChannel.SHOW_GRAPH] = aperture.pubsub.subscribe(appChannel.SHOW_GRAPH, _onShow);
				subTokens[appChannel.GRAPH_VISIBLE] = aperture.pubsub.subscribe(appChannel.GRAPH_VISIBLE, _onVisible);
				subTokens[appChannel.START_FLOW_VIEW] = aperture.pubsub.subscribe(appChannel.START_FLOW_VIEW, _initializeModule);

				_UIObjectState.subscriberTokens = subTokens;
			};

			//----------------------------------------------------------------------------------------------------------

			var end = function () {
				for (var token in _UIObjectState.subscriberTokens) {
					if (_UIObjectState.subscriberTokens.hasOwnProperty(token)) {
						aperture.pubsub.unsubscribe(_UIObjectState.subscriberTokens[token]);
					}
				}
			};

			//----------------------------------------------------------------------------------------------------------

			return {
				start: start,
				end: end
			};
		};

		modules.register('infTransactionGraph', transactionGraphConstructor);
	}
);
