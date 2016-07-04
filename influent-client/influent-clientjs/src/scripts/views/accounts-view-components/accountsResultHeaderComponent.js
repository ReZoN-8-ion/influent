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
		'views/components/resultHeaderComponentBase'
	],
	function(
		accountsChannel,
		resultHeaderComponentBase
	) {

		//--------------------------------------------------------------------------------------------------------------

		var _reset = function(xfId, headerContainer, resultsContainer, headerData, totalResults, currentSearchString) {

			resultHeaderComponentBase.setSearchResultsHeader(
				xfId,
				headerContainer,
				resultsContainer,
				headerData,
				totalResults,
				currentSearchString,
				accountsChannel.RESULT_SELECTION_CHANGE,
				accountsChannel.RESULT_SORT_ORDER_CHANGE
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		return {
			setSearchResultsHeader : _reset
		};
	}
);
