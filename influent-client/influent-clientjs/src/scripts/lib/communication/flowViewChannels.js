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
	{
		/**
		 *
		 */
		PATTERN_SEARCH_REQUEST : 'flow-pattern-search-request',

		/*
		 * data {
		 *    shownMatches: (number)
		 *    totalMatches: (number)
		 * }
		 */
		SEARCH_RESULTS_RETURNED_EVENT : 'flow-search-results-returned-event',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		PREV_SEARCH_PAGE_REQUEST : 'flow-prev-search-page-request',

		/*
		 * data {
		 *    xfId: (string)
		 * }
		 */
		NEXT_SEARCH_PAGE_REQUEST : 'flow-next-search-page-request',

		/*
		 * data {
		 *    xfId: (string)
		 *    page: (number)
		 *    noRender: (boolean)
		 * }
		 */
		SET_SEARCH_PAGE_REQUEST : 'flow-set-search-page-request',

		/*
		 * data {
		 *    xfId: (string)
		 *    isHighlighted: (boolean)
		 * }
		 */
		HIGHLIGHT_PATTERN_SEARCH_ARGUMENTS : 'highlight-pattern-search-arguments'
	}
);
