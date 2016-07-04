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
		'lib/toolbar/infToolbarOptionPicker',
		'lib/extern/OpenAjaxUnmanagedHub'
	],
	function(
		appChannel,
		constants,
		infToolbarOptionPicker
	) {

		describe('infToolbarOptionPicker adds an option selection widget to a view toolbar', function() {

			var widgetInst = null;
			var viewName = 'TEST_VIEW';
			var canvas = $('<div><div class="row"></div></div>');

			it('Has testing enabled', function () {
				expect(constants.UNIT_TESTS_ENABLED).toBeTruthy();
			});

			it('Returns a module', function() {
				expect(infToolbarOptionPicker).toBeDefined();
			});

			it('Creates and returns an instance', function() {
				widgetInst = infToolbarOptionPicker.createInstance(viewName, canvas, {
					elements: ['Test1', 'Test2', 'Test3'],
					selection: 'Test1'
				});
				expect(widgetInst).toBeDefined();
			});


			it ('Renders to a div', function() {
				widgetInst.render();
			});

			it('Responds to picker input and notifies subscribers', function() {

				// Todo - move this out to individual widget tests?
				var selectChangeCallback = jasmine.createSpy();

				var subTokens = {};
				subTokens[appChannel.FILTER_OPTION_PICKER_CHANGE_EVENT] = aperture.pubsub.subscribe(appChannel.FILTER_OPTION_PICKER_CHANGE_EVENT, selectChangeCallback);

				aperture.pubsub.publish(appChannel.FILTER_OPTION_PICKER_CHANGE_REQUEST, {
					view: viewName,
					selection: 'Test2'
				});

				expect(selectChangeCallback).toHaveBeenCalledWith(appChannel.FILTER_OPTION_PICKER_CHANGE_EVENT,	{
					view: viewName,
					selection: 'Test2'
				}, undefined, undefined);
			});
		});
	}
);
