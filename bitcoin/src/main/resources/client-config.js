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
		rpcEndpoint : '%host%/${project.artifactId}/rpc',
		restEndpoint : '%host%/${project.artifactId}/rest'
	},
	
	/*
	 * Influent specific configuration
	 */
	'influent.config' : {
		useAuth : false,
		datasource : 'Bitcoin',
		title : 'Bitcoin',
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
		startingDateRange : 'P4Y',
		defaultEndDate: new Date('Jun 1, 2013'),
		dateFormat: 'MMM D, YYYY',
		timeFormat: 'h:mma',
		defaultShowDetails : true,
		defaultGraphScale : 1000,
		doubleEncodeSourceUncertainty : true,
		maxSearchResults : 50,
		searchResultsPerPage : 12,
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
		iconOrder : ['STAT'],
		iconMap :
		{
			STAT : {
				map : function (name, value) {
					switch (name) {
						case 'NumTransactions':
							if (value < 2360537) {
								return {
									title: value,
									url: 'img/pulse-1.png'
								};
							} else if (value >= 2360537 && value < 4721075) {
								return {
									title: value,
									url: 'img/pulse-2.png'
								};
							} else if (value >= 4721075 && value < 7081613) {
								return {
									title: value,
									url: 'img/pulse-3.png'
								};
							} else if (value >= 7081613 && value < 9442151) {
								return {
									title: value,
									url: 'img/pulse-4.png'
								};
							} else if (value >= 9442151 && value < 11802688) {
								return {
									title: value,
									url: 'img/pulse-5.png'
								};
							} else if (value >= 11802688 && value < 14163226) {
								return {
									title: value,
									url: 'img/pulse-6.png'
								};
							} else if (value >= 14163226 && value < 16523764) {
								return {
									title: value,
									url: 'img/pulse-7.png'
								};
							} else if (value >= 16523764) {
								return {
									title: value,
									url: 'img/pulse-8.png'
								};
							} else {
								return null;
							}
							break;
						case 'AvgTransaction':
							if (value < 6541208) {
								return {
									title: value,
									url: 'img/wealth-1.png'
								};
							} else if (value >= 6541208 && value < 13082416) {
								return {
									title: value,
									url: 'img/wealth-2.png'
								};
							} else if (value >= 13082416 && value < 19623624) {
								return {
									title: value,
									url: 'img/wealth-3.png'
								};
							} else if (value >= 19623624 && value < 26164833) {
								return {
									title: value,
									url: 'img/wealth-4.png'
								};
							} else if (value >= 26164833 && value < 32706041) {
								return {
									title: value,
									url: 'img/wealth-5.png'
								};
							} else if (value >= 32706041 && value < 39247249) {
								return {
									title: value,
									url: 'img/wealth-6.png'
								};
							} else if (value >= 39247249 && value < 45788457) {
								return {
									title: value,
									url: 'img/wealth-7.png'
								};
							} else if (value >= 45788457) {
								return {
									title: value,
									url: 'img/wealth-8.png'
								};
							} else {
								return null;
							}
							break;
						default:
							return null;
					}
				},
				limit: 2
			}
		}
	}
}
