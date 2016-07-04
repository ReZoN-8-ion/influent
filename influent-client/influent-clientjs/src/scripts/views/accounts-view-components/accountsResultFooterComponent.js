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
		'views/components/resultFooterComponentBase'
	],
	function(
		accountsChannel,
		resultFooterComponentBase
	) {


		//--------------------------------------------------------------------------------------------------------------

		var _set = function(container, hasMore) {

			resultFooterComponentBase.setFooter(
				container,
				hasMore,
				accountsChannel.RESULT_VISIBILITY_CHANGE
			);
		};

		//--------------------------------------------------------------------------------------------------------------

		return {
			setFooter : _set
		};
	}
);
