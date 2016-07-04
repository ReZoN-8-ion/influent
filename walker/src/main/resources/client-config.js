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
			},
			/*
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
		rpcEndpoint : '%host%/${project.artifactId}/rpc',
		restEndpoint : '%host%/${project.artifactId}/rest'
	},

	/*
	 * Influent specific configuration
	 */
	'influent.config' : {
		useAuth : false,
		datasource : 'Walker',
		title : 'Walker',
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
		startingDateRange : 'P16M',
		defaultEndDate: new Date('Jan 1, 2011'),
		dateFormat: 'MMM D, YYYY',
		timeFormat: 'h:mma',
		defaultShowDetails : true,
		defaultGraphScale : 100,
		doubleEncodeSourceUncertainty : false,
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
		iconOrder : ['TEXT'],
		iconMap : {
			TEXT : {
				map : function(name,value) {

							switch (value) {
								case 'Business and Industry':
									return {
										title : 'Business and Industry',
										icon : {type: 'person', attributes: { role: 'business'}}
									};
								case 'Internet and Telecom':
									return {
										title : 'Internet and Telecom',
										icon : {type: 'person'}
									};
								case 'Law and Government':
									return {
										title : 'Law and Government',
										icon : {type: 'person', attributes: { role: 'political'}}
									};
								case 'Finance':
									return {
										title : 'Finance',
										icon : {type: 'ledger', attributes: { instrumenttype : 'cash' }}
									};
								case 'Health':
									return {
										title : 'Health',
										icon : {type: 'person', attributes: { role: 'healthcare'}}
									};
								case 'Career and Education':
									return {
										title : 'Career and Education',
										icon : {type: 'person', attributes: { role: 'academic'}}
									};
								case 'News and Media':
									return {
										title : 'News and Media',
										icon : {type: 'document', attributes: { mimetype : 'text/html' }}
									};
								case 'Arts and Entertainment':
									return {
										title : 'Arts and Entertainment',
										icon : {type: 'video'}
									};
								case 'Travel':
									return {
										title : 'Travel',
										icon : {type: 'place'}
									};
								case 'Shopping':
									return {
										title : 'Shopping',
										icon : {type: 'store'}
									};
								case 'Computer and Electronics':
									return {
										title : 'Computer and Electronics',
										icon : {type: 'document', attributes: { mimetype : 'application/powerpoint' }}
									};
								default:
									return {
										title : 'Account',
										icon : {type: 'person'}
									};
							}


				},
				distName : 'text-dist',
				limit : 4
			}
		}
	}
}
