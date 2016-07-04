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
		'views/infTransactionsView',
		'lib/communication/applicationChannels',
		'lib/communication/transactionsViewChannels',
		'lib/constants',
		'lib/module',
		'modules/infWorkspace',
		'hbs!templates/searchResults/searchDetails'
	],
	function(
		fixture,
		appChannel,
		transChannel,
		constants,
		modules,
		infWorkspace,
		searchDetailsTemplate
	) {

		var config = aperture.config.get()['influent.config'];

		var groupedResults = {
			'headers':{
				'orderBy':[{'ascending':true,'propertyKey':'ENTITY'},{'ascending':false,'propertyKey':'DATE'}],
				'properties':[
					{'tags':['ENTITY'],'defaultTerm':false,'propertyType':'STRING','range':'SINGLETON','friendlyText':'From','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'FROM','typeMappings':{'financial':'From'}},
					{'tags':['ENTITY'],'defaultTerm':false,'propertyType':'STRING','range':'SINGLETON','friendlyText':'To','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'TO','typeMappings':{'financial':'To'}},
					{'tags':['DATE'],'defaultTerm':false,'propertyType':'DATE','range':'SINGLETON','friendlyText':'Date','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'DATE','typeMappings':{'financial':'Date'}},
					{'tags':['USD','AMOUNT'],'defaultTerm':false,'propertyType':'DOUBLE','range':'SINGLETON','friendlyText':'Amount (USD)','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'AMOUNT','typeMappings':{'financial':'Amount'}}
				],
				'types':[{'exclusive':false,'friendlyText':'Financial','group':'','key':'financial'}]
			},
			'sessionId':'',
			'totalResults':15,
			'detailLevel':'FULL',
			'data':[
				{
					'items':[
						{'uid':'l.financial.2775911','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775911,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1293771600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 349999 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':162.5,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775910','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775910,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1291093200000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 116667 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':54.17,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775909','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775909,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1288497600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 116667 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':54.16,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775908','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775908,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1285819200000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 116667 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':54.17,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.453183','source':'a.partner.p163-224648','target':'a.loan.b224648','properties':{'ID':{'tags':['ID'],'value':453183,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1282017600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; loan: 700000 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':325,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'}
					],
					'groupKey':'Between Bob (b224648) and HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)'
				},
				{
					'items':[
						{'uid':'l.financial.3993005','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993005,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1348977600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 24989 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':296.74,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993004','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993004,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1346385600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.19,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993003','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993003,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1343707200000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 7668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':91.06,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993002','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993002,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1341028800000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.18,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993001','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993001,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1338436800000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 8335 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':98.98,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993000','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993000,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1335758400000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.18,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3992999','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3992999,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1333166400000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 9002 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':106.9,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3992998','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3992998,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1330491600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 3334 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':39.59,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3992997','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3992997,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1327986000000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.18,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.477052','source':'a.partner.p203-377279','target':'a.loan.b377279','properties':{'ID':{'tags':['ID'],'value':477052,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1323838800000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; loan: 80000 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':950,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'}
					],
					'groupKey':'Between Bob (b377279) and Milango Financial Services (p203-377279)'
				}
			]
		};

		var nonGroupedResults = {
			'headers':{
				'orderBy':[],
				'properties':[
					{'tags':['ENTITY'],'defaultTerm':false,'propertyType':'STRING','range':'SINGLETON','friendlyText':'From','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'FROM','typeMappings':{'financial':'From'}},
					{'tags':['ENTITY'],'defaultTerm':false,'propertyType':'STRING','range':'SINGLETON','friendlyText':'To','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'TO','typeMappings':{'financial':'To'}},
					{'tags':['DATE'],'defaultTerm':false,'propertyType':'DATE','range':'SINGLETON','friendlyText':'Date','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'DATE','typeMappings':{'financial':'Date'}},
					{'tags':['USD','AMOUNT'],'defaultTerm':false,'propertyType':'DOUBLE','range':'SINGLETON','friendlyText':'Amount (USD)','constraint':'FUZZY_PARTIAL_OPTIONAL','searchableBy':'DESCRIPTOR','key':'AMOUNT','typeMappings':{'financial':'Amount'}}
				],
				'types':[{'exclusive':false,'friendlyText':'Financial','group':'','key':'financial'}]
			},
			'sessionId':'',
			'totalResults':15,
			'detailLevel':'FULL',
			'data':[
				{
					'items':[
						{'uid':'l.financial.453183','source':'a.partner.p163-224648','target':'a.loan.b224648','properties':{'ID':{'tags':['ID'],'value':453183,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1282017600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; loan: 700000 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':325,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.477052','source':'a.partner.p203-377279','target':'a.loan.b377279','properties':{'ID':{'tags':['ID'],'value':477052,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1323838800000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; loan: 80000 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':950,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775911','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775911,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1293771600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 349999 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':162.5,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775910','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775910,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1291093200000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 116667 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':54.17,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775909','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775909,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1288497600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 116667 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':54.16,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.2775908','source':'a.loan.b224648','target':'a.partner.p163-224648','properties':{'ID':{'tags':['ID'],'value':2775908,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1285819200000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b224648)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 116667 (in UGX)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':54.17,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993005','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993005,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1348977600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 24989 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':296.74,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993004','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993004,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1346385600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.19,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993003','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993003,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1343707200000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 7668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':91.06,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993002','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993002,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1341028800000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.18,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993001','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993001,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1338436800000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 8335 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':98.98,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3993000','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3993000,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1335758400000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.18,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3992999','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3992999,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1333166400000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 9002 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':106.9,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3992998','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3992998,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1330491600000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 3334 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':39.59,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
						{'uid':'l.financial.3992997','source':'a.loan.b377279','target':'a.partner.p203-377279','properties':{'ID':{'tags':['ID'],'value':3992997,'friendlyText':'ID','displayOrder':5,'key':'ID'},'DATE':{'tags':['DATE'],'value':1327986000000,'friendlyText':'Date','displayOrder':2,'key':'DATE'},'TO':{'tags':['ENTITY'],'value':'Milango Financial Services (p203-377279)','friendlyText':'To','displayOrder':1,'key':'TO'},'FROM':{'tags':['ENTITY'],'value':'Bob (b377279)','friendlyText':'From','displayOrder':0,'key':'FROM'},'comment':{'tags':['ANNOTATION'],'value':'status: paid; repayed: 6668 (in KES)','friendlyText':'Comment','displayOrder':4,'key':'comment'},'AMOUNT':{'tags':['USD','AMOUNT'],'value':79.18,'friendlyText':'Amount (USD)','displayOrder':3,'key':'AMOUNT'}},'type':'financial'},
					]
				}
			]
		};

		var searchParamsResponse = {
			'types':[
				{
					'friendlyText':'Financial',
					'exclusive':false,
					'key':'financial',
					'group':''
				}
			],
			'orderBy':[
				{
					'propertyKey':'ENTITY',
					'ascending':true
				},
				{
					'propertyKey':'DATE',
					'ascending':false
				}
			],
			'properties':[
				{
					'friendlyText':'From',
					'typeMappings':{
						'financial':'From'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'STRING',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'FROM'
				},
				{
					'friendlyText':'Influent Account',
					'typeMappings':{
						'financial':'From'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'STRING',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'ENTITY'
				},
				{
					'friendlyText':'To',
					'typeMappings':{
						'financial':'To'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'STRING',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'TO'
				},
				{
					'friendlyText':'Linked Influent Account',
					'typeMappings':{
						'financial':'To'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'STRING',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'LINKED'
				},
				{
					'friendlyText':'Date',
					'typeMappings':{
						'financial':'Date'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'DATE',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'DATE'
				},
				{
					'friendlyText':'Amount (USD)',
					'typeMappings':{
						'financial':'Amount'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'DOUBLE',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'AMOUNT'
				},
				{
					'friendlyText':'Comment',
					'typeMappings':{
						'financial':'Comment'
					},
					'searchableBy':'DESCRIPTOR',
					'propertyType':'STRING',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'comment'
				},
				{
					'friendlyText':'ID',
					'typeMappings':{
						'financial':'TransactionId'
					},
					'searchableBy':'FREE_TEXT',
					'propertyType':'LONG',
					'range':'SINGLETON',
					'defaultTerm':false,
					'constraint':'FUZZY_PARTIAL_OPTIONAL',
					'key':'id'
				}
			]
		};

		describe('infTransactionsView Test Suite', function() {

			beforeEach(function() {
				infWorkspace.setSessionId('');
				spyOn(aperture.io, 'rest').and.callFake(function(uri, method, callback) {
					callback(searchParamsResponse, {status: 'success'});
				});
			});

			describe('infTransactionsView initialization tests', function() {

				beforeEach(function() {
					fixture.debugCleanState();
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure the infTransactionsView fixture is defined', function () {
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

					//------------------------------------------------------------------------------------------------------

					it('expect initialization to communicate initialized state', function() {
						fixture.debugSetState('canvas', $('<div/>'));
						spyOn(aperture.pubsub, 'publish');
						fixture._init();
						expect(aperture.pubsub.publish).toHaveBeenCalledWith(appChannel.VIEW_INITIALIZED, {name: constants.VIEWS.TRANSACTIONS.NAME});
					});
				});

				//----------------------------------------------------------------------------------------------------------

				describe('Ensure view registration works properly', function() {

					it('expect pub subsubs to be subscribed and unsubscribed on start and end events', function() {

						var moduleManager = modules.createManager();
						moduleManager.start('infTransactionsView', {});

						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.ALL_MODULES_STARTED)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.CLEAR_VIEW)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.DATASET_STATS)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.FILTER_SEARCH_CHANGE_EVENT)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.VIEW_PARAMS_CHANGED)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(appChannel.VIEW_REGISTERED)).toBe(true);

						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(transChannel.RESULT_FULL_DETAILS_SHOW)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(transChannel.RESULT_SELECTION_CHANGE)).toBe(true);
						expect(fixture._UIObjectState().subscriberTokens.hasOwnProperty(transChannel.RESULT_VISIBILITY_CHANGE)).toBe(true);

						moduleManager.end('infTransactionsView');

						expect($.isEmptyObject(fixture._UIObjectState().subscriberTokens)).toBe(true);
					});
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infTransactionsView clear view tests', function() {

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

					fixture._handleSearchResults(nonGroupedResults, {success: true});

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

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					expect(fixture._UIObjectState().canvas).not.toBe(null);
					expect(fixture._UIObjectState().subscriberTokens).not.toBe(null);
					expect(fixture._UIObjectState().operationsBar).not.toBe(null);
					expect(fixture._UIObjectState().transStartDate).not.toBe(null);
					expect(fixture._UIObjectState().transEndDate).not.toBe(null);
					expect(fixture._UIObjectState().searchState).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchString).not.toBe(null);
					expect(fixture._UIObjectState().currentSearchResult).not.toBe(null);

					var data = {
						title : constants.VIEWS.TRANSACTIONS.NAME
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

			describe('infTransactionsView handleSearchResults tests', function() {

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
					fixture._UIObjectState().currentSearchString = 'ENTITY:"a.loan.b224648,a.loan.b377279"';
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _handleSearchResults handles bad results', function() {

					fixture._handleSearchResults(nonGroupedResults, {success: false});
					expect(fixture._UIObjectState().currentSearchResult).toEqual(null);

					var badSessionId = _.clone(nonGroupedResults);
					badSessionId.sessionId = 'badId';

					fixture._handleSearchResults(badSessionId, {success: true});
					expect(fixture._UIObjectState().currentSearchResult).toEqual(null);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure search result context is created properly for cluster groups', function() {

					fixture._handleSearchResults(groupedResults, {success: true});

					//Test result totals
					expect(fixture._UIObjectState().currentSearchResult.getTotalSearchResults()).toEqual(15);
					expect(fixture._UIObjectState().currentSearchResult.getVisibleResults()).toEqual(2);

					//Test columns
					var header = fixture._UIObjectState().currentSearchResult.getHeaderInformation();
					expect(header.columns.length).toEqual(4);
					expect(header.columns[0].property.key).toEqual('FROM');
					expect(header.columns[1].property.key).toEqual('TO');
					expect(header.columns[2].property.key).toEqual('DATE');
					expect(header.columns[3].property.key).toEqual('AMOUNT');

					//Test summary counts
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(2);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumTotal).toEqual(15);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sortedBy).toEqual('Influent Account, Date');

					//Test cluster
					expect(fixture._UIObjectState().currentSearchResult.getChildren().length).toEqual(2);
					expect(fixture._UIObjectState().currentSearchResult.getChildren()[0].getClusterLabel()).toEqual('Between Bob (b224648) and HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)');
					expect(fixture._UIObjectState().currentSearchResult.getChildren()[0].getChildren().length).toEqual(5);

					//Test displayed results
					var visInfo = fixture._UIObjectState().currentSearchResult.getChildren()[0].getChildren()[0].getVisualInfo(header);
					expect(visInfo.columns.length).toEqual(4);
					expect(visInfo.columns[0].text).toEqual('<a href=/context.html#/accounts?query=ENTITY%3A%22a.loan.b224648%22>Bob (b224648)</a>');
					expect(visInfo.columns[1].text).toEqual('<a href=/context.html#/accounts?query=ENTITY%3A%22a.partner.p163-224648%22>HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)</a>');
			});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure pages are displayed properly for cluster groups', function() {

					fixture._handleSearchResults(groupedResults, {success: true});

					var resultRoot = fixture._UIObjectState().canvas.find('.infSearchResults');

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(2 * 2);

					fixture._onVisibilityChange(transChannel.RESULT_VISIBILITY_CHANGE);

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(4 * 2);

				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure search result context is created properly for non grouped results', function() {

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					//Test result totals
					expect(fixture._UIObjectState().currentSearchResult.getTotalSearchResults()).toEqual(15);
					expect(fixture._UIObjectState().currentSearchResult.getVisibleResults()).toEqual(2);

					//Test columns
					var header = fixture._UIObjectState().currentSearchResult.getHeaderInformation();
					expect(header.columns.length).toEqual(4);
					expect(header.columns[0].property.key).toEqual('FROM');
					expect(header.columns[1].property.key).toEqual('TO');
					expect(header.columns[2].property.key).toEqual('DATE');
					expect(header.columns[3].property.key).toEqual('AMOUNT');

					//Test summary counts
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(2);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumTotal).toEqual(15);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sortedBy).toBe(null);

					//Test displayed results
					expect(fixture._UIObjectState().currentSearchResult.getChildren().length).toEqual(15);
					var visInfo = fixture._UIObjectState().currentSearchResult.getChildren()[0].getVisualInfo(header);
					expect(visInfo.columns.length).toEqual(4);
					expect(visInfo.columns[1].text).toEqual('<a href=/context.html#/accounts?query=ENTITY%3A%22a.loan.b224648%22>Bob (b224648)</a>');
					expect(visInfo.columns[0].text).toEqual('<a href=/context.html#/accounts?query=ENTITY%3A%22a.partner.p163-224648%22>HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)</a>');
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure pages are displayed properly for non grouped results', function() {

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var resultRoot = fixture._UIObjectState().canvas.find('.infSearchResults');

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(2 * 2);

					fixture._onVisibilityChange(transChannel.RESULT_VISIBILITY_CHANGE);

					var count = resultRoot.find('tr').length;
					expect(count).toEqual(4 * 2);
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infTransactionsView transactions summary tests', function() {
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
					fixture._UIObjectState().currentSearchString = 'ENTITY:"a.loan.b224648,a.loan.b377279"';
				});

				it('Ensure column summary transaction results appear correct for grouped results', function() {
					fixture._handleSearchResults(groupedResults, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					expect(summaryRows).toBeDefined();
					expect(summaryRows.length).toEqual(4);

					var elementRows = $(summaryRows[0]).find('.summaryColumnText');
					expect(elementRows).toBeDefined();
					expect(elementRows.length).toEqual(4);

					var value = $(elementRows[0]).text();
					expect(value).toEqual('Bob (b224648)');

					var value = $(elementRows[1]).text();
					expect(value).toEqual('HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)');

					var value = $(elementRows[2]).text();
					expect(value).toEqual('Dec 31, 2010');

					var value = $(elementRows[3]).text();
					expect(value).toEqual('$162.50');
				});

				it('Ensure column summary transaction results appear correct for non-grouped results', function() {
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					expect(summaryRows).toBeDefined();
					expect(summaryRows.length).toEqual(4);

					var elementRows = $(summaryRows[0]).find('.summaryColumnText');
					expect(elementRows).toBeDefined();
					expect(elementRows.length).toEqual(4);

					var value = $(elementRows[0]).text();
					expect(value).toEqual('HOFOKAM Ltd., a partner of Catholic Relief Services (p163-224648)');

					var value = $(elementRows[1]).text();
					expect(value).toEqual('Bob (b224648)');

					var value = $(elementRows[2]).text();
					expect(value).toEqual('Aug 17, 2010');

					var value = $(elementRows[3]).text();
					expect(value).toEqual('$325.00');
				});

				it('Ensure amount and date columns are right aligned', function() {
					fixture._handleSearchResults(groupedResults, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					var elementRows = $(summaryRows[0]).find('.summaryColumn');

					var summaryColsTable = fixture._UIObjectState().canvas.find('.summaryColumns');
					var summaryCols = summaryColsTable.find('th');
					expect(summaryCols).toBeDefined();
					expect(summaryCols.length).toEqual(5);
					for (var i = 0; i < summaryCols.length; i++) {
						if (($(summaryCols[i]).find('.name').length > 0) && ($(summaryCols[i]).find('.name').text() === 'Amount' || $(summaryCols[i]).find('.name').text() === 'Date')) {
							expect($(summaryCols[i]).hasClass('summaryColumnNumFormat')).toBe(true);
							expect($(elementRows[i - 1]).hasClass('summaryColumnNumFormat')).toBe(true);
						}
					}
				});

				it('Ensure entity links to accounts view work', function() {
					fixture._handleSearchResults(groupedResults, {success: true});

					var result = fixture._UIObjectState().canvas.find('#infSearchResultTable');
					var summaryRows = result.find('tr');
					expect(summaryRows).toBeDefined();
					expect(summaryRows.length).toEqual(4);
					var links = $(summaryRows[0]).find('a');
					expect(links.length).toBe(2);

					expect($(links[0]).attr('href')).toEqual('/context.html#/accounts?query=ENTITY%3A%22a.loan.b224648%22');

					//TODO can we test clicking the link?
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infTransactionsView transactions details tests', function() {

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
					fixture._UIObjectState().currentSearchString = 'ENTITY:"a.loan.b224648,a.loan.b377279"';
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure detailed transaction results appear correct', function() {

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result = fixture._UIObjectState().currentSearchResult.getResultByDataId('l.financial.3993005');

					var testDiv = $('<div/>');

					fixture._generateTextTableElement(result, testDiv);

					var elementRows = testDiv.find('.infSearchResultProperty');
					expect(elementRows).toBeDefined();
					expect(elementRows.length).toEqual(6);

					$.each(elementRows, function(index,element) {
						expect($(element).find('.infSearchResultPropertyLabel')).toBeDefined();
						expect($(element).find('.infSearchResultPropertyValue')).toBeDefined();
					});

					var title = $(elementRows[3]).find('.infSearchResultPropertyLabel').text();
					var value = $(elementRows[3]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('Amount (USD): ');
					expect(value.trim()).toEqual('$296.74');

					title = $(elementRows[2]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[2]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('Date: ');
					expect(value.trim()).toEqual('Sep 30, 2012');

					title = $(elementRows[1]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[1]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('To: ');
					expect(value.trim()).toEqual('Milango Financial Services (p203-377279)');

					title = $(elementRows[0]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[0]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('From: ');
					expect(value.trim()).toEqual('Bob (b377279)');

					title = $(elementRows[4]).find('.infSearchResultPropertyLabel').text();
					value = $(elementRows[4]).find('.infSearchResultPropertyValue').text();
					expect(title).toEqual('Comment: ');
					expect(value.trim()).toEqual('status: paid; repayed: 24989 (in KES)');


				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infTransactionsView pubsub handling tests', function() {

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
					fixture._UIObjectState().currentSearchString = 'ENTITY:"a.loan.b224648,a.loan.b377279"';
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

				it('Ensure _onTransactionDetailsShow handles RESULT_FULL_DETAILS_SHOW pubsub', function () {
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result = fixture._UIObjectState().currentSearchResult.getResultByDataId('l.financial.3993005');

					var $container = $('<div/>');
					var $resultContainer = $('<div id="details_' + result.getXfId() + '"/>');
					$resultContainer.attr('id', 'details_' + result.getXfId());
					$resultContainer.append(searchDetailsTemplate());
					$container.append($resultContainer);

					$container.find('.simpleSearchResultText').css('display', 'block');
					$container.find('.detailedSearchResultText').css('display','none');

					// handles bad channels
					expect(fixture._onTransactionDetailsShow('bad-channel', {
						xfId: result.getXfId(),
						container: $container
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles null data
					expect(fixture._onTransactionDetailsShow(transChannel.RESULT_FULL_DETAILS_SHOW)).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles no xfId
					expect(fixture._onTransactionDetailsShow(transChannel.RESULT_FULL_DETAILS_SHOW, {
						container: $container
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles bad xfId
					expect(fixture._onTransactionDetailsShow(transChannel.RESULT_FULL_DETAILS_SHOW, {
						xfId: 'bad-xfid',
						container: $container
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles no container
					expect(fixture._onTransactionDetailsShow(transChannel.RESULT_FULL_DETAILS_SHOW, {
						xfId: result.getXfId()
					})).toEqual(false);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('[more]');

					// handles proper data
					expect(fixture._onTransactionDetailsShow(transChannel.RESULT_FULL_DETAILS_SHOW, {
						xfId: result.getXfId(),
						container: $container
					})).toEqual(true);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('none');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('block');
					expect($container.find('.infSearchResultStateToggle').html()).toEqual('show less');

					fixture._hideFullDetails($container);
					expect($container.find('.simpleSearchResultText').css('display')).toEqual('block');
					expect($container.find('.detailedSearchResultText').css('display')).toEqual('none');
					expect($container.find('#infSearchResultShowDetails').html()).toEqual('[more]');
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onSelectionChange handles RESULT_SELECTION_CHANGE pubsub', function () {
					fixture._handleSearchResults(nonGroupedResults, {success: true});

					var result1 = fixture._UIObjectState().currentSearchResult.getResultByDataId('l.financial.3993005');
					var result2 = fixture._UIObjectState().currentSearchResult.getResultByDataId('l.financial.2775911');

					// handles bad channels
					expect(fixture._onSelectionChange('bad-channel', {
						xfId: result1.getXfId(),
						isSelected: true
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles null data
					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE)).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles no xfId
					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
						isSelected: true
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles no isSelected
					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
						xfId: result1.getXfId()
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles bad xfId
					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
						xfId: 'bad-xfid',
						isSelected: true
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(0);

					// handles proper data
					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
						xfId: result1.getXfId(),
						isSelected: true
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(1);

					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
						xfId: result2.getXfId(),
						isSelected: true
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(2);

					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
						xfId: result1.getXfId(),
						isSelected: false
					})).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSelectedDataIds().length).toEqual(1);

					expect(fixture._onSelectionChange(transChannel.RESULT_SELECTION_CHANGE, {
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
					expect(fixture._onVisibilityChange(transChannel.RESULT_VISIBILITY_CHANGE)).toEqual(true);
					expect(fixture._UIObjectState().currentSearchResult.getSummaryInformation().sumVisible).toEqual(4);
				});

				//----------------------------------------------------------------------------------------------------------

				it('Ensure _onViewParametersChanged handles VIEW_PARAMS_CHANGED pubsub', function () {
					fixture.debugSetState('currentSearchString', 'bob');

					fixture._handleSearchResults(nonGroupedResults, {success: true});

					// handles bad channels
					expect(fixture._onViewParametersChanged('bad-channel', {
						title: constants.VIEWS.TRANSACTIONS.NAME,
						all: {
							query : 'not bob'
						}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles null data
					expect(fixture._onTransactionDetailsShow(appChannel.VIEW_PARAMS_CHANGED)).toEqual(false);
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
						title: constants.VIEWS.TRANSACTIONS.NAME
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles no query
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: constants.VIEWS.TRANSACTIONS.NAME,
						all: {}
					})).toEqual(false);
					expect(fixture._UIObjectState().currentSearchString).toEqual('bob');

					// handles same query
					expect(fixture._onViewParametersChanged(appChannel.VIEW_PARAMS_CHANGED, {
						title: constants.VIEWS.TRANSACTIONS.NAME,
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
						title: constants.VIEWS.TRANSACTIONS.NAME,
						all: {
							query : 'not bob'
						}
					})).toEqual(true);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.FILTER_SEARCH_DISPLAY_CHANGE_REQUEST,
						{
							view: constants.VIEWS.TRANSACTIONS.NAME,
							input: 'not bob'
						}
					);
					expect(fixture._UIObjectState().currentSearchString).toEqual('not bob');
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infTransactionsView view switching tests', function() {

				var fromDataIds = [
					"a.loan.b377279",
					"a.loan.b224648"
				];

				var toDataIds = [
					'a.partner.p203-377279',
					'a.partner.p163-224648'
				];

				var linkMap = {
					source : fromDataIds,
					target : toDataIds
				}

				var specs = [
					{"source":"a.loan.b377279","target":"a.partner.p203-377279","properties":{"transactionId":{"tags":["ID"],"value":3993005,"friendlyText":"transactionId","displayOrder":0},"outflowing":{"tags":["OUTFLOWING","AMOUNT","USD"],"value":296.74,"friendlyText":"outflowing","displayOrder":0},"DATE":{"tags":["DATE"],"value":1348977600000,"friendlyText":"DATE","displayOrder":0},"comment":{"tags":["ANNOTATION","TEXT"],"value":"status: paid; repayed: 24989 (in KES)","friendlyText":"comment","displayOrder":0},"inflowing":{"tags":["INFLOWING","AMOUNT","USD"],"value":0,"friendlyText":"inflowing","displayOrder":0}}},
					{"source":"a.partner.p203-377279","target":"a.loan.b377279","properties":{"transactionId":{"tags":["ID"],"value":477052,"friendlyText":"transactionId","displayOrder":0},"outflowing":{"tags":["OUTFLOWING","AMOUNT","USD"],"value":0,"friendlyText":"outflowing","displayOrder":0},"DATE":{"tags":["DATE"],"value":1323838800000,"friendlyText":"DATE","displayOrder":0},"comment":{"tags":["ANNOTATION","TEXT"],"value":"status: paid; loan: 80k (in KES)","friendlyText":"comment","displayOrder":0},"inflowing":{"tags":["INFLOWING","AMOUNT","USD"],"value":950,"friendlyText":"inflowing","displayOrder":0}}}
				]

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
					fixture._onFlowView(linkMap);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.ADD_FILES_TO_WORKSPACE_REQUEST,
						{
							contexts : [ { files : [ { entityIds : fromDataIds } ] }, { files : [ { entityIds : toDataIds } ] } ] ,
							fromView: constants.VIEWS.TRANSACTIONS.NAME
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

				it('Ensure _onAccountsView works properly', function () {

					spyOn(aperture.pubsub, 'publish');
					fixture._onAccountsView(linkMap);
					expect(aperture.pubsub.publish).toHaveBeenCalledWith(
						appChannel.SELECT_VIEW,
						{
							title: constants.VIEWS.ACCOUNTS.NAME,
							queryParams:{
								query: 'ENTITY:"a.loan.b377279,a.loan.b224648,a.partner.p203-377279,a.partner.p163-224648"'
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
							view: constants.VIEWS.TRANSACTIONS.NAME,
							specs: specs
						}
					);
				});
			});

			//--------------------------------------------------------------------------------------------------------------

			describe('infTransactionsView capture dimension tests', function() {

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
