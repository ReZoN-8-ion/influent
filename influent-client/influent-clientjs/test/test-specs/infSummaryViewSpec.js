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
		'views/infSummaryView',
		'lib/constants'
	],	
	function(fixture, constants) {

		describe('Initial View Test', function() {
			it('infSummaryView Has testing enabled', function() {
				expect(constants.UNIT_TESTS_ENABLED).toBeTruthy();
			});

			it('infSummaryView returns a module', function() {
				expect(fixture).toBeDefined();
			});
		});

		//--------------------------------------------------------------------------------------------------------------

		describe('Test _getStat function', function() {
			var stats = {
				myStat: {
					label: 'myStatLabel',
					value: 'myStatValue'
				},
				myMissingLabelStat: {
					value: 'myStatValue'
				},
				myMissingValueStat: {
					label: 'myStatLabel'
				},
				myNullLabelStat: {
					label: null,
					value: 'myStatValue'
				},
				myNullValueStat: {
					label: 'myStatLabel',
					value: null
				},
				myNoObject: null
			};

			it('test proper stat object', function() {
				var stat = fixture._getStat(stats, 'myStat');

				expect(stat.label).toEqual('myStatLabel');
				expect(stat.value).toEqual('myStatValue');
			});

			it('test missing and null values', function() {
				expect(fixture._getStat(stats, 'myMissingLabelStat')).toBe(null);
				expect(fixture._getStat(stats, 'myMissingValueStat')).toBe(null);
				expect(fixture._getStat(stats, 'myNullLabelStat')).toBe(null);
				expect(fixture._getStat(stats, 'myNullValueStat')).toBe(null);
			});
		});

		//--------------------------------------------------------------------------------------------------------------
		var state = fixture._UIObjectState;
		//--------------------------------------------------------------------------------------------------------------

		describe('Test _handleSummaryResponse function', function() {

			it('the summary view handles null responses', function() {

				var response = null;

				state.canvas = $('<div></div>');
				fixture._handleSummaryResponse(response);

				var summaryLabel = state.canvas.find('.summaryCaption');
				expect(summaryLabel.text()).toEqual('SUMMARY DATA UNAVAILABLE');
			});

			it('the summary view handles empty object responses', function() {

				var response = {};

				state.canvas = $('<div></div>');
				fixture._handleSummaryResponse(response);

				var summaryLabel = state.canvas.find('.summaryCaption');
				expect(summaryLabel.text()).toEqual('SUMMARY DATA UNAVAILABLE');
			});

			it('the summary view handles empty array responses', function() {

				var response = [];

				state.canvas = $('<div></div>');
				fixture._handleSummaryResponse(response);

				var summaryLabel = state.canvas.find('.summaryCaption');
				expect(summaryLabel.text()).toEqual('SUMMARY DATA UNAVAILABLE');
			});

			it('the summary view handles proper responses', function() {

				var response = [
					{
						key: 'InfoSummary',
						label: 'ABOUT',
						value: 'Some Interesting Description'
					},
					{
						key: 'ExtraValue1',
						label: 'Extra Value 1 Label',
						value: 'Extra Value 1 Value'
					},
					{
						key: 'ExtraValue2',
						label: 'Extra Value 2 Label',
						value: 'Extra Value 2 Value'
					},
					{
						key: 'ExtraValue3',
						label: 'Extra Value 3 Label',
						value: 'Extra Value 3 Value'
					}
				];

				state.canvas = $('<div></div>');
				fixture._handleSummaryResponse(JSON.stringify(response));

				expect(state.canvas.find('.app-logo span').text()).toEqual('ABOUT');
				expect(state.canvas.find('.summaryCaption').text()).toEqual('Some Interesting Description');

				var statLabels = ['Extra Value 1 Label', 'Extra Value 2 Label', 'Extra Value 3 Label'];
				var statValues = ['Extra Value 1 Value', 'Extra Value 2 Value', 'Extra Value 3 Value'];

				state.canvas.find('#summaryStats .caption').each(
					function(index) {
						var label = $(this).find('.summaryViewLabel').text();
						var value = $(this).find('.summaryViewValue').text();

						expect(label).toEqual(statLabels[index]);
						expect(value).toEqual(statValues[index]);
					}
				);
			});
		});
	}
);
