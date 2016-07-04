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
		RESULT_VISIBILITY_CHANGE: 'accounts-result-visibility-change',

		/**
		 * data {
		 *      xfId: (string)
		 *      isSelected: (boolean)
		 * }
		 */
		RESULT_SELECTION_CHANGE: 'accounts-result-selection-change',

		/**
		 * data {
		 *      xfId: (string)
		 *      container: (object)
		 * }
		 */
		RESULT_ENTITY_FULL_DETAILS_SHOW: 'accounts-result-entity-full-details-show',

		/**
		 * data {
		 *      xfId: (string)
		 *      isExpanded: (boolean)
		 * }
		 */
		RESULT_CLUSTER_VISIBILITY_CHANGE: 'accounts-result-cluster-visibility-change',

		/**
		 * data {
		 *		searchString: (string)
		 * }
		 */
		RESULT_SORT_ORDER_CHANGE: 'accounts-result-sort-order-change'
	}
);
