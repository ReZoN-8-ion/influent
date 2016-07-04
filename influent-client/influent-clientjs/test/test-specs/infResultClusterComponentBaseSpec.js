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
		'views/components/resultClusterComponentBase',
		'lib/communication/accountsViewChannels'
	],
	function(
		fixture,
		accountsChannel
	) {

		//--------------------------------------------------------------------------------------------------------------

		describe('resultClusterComponentBase tests', function() {

			var container;
			var clusterData;
			var returnedCanvas;

			beforeEach(function () {

				container = $('<div>');

				clusterData = {
					clusterLabel:'Uganda, Kyenjojo'
				};

				returnedCanvas = fixture.addSearchResultCluster(
					'myXfId',
					container,
					clusterData,
					accountsChannel.RESULT_SELECTION_CHANGE,
					accountsChannel.RESULT_CLUSTER_VISIBILITY_CHANGE
				);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the resultComponentBase fixture is defined', function () {
				expect(fixture).toBeDefined();
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure results div is created', function () {
				expect(returnedCanvas).toExist();
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the addCollapseHandler is set up', function () {

				// Check initial state of the cluster (should be expanded)

				var accordian = container.find('.infResultClusterAccordionButton');
				expect(accordian).toExist();

				var cluster = container.find('.batchResults');
				expect(cluster).toExist();
				expect(cluster).toHaveClass('in');

				var icon = accordian.find('.infResultClusterAccordionButtonIcon');
				expect(icon).toExist();
				expect(icon).toHaveClass('glyphicon-chevron-up');

				// Set up spies and click the visibility button

				spyOn(aperture.pubsub, 'publish');

				var spyEvent = spyOnEvent(accordian, 'click');
				accordian.trigger('click');

				expect('click').toHaveBeenTriggeredOn(accordian);
				expect(spyEvent).toHaveBeenTriggered();

				// check that the cluster is collapsed and a pubsub is sent

				cluster = container.find('.batchResults');
				expect(cluster).toExist();
				expect(cluster).not.toHaveClass('in');

				icon = accordian.find('.infResultClusterAccordionButtonIcon');
				expect(icon).toExist();
				expect(icon).toHaveClass('glyphicon-chevron-down');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_CLUSTER_VISIBILITY_CHANGE,
					{
						xfId: 'myXfId',
						isExpanded: false
					}
				);

				// click the visibility button again

				accordian.trigger('click');

				expect('click').toHaveBeenTriggeredOn(accordian);
				expect(spyEvent).toHaveBeenTriggered();

				// check that the cluster is expanded and a pubsub is sent

				cluster = container.find('.batchResults');
				expect(cluster).toExist();
				expect(cluster).toHaveClass('in');

				icon = accordian.find('.infResultClusterAccordionButtonIcon');
				expect(icon).toExist();
				expect(icon).toHaveClass('glyphicon-chevron-up');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_CLUSTER_VISIBILITY_CHANGE,
					{
						xfId: 'myXfId',
						isExpanded: true
					}
				);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the addSelectionClickHandler is set up', function () {

				var toggle = container.find('.infSelectGroupResults');
				expect(toggle).toExist();

				spyOn(aperture.pubsub, 'publish');

				spyOnEvent(toggle, 'click');

				toggle.find('input').prop('checked', 'checked');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SELECTION_CHANGE,
					{
						xfId: 'myXfId',
						isSelected: toggle.find('input').prop('checked')
					}
				);

				toggle.find('input').removeProp('checked');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SELECTION_CHANGE,
					{
						xfId: 'myXfId',
						isSelected: toggle.find('input').prop('checked')
					}
				);
			});
		});
	}
);
