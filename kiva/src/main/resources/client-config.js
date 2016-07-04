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

	'influent.plugins' : {
		details : [
			{
				/*
				 * the pathname of a require module to load on initialisation
				 * which will be made available to the plugin functions via this.module
				 */
				module: 'extensions',

				searchResultPrompt: function(container, result, callback) {
					return this.module.promptForDetails(container, result, callback);
				}
			},
			{
				/*
				 * the pathname of a require module to load on initialisation
				 * which will be made available to the plugin functions via this.module
				 */
				module: 'extensions',

				/*
				 * Returns the content to be displayed on the footer overlay when an entity with the
				 * 'promptForDetails' tag is selected. The user is prompted before fetching the full
				 * details of the entity.
				 *
				 * @entityData details of the selected object, which include:
				 * {
				dataId: the fully qualified id of the data item in the form type.namespace.id,
				type: the type of the selected object:
				'cluster', 'cluster_summary', 'account_owner', 'entity',
				label: the object's label text
				numMembers: the number of members in the object
				}
				 *
				 * @this.module a optional require module loaded for this plugin, by name
				 *
				 * @returns html to be displayed in the footer above an 'OK' button
				 */
				footerPrompt: function (entityData) {
					return this.module.extendFooterPrompt(entityData);
				}
			}
		]
	},
	
	/*
	 * Influent specific configuration
	 */
	'influent.config' : {
		useAuth : false,
		datasource : 'Kiva',
		title : 'Kiva',
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
		defaultEndDate: new Date(2011, 6, 1),
		dateFormat: 'MMM D, YYYY',
		timeFormat: 'h:mma',
		defaultShowDetails : true,
		defaultGraphScale : 100,
		doubleEncodeSourceUncertainty : true,
		maxSearchResults : 50,
		searchResultsPerPage : 12,
		sessionTimeoutInMinutes : 24*60,
		sessionRestorationEnabled : false,
		promptForDetailsInFooter : true,
		usePatternSearchInFlowView : true,
		objectDegreeWarningCount : 1000,
		objectDegreeLimitCount: 10000,
		enableAdvancedSearchMatchType : true,
		enableAdvancedSearchWeightedTerms : true,
		advancedSearchFuzzyLevels : {
			'is very like' : 0.9,
			'is like': 0.5,
			'is vaguely like': 0.1
		},
		iconOrder : ['TYPE', 'GEO', 'STATUS', 'WARNING'],
		iconMap : {
			TYPE : {
				map : function(name, value) {
					switch (value) {
						case 'lender':
							return {
								title: 'lender',
								icon: {type: 'Person', attributes: {role: 'business'}}
							};
						case 'partner':
							return {
								title: 'partner',
								icon: {type: 'Organization', attributes: {role: 'business'}}
							};
						case 'loan':
							return {
								title: 'loan',
								icon: {type: 'Person'}
							};
					}
				},
				limit : 1
			},
			GEO : {
				map : function(name, value) {
					if (value && value.cc) {
						return {
							title: value.text || value.cc,
							icon: {type: 'Place', attributes: {code: value.cc, country: value.cc}}
						};
					}
				},
				limit: 3
			},
			STATUS : {
				map : function(name, value) {
					switch (value) {
						case 'defaulted':
							return {
								title: 'defaulted',
								icon: {type: 'stamp', attributes: {text: 'default'}}
							};
						case 'closed':
							return {
								title: 'closed',
								icon: {type: 'stamp', attributes: {text: 'closed'}}
							};
					}
				},
				limit: 1
			},
			WARNING : {
				map : function(name, value) {
					switch (name) {
						case 'PartnerDelinquencyRate':
							if (value >= 5.0) {
								return {
									title: 'high delinquency rate',
									icon: {type: 'warning'}
								};
							}
						case 'PartnerDefaultRate':
							if (value >= 1.0) {
								return {
									title: 'high default rate',
									icon: {type: 'warning'}
								};
							}
					}
				}
			}
		}
	}
}
