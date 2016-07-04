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
		'lib/module',
		'lib/communication/applicationChannels',
		'lib/constants',
		'modules/infWorkspace',
		'views/infView',
		'hbs!templates/summaryView/summaryView'
	],
	function(
		modules,
		appChannel,
		constants,
		infWorkspace,
		infView,
		summaryViewTemplate
	) {

		var VIEW_NAME = constants.VIEWS.SUMMARY.NAME;
		var VIEW_LABEL = constants.VIEWS.SUMMARY.LABEL || VIEW_NAME;
		var ICON_CLASS = constants.VIEWS.SUMMARY.ICON;

		var _UIObjectState = {
			canvas : null,
			subscriberTokens: {}
		};

		var _getStat = function(stats, key) {

			if (stats == null ) {
				return null;
			}

			var keyStat = stats[key];
			if (keyStat == null) {
				return null;
			}

			if (!keyStat.hasOwnProperty('label') ||
				!keyStat.hasOwnProperty('value')
			) {
				return null;
			}

			var label = keyStat.label;
			var value = keyStat.value;

			if (label == null ||
				value == null
			) {
				return null;
			}

			return {
				label: label,
				value: value
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		var _handleSummaryResponse = function(response) {
			var ws = _UIObjectState.canvas;
			var context = {};
			if (response == null || $.isEmptyObject(response) || response.length < 1) {
				context.aboutValue = 'SUMMARY DATA UNAVAILABLE';
			} else {
				var results = JSON.parse(response);

				var summaryStats = [];
				var i;
				for (i = 0; i < results.length; i++) {
					summaryStats[results[i]['key']] = results[i];
				}

				var aboutLabel = _getStat(summaryStats, results[0]['key']);
				if (aboutLabel != null) {
					context.aboutLabel = aboutLabel.label;
					context.aboutValue = aboutLabel.value;
				}

				context.row = [{col: []}];

				for(i = 1; i < results.length; i++) {
					var colObject = context.row[context.row.length-1];
					var colLength = colObject.col.length;
					if (colLength === 2) {
						colObject = {col: []};
						context.row.push(colObject);
					}

					var statLabel = _getStat(summaryStats, results[i]['key']);
					if (statLabel != null) {
						colObject.col.push({
							statLabel: statLabel.label,
							statValue: statLabel.value
						});
					}
				}

				//inform others of start and end dates
				if (_getStat(summaryStats, 'StartDate') && _getStat(summaryStats, 'EndDate')) {
					var startDate = _getStat(summaryStats, 'StartDate').value;
					var endDate = _getStat(summaryStats, 'EndDate').value;

					aperture.pubsub.publish(appChannel.DATASET_STATS, {
						startDate: startDate,
						endDate: endDate
					});
				}

			}

			ws.append(summaryViewTemplate(context));
			$('#summaryShortcutAbout').click(function() {
				aperture.pubsub.publish(appChannel.OPEN_EXTERNAL_LINK_REQUEST, {
					link: aperture.config.get()['influent.config']['about']
				});
			});
			$('#summaryShortcutAccounts').click(function() {
				aperture.pubsub.publish(appChannel.SWITCH_VIEW, {
					title : constants.VIEWS.ACCOUNTS.NAME
				});
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _registerView = function(sandbox) {
			infView.registerView({
				title: VIEW_NAME,
				label: VIEW_LABEL,
				icon: ICON_CLASS,
				routes : [
					'/',        //the root path
					''          //the default naming scheme '/summary'
				],
				noOperationButton : true,
				getCaptureDimensions : _getCaptureDimensions,
				saveState : function(callback){ callback(true); }
			}, sandbox);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onViewRegistered = function(eventChannel, data) {
			if (data.name === VIEW_NAME) {
				_UIObjectState.canvas = data.canvas;
				aperture.io.rest(
					'/datasummary',
					'POST',
					function (response) {
						_handleSummaryResponse(response);
					},
					{
						postData : {
							sessionId : infWorkspace.getSessionId()
						},
						contentType: 'application/json'
					}
				);

				aperture.pubsub.publish(appChannel.VIEW_INITIALIZED, {name:VIEW_NAME});
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getCaptureDimensions = function() {
			var viewDiv = _UIObjectState.canvas.find('.summaryViewContentsContainer');
			var width = viewDiv[0].scrollWidth;
			var height = viewDiv[0].scrollHeight;

			return {
				width : width,
				height : height
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('inf' + VIEW_NAME + 'View', function(sandbox) {
			return {
				start: function() {
					var subTokens = {};
					subTokens[appChannel.VIEW_REGISTERED] = aperture.pubsub.subscribe(appChannel.VIEW_REGISTERED, _onViewRegistered);

					_UIObjectState.subscriberTokens = subTokens;

					_registerView(sandbox);
				},
				end : function() {
					// unsubscribe to all channels
					for (var token in _UIObjectState.subscriberTokens) {
						if (_UIObjectState.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_UIObjectState.subscriberTokens[token]);
						}
					}
				}
			};
		});

		//--------------------------------------------------------------------------------------------------------------

		if (constants.UNIT_TESTS_ENABLED) {
			return {
				_UIObjectState : _UIObjectState,
				_getStat : _getStat,
				_handleSummaryResponse : _handleSummaryResponse,
				name : function() { return VIEW_NAME; }
			};
		} else {
			return {
				name : function() { return VIEW_NAME; }
			};
		}
	}
);

