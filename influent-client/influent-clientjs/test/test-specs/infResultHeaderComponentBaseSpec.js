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
		'views/components/resultHeaderComponentBase',
		'lib/communication/accountsViewChannels'
	],
	function(
		fixture,
		accountsChannel
	) {

		var headerInfo ={
			'columns':[
				{'isImage':true,'columnWidth':'100px','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'Image','typeMappings':{'lender':'image','loan':'image','partner':'image'},'searchableBy':'NONE','propertyType':'IMAGE','range':'SINGLETON','defaultTerm':false,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'image'},'numFormat':false},
				{'isImage':false,'columnWidth':'16.666666666666668%','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'Name','typeMappings':{'lender':'lenders_name','loan':'loans_name','partner':'partners_name'},'searchableBy':'FREE_TEXT','propertyType':'STRING','range':'SINGLETON','defaultTerm':true,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'NAME'},'numFormat':false},
				{'isImage':false,'columnWidth':'16.666666666666668%','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'ID','typeMappings':{'lender':'id','loan':'id','partner':'id'},'searchableBy':'DESCRIPTOR','propertyType':'STRING','range':'SINGLETON','defaultTerm':true,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'id'},'numFormat':false},
				{'isImage':false,'columnWidth':'16.666666666666668%','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'Type','typeMappings':{'lender':'type','loan':'type','partner':'type'},'searchableBy':'NONE','propertyType':'STRING','range':'SINGLETON','defaultTerm':false,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'type'},'numFormat':false},
				{'isImage':false,'columnWidth':'16.666666666666668%','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'Location','typeMappings':{'lender':'geo','loan':'geo','partner':'geo'},'searchableBy':'NONE','propertyType':'GEO','range':'SINGLETON','defaultTerm':false,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'geo'},'numFormat':false},
				{'isImage':false,'columnWidth':'16.666666666666668%','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'Transactions','typeMappings':{'lender':'numTransactions','loan':'numTransactions','partner':'numTransactions'},'searchableBy':'NONE','propertyType':'INTEGER','range':'SINGLETON','defaultTerm':false,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'numTransactions'},'numFormat':true},
				{'isImage':false,'columnWidth':'16.666666666666668%','orderAsc':false,'orderDesc':false,'property':{'friendlyText':'Average (USD)','typeMappings':{'lender':'avgTransaction','loan':'avgTransaction','partner':'avgTransaction'},'searchableBy':'NONE','propertyType':'DOUBLE','range':'SINGLETON','defaultTerm':false,'constraint':'FUZZY_PARTIAL_OPTIONAL','key':'avgTransaction'},'numFormat':true}
			]
		};

		//--------------------------------------------------------------------------------------------------------------

		describe('resultHeaderComponentBase tests', function() {

			var headerContainer;
			var resultsContainer;

			beforeEach(function () {

				headerContainer = $('<div>');
				resultsContainer = $('<div>');

				fixture.setSearchResultsHeader(
					'myXfId',
					headerContainer,
					resultsContainer,
					headerInfo,
					7,
					'search string',
					accountsChannel.RESULT_SELECTION_CHANGE,
					accountsChannel.RESULT_SORT_ORDER_CHANGE
				);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the resultComponentBase fixture is defined', function () {
				expect(fixture).toBeDefined();
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the addSelectionClickHandler is set up', function () {

				var toggle = headerContainer.find('.infSearchResultsSelectAll');
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

				var column = headerContainer.find('.summaryColumnHeader');
				spyOnEvent(column, 'click');
				$(column[1]).trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SORT_ORDER_CHANGE,
					{
						searchString: 'search string ORDER:NAME'

					}
				);
			});
		});
	}
);
