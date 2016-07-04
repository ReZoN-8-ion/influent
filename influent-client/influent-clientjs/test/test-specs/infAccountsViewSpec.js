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
		'views/infAccountsView',
		'lib/communication/accountsViewChannels',
		'lib/communication/applicationChannels',
		'lib/constants',
		'lib/module',
		'modules/infWorkspace',
		'hbs!templates/searchResults/searchDetails'
	],
	function(
		fixture,
		accountsChannel,
		appChannel,
		constants,
		modules,
		infWorkspace,
		searchDetailsTemplate
	) {

		var config = aperture.config.get()['influent.config'];

		var groupCluster = {
			'headers':{
				'orderBy':[{'ascending':true,'propertyKey':'countryCode'}],
				'properties':[
					{'defaultTerm':false,'propertyType':'IMAGE','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Image','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'image','typeMappings':{'partner':'image','loan':'image','lender':'image'}},
					{'defaultTerm':true,'propertyType':'STRING','range':'SINGLETON','freeTextIndexed':true,'friendlyText':'Name','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'NAME','typeMappings':{'partner':'partners_name','loan':'loans_name','lender':'lenders_name'}},
					{'defaultTerm':true,'propertyType':'STRING','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'ID','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'id','typeMappings':{'partner':'id','loan':'id','lender':'id'}},
					{'defaultTerm':false,'propertyType':'STRING','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Type','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'type','typeMappings':{'partner':'type','loan':'type','lender':'type'}},
					{'defaultTerm':false,'propertyType':'GEO','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Location','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'geo','typeMappings':{'partner':'geo','loan':'geo','lender':'geo'}},
					{'defaultTerm':false,'propertyType':'INTEGER','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Transactions','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'numTransactions','typeMappings':{'partner':'numTransactions','loan':'numTransactions','lender':'numTransactions'}},
					{'defaultTerm':false,'propertyType':'DOUBLE','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Average (USD)','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'avgTransaction','typeMappings':{'partner':'avgTransaction','loan':'avgTransaction','lender':'avgTransaction'}}
				],
				'types':[
					{'exclusive':false,'friendlyText':'Lender','group':'Individuals','key':'lender'},
					{'exclusive':false,'friendlyText':'Loan','group':'Individuals','key':'loan'},
					{'exclusive':false,'friendlyText':'Partner','group':'Organizations','key':'partner'}
				]
			},
			'searchFilters':{'loans_location_countryCode':{'values':['KE','LR','UG'],'friendlyText':'Country Code'},'datatype':{'values':['loan'],'friendlyText':'Kiva Account Type'}},
			'scores':{},
			'sessionId':'',
			'totalResults':4,
			'detailLevel':'SUMMARY',
			'data':[
				{
					'items':[
						{'uid':'a.loan.b377279','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':190.00000000000003,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':38,'text':'Kenya, Likoni','cc':'KEN','lat':1},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/970705.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Kenya, Likoni','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b377279','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'KE','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':950,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1348977600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':950,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1323838800000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':10,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'}
					],
					'groupKey':'Country Code: KE'
				},
				{
					'items':[
						{'uid':'a.loan.b489889','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':417.49666666666667,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':-9.5,'text':'Liberia, Compound #3','cc':'LBR','lat':6.5},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/1225622.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Liberia, Compound #3','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b489889','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'LR','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':1100,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1355634000000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':1100,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1350360000000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':3,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'in_repayment','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'}
					],
					'groupKey':'Country Code: LR'
				},
				{
					'items':[
						{'uid':'a.loan.b224648','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':130,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':33,'text':'Uganda, Kyenjojo','cc':'UGA','lat':2},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/586879.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Uganda, Kyenjojo','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b224648','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'UG','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':325,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1293771600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':325,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1282017600000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':5,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'},
						{'uid':'a.loan.b131130','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':332.3529411764707,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':32.916667,'text':'Uganda, Mukono','cc':'UGA','lat':0.25},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/374344.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Uganda, Mukono','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b131130','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'UG','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':2825,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1260939600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':2825,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1250654400000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':17,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'}
					],
					'groupKey':'Country Code: UG'
				}
			]
		};

		var nonGroupedResults = {
			'headers':{
				'orderBy':[{'ascending':false,'propertyKey':'SCORE'}],
				'properties':[
					{'defaultTerm':false,'propertyType':'IMAGE','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Image','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'image','typeMappings':{'partner':'image','loan':'image','lender':'image'}},
					{'defaultTerm':true,'propertyType':'STRING','range':'SINGLETON','freeTextIndexed':true,'friendlyText':'Name','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'NAME','typeMappings':{'partner':'partners_name','loan':'loans_name','lender':'lenders_name'}},
					{'defaultTerm':true,'propertyType':'STRING','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'ID','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'id','typeMappings':{'partner':'id','loan':'id','lender':'id'}},
					{'defaultTerm':false,'propertyType':'STRING','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Type','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'type','typeMappings':{'partner':'type','loan':'type','lender':'type'}},
					{'defaultTerm':false,'propertyType':'GEO','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Location','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'geo','typeMappings':{'partner':'geo','loan':'geo','lender':'geo'}},
					{'defaultTerm':false,'propertyType':'INTEGER','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Transactions','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'numTransactions','typeMappings':{'partner':'numTransactions','loan':'numTransactions','lender':'numTransactions'}},
					{'defaultTerm':false,'propertyType':'DOUBLE','range':'SINGLETON','freeTextIndexed':false,'friendlyText':'Average (USD)','constraint':'FUZZY_PARTIAL_OPTIONAL','key':'avgTransaction','typeMappings':{'partner':'avgTransaction','loan':'avgTransaction','lender':'avgTransaction'}}
				],
				'types':[
					{'exclusive':false,'friendlyText':'Lender','group':'Individuals','key':'lender'},
					{'exclusive':false,'friendlyText':'Loan','group':'Individuals','key':'loan'},
					{'exclusive':false,'friendlyText':'Partner','group':'Organizations','key':'partner'}
				]
			},
			'searchFilters':{'loans_location_countryCode':{'values':['UG','KE','LR'],'friendlyText':'Country Code'},'datatype':{'values':['loan'],'friendlyText':'Kiva Account Type'}},
			'scores':{},
			'sessionId':'',
			'totalResults':4,
			'detailLevel':'SUMMARY',
			'data':[
				{
					'items':[
						{'uid':'a.loan.b224648','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':130,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':33,'text':'Uganda, Kyenjojo','cc':'UGA','lat':2},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/586879.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Uganda, Kyenjojo','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b224648','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'UG','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':325,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1293771600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':325,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1282017600000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':5,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'},
						{'uid':'a.loan.b377279','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':190.00000000000003,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':38,'text':'Kenya, Likoni','cc':'KEN','lat':1},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/970705.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Kenya, Likoni','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b377279','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'KE','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':950,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1348977600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':950,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1323838800000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':10,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'},
						{'uid':'a.loan.b131130','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':332.3529411764707,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':32.916667,'text':'Uganda, Mukono','cc':'UGA','lat':0.25},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/374344.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Uganda, Mukono','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b131130','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'UG','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':2825,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1260939600000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':2825,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1250654400000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':17,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'paid','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'},
						{'uid':'a.loan.b489889','entitytags':['ACCOUNT'],'properties':{'avgTransaction':{'tags':['AMOUNT','STAT','USD'],'value':417.49666666666667,'friendlyText':'Average Transaction (USD)','displayOrder':16,'key':'avgTransaction'},'geo':{'tags':['GEO'],'value':{'lon':-9.5,'text':'Liberia, Compound #3','cc':'LBR','lat':6.5},'friendlyText':'Location','displayOrder':7,'key':'geo'},'image':{'tags':['RAW'],'range':{'values':['http://www.kiva.org/img/w400/1225622.jpg'],'type':'IMAGE'},'friendlyText':'Image','displayOrder':1,'key':'image'},'label':{'tags':['LABEL'],'value':'Bob. Liberia, Compound #3','friendlyText':'Label','displayOrder':8,'key':'label'},'type':{'tags':['TYPE'],'value':'loan','friendlyText':'Kiva Account Type','displayOrder':0,'key':'type'},'inboundDegree':{'tags':['INFLOWING'],'value':1,'friendlyText':'Inbound Sources','displayOrder':10,'key':'inboundDegree'},'id':{'tags':['ID','RAW'],'value':'b489889','friendlyText':'ID','displayOrder':2,'key':'id'},'loans_location_countryCode':{'tags':['RAW','FILTERABLE'],'value':'LR','friendlyText':'Country Code','displayOrder':3,'key':'loans_location_countryCode'},'outboundDegree':{'tags':['OUTFLOWING'],'value':1,'friendlyText':'Outbound Targets','displayOrder':11,'key':'outboundDegree'},'loans_name':{'tags':['NAME','RAW'],'value':'Bob','friendlyText':'Name','displayOrder':6,'key':'loans_name'},'loans_loanAmount':{'tags':['AMOUNT','RAW'],'value':1100,'friendlyText':'Loan Amount','displayOrder':4,'key':'loans_loanAmount'},'loans_description_texts_en':{'tags':['TEXT','ANNOTATION','RAW','HTML'],'value':'description value','friendlyText':'Description','displayOrder':9,'key':'loans_description_texts_en'},'latestTransaction':{'tags':['STAT','DATE'],'value':1355634000000,'friendlyText':'Latest Transaction','displayOrder':14,'key':'latestTransaction'},'maxTransaction':{'tags':['AMOUNT','STAT','USD'],'value':1100,'friendlyText':'Largest Transaction','displayOrder':12,'key':'maxTransaction'},'earliestTransaction':{'tags':['STAT','DATE'],'value':1350360000000,'friendlyText':'Earliest Transaction','displayOrder':13,'key':'earliestTransaction'},'numTransactions':{'tags':['COUNT','STAT'],'value':3,'friendlyText':'Number of Transactions','displayOrder':15,'key':'numTransactions'},'loans_status':{'tags':['STATUS','TEXT','RAW'],'value':'in_repayment','friendlyText':'Status','displayOrder':5,'key':'loans_status'}},'type':'loan','entitytype':'entity'}
					]
				}
			]
		};

		var entityDetails = {
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

		var searchParamsResponse = {
			'properties': [
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'id',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'id',
					'typeMappings': {
						'partner': 'id',
						'loan': 'id',
						'lender': 'id'
					}
				},
				{
					'defaultTerm': true,
					'range': 'SINGLETON',
					'freeTextIndexed': true,
					'friendlyText': 'Name',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'name',
					'typeMappings': {
						'partner': 'partners_name',
						'loan': 'loans_name',
						'lender': 'lenders_name'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Occupation',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'occupation',
					'typeMappings': {
						'lender': 'lenders_occupation'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Teams',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'teams',
					'typeMappings': {
						'lender': 'lender_teams'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Description',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'description',
					'typeMappings': {
						'loan': 'loans_description_texts_en',
						'lender': 'lenders_loanBecause'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Country code',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'countryCode',
					'typeMappings': {
						'loan': 'loans_location_countryCode',
						'lender': 'lenders_countryCode'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Occupational info',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'occupationalInfo',
					'typeMappings': {
						'lender': 'lenders_occupationalInfo'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Inviter ID',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'inviterId',
					'typeMappings': {
						'lender': 'lenders_inviterId'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Country',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'country',
					'typeMappings': {
						'loan': 'loans_location_country'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Loan status',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'loan_status',
					'typeMappings': {
						'loan': 'loans_status'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Loan use',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'loan_use',
					'typeMappings': {
						'loan': 'loans_use'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Activity',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'activity',
					'typeMappings': {
						'loan': 'loans_activity'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Sector',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'sector',
					'typeMappings': {
						'loan': 'loans_sector'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Partner status',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'partner_status',
					'typeMappings': {
						'partner': 'partners_status'
					}
				},
				{
					'defaultTerm': false,
					'range': 'SINGLETON',
					'freeTextIndexed': false,
					'friendlyText': 'Due diligence type',
					'constraint': 'FUZZY_PARTIAL_OPTIONAL',
					'key': 'due_diligence_type',
					'typeMappings': {
						'partner': 'partners_dueDiligenceType'
					}
				}],
			'types': [{
				'exclusive': false,
				'friendlyText': 'Lender',
				'group': 'Individuals',
				'key': 'lender'
			},
				{
					'exclusive': false,
					'friendlyText': 'Loan',
					'group': 'Individuals',
					'key': 'loan'
				},
				{
					'exclusive': false,
					'friendlyText': 'Partner',
					'group': 'Organizations',
					'key': 'partner'
				}]
		};

		describe('infAccountsView Test Suite', function() {

			beforeEach(function() {
				infWorkspace.setSessionId('');
				spyOn(aperture.io, 'rest').and.callFake(function(uri, method, callback) {
					if (uri === '/searchparams') {
						callback(searchParamsResponse, {status: 'success'});
					} else if (uri === '/entitydetails') {
						callback(entityDetails, {success: true});
					}
				});
			});

			describe('infAccountsView initialization tests', function() {

				beforeEach(function() {
					fixture.debugCleanState();
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure the infAccountsView fixture is defined', function () {
					expect(fixture).toBeDefined();
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure operations bar is created', function () {
					var canvas = $('<div/>');
					canvas.append('<div class="infSearchResultToolbar"></div>');
					fixture.debugSetState('canvas', canvas);
					fixture._createOperationsBar();
					expect(fixture._UIObjectState().operationsBar.buttons().length).toEqual(3);
				});

				//----------------------------------------------------------------------------------------------------------

				describe('Ensure initialization works properly', function() {

					it('expect initialization to populate state', function() {
						fixture.debugSetState('canvas', $('<div/>'));
						fixture._init;
						expect(fixture._UIObjectState().viewToolbar).not.toBe(null);

					});

					//----------------------------------------------------------------------------------------------------------

					it('expect initialization to communicate initialized state', function() {
						fixture.debugSetState('canvas', $('<div/>'));
						spyOn(aperture.pubsub, 'publish');
						fixture._init();
						expect(aperture.pubsub.publish).toHaveBeenCalledWith(appChannel.VIEW_INITIALIZED, {name: constants.VIEWS.ACCOUNTS.NAME});
					});
				});

				describe('Ensure view registration works properly', function() {

					it('expect pub subsubs to be subscribed and unsubscribed on start and end events', function() {

						var moduleManager = modules.createManager();
						moduleManager.start('infAccountsView', {});

						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.ALL_MODULES_STARTED)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.CLEAR_VIEW)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.DATASET_STATS)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.FILTER_SEARCH_CHANGE_EVENT)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.VIEW_PARAMS_CHANGED)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.VIEW_REGISTERED)).toBe(true);

						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(accountsChannel.RESULT_SELECTION_CHANGE)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(accountsChannel.RESULT_VISIBILITY_CHANGE)).toBe(true);

						moduleManager.end('infAccountsView');

						expect($.isEmptyObject(fixture._UIObjectState().subscriberTokens)).toBe(true);
					});
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView clear view tests', function() {

				beforeEach(function() {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});
					fixture.debugSetState('currentSearchString', 'bob');

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate : start.toUTCString(),
						endDate : end.toUTCString()
					});
				});

				//----------------------------------------------------------------------------------------------------------

				it('ensure the _clear function works as expected', function() {

					fixture._handleSearchResults(groupCluster, {success: true});

					expect(fixture._UIObjectState().canvas).not.toBe(null);
					expect(fixture._UIObjectState().subscriberTokens).not.toBe(null);
					expect(fixture._UIObjectState().operationsBar).not.toBe(null);
					expect(fixture._UIObjectState().transStartDate).not.toBe(null);
					expect(fixture._UIObjectState().transEndDate).not.toBe(null);
					expect(fixture._UIObjectState().searchState).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchString).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchResult).not.toBe(null);

					fixture._clear();

					// expect the current search results to be clear
					expect(fixture._UIObjectState().currentSearchResult).toBe(null);

					// expect the rest of the state not to be cleared
					expect(fixture._UIObjectState().canvas).not.toBe(null);
					expect(fixture._UIObjectState().subscriberTokens).not.toBe(null);
					expect(fixture._UIObjectState().operationsBar).not.toBe(null);
					expect(fixture._UIObjectState().transStartDate).not.toBe(null);
					expect(fixture._UIObjectState().transEndDate).not.toBe(null);
					expect(fixture._UIObjectState().searchState).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchString).not.toBe(null);
				});

				//----------------------------------------------------------------------------------------------------------

				it('ensure the _onClearView function works as expected', function() {

					fixture._handleSearchResults(groupCluster, {success: true});

					expect(fixture._UIObjectState().canvas).not.toBe(null);
					expect(fixture._UIObjectState().subscriberTokens).not.toBe(null);
					expect(fixture._UIObjectState().operationsBar).not.toBe(null);
					expect(fixture._UIObjectState().transStartDate).not.toBe(null);
					expect(fixture._UIObjectState().transEndDate).not.toBe(null);
					expect(fixture._UIObjectState().searchState).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchString).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchResult).not.toBe(null);

					var data = {
						title : constants.VIEWS.ACCOUNTS.NAME
					}

					// ensure bad channels returns false and don't clear the current search results
					expect(fixture._onClearView('bad-channel', data)).toBe(false);
					expect(fixture._UIObjectState().currentSearchResult).not.toBe(null);

					// ensure bad data returns false and don't clear the current search results
					expect(fixture._onClearView(appChannel.CLEAR_VIEW, null)).toBe(false);
					expect(fixture._onClearView(appChannel.CLEAR_VIEW, {badTitle : 'badTitle'})).toBe(false);
					expect(fixture._UIObjectState().currentSearchResult).not.toBe(null);

					expect(fixture._onClearView(appChannel.CLEAR_VIEW, data)).toBe(true);

					// expect the current search results to be clear
					expect(fixture._UIObjectState().currentSearchResult).toBe(null);

					expect(fixture._UIObjectState().canvas).not.toBe(null);
					expect(fixture._UIObjectState().subscriberTokens).not.toBe(null);
					expect(fixture._UIObjectState().operationsBar).not.toBe(null);
					expect(fixture._UIObjectState().transStartDate).not.toBe(null);
					expect(fixture._UIObjectState().transEndDate).not.toBe(null);
					expect(fixture._UIObjectState().searchState).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchString).not.toBe(null);
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView handleSearchResults tests', function() {

				beforeEach(function() {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate : start.toUTCString(),
						endDate : end.toUTCString()
					});
					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _handleSearchResults handles bad results', function() {

					fixture._handleSearchResults(groupCluster, {success: false});
					expect(fixture._UIObjectState().currentSearchResult).toEqual(null);

					var badSessionId = _.clone(groupCluster);
					badSessionId.sessionId = 'badId';

					fixture._handleSearchResults(badSessionId, {success: true});
					expect(fixture._UIObjectState().currentSearchResult).toEqual(null);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure search result context is created properly for cluster groups', function() {

					fixture._handleSearchResults(groupCluster, {success: true});

					//Test result totals
					expect(fixture._UIObjectState().currentSearchResult.getTotalSearchResults()).toEqual(4);
					expect(fixture._UIObjectState().currentSearchResult.getVisibleResults()).toEqual(2);

					//Test columns
					var header = fixture._UIObjectState().currentSearchResult.getHeaderInformation();
					expect(header.columns.length).toEqual(7);
					expect(header.columns[0].isImage).toBe(true);
					expect(header.columns[1].property.key).toEqual('NAME');
					expect(header.columns[3].property.key).toEqual('type');

					//Test summary counts
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(2);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumTotal).toEqual(4);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sortedBy).toEqual('Country code');

					//Test cluster
					expect(fixture._UIObjectState().currentSearchResult.getChildren().length).toEqual(3);
					expect(fixture._UIObjectState().currentSearchResult.getChildren()[0].getClusterLabel()).toEqual('Country Code: KE');
					expect(fixture._UIObjectState().currentSearchResult.getChildren()[0].getChildren().length).toEqual(1);

					//Test displayed results
					var visInfo = fixture._UIObjectState().currentSearchResult.getChildren()[0].getChildren()[0].getVisualInfo(header);
					expect(visInfo.columns.length).toEqual(7);
					expect(visInfo.columns[0].isImage).toEqual(true);
					expect(visInfo.columns[1].text).toEqual('Bob');
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure pages are displayed properly for cluster groups', function() {

					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
					fixture._handleSearchResults(groupCluster, {success: true});

					var resultRoot = fixture._UIObjectState().canvas.find('.infSearchResults');

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(2 * 2);

					fixture._onVisibilityChange(accountsChannel.RESULT_VISIBILITY_CHANGE);

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(4 * 2);

				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure search result context is created properly for non grouped results', function() {

					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					//Test result totals
					expect(fixture._UIObjectState().currentSearchResult.getTotalSearchResults()).toEqual(4);
					expect(fixture._UIObjectState().currentSearchResult.getVisibleResults()).toEqual(2);

					//Test columns
					var header = fixture._UIObjectState().currentSearchResult.getHeaderInformation();
					expect(header.columns.length).toEqual(7);
					expect(header.columns[0].isImage).toBe(true);
					expect(header.columns[1].property.key).toEqual('NAME');
					expect(header.columns[3].property.key).toEqual('type');

					//Test summary counts
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(2);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumTotal).toEqual(4);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sortedBy).toEqual('SCORE');

					//Test displayed results
					expect(fixture._UIObjectState().currentSearchResult.getChildren().length).toEqual(4);
					var visInfo = fixture._UIObjectState().currentSearchResult.getChildren()[0].getVisualInfo(header);
					expect(visInfo.columns.length).toEqual(7);
					expect(visInfo.columns[0].isImage).toEqual(true);
					expect(visInfo.columns[1].text).toEqual('Bob');
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure pages are displayed properly for non grouped results', function() {

					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var resultRoot = fixture._UIObjectState().canvas.find('.infSearchResults');

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(2 * 2);

					fixture._onVisibilityChange(accountsChannel.RESULT_VISIBILITY_CHANGE);

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(4 * 2);
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView entity summary tests', function() {

				beforeEach(function() {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate : start.toUTCString(),
						endDate : end.toUTCString()
					});
					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
				});

				it('Ensure summary entity results appear correct for grouped results', function() {

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					expect(summaryRows).toBeDefined();
					expect(summaryRows.length).toEqual(4);

					var elementRows = $(summaryRows[0]).find('.summaryColumnText');
					expect(elementRows).toBeDefined();
					expect(elementRows.length).toEqual(6);

					var value = $(elementRows[0]).text();
					expect(value).toEqual('Bob');

					var value = $(elementRows[1]).text();
					expect(value).toEqual('b224648');

					var value = $(elementRows[2]).text();
					expect(value).toEqual('loan');

					var value = $(elementRows[3]).text();
					expect(value).toEqual('Uganda, Kyenjojo');

					var value = $(elementRows[4]).text();
					expect(value).toEqual('5');

					var value = $(elementRows[5]).text();
					expect(value).toEqual('$130.00');
				});

				it('Ensure summary entity results appear correct for non-grouped results', function() {
					fixture._handleSearchResults(groupCluster, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					expect(summaryRows).toBeDefined();
					expect(summaryRows.length).toEqual(4);

					var elementRows = $(summaryRows[0]).find('.summaryColumnText');
					expect(elementRows).toBeDefined();
					expect(elementRows.length).toEqual(6);

					var value = $(elementRows[0]).text();
					expect(value).toEqual('Bob');

					var value = $(elementRows[1]).text();
					expect(value).toEqual('b377279');

					var value = $(elementRows[2]).text();
					expect(value).toEqual('loan');

					var value = $(elementRows[3]).text();
					expect(value).toEqual('Kenya, Likoni');

					var value = $(elementRows[4]).text();
					expect(value).toEqual('10');

					var value = $(elementRows[5]).text();
					expect(value).toEqual('$190.00');
				});

				it('Ensure amount and date columns are right aligned', function() {
					fixture._handleSearchResults(groupCluster, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					var elementRows = $(summaryRows[0]).find('.summaryColumn');

					var summaryColsTable = fixture._UIObjectState().canvas.find('.summaryColumns');
					var summaryCols = summaryColsTable.find('th');
					expect(summaryCols).toBeDefined();
					expect(summaryCols.length).toEqual(8);
					for (var i = 0; i < summaryCols.length; i++) {
						if (($(summaryCols[i]).find('.name').length > 0) && ($(summaryCols[i]).find('.name').text() === 'Amount' || $(summaryCols[i]).find('.name').text() === 'Date')) {
							expect($(summaryCols[i]).hasClass('summaryColumnNumFormat')).toBe(true);
							expect($(elementRows[i - 1]).hasClass('summaryColumnNumFormat')).toBe(true);
						}
					}
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView entity details tests', function() {

				beforeEach(function() {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate : start.toUTCString(),
						endDate : end.toUTCString()
					});
					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure detailed entity results appear correct', function() {

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result = fixture._UIObjectState().currentSearchResult.getResultByDataId('a.loan.b224648');

					var testDiv = $('<div/>');

					result.expandProperties(entityDetails.properties);
					fixture._generateTextTableElement(result, 'result_graph_' + result.getXfId(), testDiv);

					var elementRows = testDiv.find('.infSearchResultProperty');
					expect(elementRows).toBeDefined();
					expect(elementRows.length).toEqual(17);

					$.each(elementRows, function(index,element) {
						expect($(element).find('.infSearchResultPropertyLabel')).toBeDefined();
						expect($(element).find('.infSearchResultPropertyValue')).toBeDefined();
					});

					var title, value;

					title= $(elementRows[0]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[0]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('Kiva Account Type: ');
					expect(value.trim()).toEqual('loan');

					title= $(elementRows[2]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[2]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('ID: ');
					expect(value.trim()).toEqual('b224648');

					title = $(elementRows[3]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[3]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('Country Code: ');
					expect(value.trim()).toEqual('UG');

					title = $(elementRows[4]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[4]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('Loan Amount: ');
					expect(value.trim()).toEqual('325');

					title= $(elementRows[6]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[6]).find('.infSearchResultPropertyValue').html();
					expect(title).toEqual('Name: ');
					expect(value.trim()).toEqual('Bob');
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView pubsub handling tests', function() {

				beforeEach(function () {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate : start.toUTCString(),
						endDate : end.toUTCString()
					});
					fixture._UIObjectState().currentSearchString = 'countryCode:"UG" countryCode:"KE" countryCode:"LR" TYPE:loan MATCH:any ';
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onDatasetStats handles DATASET_STATS pubsub', function () {

					fixture.debugSetState('transStartDate', null);
					fixture.debugSetState('transEndDate', null);

					var start = new Date(1);
					var end = new Date();

					// handles bad channels
					expect(fixture._onDatasetStats('bad-channel', {
						startDate: start.toISOString(),
						endDate: end.toISOString()
					})).toEqual(false);
					expect(fixture._UIObjectState().transStartDate).toBeNull();
					expect(fixture._UIObjectState().transEndDate).toBeNull();

					// handles null data
					expect(fixture._onDatasetStats(appChannel.DATASET_STATS)).toEqual(false);
					expect(fixture._UIObjectState().transStartDate).toBeNull();
					expect(fixture._UIObjectState().transEndDate).toBeNull();

					// handles only one date
					expect(fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate: start.toISOString()
					})).toEqual(false);
					expect(fixture._UIObjectState().transStartDate).toBeNull();
					expect(fixture._UIObjectState().transEndDate).toBeNull();
					expect(fixture._onDatasetStats(appChannel.DATASET_STATS, {
						endDate: end.toISOString()
					})).toEqual(false);
					expect(fixture._UIObjectState().transStartDate).toBeNull();
					expect(fixture._UIObjectState().transEndDate).toBeNull();

					// handles proper data
					expect(fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate: start.toISOString(),
						endDate: end.toISOString()
					})).toEqual(true);
					expect(fixture._UIObjectState().transStartDate).toEqual(start.toISOString());
					expect(fixture._UIObjectState().transEndDate).toEqual(end.toISOString());
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onEntityFullDetailsShow handles RESULT_ENTITY_FULL_DETAILS_SHOW pubsub', function (done) {
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result = fixture._UIObjectState().currentSearchResult.getResultByDataId('a.loan.b224648');

					var $container = $('<div/>');
					var $resultContainer = $('<div id="details_' + result.getXfId() + '"/>');
					$resultContainer.attr('id', 'details_' + result.getXfId());
					$resultContainer.append(searchDetailsTemplate());
					$container.append($resultContainer);

					$container.find('.simpleSearchResultText').css('display', 'block');
					$container.find('.detailedSearchResultText').css('display','none');

					// handles bad channels
					expect(fixture._onEntityFullDetailsShow('bad-channel', {
						xfId: result.getXfId(),
						container: $container
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles null data
					expect(fixture._onEntityFullDetailsShow(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW)).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles no xfId
					expect(fixture._onEntityFullDetailsShow(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW, {
						container: $container
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles bad xfId
					expect(fixture._onEntityFullDetailsShow(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW, {
						xfId: 'bad-xfid',
						container: $container
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles no container
					expect(fixture._onEntityFullDetailsShow(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW, {
						xfId: result.getXfId()
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles proper data
					jasmine.clock().install

					//rest spyOn set in before function
					expect(fixture._onEntityFullDetailsShow(accountsChannel.RESULT_ENTITY_FULL_DETAILS_SHOW, {
						xfId: result.getXfId(),
						container: $container
					})).toEqual(true);
					setTimeout(function() {
						expect(aperture.io.rest).toHaveBeenCalled();
						expect($container.find('.simpleSearchResultText').css('display')).toEqual('none');
						expect($container.find('.detailedSearchResultText').css('display')).toEqual('block');
						expect($container.find('.infSearchResultStateToggle').html()).toEqual('show less');

						fixture._hideFullDetails($container);
						setTimeout(function() {
							expect(aperture.io.rest).toHaveBeenCalled();
							expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
							expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
							expect($container.find('#infSearchResultShowDetails').html()).toEqual('[more]');

							jasmine.clock().uninstall();

							done();
						}, 100);
					}, 100);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onSelectionChange handles RESULT_SELECTION_CHANGE pubsub', function () {
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result1 = fixture._UIObjectState().currentSearchResult.getResultByDataId('a.loan.b224648');
					var result2 = fixture._UIObjectState().currentSearchResult.getResultByDataId('a.loan.b377279');

					// handles bad channels
					expect(fixture._onSelectionChange('bad-channel', {
						xfId: result1.getXfId(),
						isSelected: true
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles null data
					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE)).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles no xfId
					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						isSelected: true
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles no isSelected
					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						xfId: result1.getXfId()
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles bad xfId
					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						xfId: 'bad-xfid',
						isSelected: true
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles proper data
					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						xfId: result1.getXfId(),
						isSelected: true
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(1);

					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						xfId: result2.getXfId(),
						isSelected: true
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(2);

					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						xfId: result1.getXfId(),
						isSelected: false
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(1);

					expect(fixture._onSelectionChange(accountsChannel.RESULT_SELECTION_CHANGE, {
						xfId: result2.getXfId(),
						isSelected: false
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onVisibilityChange handles RESULT_VISIBILITY_CHANGE pubsub', function () {
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					// handles bad channels
					expect(fixture._onVisibilityChange('bad-channel')).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(2);

					// handles proper data
					expect(fixture._onVisibilityChange(accountsChannel.RESULT_VISIBILITY_CHANGE)).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(4);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onViewParametersChanged handles VIEW_PARAMS_CHANGED pubsub', function () {
					fixture.debugSetState('currentSearchString', 'bob');

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					// handles bad channels
					expect(fixture._onViewParametersChanged('bad-channel', {
						title: constants.VIEWS.ACCOUNTS.NAME,
						all: {
							query : 'not bob'
						}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles null data
					expect(fixture._onEntityFullDetailsShow(appChannel.VIEW_PARAMS_CHANGED)).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles no title
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						all: {
							query : 'not bob'
						}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles bad title
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: 'bad-title',
						all: {
							query : 'not bob'
						}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles no all
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: constants.VIEWS.ACCOUNTS.NAME
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles no query
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: constants.VIEWS.ACCOUNTS.NAME,
						all: {}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles same query
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: constants.VIEWS.ACCOUNTS.NAME,
						all: {
							query : 'bob'
						}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles proper data
					spyOn(aperture.pubsub, 'publish');
					//spyOn(aperture.io, 'rest').and.callFake(function(uri, method, callback) {
					//	callback(nonGroupedResults, {success: true});
					//});
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: constants.VIEWS.ACCOUNTS.NAME,
						all: {
							query : 'not bob'
						}
					})).toEqual(true);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST,
						{
							view: constants.VIEWS.ACCOUNTS.NAME,
							input: 'not bob'
						}
					);
					expect(fixture._UIObjectState().currentSearchString).toEqual('not bob');
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView view switching tests', function() {

				var dataIds = [
					"a.loan.b224648",
					"a.loan.b377279",
					"a.loan.b131130",
					"a.loan.b489889"
				];

				var specs = [
					{"uid":"a.loan.b224648","entitytags":["ACCOUNT"],"properties":{"loans_postedDate":{"tags":["DATE"],"value":1282401603000,"friendlyText":"Posted Date","displayOrder":2},"loans_terms_disbursalCurrency":{"tags":["TEXT","RAW"],"value":"UGX","friendlyText":"Disbursal Currency","displayOrder":4},"type":{"tags":["TYPE"],"value":"loan","friendlyText":"Kiva Account Type","displayOrder":0},"loans_location_geo_type":{"tags":["RAW"],"value":"point","friendlyText":"Geo Type","displayOrder":5},"timestamp":{"tags":["DATE","RAW"],"value":1392057161942,"friendlyText":"Timestamp","displayOrder":34},"id":{"tags":["ID","RAW"],"value":"b224648","friendlyText":"ID","displayOrder":3},"loans_basketAmount":{"tags":["AMOUNT","RAW"],"value":1200,"friendlyText":"Basket Amount","displayOrder":6},"outboundDegree":{"tags":["OUTFLOWING"],"value":1,"friendlyText":"outbound Degree","displayOrder":38},"loans_location_countryCode":{"tags":["RAW","FILTERABLE"],"value":"UG","friendlyText":"Country Code","displayOrder":7},"loans_description_texts_en":{"tags":["TEXT","RAW","HTML"],"value":"loans_description_texts_en for a.loan.b224648","friendlyText":"Description","displayOrder":10},"loans_loanAmount":{"tags":["AMOUNT","RAW","SUMMARY"],"value":325,"friendlyText":"Loan Amount","displayOrder":9},"loans_terms_lossLiability_currencyExchange":{"tags":["RAW"],"value":"shared","friendlyText":"Loss Liability Currency Exchange","displayOrder":8},"loans_terms_lossLiability_currencyExchangeCoverageRate":{"tags":["RAW"],"value":0.20000000298023224,"friendlyText":"Loss Liability Coverage Rate","displayOrder":12},"loans_sector":{"tags":["TEXT","RAW"],"value":"Housing","friendlyText":"Sector","displayOrder":13},"loans_terms_disbursalDate":{"tags":["DATE","RAW"],"value":1282028400000,"friendlyText":"Disbursal Date","displayOrder":14},"numTransactions":{"tags":["COUNT","STAT","USD"],"value":5,"friendlyText":"num Transactions","displayOrder":39},"loans_location_geo_pairs":{"tags":["RAW"],"value":"2 33","friendlyText":"Geo Pairs","displayOrder":15},"lat":{"tags":["RAW"],"value":2,"friendlyText":"Latitude","displayOrder":16},"loans_status":{"tags":["STATUS","TEXT","RAW","SUMMARY"],"value":"paid","friendlyText":"Status","displayOrder":17},"avgTransaction":{"tags":["AMOUNT","STAT","USD"],"value":130,"friendlyText":"avg Transaction","displayOrder":40},"text":{"tags":["RAW"],"value":"text for a.loan.b224648","friendlyText":"text","displayOrder":11},"lon":{"tags":["RAW"],"value":33,"friendlyText":"Longitude","displayOrder":18},"geo":{"tags":["GEO"],"value":{"lon":33,"text":"Uganda, Kyenjojo","cc":"UGA","lat":2},"friendlyText":"","displayOrder":35},"loans_location_country":{"tags":["RAW"],"value":"Uganda","friendlyText":"Country","displayOrder":19},"loans_location_town":{"tags":["RAW"],"value":"Kyenjojo","friendlyText":"Town","displayOrder":20},"loans_terms_disbursalAmount":{"tags":["AMOUNT","RAW"],"value":700000,"friendlyText":"Disbursal Amount","displayOrder":21},"loans_use":{"tags":["TEXT","RAW"],"value":"construction of a commercial house for income generation","friendlyText":"Use","displayOrder":22},"image":{"tags":["IMAGE"],"range":{"values":["http://www.kiva.org/img/w400/586879.jpg"],"type":"STRING"},"friendlyText":"Image","displayOrder":1},"label":{"tags":["LABEL"],"value":"Bob. Uganda, Kyenjojo","friendlyText":"label","displayOrder":36},"loans_activity":{"tags":["TEXT","RAW"],"value":"","friendlyText":"Activity","displayOrder":24},"loans_terms_loanAmount":{"tags":["AMOUNT","RAW"],"value":325,"friendlyText":"Loan Amount","displayOrder":25},"inboundDegree":{"tags":["INFLOWING"],"value":1,"friendlyText":"inbound Degree","displayOrder":37},"image_id":{"tags":["RAW"],"value":586879,"friendlyText":"image_id","displayOrder":23},"loans_fundedAmount":{"tags":["AMOUNT","RAW"],"value":325,"friendlyText":"Funded Amount","displayOrder":26},"loans_fundedDate":{"tags":["DATE","RAW"],"value":1282572056000,"friendlyText":"Funded Date","displayOrder":27},"loans_paidDate":{"tags":["DATE","RAW"],"value":1295097858000,"friendlyText":"Paid Date","displayOrder":29},"loans_name":{"tags":["NAME","RAW","SUMMARY"],"value":"Bob","friendlyText":"Name","displayOrder":28},"loans_plannedExpirationDate":{"tags":["DATE","RAW"],"value":-2209143600000,"friendlyText":"Planned Expiration Date","displayOrder":32},"loans_paidAmount":{"tags":["AMOUNT","RAW"],"value":325,"friendlyText":"Paid Amount","displayOrder":31},"loans_location_geo_level":{"tags":["RAW"],"value":"country","friendlyText":"Geo Level","displayOrder":30},"loans_terms_lossLiability_nonpayment":{"tags":["RAW"],"value":"lender","friendlyText":"Loss Liability Non-Payment","displayOrder":33}},"entitytype":"entity"},
					{"uid":"a.loan.b377279","entitytags":["ACCOUNT"],"properties":{"loans_postedDate":{"tags":["DATE"],"value":1325405203000,"friendlyText":"Posted Date","displayOrder":2},"loans_terms_disbursalCurrency":{"tags":["TEXT","RAW"],"value":"KES","friendlyText":"Disbursal Currency","displayOrder":4},"type":{"tags":["TYPE"],"value":"loan","friendlyText":"Kiva Account Type","displayOrder":0},"loans_location_geo_type":{"tags":["RAW"],"value":"point","friendlyText":"Geo Type","displayOrder":5},"timestamp":{"tags":["DATE","RAW"],"value":1392057290915,"friendlyText":"Timestamp","displayOrder":34},"id":{"tags":["ID","RAW"],"value":"b377279","friendlyText":"ID","displayOrder":3},"loans_basketAmount":{"tags":["AMOUNT","RAW"],"value":1200,"friendlyText":"Basket Amount","displayOrder":6},"outboundDegree":{"tags":["OUTFLOWING"],"value":1,"friendlyText":"outbound Degree","displayOrder":38},"loans_location_countryCode":{"tags":["RAW","FILTERABLE"],"value":"KE","friendlyText":"Country Code","displayOrder":7},"loans_description_texts_en":{"tags":["TEXT","RAW","HTML"],"value":"loans_description_texts_en for a.loan.b377279","friendlyText":"Description","displayOrder":10},"loans_loanAmount":{"tags":["AMOUNT","RAW","SUMMARY"],"value":950,"friendlyText":"Loan Amount","displayOrder":9},"loans_terms_lossLiability_currencyExchange":{"tags":["RAW"],"value":"shared","friendlyText":"Loss Liability Currency Exchange","displayOrder":8},"loans_terms_lossLiability_currencyExchangeCoverageRate":{"tags":["RAW"],"value":0.20000000298023224,"friendlyText":"Loss Liability Coverage Rate","displayOrder":12},"loans_sector":{"tags":["TEXT","RAW"],"value":"Transportation","friendlyText":"Sector","displayOrder":13},"loans_terms_disbursalDate":{"tags":["DATE","RAW"],"value":1323849600000,"friendlyText":"Disbursal Date","displayOrder":14},"numTransactions":{"tags":["COUNT","STAT","USD"],"value":10,"friendlyText":"num Transactions","displayOrder":39},"loans_location_geo_pairs":{"tags":["RAW"],"value":"1 38","friendlyText":"Geo Pairs","displayOrder":15},"lat":{"tags":["RAW"],"value":1,"friendlyText":"Latitude","displayOrder":16},"loans_status":{"tags":["STATUS","TEXT","RAW","SUMMARY"],"value":"paid","friendlyText":"Status","displayOrder":17},"avgTransaction":{"tags":["AMOUNT","STAT","USD"],"value":190.00000000000003,"friendlyText":"avg Transaction","displayOrder":40},"text":{"tags":["RAW"],"value":"text for a.loan.b377279","friendlyText":"text","displayOrder":11},"lon":{"tags":["RAW"],"value":38,"friendlyText":"Longitude","displayOrder":18},"geo":{"tags":["GEO"],"value":{"lon":38,"text":"Kenya, Likoni","cc":"KEN","lat":1},"friendlyText":"","displayOrder":35},"loans_location_country":{"tags":["RAW"],"value":"Kenya","friendlyText":"Country","displayOrder":19},"loans_location_town":{"tags":["RAW"],"value":"Likoni","friendlyText":"Town","displayOrder":20},"loans_terms_disbursalAmount":{"tags":["AMOUNT","RAW"],"value":80000,"friendlyText":"Disbursal Amount","displayOrder":21},"loans_use":{"tags":["TEXT","RAW"],"value":"To purchase vehicle tires and carry out body work on his van.","friendlyText":"Use","displayOrder":22},"image":{"tags":["IMAGE"],"range":{"values":["http://www.kiva.org/img/w400/970705.jpg"],"type":"STRING"},"friendlyText":"Image","displayOrder":1},"label":{"tags":["LABEL"],"value":"Bob. Kenya, Likoni","friendlyText":"label","displayOrder":36},"loans_activity":{"tags":["TEXT","RAW"],"value":"","friendlyText":"Activity","displayOrder":24},"loans_terms_loanAmount":{"tags":["AMOUNT","RAW"],"value":950,"friendlyText":"Loan Amount","displayOrder":25},"inboundDegree":{"tags":["INFLOWING"],"value":1,"friendlyText":"inbound Degree","displayOrder":37},"image_id":{"tags":["RAW"],"value":970705,"friendlyText":"image_id","displayOrder":23},"loans_fundedAmount":{"tags":["AMOUNT","RAW"],"value":950,"friendlyText":"Funded Amount","displayOrder":26},"loans_fundedDate":{"tags":["DATE","RAW"],"value":1327833252000,"friendlyText":"Funded Date","displayOrder":27},"loans_paidDate":{"tags":["DATE","RAW"],"value":1350380198000,"friendlyText":"Paid Date","displayOrder":29},"loans_name":{"tags":["NAME","RAW","SUMMARY"],"value":"Bob","friendlyText":"Name","displayOrder":28},"loans_plannedExpirationDate":{"tags":["DATE","RAW"],"value":1327997203000,"friendlyText":"Planned Expiration Date","displayOrder":32},"loans_paidAmount":{"tags":["AMOUNT","RAW"],"value":950,"friendlyText":"Paid Amount","displayOrder":31},"loans_location_geo_level":{"tags":["RAW"],"value":"country","friendlyText":"Geo Level","displayOrder":30},"loans_terms_lossLiability_nonpayment":{"tags":["RAW"],"value":"lender","friendlyText":"Loss Liability Non-Payment","displayOrder":33}},"entitytype":"entity"}
				];

				beforeEach(function () {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate: start.toUTCString(),
						endDate: end.toUTCString()
					});
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onFlowView works properly', function () {

					spyOn(aperture.pubsub, 'publish');
					fixture._onFlowView(dataIds);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.ADD_FILES_TO_WORKSPACE_REQUEST,
						{
							contexts : [ { files : [ { entityIds: dataIds } ] } ],
							fromView: constants.VIEWS.ACCOUNTS.NAME
						}
					);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.SELECT_VIEW,
						{
							title: constants.VIEWS.FLOW.NAME
						}
					);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onTransactionsView works properly', function () {
					spyOn(aperture.pubsub, 'publish');
					fixture._onTransactionsView(dataIds);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.SELECT_VIEW,
						{
							title: constants.VIEWS.TRANSACTIONS.NAME,
							queryParams:{
								query: 'ENTITY:"a.loan.b224648,a.loan.b377279,a.loan.b131130,a.loan.b489889"'
							}
						}
					);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onShowAdvancedSearchDialog works properly', function () {
					spyOn(aperture.pubsub, 'publish');
					fixture._onShowAdvancedSearchDialog(specs);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.ADVANCED_SEARCH_REQUEST,
						{
							view: constants.VIEWS.ACCOUNTS.NAME,
							specs: specs
						}
					);
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infAccountsView capture dimension tests', function() {

				beforeEach(function () {
					fixture.debugCleanState();
					fixture.debugSetState('canvas', $('<div/>'));
					fixture.debugSetState('subscriberTokens', {});

					fixture._init();
					var start = new Date(1);
					var end = new Date();
					fixture._onDatasetStats(appChannel.DATASET_STATS, {
						startDate: start.toUTCString(),
						endDate: end.toUTCString()
					});
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure capture dimensions works properly', function () {

					var $canvas = $('<div/>');
					var $view = $('<div/>');
					$view.addClass('simpleViewContentsContainer');
					$canvas.append($view);
					fixture.debugSetState('canvas', $canvas);

					var captureDimentions = {
						width: 0,
						height: 0
					}

					expect(fixture._getCaptureDimensions()).toEqual(captureDimentions);
				});
			});
		});
	}
);
