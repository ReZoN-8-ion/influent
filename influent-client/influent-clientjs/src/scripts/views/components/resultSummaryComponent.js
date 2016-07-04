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
		'hbs!templates/searchResults/resultsSummary'
	],
	function(
		resultsSummaryTemplate
	) {
		var state = {
			template : null,
			results : false,
			sortedBy : null,
			sumVisible : 0,
			sumTotal : 0
		};

		//--------------------------------------------------------------------------------------------------------------

		var _reset = function(container, summaryData) {
			container.empty();

			state.results = summaryData.results;
			state.sortedBy = summaryData.sortedBy;
			state.sumVisible = summaryData.sumVisible;
			state.sumTotal = summaryData.sumTotal;

			state.template = resultsSummaryTemplate(summaryData);

			container.append(state.template);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _refresh = function(container, summaryData) {

			if (state.results !== summaryData.results) {
				_reset(container, summaryData);
			} else {
				if (state.sumVisible !== summaryData.sumVisible) {
					state.sumVisible = summaryData.sumVisible;
					$('.infSearchResultSumVisibleCount').text(state.sumVisible);
				}

				if (state.sumTotal !== summaryData.sumTotal) {
					state.sumTotal = summaryData.sumTotal;
					$('.infSearchResultSumTotalCount').text(state.sumTotal);
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		return {
			setSearchSummaryStats : _reset,
			updateSearchSummaryStats : _refresh
		};
	}
);
