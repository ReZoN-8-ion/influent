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
		'lib/advanced-search/infToolbarAdvancedMatchCriteria',
		'lib/advanced-search/infSearchParams'
	],
	function(
		fixture,
		infSearchParams
		) {

		//var config = aperture.config.get()['influent.config']


		document.body.innerHTML = $('<div/>');
		var $root = $(document.body);

		var instance;

		var initializationResponse = {
			'properties': [{
				'defaultTerm': false,
				'range': 'SINGLETON',
				'freeTextIndexed': false,
				'friendlyText': 'id',
				'constraint': 'FUZZY_PARTIAL_OPTIONAL',
				'key': 'id',
				'sortable': true,
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
				'key': 'NAME',
				'sortable': true,
				'typeMappings': {
					'partner': 'partners_name',
					'loan': 'loans_name',
					'lender': 'lenders_name'
				},
				'tags': [
					'NAME', 'SHARED_IDENTIFIER'
				]
			},
			{
				'defaultTerm': false,
				'range': 'SINGLETON',
				'freeTextIndexed': false,
				'friendlyText': 'Occupation',
				'constraint': 'FUZZY_PARTIAL_OPTIONAL',
				'key': 'occupation',
				'sortable': true,
				'typeMappings': {
					'lender': 'lenders_occupation'
				},
				'tags': [
					'SHARED_IDENTIFIER'
				]
			},
			{
				'defaultTerm': false,
				'range': 'SINGLETON',
				'freeTextIndexed': false,
				'friendlyText': 'Teams',
				'constraint': 'FUZZY_PARTIAL_OPTIONAL',
				'key': 'teams',
				'sortable': true,
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
				'sortable': true,
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
				'sortable': true,
				'typeMappings': {
					'loan': 'loans_location_countryCode',
					'lender': 'lenders_countryCode',
					'partner': 'partners_cc'
				},
				'tags': [
					'SHARED_IDENTIFIER'
				]
			},
			{
				'defaultTerm': false,
				'range': 'SINGLETON',
				'freeTextIndexed': false,
				'friendlyText': 'Occupational info',
				'constraint': 'FUZZY_PARTIAL_OPTIONAL',
				'key': 'occupationalInfo',
				'sortable': true,
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
				'sortable': true,
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
				'key': 'loan_country',
				'sortable': true,
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
				'sortable': true,
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
				'sortable': true,
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
				'sortable': true,
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
				'key': 'loan_sector',
				'sortable': true,
				'typeMappings': {
					'loan': 'loans_sector'
				},
				'tags': [
					'SHARED_IDENTIFIER'
				]
			},
			{
				'defaultTerm': false,
				'range': 'SINGLETON',
				'freeTextIndexed': false,
				'friendlyText': 'Partner status',
				'constraint': 'FUZZY_PARTIAL_OPTIONAL',
				'key': 'partner_status',
				'sortable': true,
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
				'sortable': true,
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
			}],
			'orderBy': [{
				'propertyKey': 'SCORE'
			}]

		};

		var loan1Entity = {
			'uid':'a.loan.b146902',
			'entitytags':[
				'ACCOUNT'
			],
			'properties':{
				'loans_postedDate':{
					'tags':[
						'DATE',
						'RAW'
					],
					'value':1256391015000,
					'friendlyText':'Posted Date',
					'displayOrder':2
				},
				'loans_terms_disbursalCurrency':{
					'tags':[
						'TEXT',
						'RAW'
					],
					'value':'PHP',
					'friendlyText':'Disbursal Currency',
					'displayOrder':4
				},
				'type':{
					'tags':[
						'TYPE'
					],
					'value':'loan',
					'friendlyText':'Kiva Account Type',
					'displayOrder':0
				},
				'loans_location_geo_type':{
					'tags':[
						'RAW'
					],
					'value':'point',
					'friendlyText':'Geo Type',
					'displayOrder':5
				},
				'timestamp':{
					'tags':[
						'DATE',
						'RAW'
					],
					'value':1392057086170,
					'friendlyText':'Timestamp',
					'displayOrder':34
				},
				'id':{
					'tags':[
						'ID',
						'RAW'
					],
					'value':'b146902',
					'friendlyText':'ID',
					'displayOrder':3
				},
				'loans_basketAmount':{
					'tags':[
						'AMOUNT',
						'RAW'
					],
					'value':0,
					'friendlyText':'Basket Amount',
					'displayOrder':6
				},
				'outboundDegree':{
					'tags':[
						'OUTFLOWING'
					],
					'value':1,
					'friendlyText':'outbound Degree',
					'displayOrder':38
				},
				'countryCode':{
					'tags':[
						'RAW',
						'FILTERABLE',
						'SHARED_IDENTIFIER'
					],
					'value':'PH',
					'friendlyText':'Country Code',
					'displayOrder':7
				},
				'description':{
					'tags':[
						'TEXT',
						'RAW',
						'HTML'
					],
					'value':'description of Mark',
					'friendlyText':'Description',
					'displayOrder':10
				},
				'loans_loanAmount':{
					'tags':[
						'AMOUNT',
						'RAW',
						'SUMMARY'
					],
					'value':125,
					'friendlyText':'Loan Amount',
					'displayOrder':9
				},
				'loans_terms_lossLiability_currencyExchange':{
					'tags':[
						'RAW'
					],
					'value':'partner',
					'friendlyText':'Loss Liability Currency Exchange',
					'displayOrder':8
				},
				'loans_terms_lossLiability_currencyExchangeCoverageRate':{
					'tags':[
						'RAW'
					],
					'value':0,
					'friendlyText':'Loss Liability Coverage Rate',
					'displayOrder':12
				},
				'loan_sector':{
					'tags':[
						'TEXT',
						'RAW',
						'SHARED_IDENTIFIER'
					],
					'value':'Retail',
					'friendlyText':'Sector',
					'displayOrder':13
				},
				'loans_terms_disbursalDate':{
					'tags':[
						'DATE',
						'RAW'
					],
					'value':1255071600000,
					'friendlyText':'Disbursal Date',
					'displayOrder':14
				},
				'loans_location_geo_pairs':{
					'tags':[
						'RAW'
					],
					'value':'13 122',
					'friendlyText':'Geo Pairs',
					'displayOrder':15
				},
				'lat':{
					'tags':[
						'RAW'
					],
					'value':13,
					'friendlyText':'Latitude',
					'displayOrder':16
				},
				'loan_status':{
					'tags':[
						'STATUS',
						'TEXT',
						'RAW',
						'SUMMARY'
					],
					'value':'paid',
					'friendlyText':'Status',
					'displayOrder':17
				},
				'text':{
					'tags':[
						'RAW'
					],
					'value':'description of Mark',
					'friendlyText':'text',
					'displayOrder':11
				},
				'lon':{
					'tags':[
						'RAW'
					],
					'value':122,
					'friendlyText':'Longitude',
					'displayOrder':18
				},
				'geo':{
					'tags':[
						'GEO'
					],
					'value':{
						'lon':122,
						'text':'Philippines, Talakag, Bukidnon',
						'cc':'PHL',
						'lat':13
					},
					'friendlyText':'',
					'displayOrder':35
				},
				'loan_country':{
					'tags':[
						'RAW'
					],
					'value':'Philippines',
					'friendlyText':'Country',
					'displayOrder':19
				},
				'loans_location_town':{
					'tags':[
						'RAW'
					],
					'value':'Talakag, Bukidnon',
					'friendlyText':'Town',
					'displayOrder':20
				},
				'loans_terms_disbursalAmount':{
					'tags':[
						'AMOUNT',
						'RAW'
					],
					'value':5000,
					'friendlyText':'Disbursal Amount',
					'displayOrder':21
				},
				'loan_use':{
					'tags':[
						'TEXT',
						'RAW'
					],
					'value':'loan of Mark',
					'friendlyText':'Use',
					'displayOrder':22
				},
				'image':{
					'tags':[
						'IMAGE'
					],
					'range':{
						'values':[
							'http://www.kiva.org/img/w400/412493.jpg'
						],
						'type':'STRING'
					},
					'friendlyText':'Image',
					'displayOrder':1
				},
				'label':{
					'tags':[
						'LABEL'
					],
					'value':'Mark. Philippines, Talakag, Bukidnon',
					'friendlyText':'label',
					'displayOrder':36
				},
				'loan_activity':{
					'tags':[
						'TEXT',
						'RAW'
					],
					'value':'',
					'friendlyText':'Activity',
					'displayOrder':24
				},
				'loans_terms_loanAmount':{
					'tags':[
						'AMOUNT',
						'RAW'
					],
					'value':125,
					'friendlyText':'Loan Amount',
					'displayOrder':25
				},
				'inboundDegree':{
					'tags':[
						'INFLOWING'
					],
					'value':1,
					'friendlyText':'inbound Degree',
					'displayOrder':37
				},
				'image_id':{
					'tags':[
						'RAW'
					],
					'value':412493,
					'friendlyText':'image_id',
					'displayOrder':23
				},
				'loans_fundedAmount':{
					'tags':[
						'AMOUNT',
						'RAW'
					],
					'value':125,
					'friendlyText':'Funded Amount',
					'displayOrder':26
				},
				'loans_fundedDate':{
					'tags':[
						'DATE',
						'RAW'
					],
					'value':1256398478000,
					'friendlyText':'Funded Date',
					'displayOrder':27
				},
				'loans_paidDate':{
					'tags':[
						'DATE',
						'RAW'
					],
					'value':1268648574000,
					'friendlyText':'Paid Date',
					'displayOrder':29
				},
				'NAME':{
					'tags':[
						'NAME',
						'RAW',
						'SUMMARY',
						'SHARED_IDENTIFIER'
					],
					'value':'Mark',
					'friendlyText':'Name',
					'displayOrder':28
				},
				'loans_plannedExpirationDate':{
					'tags':[
						'DATE',
						'RAW'
					],
					'value':-2209143600000,
					'friendlyText':'Planned Expiration Date',
					'displayOrder':32
				},
				'loans_paidAmount':{
					'tags':[
						'AMOUNT',
						'RAW'
					],
					'value':125,
					'friendlyText':'Paid Amount',
					'displayOrder':31
				},
				'loans_location_geo_level':{
					'tags':[
						'RAW'
					],
					'value':'country',
					'friendlyText':'Geo Level',
					'displayOrder':30
				},
				'loans_terms_lossLiability_nonpayment':{
					'tags':[
						'RAW'
					],
					'value':'partner',
					'friendlyText':'Loss Liability Non-Payment',
					'displayOrder':33
				}
			},
			'entitytype':'entity'
		};

		var loan2Entity = {
			'uid': 'a.loan.b311953',
			'entitytags': [
				'ACCOUNT'
			],
			'properties': {
				'loans_postedDate': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1309273204000,
					'friendlyText': 'Posted Date',
					'displayOrder': 2
				},
				'loans_terms_disbursalCurrency': {
					'tags': [
						'TEXT',
						'RAW'
					],
					'value': 'PHP',
					'friendlyText': 'Disbursal Currency',
					'displayOrder': 4
				},
				'type': {
					'tags': [
						'TYPE'
					],
					'value': 'loan',
					'friendlyText': 'Kiva Account Type',
					'displayOrder': 0
				},
				'loans_location_geo_type': {
					'tags': [
						'RAW'
					],
					'value': 'point',
					'friendlyText': 'Geo Type',
					'displayOrder': 5
				},
				'timestamp': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1392057235962,
					'friendlyText': 'Timestamp',
					'displayOrder': 34
				},
				'id': {
					'tags': [
						'ID',
						'RAW'
					],
					'value': 'b311953',
					'friendlyText': 'ID',
					'displayOrder': 3
				},
				'loans_basketAmount': {
					'tags': [
						'AMOUNT',
						'RAW'
					],
					'value': 0,
					'friendlyText': 'Basket Amount',
					'displayOrder': 6
				},
				'outboundDegree': {
					'tags': [
						'OUTFLOWING'
					],
					'value': 1,
					'friendlyText': 'outbound Degree',
					'displayOrder': 38
				},
				'countryCode': {
					'tags': [
						'RAW',
						'FILTERABLE',
						'SHARED_IDENTIFIER'
					],
					'value': 'PH',
					'friendlyText': 'Country Code',
					'displayOrder': 7
				},
				'description': {
					'tags': [
						'TEXT',
						'RAW',
						'HTML'
					],
					'value': 'description of Joe',
					'friendlyText': 'Description',
					'displayOrder': 10
				},
				'loans_loanAmount': {
					'tags': [
						'AMOUNT',
						'RAW',
						'SUMMARY'
					],
					'value': 300,
					'friendlyText': 'Loan Amount',
					'displayOrder': 9
				},
				'loans_terms_lossLiability_currencyExchange': {
					'tags': [
						'RAW'
					],
					'value': 'shared',
					'friendlyText': 'Loss Liability Currency Exchange',
					'displayOrder': 8
				},
				'loans_terms_lossLiability_currencyExchangeCoverageRate': {
					'tags': [
						'RAW'
					],
					'value': 0.20000000298023224,
					'friendlyText': 'Loss Liability Coverage Rate',
					'displayOrder': 12
				},
				'loan_sector': {
					'tags': [
						'TEXT',
						'RAW',
						'SHARED_IDENTIFIER'
					],
					'value': 'Agriculture',
					'friendlyText': 'Sector',
					'displayOrder': 13
				},
				'loans_terms_disbursalDate': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1306479600000,
					'friendlyText': 'Disbursal Date',
					'displayOrder': 14
				},
				'loans_location_geo_pairs': {
					'tags': [
						'RAW'
					],
					'value': '13 122',
					'friendlyText': 'Geo Pairs',
					'displayOrder': 15
				},
				'lat': {
					'tags': [
						'RAW'
					],
					'value': 13,
					'friendlyText': 'Latitude',
					'displayOrder': 16
				},
				'loan_status': {
					'tags': [
						'STATUS',
						'TEXT',
						'RAW',
						'SUMMARY'
					],
					'value': 'paid',
					'friendlyText': 'Status',
					'displayOrder': 17
				},
				'text': {
					'tags': [
						'RAW'
					],
					'value': 'description of Joe',
					'friendlyText': 'text',
					'displayOrder': 11
				},
				'lon': {
					'tags': [
						'RAW'
					],
					'value': 122,
					'friendlyText': 'Longitude',
					'displayOrder': 18
				},
				'geo': {
					'tags': [
						'GEO'
					],
					'value': {
						'lon': 122,
						'text': 'Philippines, Buena Suerte, Cauayan City, Isabela',
						'cc': 'PHL',
						'lat': 13
					},
					'friendlyText': '',
					'displayOrder': 35
				},
				'loan_country': {
					'tags': [
						'RAW'
					],
					'value': 'Philippines',
					'friendlyText': 'Country',
					'displayOrder': 19
				},
				'loans_location_town': {
					'tags': [
						'RAW'
					],
					'value': 'Buena Suerte, Cauayan City, Isabela',
					'friendlyText': 'Town',
					'displayOrder': 20
				},
				'loans_terms_disbursalAmount': {
					'tags': [
						'AMOUNT',
						'RAW'
					],
					'value': 12000,
					'friendlyText': 'Disbursal Amount',
					'displayOrder': 21
				},
				'loan_use': {
					'tags': [
						'TEXT',
						'RAW'
					],
					'value': 'loan of Joe',
					'friendlyText': 'Use',
					'displayOrder': 22
				},
				'image': {
					'tags': [
						'IMAGE'
					],
					'range': {
						'values': [
							'http://www.kiva.org/img/w400/794548.jpg'
						],
						'type': 'STRING'
					},
					'friendlyText': 'Image',
					'displayOrder': 1
				},
				'label': {
					'tags': [
						'LABEL'
					],
					'value': 'Joe. Philippines, Buena Suerte, Cauayan City, Isabela',
					'friendlyText': 'label',
					'displayOrder': 36
				},
				'loan_activity': {
					'tags': [
						'TEXT',
						'RAW'
					],
					'value': '',
					'friendlyText': 'Activity',
					'displayOrder': 24
				},
				'loans_terms_loanAmount': {
					'tags': [
						'AMOUNT',
						'RAW'
					],
					'value': 300,
					'friendlyText': 'Loan Amount',
					'displayOrder': 25
				},
				'inboundDegree': {
					'tags': [
						'INFLOWING'
					],
					'value': 1,
					'friendlyText': 'inbound Degree',
					'displayOrder': 37
				},
				'image_id': {
					'tags': [
						'RAW'
					],
					'value': 794548,
					'friendlyText': 'image_id',
					'displayOrder': 23
				},
				'loans_fundedAmount': {
					'tags': [
						'AMOUNT',
						'RAW'
					],
					'value': 300,
					'friendlyText': 'Funded Amount',
					'displayOrder': 26
				},
				'loans_fundedDate': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1310134519000,
					'friendlyText': 'Funded Date',
					'displayOrder': 27
				},
				'loans_paidDate': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1324111058000,
					'friendlyText': 'Paid Date',
					'displayOrder': 29
				},
				'NAME': {
					'tags': [
						'NAME',
						'RAW',
						'SUMMARY',
						'SHARED_IDENTIFIER'
					],
					'value': 'Joe',
					'friendlyText': 'Name',
					'displayOrder': 28
				},
				'loans_plannedExpirationDate': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': -2209143600000,
					'friendlyText': 'Planned Expiration Date',
					'displayOrder': 32
				},
				'loans_paidAmount': {
					'tags': [
						'AMOUNT',
						'RAW'
					],
					'value': 300,
					'friendlyText': 'Paid Amount',
					'displayOrder': 31
				},
				'loans_location_geo_level': {
					'tags': [
						'RAW'
					],
					'value': 'country',
					'friendlyText': 'Geo Level',
					'displayOrder': 30
				},
				'loans_terms_lossLiability_nonpayment': {
					'tags': [
						'RAW'
					],
					'value': 'lender',
					'friendlyText': 'Loss Liability Non-Payment',
					'displayOrder': 33
				}
			},
			'entitytype': 'entity'
		};

		var partnerEntity = {
			'uid': 'a.partner.p128-146902',
			'entitytags': [
				'ACCOUNT'
			],
			'properties': {
				'countryCode': {
					'tags': [
						'RAW',
						'SHARED_IDENTIFIER'
					],
					'value': 'PH',
					'friendlyText': 'partners_cc',
					'displayOrder': 13
				},
				'partner_due_diligence_type': {
					'tags': [
						'TEXT',
						'RAW'
					],
					'value': 'Full',
					'friendlyText': 'Due Diligence Type',
					'displayOrder': 3
				},
				'geo': {
					'tags': [
						'GEO'
					],
					'value': {
						'lon': 0,
						'text': 'Philippines',
						'cc': 'PHL',
						'lat': 0
					},
					'friendlyText': '',
					'displayOrder': 15
				},
				'partner_status': {
					'tags': [
						'STATUS',
						'TEXT',
						'RAW',
						'SUMMARY'
					],
					'value': 'active',
					'friendlyText': 'Status',
					'displayOrder': 8
				},
				'CLUSTER_SUMMARY': {
					'tags': [
						'CLUSTER_SUMMARY'
					],
					'value': 's.partner.sp128',
					'friendlyText': 'CLUSTER_SUMMARY',
					'displayOrder': 17
				},
				'image': {
					'tags': [
						'IMAGE'
					],
					'range': {
						'values': [
							'http://www.kiva.org/img/w400/272879.jpg'
						],
						'type': 'STRING'
					},
					'friendlyText': 'Image',
					'displayOrder': 1
				},
				'label': {
					'tags': [
						'LABEL'
					],
					'value': 'Hagdan Sa Pag-uswag Foundation, Inc. (HSPFI)',
					'friendlyText': 'label',
					'displayOrder': 16
				},
				'inboundDegree': {
					'tags': [
						'INFLOWING'
					],
					'value': 6,
					'friendlyText': 'inbound Degree',
					'displayOrder': 19
				},
				'type': {
					'tags': [
						'TYPE'
					],
					'value': 'partner',
					'friendlyText': 'Kiva Account Type',
					'displayOrder': 0
				},
				'image_id': {
					'tags': [
						'RAW'
					],
					'value': 272879,
					'friendlyText': 'image_id',
					'displayOrder': 7
				},
				'partners_rating': {
					'tags': [
						'STAT',
						'RAW'
					],
					'value': 3,
					'friendlyText': 'Rating',
					'displayOrder': 11
				},
				'timestamp': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1392057752328,
					'friendlyText': 'Timestamp',
					'displayOrder': 14
				},
				'id': {
					'tags': [
						'ID',
						'RAW'
					],
					'value': 'p128',
					'friendlyText': 'ID',
					'displayOrder': 12
				},
				'partners_startDate': {
					'tags': [
						'DATE',
						'RAW'
					],
					'value': 1234890077000,
					'friendlyText': 'Start Date',
					'displayOrder': 2
				},
				'partners_loansPosted': {
					'tags': [
						'RAW'
					],
					'value': 15572,
					'friendlyText': 'Loans Posted',
					'displayOrder': 4
				},
				'outboundDegree': {
					'tags': [
						'OUTFLOWING'
					],
					'value': 6,
					'friendlyText': 'outbound Degree',
					'displayOrder': 20
				},
				'partners_delinquencyRate': {
					'tags': [
						'STAT',
						'RAW'
					],
					'value': 0.3026812459223,
					'friendlyText': 'Delinquency Rate',
					'displayOrder': 5
				},
				'partners_defaultRate': {
					'tags': [
						'STAT',
						'RAW'
					],
					'value': 0,
					'friendlyText': 'Default Rate',
					'displayOrder': 6
				},
				'owner': {
					'tags': [
						'ACCOUNT_OWNER'
					],
					'value': 's.partner.p128',
					'friendlyText': 'Account Owner',
					'displayOrder': 18
				},
				'NAME': {
					'tags': [
						'NAME',
						'LABEL',
						'RAW',
						'SUMMARY',
						'SHARED_IDENTIFIER'
					],
					'value': 'Hagdan Sa Pag-uswag Foundation, Inc. (HSPFI)',
					'friendlyText': 'Name',
					'displayOrder': 9
				},
				'partners_totalAmountRaised': {
					'tags': [
						'RAW'
					],
					'value': 3162925,
					'friendlyText': 'Total Amount Raised',
					'displayOrder': 10
				}
			},
			'entitytype': 'entity'
		};

		var seededLoanAdvancedSearch = [
			'NAME:Mark~0.5',
			'countryCode:PH~0.5',
			'loan_sector:Retail~0.5'
		];

		var seededMultiLoanAdvancedSearch = [
			'NAME:Mark, Joe~0.5',
			'countryCode:PH~0.5',
			'loan_sector:Retail, Agriculture~0.5'
		];

		var seededMultiLoanPartnerAdvancedSearch = [
			'NAME:Mark, Joe, Hagdan Sa Pag-uswag Foundation\\, Inc. (HSPFI)~0.5',
			'countryCode:PH~0.5'
		];

		function getPropertyCount(jsObject) {
			var count = 0;
			for (var key in jsObject) {
				if (jsObject.hasOwnProperty(key)) {
					count++;
				}
			}
			return count;
		}

		describe('infToolbarAdvancedMatchCriteria test', function() {
			it('ensures the infToolbarAdvancedMatchCriteria fixture is defined', function() {
				expect(fixture).toBeDefined();
			});

			it('ensures an instance can be created', function() {
				var searchParams = infSearchParams.create(initializationResponse);
				instance = fixture.createInstance('accounts',$root,searchParams,true);
				expect(instance).toBeDefined();
			});

			it('ensures the initialization response can be handled', function() {
				var builtTypeMap = instance.getSearchParams().getTypeMap();
				expect(getPropertyCount(builtTypeMap) > 0).toBe(true);
				var builtPropertyMap = instance.getSearchParams().getPropertyMap();
				expect(getPropertyCount(builtPropertyMap) > 0).toBe(true);
			});

			it('ensures the UI can be built',function() {
				instance.build();
				var state = instance.getState();
				expect(state.canvas.length > 0).toBe(true);
				expect(state.criteria).toBeDefined();
			});

			it('ensures it can be opened without a search string',function() {
				instance.setFieldsFromString('');
			});

			it('ensures that a default type is chosen',function() {
				var types = instance.getState().selectedTypes;
				expect(types).toBeDefined();
				expect(types.length>0).toBe(true);
			});

			it('ensures that a default row is added',function() {
				var criteriaList = instance.getCriteriaRows();
				expect(criteriaList).toBeDefined();
				expect(criteriaList.length===1).toBe(true);
			});

			it('ensures an empty UI generates an empty string',function() {
				var searchStr = instance.assembleSearchString();
				expect(searchStr==='').toBe(true);
			});

			it('ensures that a simple query can be parsed',function() {
				var qs = 'NAME:"dan" TYPE:lender';
				var criteria = instance.parseQuery(qs);
				expect(criteria).toBeDefined();
				expect(criteria.list).toBeDefined();
				expect(criteria.list.length).toBe(2);
				expect(criteria.map).toBeDefined();
				expect(criteria.map.NAME).toBeDefined();
				expect(criteria.map.TYPE).toBeDefined();
				expect(criteria.map.TYPE.length).toBe(1);
				expect(criteria.map.MATCH).not.toBeDefined();
			});

			it('ensures that a complex query can be parsed',function() {
				var qs = 'NAME:"dan" id:"12345" occupation:"45" TYPE:lender MATCH:any';
				var criteria = instance.parseQuery(qs);
				expect(criteria).toBeDefined();
				expect(criteria.list).toBeDefined();
				expect(criteria.list.length).toBe(5);
				expect(criteria.map).toBeDefined();
				expect(criteria.map.NAME).toBeDefined();
				expect(criteria.map.TYPE).toBeDefined();
				expect(criteria.map.TYPE.length).toBe(1);
				expect(criteria.map.MATCH).toBeDefined();
			});

			it('ensures that a query with multiple TYPEs can be parsed',function() {
				var qs ='NAME:"dan" TYPE:lender TYPE:partner';
				var criteria = instance.parseQuery(qs);
				expect(criteria).toBeDefined();
				expect(criteria.list).toBeDefined();
				expect(criteria.list.length).toBe(3);
				expect(criteria.map).toBeDefined();
				expect(criteria.map.NAME).toBeDefined();
				expect(criteria.map.TYPE).toBeDefined();
				expect(criteria.map.TYPE.length).toBe(2);
				expect(criteria.map.MATCH).not.toBeDefined();
			});

			it('ensures that clicking on the add criteria button adds a criteria row',function() {
				var numCriteriaRows = instance.getCriteriaRows().length;
				instance.onCriteriaAdd();
				expect(instance.getCriteriaRows().length).toBe(numCriteriaRows+1);
			});

			it('ensures that criteria can be built from a simple query',function() {
				var qs = 'NAME:"dan" TYPE:lender';
				instance.setFieldsFromString(qs);

				var builtCriteria = instance.getState().criteria;
				expect(builtCriteria).toBeDefined();
				expect(builtCriteria.list().length).toBe(1);
				expect(builtCriteria.list()[0].value()).toBe('NAME:"dan"');
			});

			it('ensures that criteria can be built from a complex query',function() {
				var qs = 'NAME:"dan" id:"12345" occupation:"45" TYPE:lender MATCH:any';
				instance.setFieldsFromString(qs);
				var builtCriteria = instance.getState().criteria;
				expect(builtCriteria).toBeDefined();
				expect(builtCriteria.list().length).toBe(3);
				expect(builtCriteria.list()[0].value()).toBe('NAME:"dan"');
				expect(builtCriteria.list()[1].value()).toBe('id:"12345"');
				expect(builtCriteria.list()[2].value()).toBe('occupation:"45"');
			});

			it('ensures that one of any/all is selected by default',function() {
				var qs = '';
				instance.setFieldsFromString(qs);
				var canvas = instance.getState().canvas;
				var anyAll = canvas.find('.advancedsearch-any-all-line>input');
				expect(anyAll).toBeDefined();
				expect(anyAll.length).toBe(2);
				var numChecked = 0;
				$.each(anyAll,function(idx,element) {
					if ($(element).prop('checked')) {
						numChecked++;
					}
				});
				expect(numChecked).toBe(1);
			});

			it('ensures the any selector is correctly set',function() {
				var qs = 'NAME:"dan" TYPE:lender';
				instance.setFieldsFromString(qs);
				var canvas = instance.getState().canvas;
				var anyElement = canvas.find('.advancedSearchbooleanOperation[value="any"]');
				var allElement = canvas.find('.advancedSearchbooleanOperation[value="all"]');
				expect(anyElement).toBeDefined();
				expect(allElement).toBeDefined();
				expect(anyElement.prop('checked')).toBe(true);
				expect(allElement.prop('checked')).toBe(false);
			});

			it('ensures the all selector is correctly set',function() {
				var qs = 'NAME:"dan" id:"12345" occupation:"45" TYPE:lender MATCH:all ORDER:id';
				instance.setFieldsFromString(qs);
				var canvas = instance.getState().canvas;
				var anyElement = canvas.find('.advancedSearchbooleanOperation[value="any"]');
				var allElement = canvas.find('.advancedSearchbooleanOperation[value="all"]');
				expect(anyElement).toBeDefined();
				expect(allElement).toBeDefined();
				expect(anyElement.prop('checked')).toBe(false);
				expect(allElement.prop('checked')).toBe(true);
			});

			it('ensures it can correctly assemble search strings from query strings, stripping unnecessary terms',function() {
				var stringsIn = [
					'NAME:"dan" TYPE:lender MATCH:any',
					'NAME:"dan" id:"12345" occupation:"45" TYPE:lender MATCH:any ORDER:id',
					'NAME:"dan" TYPE:lender TYPE:partner MATCH:any ORDER:id'
				];

				var stringsOut = [
					'NAME:"dan" TYPE:lender',
					'NAME:"dan" id:"12345" occupation:"45" TYPE:lender MATCH:any ORDER:id',
					'NAME:"dan" TYPE:lender TYPE:partner ORDER:id'
				];

				for (var i = 0; i < stringsIn.length; i++) {
					instance.setFieldsFromString(stringsIn[i]);
					expect(instance.assembleSearchString().trim()).toBe(stringsOut[i]);
				}
			});

			it('ensures it can correctly seed properties from one loan entities', function() {
				instance.clear();

				instance.seedFromEntities([loan1Entity]);
				var rows = instance.getCriteriaRows();
				for (var i = 0; i < rows.length; i++) {
					rows[i] = rows[i].value();
				}
				var selectVal = instance.getState().selectedTypes;
				expect(rows).toEqual(seededLoanAdvancedSearch);
				expect(selectVal).toEqual(['loan']);
			});

			it('ensures it can correctly seed properties from multiple loan entities', function() {
				instance.clear();
				instance.seedFromEntities([loan1Entity, loan2Entity]);
				var rows = instance.getCriteriaRows();
				for (var i = 0; i < rows.length; i++) {
					rows[i] = rows[i].value();
				}
				var selectVal = instance.getState().selectedTypes;
				expect(rows).toEqual(seededMultiLoanAdvancedSearch);
				expect(selectVal).toEqual(['loan']);
			});

			it('ensures it can correctly seed properties from multiple loan and partner entities', function() {
				instance.clear();
				instance.seedFromEntities([loan1Entity, loan2Entity, partnerEntity]);
				var rows = instance.getCriteriaRows();
				for (var i = 0; i < rows.length; i++) {
					rows[i] = rows[i].value();
				}
				var selectVal = instance.getState().selectedTypes;
				expect(rows).toEqual(seededMultiLoanPartnerAdvancedSearch);
				expect(selectVal).toEqual(['loan', 'partner']);
			});

			it('ensures it can correctly infer types when no TYPE is in the query string', function() {
				var qs = 'NAME:"dan" id:"12345"';
				instance.clear();
				instance.setFieldsFromString(qs);
				var selectedTypes = instance.getState().selectedTypes;
				expect(selectedTypes).toBeDefined();
				expect(selectedTypes.length).toBe(3);
			});

			it('has a means of specifying the order of search results', function () {
				var qs = 'NAME:"dan" id:"12345" occupation:"45" TYPE:lender MATCH:all ORDER:id ORDER:NAME';
				instance.setFieldsFromString(qs);
				expect(instance.getOrderingRows().length).toBe(2);
			});
		});
	}
);
