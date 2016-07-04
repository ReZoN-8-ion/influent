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
		'lib/constants',
		'lib/util/duration',
		'lib/util/xfUtil',
		'hbs!templates/viewToolbar/infToolbarDatePicker',
		'moment'
	],
	function(
		appChannel,
		constants,
		duration,
		xfUtil,
		infToolbarDatePickerTemplate,
		moment
	) {

		// Bucketing information
		// NOTE: numDays is approximate
		var DURATION_DATA = {
			'P14D': { numDays: 14, friendlyName: '14 day', numBuckets: 14, bucketBy: 'days' },
			'P30D': { numDays: 30, friendlyName: '30 days', numBuckets: 15,bucketBy: 'days' },
			'P60D': { numDays: 60, friendlyName: '60 days', numBuckets: 15, bucketBy: 'days' },
			'P112D': { numDays: 112, friendlyName: '16 weeks', numBuckets: 16, bucketBy: 'weeks' },
			'P224D': { numDays: 224, friendlyName: '32 weeks', numBuckets: 16,bucketBy: 'weeks' },
			'P1Y': { numDays: 365, friendlyName: '1 year', numBuckets: 12, bucketBy: 'months' },
			'P16M': { numDays: 486, friendlyName: '16 months', numBuckets: 16, bucketBy: 'months' },
			'P2Y': { numDays: 730, friendlyName: '2 years', numBuckets: 12, bucketBy: 'months' },
			'P32M': { numDays: 973, friendlyName: '32 months', numBuckets: 12, bucketBy: 'quarters' },
			'P4Y': { numDays: 1460, friendlyName: '4 years', numBuckets: 16, bucketBy: 'quarters' },
			'P8Y': { numDays: 2920, friendlyName: '8 years', numBuckets: 16, bucketBy: 'years' },
			'P16Y': { numDays: 5840, friendlyName: '16 years', numBuckets: 16, bucketBy: 'years' }
		};

		var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		var module = {};

		module.createInstance = function (view, canvas) {

			var instance = {};

			var _UIObjectState = {
				view: null,
				canvas: null,
				widgetCanvas: null,
				subscriberTokens: null,
				startDate: new Date('Jan 1, 2013'),
				endDate: new Date(),
				maxDate: null,
				minDate: null,
				duration: ''
			};

			//--------------------------------------------------------------------------------------------------------------

			var _$ = function(e) {
				return _UIObjectState.widgetCanvas.find(e);
			};

			_UIObjectState.view = view;
			_UIObjectState.canvas = canvas;

			//--------------------------------------------------------------------------------------------------------------
			// Private Methods
			//--------------------------------------------------------------------------------------------------------------

			var _applyChanges = function(start, end, duration, numBuckets) {
				_UIObjectState.startDate = start;
				_UIObjectState.endDate = end;
				_UIObjectState.duration = duration;
				_UIObjectState.numBuckets = numBuckets;

				_updateButtonUI();
				_updateDropdownUI();
				_applyFilterChanges();
			};

			var _updateDropdownFromPickers = function() {
				var start = _$('#datepicker-from').datepicker('getDate');
				var end = _$('#datepicker-to').datepicker('getDate');

				if (moment(end).isAfter(moment(start))) {
					var options = _findContainingDurations(start, end);
					_updateDateOptions(options);
					$('#datepicker-warning').hide();
				} else {
					$('#datepicker-warning').show();
				}
			};

			var _onFilterChangeRequest = function(eventChannel, data) {

				if (eventChannel !== appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST ||
					data.view !== _UIObjectState.view) {
					return;
				}
				_applyChanges(
					data.startDate,
					data.endDate,
					data.duration,
					data.numBuckets
				);
			};

			//--------------------------------------------------------------------------------------------------------------

			var _setDateBounds = function(eventChannel, data) {

				if (eventChannel !== appChannel.DATASET_STATS) {
					return;
				}

				// Note: sets bounds for all datepickers.
				if (data.startDate && data.endDate) {
					_UIObjectState.minDate = new Date(data.startDate);
					_UIObjectState.maxDate = new Date(data.endDate);
					_updateButtonUI();
					_updateDropdownUI();
					_applyFilterChanges();
				}
			};

			//--------------------------------------------------------------------------------------------------------------

			var _applyFilterChanges = function () {
				aperture.pubsub.publish(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT, {
					view: _UIObjectState.view,
					startDate: _UIObjectState.startDate,
					endDate: _UIObjectState.endDate,
					duration: _UIObjectState.duration,
					numBuckets: _UIObjectState.numBuckets
				});
			};

			//--------------------------------------------------------------------------------------------------------------

			var _updateButtonUI = function() {
				var localStart = xfUtil.localShiftedDate(_UIObjectState.startDate);
				var localEnd = xfUtil.localShiftedDate(_UIObjectState.endDate);
				var startString = moment(localStart).format(constants.DATE_FORMAT);
				var endString = moment(localEnd).format(constants.DATE_FORMAT);
				_$('.dropdown-toggle').html(startString + ' to ' + endString + '<span class="caret" style="margin-left:8px"></span>');

				// If the dropdown is open, close it.
				if (_$('.btn-group').hasClass('open')) {
					_$('.dropdown-toggle').dropdown('toggle');
				}
			};

			//--------------------------------------------------------------------------------------------------------------

			var _updateDropdownUI = function() {
				_$('#datepicker-from').datepicker('update', xfUtil.localShiftedDate(_UIObjectState.startDate));
				_$('#datepicker-to').datepicker('update', xfUtil.localShiftedDate(_UIObjectState.endDate));
			};

			//--------------------------------------------------------------------------------------------------------------

			var _updateDateOptions = function(options) {
				_$('.time-window-option').remove();

				// If the first option returned is the same as the currently set date, don't prompt for bucket choices, apply the change
				if (!options[0].startModified && !options[0].endModified) {

					_$('#time-window-header').hide();
					_$('.time-window-option').remove();
					_applyChanges(
						xfUtil.utcShiftedDate(options[0].start),
						xfUtil.utcShiftedDate(options[0].end),
						options[0].duration,
						DURATION_DATA[options[0].duration].numBuckets
					);
					return;
				}

				_$('#time-window-header').show();

				var dateRangeIntervals = aperture.config.get()['influent.config'].dateRangeIntervals;
				aperture.util.forEach(options, function (o) {
					var durationName = dateRangeIntervals[o.duration];

					var startPrefix = '<span class="daterange-start';
					var startSuffix = '';
					if (o.startModified > 0) {
						startPrefix += ' daterange-modified-less">';
						startSuffix = ' <i class="glyphicon glyphicon-circle-arrow-right"></i></span>';
					} else if (o.startModified < 0) {
						startPrefix += ' daterange-modified-more">';
						startSuffix = ' <i class="glyphicon glyphicon-circle-arrow-left"></i></span>';
					} else {
						startPrefix += ' daterange-unmodified">';
						startSuffix = ' <i class="glyphicon glyphicon-record"></i></span>';
					}

					var endPrefix = '<span class="daterange-end';
					var endSuffix = '</span>';
					if (o.endModified > 0) {
						endPrefix += ' daterange-modified-more"><i class="glyphicon glyphicon-circle-arrow-right"></i> ';
					} else if (o.endModified < 0) {
						endPrefix += ' daterange-modified-less"><i class="glyphicon glyphicon-circle-arrow-left"></i> ';
					} else {
						endPrefix += ' daterange-unmodified"><i class="glyphicon glyphicon-record"></i> ';
					}

					var line = $('<li></li>');
					line.addClass('time-window-option');
					line.html('<a href="#">' +
						startPrefix + moment(o.start).format(constants.DATE_FORMAT) + startSuffix +
						' to ' + endPrefix + moment(o.end).format(constants.DATE_FORMAT) + endSuffix +
						' (' + (durationName ? durationName : DURATION_DATA[o.duration].friendlyName) + ')</a>');

					line.click(function() {
						_$('#time-window-header').hide();
						_$('.time-window-option').remove();
						_applyChanges(
							xfUtil.utcShiftedDate(o.start),
							xfUtil.utcShiftedDate(o.end),
							o.duration,
							DURATION_DATA[o.duration].numBuckets
						);
						return false;
					});

					_$('.datepicker-dropdown-content').append(line);
				});
			};
			//--------------------------------------------------------------------------------------------------------------

			var _findContainingDurations = function (start, end) {

				// Finds date range suggestions by moving/expanding date range
				// intervals until it finds ones that contain the given dates

				var dateRangeIntervals = aperture.config.get()['influent.config'].dateRangeIntervals;

				var fromInclusive = null;
				var toInclusive = null;
				var fromToInclusive = null;

				var s, e, movingDate;
				var numBucketsMoved = 0;
				var returnedList = [];
				var dayDiff = moment(end).diff(start, 'days');

				var closestDuration = null;
				aperture.util.forEach(dateRangeIntervals, function(d, key) {
					if (!closestDuration || Math.abs(dayDiff - DURATION_DATA[key].numDays) < Math.abs(dayDiff - DURATION_DATA[closestDuration].numDays)) {
						closestDuration = key;
					}
				});

				if (!closestDuration) {
					return returnedList;
				}

				// Walk left until we find an interval that contains the start date.
				while (!fromInclusive) {
					movingDate = moment(start).subtract(numBucketsMoved, DURATION_DATA[closestDuration].bucketBy).toDate();
					s = duration.roundDateByDuration(movingDate, closestDuration);

					if (moment(start).isSame(s) || moment(start).isAfter(s)) {
						e = duration.addToDate(closestDuration, s);
						fromInclusive = {start: s, end: e, duration: closestDuration};
					}
					numBucketsMoved++;
				}

				// Walk right until we find an interval that contains the end date.
				numBucketsMoved = 0;
				while (!toInclusive) {
					movingDate = moment(end).add(numBucketsMoved, DURATION_DATA[closestDuration].bucketBy).toDate();
					e = duration.roundDateByDuration(movingDate, closestDuration);

					if (moment(end).isSame(e) || moment(end).isBefore(e)) {
						s = duration.subtractFromDate(closestDuration, e);
						toInclusive = {start: s, end: e, duration: closestDuration};
					}
					numBucketsMoved++;
				}

				// Move successively larger intervals from right to left across the range until
				// we find a containing interval
				aperture.util.forEach(dateRangeIntervals, function(d, key) {
					if (!fromToInclusive && DURATION_DATA[key].numDays >= DURATION_DATA[closestDuration].numDays) {
						numBucketsMoved = 0;
						var endOutOfRange = false;
						while (!endOutOfRange) {

							movingDate = moment(start).subtract(numBucketsMoved, DURATION_DATA[key].bucketBy).toDate();
							s = duration.roundDateByDuration(movingDate, key);
							e = duration.addToDate(key, s);

							if ((moment(start).isSame(s) || moment(start).isAfter(s)) &&
								(moment(end).isSame(e) || moment(end).isBefore(e))) {
								fromToInclusive = {start: s, end: e, duration: key};
							} else if (moment(end).isAfter(e)) {
								endOutOfRange = true;
							}
							numBucketsMoved++;
						}
					}
				});

				// Form the results
				var durationList = [fromInclusive, toInclusive, fromToInclusive];

				// Only add unique suggestions
				aperture.util.forEach(durationList, function(d) {
					if (d) {

						var isInReturnList = false;
						aperture.util.forEach(returnedList, function(d2) {
							if (moment(d.start).isSame(d2.start) &&
								moment(d.end).isSame(d2.end)) {
								isInReturnList = true;
							}
						});

						if (!isInReturnList) {
							// Highlight what was modified in the suggestion
							d.startModified = moment(d.start).isSame(start)? 0: moment(d.start).isBefore(start)? -1 : 1;
							d.endModified = moment(d.end).isSame(end)? 0: moment(d.end).isBefore(end)? -1 : 1;

							returnedList.push(d);
						}
					}
				});

				return returnedList;
			};

			//--------------------------------------------------------------------------------------------------------------

			var _initializeFilter = function () {

				_$('.dropdown-menu').click(function(e) {

					// Don't close dropdown if we click in it
					e.stopPropagation();
				});

				// FROM DATEPICKER
				_$('#datepicker-from').datepicker({
					format: constants.BOOTSTRAP_DATE_FORMAT,
					autoclose: true,
					forceParse: false,
					multidateSeparator: ';'
				})
				.on('changeDate', function () {
					_updateDropdownFromPickers();
				})
				.on('show', function() {
					$('.datepicker-dropdown').click( function(event) {
						// fixme: currently applies to all datepickers
						// Don't close datepicker widget by clicking through to the workspace
						event.stopPropagation();
					});
				});

				// TO DATEPICKER
				_$('#datepicker-to').datepicker({
					format: constants.BOOTSTRAP_DATE_FORMAT,
					autoclose: true,
					forceParse: false,
					multidateSeparator: ';'
				})
				.on('changeDate', function () {
					_updateDropdownFromPickers();
				})
				.on('show', function() {
					$('.datepicker-dropdown').click( function(event) {
						// fixme: currently applies to all datepickers
						// Don't close datepicker widget by clicking through to the workspace
						event.stopPropagation();
					});
				});

				var dateRangeIntervals = aperture.config.get()['influent.config'].dateRangeIntervals;
				var dateRangeIntervalKeys = Object.keys(dateRangeIntervals);
				_UIObjectState.duration = aperture.config.get()['influent.config']['startingDateRange'] || dateRangeIntervalKeys[dateRangeIntervalKeys.length - 1];
				var localEnd = aperture.config.get()['influent.config']['defaultEndDate'] || new Date();
				localEnd = duration.roundDateByDuration(localEnd, _UIObjectState.duration);
				var localStart = duration.roundDateByDuration(duration.subtractFromDate(_UIObjectState.duration, localEnd), _UIObjectState.duration);
				_UIObjectState.startDate = xfUtil.utcShiftedDate(localStart);
				_UIObjectState.endDate = xfUtil.utcShiftedDate(localEnd);
				_UIObjectState.numBuckets = DURATION_DATA[_UIObjectState.duration].numBuckets;
				_updateButtonUI();
				_updateDropdownUI();
				_applyFilterChanges();
			};

			//--------------------------------------------------------------------------------------------------------------
			// Public
			//--------------------------------------------------------------------------------------------------------------

			instance.render = function () {

				if (!_UIObjectState.canvas || !_UIObjectState.canvas instanceof $) {
					throw 'No assigned canvas for rendering view toolbar widget';
				}

				var row = _UIObjectState.canvas.find('.row');

				// Plug everything into the template
				_UIObjectState.widgetCanvas = $(infToolbarDatePickerTemplate()).appendTo(row);

				_initializeFilter();
			};

			// TODO: Do we need to listen to incoming changes? ..
			var subTokens = {};
			subTokens[appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST] = aperture.pubsub.subscribe(appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST, _onFilterChangeRequest);
			subTokens[appChannel.DATASET_STATS] = aperture.pubsub.subscribe(appChannel.DATASET_STATS, _setDateBounds);

			_UIObjectState.subscriberTokens = subTokens;

			// TODO: .. If so, we need to unsubscribe too.
			// UNIT TESTING --------------------------------------------------------------------------------------------

			if (constants.UNIT_TESTS_ENABLED) {
				instance.DURATION_BUCKETS = DURATION_DATA;
				instance.MONTH_NAMES = MONTH_NAMES;

				instance.updateDropdownFromPickers = _updateDropdownFromPickers;
				instance.onFilterChangeRequest = _onFilterChangeRequest;
			}

			// UNIT TESTING --------------------------------------------------------------------------------------------

			return instance;
		};

		return module;
	}
);
