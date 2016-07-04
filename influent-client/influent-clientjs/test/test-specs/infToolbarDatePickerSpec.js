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
		'lib/util/xfUtil',
		'lib/communication/applicationChannels',
		'lib/constants',
		'lib/toolbar/infToolbarDatePicker',
		'lib/util/duration',
		'moment'
	],
	function(
		xfUtil,
		appChannel,
		constants,
		infToolbarDatePicker,
		duration,
	    moment
	) {
		describe('infToolbarDatePicker adds a date picker widget to a view toolbar', function() {

			var _viewName = 'TEST_VIEW';

			var _widgetInst;
			var _canvas;
			var _startDate;
			var _endDate;
			var _numBuckets = 12;
			var _duration = 'P1Y';

			var _setDate = function(localEndDate, dur, numBuckets) {
				_duration = dur;
				_numBuckets = numBuckets;
				localEndDate = duration.roundDateByDuration(localEndDate, _duration);
				var localStartDate = duration.roundDateByDuration(duration.subtractFromDate(_duration, localEndDate), _duration);
				_startDate = xfUtil.utcShiftedDate(localStartDate);
				_endDate = xfUtil.utcShiftedDate(localEndDate);

				_widgetInst.onFilterChangeRequest(
					appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST,
					{
						view: _viewName,
						startDate: _startDate,
						endDate: _endDate,
						duration: _duration,
						numBuckets: _numBuckets
					}
				);
			}

			var _getPickerDateString = function(id) {
				var content = _canvas.find('.datepicker-dropdown-content');
				var picker = content.find(id);
				var d = picker.datepicker('getDate');
				return moment(d).utc().format(constants.DATE_FORMAT);
			}

			beforeEach(function() {
				document.body.innerHTML = window.__html__['influent-clientjs/test/test-specs/html/includeJQueryUi.html'];
				_canvas = $('<div><div class="row"></div></div>');
				_widgetInst = infToolbarDatePicker.createInstance(_viewName, _canvas);
				_widgetInst.render();
				_setDate(new Date('Jan 1, 2013'), 'P1Y', 12);
			});

			it('Has testing enabled', function () {
				expect(constants.UNIT_TESTS_ENABLED).toBeTruthy();
			});

			it('Returns a module', function() {
				expect(infToolbarDatePicker).toBeDefined();
			});

			it('Creates and returns an instance', function() {
				expect(_widgetInst).toBeDefined();
			});

			it('Uses the duration module to calculate date offsets', function() {
				var localStart = xfUtil.localShiftedDate(_startDate);
				expect(localStart.toString()).toBe(new Date('Jan 1, 2012').toString());
			});

			it('Responds to date input and notifies subscribers', function() {

				// Todo - move this out to individual widget tests?
				var datepickerChangeCallback = jasmine.createSpy();

				var subTokens = {};
				subTokens[appChannel.FILTER_DATE_PICKER_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT, datepickerChangeCallback);

				aperture.pubsub.publish(appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST, {
					view: _viewName,
					startDate: _startDate,
					endDate: _endDate,
					duration: _duration,
					numBuckets: _numBuckets
				});

				expect(datepickerChangeCallback).toHaveBeenCalledWith(appChannel.FILTER_DATE_PICKER_CHANGE_EVENT,	{
					view: _viewName,
					startDate: _startDate,
					endDate: _endDate,
					duration: _duration,
					numBuckets: _numBuckets
				}, undefined, undefined);

				var localStart = xfUtil.localShiftedDate(_startDate);
				var localEnd = xfUtil.localShiftedDate(_endDate);

				// Make sure the label on the button is what we expect it to be
				var startString = _widgetInst.MONTH_NAMES[localStart.getMonth()] + ' ' + localStart.getDate() + ', ' + localStart.getFullYear();
				var endString = _widgetInst.MONTH_NAMES[localEnd.getMonth()] + ' ' + localEnd.getDate() + ', ' + localEnd.getFullYear();
				expect(_canvas.find('.dropdown-toggle').html()).toBe(startString + ' to ' + endString + '<span class="caret" style="margin-left:8px"></span>');
			});

			it('Expands a dropdown when the user clicks on the datepicker button', function() {
				var buttonGroup = _canvas.find('.btn-group');
				var dropdown = _canvas.find('.dropdown-toggle');

				expect(buttonGroup.hasClass('open')).toBeFalsy();
				dropdown.dropdown('toggle');
				expect(buttonGroup.hasClass('open')).toBeTruthy();
			});


			it('Has a dropdown that shows to/from date selectors, populated with the current date settings', function() {
				var content = _canvas.find('.datepicker-dropdown-content');
				var fromPicker = content.find('#datepicker-from');
				var toPicker = content.find('#datepicker-to');

				expect(fromPicker.length).toBeGreaterThan(0);
				expect(toPicker.length).toBeGreaterThan(0);

				expect(_getPickerDateString('#datepicker-from')).toBe('Jan 1, 2012');
				expect(_getPickerDateString('#datepicker-to')).toBe('Jan 1, 2013');
			});

			it('Has no date bucket suggestions if the date is appropriate', function() {
				expect($('#time-window-header').is(':visible')).toBeFalsy();
				expect($('.time-window-option')).not.toExist();
			});

			it('Choosing a daterange outside of a bucket will present bucket options', function() {
				expect(_canvas.find('.time-window-option').length).toBe(0); // no bucket options

				_widgetInst.onFilterChangeRequest(
					appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST,
					{
						view: _viewName,
						startDate: new Date('Jan 1, 2013'),
						endDate: new Date('Jan 2, 2013'),
						duration: 'P1Y',
						numBuckets: 12
					}
				);

				_widgetInst.updateDropdownFromPickers();
				expect(_canvas.find('.time-window-option').length).toBe(2); // 2 bucket options

				_widgetInst.onFilterChangeRequest(
					appChannel.FILTER_DATE_PICKER_CHANGE_REQUEST,
					{
						view: _viewName,
						startDate: new Date('Jan 1, 2013'),
						endDate: new Date('Jan 15, 2013'),
						duration: 'P1Y',
						numBuckets: 12
					}
				);

				_widgetInst.updateDropdownFromPickers();
				expect(_canvas.find('.time-window-option').length).toBe(0); // No bucket options
			});
		});
	}
);
