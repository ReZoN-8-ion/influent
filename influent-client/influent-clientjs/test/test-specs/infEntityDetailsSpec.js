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
		'modules/infEntityDetails',
		'lib/constants',
		'modules/infRest',
		'lib/communication/applicationChannels',
		'lib/module'
	],
	function(
		fixture,
		constants,
		infRest,
		appChannel,
		modules)
	{

		var state = fixture._UIObjectState;

		var entityDetails = {
			"uid":"a.loan.b150236",
			"entitytype":"entity",
			"entitytags":["ACCOUNT"],
			"type":"loan",
			"properties":{
				"loans_plannedExpirationDate":{"friendlyText":"Planned Expiration Date","displayOrder":35,"value":-2209143600000,"key":"loans_plannedExpirationDate","tags":["DATE"]},
				"numTransactions":{"friendlyText":"Number of Transactions","displayOrder":31,"value":46,"key":"numTransactions","tags":["COUNT","STAT"]},
				"lon":{"friendlyText":"Longitude","displayOrder":26,"value":31.6,"key":"lon","tags":["RAW"]},
				"loans_sector":{"friendlyText":"Sector","displayOrder":37,"value":"Food","key":"loans_sector","tags":["TEXT"]},
				"loans_terms_disbursalDate":{"friendlyText":"Disbursal Date","displayOrder":7,"value":1256713200000,"key":"loans_terms_disbursalDate","tags":["DATE"]},
				"type":{"friendlyText":"Kiva Account Type","displayOrder":17,"value":"loan","key":"type","tags":["TYPE"]},
				"loans_fundedDate":{"friendlyText":"Funded Date","displayOrder":10,"value":1257601880000,"key":"loans_fundedDate","tags":["DATE"]},
				"geo":{"friendlyText":"Location","displayOrder":25,"value":{"cc":"SSD","lon":31.6,"text":"South Sudan, Gudele","lat":4.85},"key":"geo","tags":["GEO"]},
				"loans_loanAmount":{"friendlyText":"Loan Amount","displayOrder":23,"value":200,"key":"loans_loanAmount","tags":["AMOUNT","SUMMARY"]},
				"inboundDegree":{"friendlyText":"Inbound Sources","displayOrder":16,"value":1,"key":"inboundDegree","tags":["INFLOWING"]},
				"loans_terms_disbursalCurrency":{"friendlyText":"Disbursal Currency","displayOrder":6,"value":"SDG","key":"loans_terms_disbursalCurrency","tags":["TEXT"]},
				"loans_name":{"friendlyText":"Name","displayOrder":30,"value":"Daniel","key":"loans_name","tags":["NAME","SUMMARY"]},
				"loans_status":{"friendlyText":"Status","displayOrder":38,"value":"paid","key":"loans_status","tags":["STATUS","TEXT","SUMMARY"]},
				"loans_location_town":{"friendlyText":"Town","displayOrder":39,"value":"Gudele","key":"loans_location_town","tags":["RAW"]},
				"loans_description_texts_en":{"friendlyText":"Description","displayOrder":41,"value":'Daniel G. is 21 years old and married...large retail shop.<br><p><br><b>About BRAC</b><br>BRAC\'s holistic approach...women members.',"key":"loans_description_texts_en","tags":["TEXT","ANNOTATION","SUMMARY","HTML"]},
				"latestTransaction":{"friendlyText":"Latest Transaction","displayOrder":21,"value":1288065600000,"key":"latestTransaction","tags":["STAT","DATE"]},
				"earliestTransaction":{"friendlyText":"Earliest Transaction","displayOrder":8,"value":1256702400000,"key":"earliestTransaction","tags":["STAT","DATE"]},
				"id":{"friendlyText":"ID","displayOrder":14,"value":"b150236","key":"id","tags":["ID","SUMMARY"]},
				"loans_terms_loanAmount":{"friendlyText":"Loan Amount","displayOrder":24,"value":200,"key":"loans_terms_loanAmount","tags":["AMOUNT"]},
				"avgTransaction":{"friendlyText":"Average Transaction (USD)","displayOrder":1,"value":8.695652173913041,"key":"avgTransaction","tags":["AMOUNT","STAT","USD"]},
				"lat":{"friendlyText":"Latitude","displayOrder":22,"value":4.85,"key":"lat","tags":["RAW"]},
				"timestamp":{"friendlyText":"Last Updated","displayOrder":20,"value":1392057089333,"key":"timestamp","tags":["DATE"]},
				"image":{"friendlyText":"Image","displayOrder":15,"range":{"values":["http://www.kiva.org/img/w400/421251.jpg","http://www.kiva.org/img/w400/146773.jpg","http://www.kiva.org/img/w400/148448.jpg"],"type":"STRING"},"key":"image","tags":["IMAGE"]},
				"loans_fundedAmount":{"friendlyText":"Funded Amount","displayOrder":9,"value":200,"key":"loans_fundedAmount","tags":["AMOUNT"]},
				"loans_paidAmount":{"friendlyText":"Paid Amount","displayOrder":33,"value":200,"key":"loans_paidAmount","tags":["AMOUNT"]},
				"loans_terms_disbursalAmount":{"friendlyText":"Disbursal Amount","displayOrder":5,"value":400,"key":"loans_terms_disbursalAmount","tags":["AMOUNT"]},
				"loans_location_country":{"friendlyText":"Country","displayOrder":3,"value":"South Sudan","key":"loans_location_country","tags":["RAW"]},
				"loans_location_countryCode":{"friendlyText":"Country Code","displayOrder":4,"value":"QS","key":"loans_location_countryCode","tags":["RAW","FILTERABLE"]},
				"label":{"friendlyText":"Label","displayOrder":18,"value":"Daniel. South Sudan, Gudele","key":"label","tags":["LABEL"]},
				"outboundDegree":{"friendlyText":"Outbound Targets","displayOrder":32,"value":1,"key":"outboundDegree","tags":["OUTFLOWING"]},
				"loans_activity":{"friendlyText":"Activity","displayOrder":0,"value":"","key":"loans_activity","tags":["TEXT"]},
				"loans_basketAmount":{"friendlyText":"Basket Amount","displayOrder":2,"value":0,"key":"loans_basketAmount","tags":["AMOUNT"]},
				"loans_terms_lossLiability_nonpayment":{"friendlyText":"Loss Liability Non-Payment","displayOrder":29,"value":"partner","key":"loans_terms_lossLiability_nonpayment","tags":["RAW"]},
				"loans_paidDate":{"friendlyText":"Paid Date","displayOrder":34,"value":1289902867000,"key":"loans_paidDate","tags":["DATE"]},
				"loans_location_geo_pairs":{"friendlyText":"Geo Pairs","displayOrder":12,"value":"4.85 31.6","key":"loans_location_geo_pairs","tags":["RAW"]},
				"loans_location_geo_type":{"friendlyText":"Geo Type","displayOrder":13,"value":"point","key":"loans_location_geo_type","tags":["RAW"]},
				"loans_terms_lossLiability_currencyExchange":{"friendlyText":"Loss Liability Currency Exchange","displayOrder":28,"value":"shared","key":"loans_terms_lossLiability_currencyExchange","tags":["RAW"]},
				"loans_postedDate":{"friendlyText":"Posted Date","displayOrder":36,"value":1257593411000,"key":"loans_postedDate","tags":["DATE"]},
				"loans_location_geo_level":{"friendlyText":"Geo Level","displayOrder":11,"value":"country","key":"loans_location_geo_level","tags":["RAW"]},
				"maxTransaction":{"friendlyText":"Largest Transaction","displayOrder":19,"value":200,"key":"maxTransaction","tags":["AMOUNT","STAT","USD"]},
				"loans_terms_lossLiability_currencyExchangeCoverageRate":{"friendlyText":"Loss Liability Coverage Rate","displayOrder":27,"value":0.20000000298023224,"key":"loans_terms_lossLiability_currencyExchangeCoverageRate","tags":["RAW"]},
				"loans_use":{"friendlyText":"Use","displayOrder":40,"value":"To purchase other food items to sell","key":"loans_use","tags":["TEXT"]}
			}
		};

		var clusterDetailsData = {
			"xfId":"immutable_52925096-4AD4-5CD3-33E3-49C8525DD44F",
			"uiType":"xfImmutableCluster",
			"spec":{
				"parent":{},
				"type":"xfImmutableCluster",
				"accounttype":"cluster",
				"dataId":"c.null.b23f11cb-3f9a-474f-ae1e-41635f88215d",
				"count":5,
				"members":[
					{"parent":{},"type":"xfEntity","accounttype":"entity","dataId":"a.lender.lsarah5173","icons":[],"graphUrl":"","flow":{},"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]},"duplicateCount":1,"label":"","confidenceInSrc":1,"confidenceInAge":1,"unbranchable":false,"inDegree":0,"outDegree":0,"leftOperation":"branch","rightOperation":"branch","promptForDetails":false},
					{"parent":{},"type":"xfEntity","accounttype":"entity","dataId":"a.lender.lmas8315","icons":[],"graphUrl":"","flow":{},"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]},"duplicateCount":1,"label":"","confidenceInSrc":1,"confidenceInAge":1,"unbranchable":false,"inDegree":0,"outDegree":0,"leftOperation":"branch","rightOperation":"branch","promptForDetails":false},
					{"parent":{},"type":"xfEntity","accounttype":"entity","dataId":"a.lender.lruth5287","icons":[],"graphUrl":"","flow":{},"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]},"duplicateCount":1,"label":"","confidenceInSrc":1,"confidenceInAge":1,"unbranchable":false,"inDegree":0,"outDegree":0,"leftOperation":"branch","rightOperation":"branch","promptForDetails":false},
					{"parent":{},"type":"xfEntity","accounttype":"entity","dataId":"a.lender.lmartial3595","icons":[],"graphUrl":"","flow":{},"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]},"duplicateCount":1,"label":"","confidenceInSrc":1,"confidenceInAge":1,"unbranchable":false,"inDegree":0,"outDegree":0,"leftOperation":"branch","rightOperation":"branch","promptForDetails":false},
					{"parent":{},"type":"xfEntity","accounttype":"entity","dataId":"a.lender.lragnar3899","icons":[],"graphUrl":"","flow":{},"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]},"duplicateCount":1,"label":"","confidenceInSrc":1,"confidenceInAge":1,"unbranchable":false,"inDegree":0,"outDegree":0,"leftOperation":"branch","rightOperation":"branch","promptForDetails":false}
				],
				"icons":[
					{"type":"TYPE","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Person?iconWidth=24&iconHeight=24&role=business","title":"lender (5)","score":1,"friendlyName":"Kiva Account Type"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=SWE&country=SWE","title":"Sweden (1)","score":0.2,"friendlyName":"Location"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=USA&country=USA","title":"United States (1)","score":0.2,"friendlyName":"Location"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=FRA&country=FRA","title":"France (1)","score":0.2,"friendlyName":"Location"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=GBR&country=GBR","title":"United Kingdom (1)","score":0.2,"friendlyName":"Location"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=AUS&country=AUS","title":"Australia (1)","score":0.2,"friendlyName":"Location"}
				],
				"graphUrl":"http://localhost:8080/kiva/rest/chart?hash=D5905D9C-43A8-6672-A5F9-3AE2F37BF824|column_0BB01220-84D8-D4E0-60E7-20B278D4B17E|file_E17075CC-525E-BA2C-C5A8-2F3C43AFE02C|2010-03-01T00:00:00.000Z|2011-07-01T00:00:00.000Z|19.23|16|140|60|c.null.b23f11cb-3f9a-474f-ae1e-41635f88215d:1|f|a.loan.b150236",
				"flow":{},
				"duplicateCount":1,
				"label":"Dotty Cecil",
				"confidenceInSrc":0.14260008899851,
				"confidenceInAge":0,
				"unbranchable":false,
				"inDegree":1582,
				"outDegree":1622,
				"leftOperation":"branch",
				"rightOperation":"branch",
				"ownerId":"",
				"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]}
			}
		};


		var clusterSummary = {
			"uid":"s.partner.p204",
			"entitytype":"entity",
			"entitytags":["ACCOUNT_OWNER"],
			"type":"partner",
			"properties":{
				"CLUSTER_SUMMARY":{"friendlyText":"CLUSTER_SUMMARY","displayOrder":1,"value":"s.partner.sp204","key":"CLUSTER_SUMMARY","tags":["CLUSTER_SUMMARY"]},
				"image":{"friendlyText":"Image","displayOrder":8,"range":{"values":["http://www.kiva.org/img/w400/1173658.jpg"],"type":"STRING"},"key":"image","tags":["IMAGE"]},
				"partners_dueDiligenceType":{"friendlyText":"Due Diligence Type","displayOrder":5,"value":"Full","key":"partners_dueDiligenceType","tags":["TEXT"]},
				"partners_defaultRate":{"friendlyText":"Default Rate","displayOrder":3,"value":0,"key":"partners_defaultRate","tags":["STAT"]},
				"numTransactions":{"friendlyText":"Number of Transactions","displayOrder":18,"value":374566,"key":"numTransactions","tags":["COUNT","STAT"]},
				"partners_startDate":{"friendlyText":"Start Date","displayOrder":21,"value":1316780405000,"key":"partners_startDate","tags":["DATE"]},
				"label":{"friendlyText":"Label","displayOrder":11,"value":"VisionFund Cambodia","key":"label","tags":["LABEL"]},
				"partners_delinquencyRate":{"friendlyText":"Delinquency Rate","displayOrder":4,"value":0.011635514923169,"key":"partners_delinquencyRate","tags":["STAT"]},
				"type":{"friendlyText":"Kiva Account Type","displayOrder":10,"value":"partner","key":"type","tags":["TYPE"]},
				"outboundDegree":{"friendlyText":"Outbound Targets","displayOrder":19,"value":31018,"key":"outboundDegree","tags":["OUTFLOWING"]},
				"partners_name":{"friendlyText":"Name","displayOrder":17,"value":"VisionFund Cambodia","key":"partners_name","tags":["NAME","LABEL","SUMMARY"]},
				"geo":{"friendlyText":"Location","displayOrder":16,"range":{"values":[{"cc":"KHM","lon":0,"text":"Cambodia","lat":0},{"cc":"THA","lon":0,"text":"Thailand","lat":0}],"type":"GEO"},"key":"geo","tags":["GEO"]},
				"partners_totalAmountRaised":{"friendlyText":"Total Amount Raised","displayOrder":23,"value":1920225,"key":"partners_totalAmountRaised","tags":["AMOUNT","USD"]},
				"partners_cc":{"friendlyText":"Country Code(s)","displayOrder":2,"value":"KH,TH","key":"partners_cc","tags":["TEXT"]},
				"inboundDegree":{"friendlyText":"Inbound Sources","displayOrder":9,"value":29894,"key":"inboundDegree","tags":["INFLOWING"]},
				"partners_loansPosted":{"friendlyText":"Loans Posted","displayOrder":15,"value":3164,"key":"partners_loansPosted","tags":["AMOUNT","SUMMARY"]},
				"partners_rating":{"friendlyText":"Rating","displayOrder":20,"value":4,"key":"partners_rating","tags":["STAT"]},
				"latestTransaction":{"friendlyText":"Latest Transaction","displayOrder":14,"value":1362114000000,"key":"latestTransaction","tags":["STAT","DATE"]},
				"earliestTransaction":{"friendlyText":"Earliest Transaction","displayOrder":6,"value":1316059200000,"key":"earliestTransaction","tags":["STAT","DATE"]},
				"partners_status":{"friendlyText":"Status","displayOrder":22,"value":"active","key":"partners_status","tags":["STATUS","TEXT","SUMMARY"]},
				"id":{"friendlyText":"ID","displayOrder":7,"value":"p204","key":"id","tags":["ID","SUMMARY"]},
				"avgTransaction":{"friendlyText":"Average Transaction (USD)","displayOrder":0,"value":12.855249168370941,"key":"avgTransaction","tags":["AMOUNT","STAT","USD"]},
				"maxTransaction":{"friendlyText":"Largest Transaction","displayOrder":12,"value":3750,"key":"maxTransaction","tags":["AMOUNT","STAT","USD"]},
				"timestamp":{"friendlyText":"Last Updated","displayOrder":13,"value":1392057752451,"key":"timestamp","tags":["DATE"]}
			}
		};

		var clusterSummaryData = {
			"xfId":"summary_6E9350F6-F87D-AFF0-FF34-D8DB4BADCA28",
			"uiType":"xfSummaryCluster",
			"spec":{
				"parent":{},
				"type":"xfSummaryCluster",
				"accounttype":"cluster_summary",
				"dataId":"s.partner.sp204",
				"count":3264,
				"members":[],
				"icons":[
					{"type":"TYPE","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Organization?iconWidth=24&iconHeight=24&role=business","title":"partner (3264)","score":1,"friendlyName":"Type Distribution"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=KHM&country=KHM","title":"Cambodia (3264)","score":1,"friendlyName":"Location Distribution"},
					{"type":"GEO","imgUrl":"http://localhost:8080/kiva/rest/icon/aperture-hscb/Place?iconWidth=24&iconHeight=24&code=THA&country=THA","title":"Thailand (3264)","score":1,"friendlyName":"Location Distribution"}
				],
				"graphUrl":"http://localhost:8080/kiva/rest/chart?hash=368C4B88-4B7F-9A92-E871-3C5AB99E3B23|file_6C1724CA-F8D4-62E9-F92E-8F4855D196E3|file_6C1724CA-F8D4-62E9-F92E-8F4855D196E3|2010-03-01T00:00:00.000Z|2011-07-01T00:00:00.000Z|0.0|16|140|60|s.partner.sp204|f|a.partner.sp204",
				"flow":{},
				"duplicateCount":1,
				"label":"VisionFund Cambodia",
				"confidenceInSrc":1,
				"confidenceInAge":1,
				"unbranchable":false,
				"inDegree":29894,
				"outDegree":31018,
				"leftOperation":"branch",
				"rightOperation":"branch",
				"ownerId":"s.partner.p204",
				"chartSpec":{"startValue":0,"endValue":0,"credits":[],"debits":[],"maxCredit":0,"maxDebit":0,"maxBalance":0,"minBalance":0,"focusCredits":[],"focusDebits":[]}
			}
		};

		var _moduleManager = modules.createManager();

		// -------------------------------------------------------------------------------------------------------------

		describe('infEntityDetails initialization', function () {
			it('Has testing enabled', function () {
				expect(constants.UNIT_TESTS_ENABLED).toBeTruthy();
			});

			it('Ensures the infEntityDetails fixture is defined', function () {
				expect(fixture).toBeDefined();
			});

			it('expects pub subsubs to be subscribed and unsubscribed on start and end events', function () {

				var hasAllOwnProperties = function (object, list) {
					for (var i = 0; i < list.length; i++) {
						if (!object.hasOwnProperty(list[i])) {
							return false;
						}
					}
					return true;
				};

				_moduleManager.start('infEntityDetails', {});

				expect(hasAllOwnProperties(fixture._UIObjectState.subscriberTokens, _subscribedChannels)).toBe(true);

				_moduleManager.end('infEntityDetails');

				expect($.isEmptyObject(fixture._UIObjectState.subscriberTokens)).toBe(true);
			});
		});

		describe('Entity details test', function() {
			it('Test the entity details', function() {
				state.canvas = $('<div id="details"></div>');

				var spec = {
					dataId: 'a.loan.b150236'
				};
				var data = {
					uiType: 'xfEntity',
					spec: spec,
					xfId: ''
				};
				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, entityDetails);});
				fixture._onUpdate('entity-details-information', data);

				var title = state.canvas.find('.detailsTitle');
				expect(title.text().trim()).toEqual('Account');

				var label = state.canvas.find('.detailsEntityLabel');
				expect(label.text().trim()).toEqual('Daniel. South Sudan, Gudele');

				var rowValue = [];
				state.canvas.find('.propertyTable tr').each(function() {
					rowValue.push($(this).find('td').eq(2).text().trim());
				});

				expect(rowValue.length).toEqual(42);
				expect(rowValue[1]).toEqual('$8.70');
				expect(rowValue[3]).toEqual('South Sudan');
				expect(rowValue[41]).toEqual('Daniel G. is 21 years old and married...large retail shop. About BRAC BRAC\'s holistic approach...women members.');
				expect(rowValue[40]).toEqual('To purchase other food items to sell');

				// TODO: image carousel is broken right now
				//var carouselLabel = state.canvas.find('.imageControlsLabel');
				//expect(carouselLabel.text()).toEqual('1 of 3');
			});
		});

		describe('Cluster details test', function() {
			it('Test cluster details', function() {
				state.canvas = $('<div id="details"></div>');

				fixture._onUpdate('entity-details-information', clusterDetailsData);

				var title = state.canvas.find('.detailsTitle');
				expect(title.text().trim()).toEqual('Cluster');

				var label = state.canvas.find('.detailsEntityLabel');
				expect(label.text().trim()).toEqual('Dotty Cecil (+4)');

				var detailBlocks = state.canvas.find('.detailsBlock');
				expect(detailBlocks.length).toBe(6);

				expect($(detailBlocks[0]).find('.detailsValueValue').text()).toEqual('lender (5)');
				expect($(detailBlocks[0]).find('.detailsValueScore').text()).toEqual('100%');

				expect($(detailBlocks[1]).find('.detailsValueValue').text()).toEqual('Sweden (1)');
				expect($(detailBlocks[1]).find('.detailsValueScore').text()).toEqual('20%');

				expect($(detailBlocks[2]).find('.detailsValueValue').text()).toEqual('United States (1)');
				expect($(detailBlocks[2]).find('.detailsValueScore').text()).toEqual('20%');

				expect($(detailBlocks[3]).find('.detailsValueValue').text()).toEqual('France (1)');
				expect($(detailBlocks[3]).find('.detailsValueScore').text()).toEqual('20%');

				expect($(detailBlocks[4]).find('.detailsValueValue').text()).toEqual('United Kingdom (1)');
				expect($(detailBlocks[4]).find('.detailsValueScore').text()).toEqual('20%');

				expect($(detailBlocks[5]).find('.detailsValueValue').text()).toEqual('Australia (1)');
				expect($(detailBlocks[5]).find('.detailsValueScore').text()).toEqual('20%');
			});
		});

		describe('Cluster summary details test', function() {
			it('Test the cluster summary details', function() {
				state.canvas = $('<div id="details"></div>');

				spyOn(infRest, 'request').and.callFake(function(resource) {return _fakeRestResponse(resource, clusterSummary);});
				fixture._onUpdate('entity-details-information', clusterSummaryData);

				var title = state.canvas.find('.detailsTitle');
				expect(title.length).toBe(2);
				expect($(title[0]).text().trim()).toEqual('Account');
				expect($(title[1]).text().trim()).toEqual('Account');

				var label = state.canvas.find('.detailsEntityLabel');
				expect(label.length).toBe(2);
				expect($(label[0]).text().trim()).toEqual('VisionFund Cambodia (+3263)');
				expect($(label[1]).text().trim()).toEqual('VisionFund Cambodia (+3263)');

				var rowValue = [];
				state.canvas.find('.propertyTable tr').each(function() {
					rowValue.push($(this).find('td').eq(2).text().trim());
				});

				expect(rowValue.length).toEqual(24);
				expect(rowValue[0]).toEqual('$12.86');
				expect(rowValue[1]).toEqual('s.partner.sp204');
				expect(rowValue[14]).toEqual('Mar 1, 2013');
				expect(rowValue[23]).toEqual('$1.92M');

				var detailBlocks = state.canvas.find('.detailsBlock');
				expect(detailBlocks.length).toBe(3);

				expect($(detailBlocks[0]).find('.detailsValueValue').text()).toEqual('partner (3264)');
				expect($(detailBlocks[0]).find('.detailsValueScore').text()).toEqual('100%');

				expect($(detailBlocks[1]).find('.detailsValueValue').text()).toEqual('Cambodia (3264)');
				expect($(detailBlocks[1]).find('.detailsValueScore').text()).toEqual('100%');

				expect($(detailBlocks[2]).find('.detailsValueValue').text()).toEqual('Thailand (3264)');
				expect($(detailBlocks[2]).find('.detailsValueScore').text()).toEqual('100%');

			});
		});

		var _fakeRestResponse = function(resource, resources) {
			var request = {
				resource: resource
			};
			request.inContext = function (contextId) {
				this.contextId = contextId;
				return this;
			};

			request.withData = function (data, contentType) {
				this.data = data;
				return this;
			};

			request.then = function (callback) {
				callback(resources, {status: 'success'});

				return this;
			};

			return request;
		};

		var _subscribedChannels = [
			appChannel.SELECTION_CHANGE_EVENT,
			appChannel.SEARCH_REQUEST,
			appChannel.ENTITY_DETAILS_INFORMATION,
			appChannel.START_FLOW_VIEW
		];
	}
);
