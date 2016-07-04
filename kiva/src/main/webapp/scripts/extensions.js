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
		'hbs!templates/accountsView/searchDetailsOverlay',
	],
	function(
		searchDetailsOverlay
	){
		aperture.log.info('loaded Kiva extensions module');

		//--------------------------------------------------------------------------------------------------------------

		var _addPromptForDetailsClickHandler = function($details, xfId, callback) {
			$details.find('.infSearchResultTextbox button').click(function() {
				callback($details, xfId);
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		// return the module to the plugin in config.js
		return {
			promptForDetails : function($details, result, callback) {
				// TODO: FIX!! extensions cannot require knowledge of influent internals to work.
				var $resultDetails = $details.find('.resultDetails');

				var template = searchDetailsOverlay();
				$resultDetails.append(template);
				_addPromptForDetailsClickHandler($details, result.getXfId(), callback);
			}
		};
	}
);
