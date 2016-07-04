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
		'views/components/resultFooterComponentBase',
		'lib/communication/accountsViewChannels'
	],
	function(
		fixture,
		accountsChannel
	) {

		//--------------------------------------------------------------------------------------------------------------

		describe('resultFooterComponentBase tests', function() {

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the resultComponentBase fixture is defined', function () {
				expect(fixture).toBeDefined();
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the footer is set up with more results', function () {

				var container = $('<div>');

				fixture.setFooter(
					container,
					true,
					accountsChannel.RESULT_VISIBILITY_CHANGE
				);

				var moreButton = container.find('button');
				expect(moreButton).toExist();

				spyOn(aperture.pubsub, 'publish');

				var spyEvent = spyOnEvent(moreButton, 'click');
				moreButton.trigger('click');

				expect('click').toHaveBeenTriggeredOn(moreButton);
				expect(spyEvent).toHaveBeenTriggered();

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(accountsChannel.RESULT_VISIBILITY_CHANGE);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the footer is set up with no more results', function () {

				var container = $('<div>');

				fixture.setFooter(
					container,
					false,
					accountsChannel.RESULT_VISIBILITY_CHANGE
				);

				var moreButton = container.find('button');
				expect(moreButton).not.toExist();
			});
		});
	}
);
