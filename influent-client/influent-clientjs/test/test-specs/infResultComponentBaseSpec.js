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
		'views/components/resultComponentBase',
		'lib/communication/accountsViewChannels',
		'lib/models/xfEntityResult'
	],
	function(
		fixture,
		accountsChannel,
	    xfResult
	) {

		var config = aperture.config.get()['influent.config'];

		var headerInfo = {
			"columns":[
				{"isImage":true,"columnWidth":"100px","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":false,"propertyType":"IMAGE","range":"SINGLETON","freeTextIndexed":false,"friendlyText":"Image","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"image","typeMappings":{"partner":"image","loan":"image","lender":"image"}},"numFormat":false},
				{"isImage":false,"columnWidth":"16.666666666666668%","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":true,"propertyType":"STRING","range":"SINGLETON","freeTextIndexed":true,"friendlyText":"Name","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"NAME","typeMappings":{"partner":"partners_name","loan":"loans_name","lender":"lenders_name"}},"numFormat":false},
				{"isImage":false,"columnWidth":"16.666666666666668%","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":true,"propertyType":"STRING","range":"SINGLETON","freeTextIndexed":false,"friendlyText":"ID","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"id","typeMappings":{"partner":"id","loan":"id","lender":"id"}},"numFormat":false},
				{"isImage":false,"columnWidth":"16.666666666666668%","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":false,"propertyType":"STRING","range":"SINGLETON","freeTextIndexed":false,"friendlyText":"Type","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"type","typeMappings":{"partner":"type","loan":"type","lender":"type"}},"numFormat":false},
				{"isImage":false,"columnWidth":"16.666666666666668%","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":false,"propertyType":"GEO","range":"SINGLETON","freeTextIndexed":false,"friendlyText":"Location","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"geo","typeMappings":{"partner":"geo","loan":"geo","lender":"geo"}},"numFormat":false},
				{"isImage":false,"columnWidth":"16.666666666666668%","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":false,"propertyType":"INTEGER","range":"SINGLETON","freeTextIndexed":false,"friendlyText":"Transactions","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"numTransactions","typeMappings":{"partner":"numTransactions","loan":"numTransactions","lender":"numTransactions"}},"numFormat":true},
				{"isImage":false,"columnWidth":"16.666666666666668%","orderAsc":false,"orderDesc":false,"property":{"defaultTerm":false,"propertyType":"DOUBLE","range":"SINGLETON","freeTextIndexed":false,"friendlyText":"Average (USD)","constraint":"FUZZY_PARTIAL_OPTIONAL","key":"avgTransaction","typeMappings":{"partner":"avgTransaction","loan":"avgTransaction","lender":"avgTransaction"}},"numFormat":true}
			]
		};

		var resultSpec = {
			'uid':'a.loan.b224648',
			'entitytags':['ACCOUNT'],
			'properties':{
				'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':130,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},
				'geo':{'tags':['GEO'],'value':{'lon':33,'text':'Uganda, Kyenjojo','cc':'UGA','lat':2},'friendlyText':'Location','displayOrder':7,'key':'geo'},
				'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/586879.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},
				'label':{'tags':['LABEL'],'value':'Bob. Uganda, Kyenjojo','friendlyText':'Label','displayOrder':8,'key':'label'},
				'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},
				'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},
				'id':{'tags':['ID','RAW'],'value':'b224648','friendlyText':'ID','displayOrder':2,'key':'id'},
				'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'UG','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},
				'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},
				'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},
				'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':325,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},
				'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},
				'latestTransaction':{'tags':['STAT','DATE'],'value':1293771600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},
				'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':325,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},
				'earliestTransaction':{'tags':['STAT','DATE'],'value':1282017600000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},
				'numTransactions':{'tags':['COUNT','STAT'],'value':5,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},
				'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}
			},
			'type':'loan',
			'entitytype':'entity'
		};

		var snippet = [
			{'index':0,'key':'loans_location_countryCode','friendlyText':'Country Code','value':'UG','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['RAW','FILTERABLE']},
			{'index':1,'key':'loans_loanAmount','friendlyText':'Loan Amount','value':'325','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['AMOUNT','RAW']},
			{'index':2,'key':'loans_status','friendlyText':'Status','value':'paid','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['STATUS','TEXT','RAW']},
			{'index':3,'key':'label','friendlyText':'Label','value':'Bob. Uganda, Kyenjojo','isHTML':false,'matchTerms':['bob'],'matchCount':1,'tags':['LABEL']},
			{'index':4,'key':'loans_description_texts_en','friendlyText':'Description','value':'Description text','isHTML':false,'matchTerms':['bob'],'matchCount':1,'tags':['TEXT','ANNOTATION','RAW','HTML']},
			{'index':5,'key':'inboundDegree','friendlyText':'Inbound Sources','value':'1','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['INFLOWING']},
			{'index':6,'key':'outboundDegree','friendlyText':'Outbound Targets','value':'1','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['OUTFLOWING']},
			{'index':7,'key':'maxTransaction','friendlyText':'Largest Transaction','value':'$325.00','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['AMOUNT','STAT','USD']},
			{'index':8,'key':'earliestTransaction','friendlyText':'Earliest Transaction','value':'August 17, 2010','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['STAT','DATE']},
			{'index':9,'key':'latestTransaction','friendlyText':'Latest Transaction','value':'December 31, 2010','isHTML':false,'matchTerms':null,'matchCount':0,'tags':['STAT','DATE']}
		];

		//--------------------------------------------------------------------------------------------------------------

		describe('resultComponentBase tests', function() {

			var container;
			var result;

			beforeEach(function () {

				container = $('<div>');
				result = xfResult.createInstance(resultSpec);

				fixture.addSearchResult(
					result.getXfId(),
					container,
					headerInfo,
					result,
					snippet,
					accountsChannel.RESULT_SELECTION_CHANGE,
					accountsChannel.RESULT_ENTITY_DETAILS_CHANGE
				);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the resultComponentBase fixture is defined', function () {
				expect(fixture).toBeDefined();
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure summary and details divs are created', function () {
				expect(container.find('#summary_' + result.getXfId())).toExist();
				expect(container.find('#details_' + result.getXfId())).toExist();
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the addDetailsClickHandler is set up', function () {
				expect(container.find('.infSearchResultStateToggle')).toExist();

				var toggle = container.find('.infSearchResultStateToggle');

				spyOn(aperture.pubsub, 'publish');

				spyOnEvent(toggle, 'click');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_ENTITY_DETAILS_CHANGE,
					{
						xfId: result.getXfId(),
						container: container.find('#details_' + result.getXfId())
					}
				);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the addSelectionClickHandler is set up', function () {
				expect(container.find('.selectSingleResult')).toExist();

				var toggle = container.find('.selectSingleResult');

				spyOn(aperture.pubsub, 'publish');

				spyOnEvent(toggle, 'click');

				toggle.find('input').prop('checked', 'checked');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SELECTION_CHANGE,
					{
						xfId: result.getXfId(),
						isSelected: toggle.find('input').prop('checked')
					}
				);

				toggle.find('input').removeProp('checked');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SELECTION_CHANGE,
					{
						xfId: result.getXfId(),
						isSelected: toggle.find('input').prop('checked')
					}
				);
			});

			//----------------------------------------------------------------------------------------------------------

			it('Ensure the selection highlighting works', function () {
				expect(container.find('.selectSingleResult')).toExist();

				var toggle = container.find('.selectSingleResult');

				expect(toggle).not.toHaveClass('searchResultSelected');

				spyOn(aperture.pubsub, 'publish');

				spyOnEvent(toggle, 'click');

				toggle.find('input').prop('checked', 'checked');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SELECTION_CHANGE,
					{
						xfId: result.getXfId(),
						isSelected: toggle.find('input').prop('checked')
					}
				);

				expect(toggle).toHaveClass('searchResultSelected');

				toggle.find('input').prop('checked', '');
				toggle.trigger('click');

				expect(aperture.pubsub.publish).toHaveBeenCalledWith(
					accountsChannel.RESULT_SELECTION_CHANGE,
					{
						xfId: result.getXfId(),
						isSelected: toggle.find('input').prop('checked')
					}
				);

				expect(toggle).not.toHaveClass('searchResultSelected');
			});
		});

		//--------------------------------------------------------------------------------------------------------------

		xdescribe('prompting for details test', function() {

			var container;
			var result;

			beforeEach(function () {

				container = $('<div>');
				result = xfResult.createInstance(resultSpec);
				result.setDetailsPrompt(true);

				fixture.addSearchResult(
					result.getXfId(),
					container,
					headerInfo,
					result,
					snippet,
					accountsChannel.RESULT_SELECTION_CHANGE,
					accountsChannel.RESULT_ENTITY_DETAILS_CHANGE
				);
			});

			it('Ensure prompting for details works properly', function() {

				var resultDetails = container.find('.resultDetails');
				expect(resultDetails).toExist();

				var promptOverlay = container.find('.infSearchResultOverlay');
				expect(promptOverlay).toExist();

				var acceptButton = promptOverlay.find('.infSearchResultTextbox button');
				expect(acceptButton).toExist();

				var spyEvent = spyOnEvent(acceptButton, 'click');

				acceptButton.trigger('click');

				expect('click').toHaveBeenTriggeredOn(acceptButton);
				expect(spyEvent).toHaveBeenTriggered();

				expect(result.getDetailsPrompt()).toBe(false);

				promptOverlay = container.find('.infSearchResultOverlay');
				expect(promptOverlay).not.toExist();
			});
		});
	}
);
