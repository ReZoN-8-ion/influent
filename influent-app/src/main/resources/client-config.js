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
{
	/*
	 * A default log configuration, which appends info to the console but pops up notifications.
	 */
	'aperture.log' : {
		level : 'log',
		logWindowErrors : {
			log : true,
			preventDefault : true
		},
		appenders : {
			consoleAppender : {
				level : 'info'
			},
			notifyAppender : {
				level : 'error'
			}/*,
			draperAppender : {
				address : 'http://10.1.90.46:1337',
				webworker : 'scripts/lib/extern/draper.activity_worker-2.1.1.js',
			}
			*/
		}
	},
	
	/*
	 * The endpoint locations for Aperture services accessed through the io interface
	 */
	'aperture.io' : {
		rpcEndpoint : '%host%/influent/rpc',
		restEndpoint : '%host%/influent/rest'
	},
	
	/*
	 * Influent specific configuration
	 */
	'influent.config' : {
		useAuth : false,
		datasource : 'Influent Example',
		title : 'Influent',
		help : 'http://community.influent.org/docs/user-guide/',
		about : 'http://community.influent.org/docs/about/',
		aboutFlow : 'http://community.influent.org/docs/user-guide/how-to/investigate-flow/#add-accounts',
		dateRangeIntervals : {
			P14D : '2 weeks',
			P112D : '16 weeks',
			P1Y : '1 year',
			P16M : '16 months',
			P4Y : '4 years',
			P16Y : '16 years'
		},
		startingDateRange : 'P1Y',
		defaultEndDate: new Date(2015, 3, 1),
		dateFormat: 'MMM D, YYYY',
		timeFormat: 'h:mma',
		defaultShowDetails : true,
		defaultGraphScale : 1000,
		doubleEncodeSourceUncertainty : true,
		maxSearchResults : 50,
		searchResultsPerPage : 12,
		enableAdvancedSearchMatchType : true,
		sessionTimeoutInMinutes : 24*60,
		sessionRestorationEnabled : false,
		promptForDetailsInFooter : false,
		usePatternSearchInFlowView : false,
		objectDegreeWarningCount : 1000,
		objectDegreeLimitCount: 10000,
		enableAdvancedSearchMatchType : true,
		enableAdvancedSearchWeightedTerms : true,
		advancedSearchFuzzyLevels : {
			'is very like' : 0.9,
			'is like': 0.5,
			'is vaguely like': 0.1
		},
		iconOrder : ['ENTITY_TYPE', 'STAT', 'COUNTRY_CODE'],
		iconMap : {
			ENTITY_TYPE : {
				map: function(name, value) {
					switch (value) {
						case 'Personal':
							return {
								title: 'Personal',
								icon : {type: 'person'}
							};
						case 'Commercial':
							return {
								title: 'Commercial',
								icon : {type: 'person', attributes: { role: 'business'}}
							};
						default:
					}
				},
				limit: 1
			},
			COUNTRY_CODE : {
				map: function(name, value) {
					if (value) {
						return {
							title: value,
							icon: {type: 'Place', attributes: {code: value, country: 'US'}}
						};
					}
				},
				limit: 2
			},
			STAT : {
				map: function(name, value) {
					switch (value) {
						case 'Savings':
							return {
								title: 'Savings',
								icon : {type: 'ledger', attributes: {instrumenttype: 'deposit'}}
							};
						case 'Credit Card':
							return {
								title: 'Credit',
								icon : {type: 'ledger', attributes: {instrumenttype: 'creditcard'}}
							};
						case 'Checking':
							return {
								title: 'Checking',
								icon : {type: 'account'}
							};
						case 'Cash':
							return {
								title: 'Cash',
								icon : {type: 'ledger', attributes: {instrumenttype: 'cash'}}
							};
						case 'Line of Credit':
							return {
								title: 'Line of Credit',
								icon : {type: 'ledger', attributes: {instrumenttype: 'loan'}}
							};
						default:
					}
				},
				limit: 1
			}
		}
	}
}
