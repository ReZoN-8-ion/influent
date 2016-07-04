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
	{
		MODULE_NAMES : {
			ACCOUNTS_SEARCH_RESULT : 'xfAccountsSearchResult',
			CLUSTER_BASE : 'xfClusterBase',
			COLUMN : 'xfColumn',
			ENTITY : 'xfEntity',
			ENTITY_RESULT : 'xfEntityResult',
			ENTITY_RESULT_CLUSTER : 'xfEntityResultCluster',
			FILE : 'xfFile',
			IMMUTABLE_CLUSTER : 'xfImmutableCluster',
			LINK : 'xfLink',
			MATCH : 'xfMatch',
			MUTABLE_CLUSTER : 'xfMutableCluster',
			RESULT_BASE : 'xfResultBase',
			RESULT_CLUSTER_BASE : 'xfResultClusterBase',
			SEARCH_RESULT_BASE : 'xfSearchResultBase',
			SUMMARY_CLUSTER : 'xfSummaryCluster',
			TRANSACTION_RESULT : 'xfTransactionResult',
			TRANSACTION_RESULT_CLUSTER : 'xfTransactionResultCluster',
			TRANSACTIONS_SEARCH_RESULT : 'xfTransactionsSearchResult',
			WORKSPACE : 'xfWorkspace'
		},
		ACCOUNT_TYPES : {
			ACCOUNT_OWNER : 'account_owner',
			CLUSTER : 'cluster',
			CLUSTER_SUMMARY : 'cluster_summary',
			ENTITY : 'entity',
			ENTITY_CLUSTER : 'entity_cluster',
			FILE : 'file'
		},
		AJAX_SPINNER_FILE : 'img/ajax-loader.gif',
		AJAX_SPINNER_BG	: 'url("img/ajax-loader.gif") no-repeat center center',
		AJAX_SPINNER_LARGE_BG	: 'url("img/ajax-loader-large.gif") no-repeat center center',
		SORT_FUNCTION : {
			INCOMING : 'incoming',
			OUTGOING : 'outgoing',
			BOTH : 'both'
		},
		VIEWS : {
			SUMMARY : {
				NAME : 'Summary',
				ICON : 'glyphicon glyphicon-info-sign'
			},
			ACCOUNTS : {
				NAME : 'Accounts',
				ICON : 'glyphicon glyphicon-user'
			},
			TRANSACTIONS : {
				NAME : 'Transactions',
				ICON : 'glyphicon glyphicon-list'
			},
			FLOW : {
				NAME : 'Flow',
				ICON : 'glyphicon glyphicon-random'
			}
		},
		UNIT_TESTS_ENABLED : aperture.config.get()['influent.config']['unitTestsEnabled'] || false,
		DATE_FORMAT: aperture.config.get()['influent.config'].dateFormat,
		TIME_FORMAT: aperture.config.get()['influent.config'].timeFormat,
		QUERY_DATE_FORMAT: 'YYYY-MM-DD',
		BOOTSTRAP_DATE_FORMAT: aperture.config.get()['influent.config'].dateFormat
			.replace('YYYY', 'yyyy')
			.replace('YY', 'yy')
			.replace('MMMM', 'MM')
			.replace('MMM', 'M')
			.replace('D', 'd')
	}
);
