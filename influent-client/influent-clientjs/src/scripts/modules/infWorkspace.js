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
		'modules/infHeader',
		'modules/infRest',
		'cookieUtil',
		'lib/ui/xfModalDialog',
		'hbs!templates/InfWorkspace'
	],
	function(
		modules,
		appChannel,
		constants,
		infHeader,
		infRest,
		cookieUtil,
		xfModalDialog,
		infWorkspaceTemplate
	) {


		var _UIObjectState = {
			sessionId : null,
			canvas : null,
			subscriberTokens : null,
			viewModel : {
				views: []
			},
			initializedViews : [],
			showingView : false,
			activeView : null
		};

		//--------------------------------------------------------------------------------------------------------------

		var _init = function(sandbox) {
			_UIObjectState.canvas = $(sandbox.dom);
			_UIObjectState.canvas.empty();

			$(window).bind( 'beforeunload', _onUnload);

			$(window).bind( 'unload',
				function() {
					var cookieId = aperture.config.get()['aperture.io'].restEndpoint.replace('%host%', 'sessionId');
					var cookieExpiryMinutes = aperture.config.get()['influent.config']['sessionTimeoutInMinutes'] || 24*60;
					var sessionId = _UIObjectState.sessionId;

					cookieUtil.createCookie(cookieId, sessionId, cookieExpiryMinutes);
				}
			);

			if(window.callPhantom) {
				$(window).bind( 'load',
					function() {
						if (infRest.getPendingRequests() !== 0) {
							infRest.addRestListener(function () {
								if(infRest.getPendingRequests() === 0) {
									window.callPhantom();
									infRest.removeRestListener(this);
								}
							});
						} else {
							window.callPhantom();
						}
					}
				);
			}

			_UIObjectState.canvas.append(infWorkspaceTemplate(_UIObjectState.viewModel));

			for (var i = 0; i < _UIObjectState.viewModel.views.length; i++) {
				aperture.pubsub.publish(appChannel.VIEW_REGISTERED, {
					name: _UIObjectState.viewModel.views[i].title,
					canvas: _UIObjectState.canvas.find('#infWorkspaceTabContent' + _UIObjectState.viewModel.views[i].title)
				});
			}
			aperture.pubsub.publish(appChannel.ALL_VIEWS_REGISTERED,{});

			// On tab change event
			$('a[class="view-tab"]').on('shown.bs.tab', function (e) {
				if (!_UIObjectState.showingView) {
					//we got in here without going through the SHOW_VIEW event, so stop the tab
					//from being shown, and fire the SELECT_VIEW event to properly switch tabs.
					e.preventDefault();

					aperture.pubsub.publish(appChannel.SWITCH_VIEW, {title : $(e.target).attr('infviewname')});
				}
			});

		};

		//--------------------------------------------------------------------------------------------------------------

		var _onUnload = function() {
			return 'You are about to leave the current Influent session.';
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onLogout = function (eventChannel) {

			if (eventChannel !== appChannel.LOGOUT_REQUEST) {
				return;
			}

			// looked at saving state here but it appears we do successfully save state on 'beforeunload'
			// before the server processes logout.
			window.location = 'logout';
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onRegisterView = function(eventChannel, viewData) {
			_UIObjectState.viewModel.views.push(viewData);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onRequestRegisteredViews = function(eventChannel, data) {
			if (data.callback) {
				var viewsCopy = [];
				for (var i = 0; i < _UIObjectState.viewModel.views.length; i++) {
					viewsCopy.push($.extend(_UIObjectState.viewModel.views[i], {}));
				}
				data.callback(viewsCopy);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onViewInitialized = function(eventChannel, data) {
			_UIObjectState.initializedViews.push(data.name);
			if (_UIObjectState.initializedViews.length === _UIObjectState.viewModel.views.length) {
				aperture.pubsub.publish(appChannel.ALL_VIEWS_INITIALIZED, {});
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSwitchView = function(eventChannel, data) {

			$.each(_UIObjectState.viewModel.views, function(index,val) {
				if (val.title === data.title) {
					if (val.hasOwnProperty('queryParams')) {
						data.queryParams = val.queryParams();
					}
				}
			});

			aperture.pubsub.publish(appChannel.SELECT_VIEW, data);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onShowView = function(eventChannel, selectData) {
			var title = selectData.title;
			var bFound = false;
			$.each(_UIObjectState.viewModel.views, function(index,val) {
				if (val.title === title) {
					bFound = true;
					return true;
				}
			});
			if (!bFound) {
				throw 'Unable to select view module ' + title + '.  No view module with that name has been registered with Influent.';
			}

			var selection = _UIObjectState.canvas.find('a[infviewname="' + title + '"]');
			if (selection) {
				//need to flag that we're showing the view so the tab can actually go through
				_UIObjectState.showingView = true;
				selection.tab('show');
				_UIObjectState.showingView = false;

				var selectedView = aperture.util.find(_UIObjectState.viewModel.views, function (ele) {
					return ele.title === title;
				});
				if (selectedView) {
					infHeader.setSpec(selectedView.headerSpec);
					infHeader.render();
					_UIObjectState.activeView = title;
				}
			} else {
				throw 'Unable to find bootstrap tab for view ' + title + '.';
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onExportCapture = function (eventChannel) {

			if (eventChannel !== appChannel.EXPORT_CAPTURED_IMAGE_REQUEST
			) {
				return;
			}

			var captureView = null;
			for (var i = 0; i < _UIObjectState.viewModel.views.length; i++) {
				var view = _UIObjectState.viewModel.views[i];
				if (view.title === _UIObjectState.activeView) {
					captureView = view;
					break;
				}
			}

			if (captureView == null) {
				aperture.log.error('Failed to determine active view. Aborting capture.');
				return;
			}

			var callback = function (response) {

				var exportCallback = function () {
					$.blockUI({
						theme: true,
						title: 'Capture In Progress',
						message: '<img src="' + constants.AJAX_SPINNER_FILE + '" style="display:block;margin-left:auto;margin-right:auto"/>'
					});

					var timestamp = (new Date().getTime());

					var dimensions = captureView.getCaptureDimensions();
					var headerDiv = $('#infHeader');
					dimensions.height += headerDiv[0].scrollHeight;

					var settings = {
						format: 'PNG',
						captureWidth: dimensions.width,
						captureHeight: dimensions.height,
						renderDelay: 4000,
						reload: true,
						downloadToken: timestamp
					};


					var auth = aperture.config.get()['influent.config']['captureAuthentication'];
					if (auth != null) {
						if (auth.username != null && auth.password != null) {
							settings.username = auth.username;
							settings.password = auth.password;
						}
					}

					var sessionUrl = window.location.href;

					if (sessionUrl.indexOf('?sessionId=') === -1) {
						sessionUrl += '?sessionId=' + _UIObjectState.sessionId;
					}

					aperture.capture.store(
						sessionUrl + '&capture=true',
						settings,
						null,
						function (response) {
							var a = document.createElement('a');

							a.href = aperture.store.url(response, 'pop', 'influent-snapshot.png');

							document.body.appendChild(a);

							setTimeout(
								function () {
									$(window).unbind('beforeunload');
									a.click();
									document.body.removeChild(a);
									$.unblockUI();
									xfModalDialog.createInstance({
										title: 'Success',
										contents: 'Export successful!',
										buttons: {
											'Ok': function () {
											}
										}
									});
									setTimeout(
										function () {
											$(window).bind('beforeunload', _onUnload);
										},
										0
									);
								},
								0
							);
						}
					);
				};

				if (response === 'NONE' || response === 'ERROR') {
					// we could not save the state... warn the user
					xfModalDialog.createInstance({
						title: 'Warning',
						contents: 'There was an issue when saving the application state to the server. The resulting capture will not represent the current state. Do you wish to continue?',
						buttons: {
							'Continue': exportCallback,
							'Cancel': function () {
							}
						}
					});
				} else {
					exportCallback();
				}
			};

			captureView.saveState(callback);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onOpenExternalLink = function(eventChannel, data) {
			if (eventChannel !== appChannel.OPEN_EXTERNAL_LINK_REQUEST) {
				return;
			}

			if (data.link) {
				window.open(data.link);
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('infWorkspace', function(sandbox) {

			_UIObjectState.sessionId = sandbox.spec.sessionId;

			return {
				start: function() {

					var subTokens = {};
					subTokens[appChannel.ALL_MODULES_STARTED] = aperture.pubsub.subscribe(appChannel.ALL_MODULES_STARTED, function() { _init(sandbox); });
					subTokens[appChannel.REGISTER_VIEW] = aperture.pubsub.subscribe(appChannel.REGISTER_VIEW, _onRegisterView);
					subTokens[appChannel.SHOW_VIEW] = aperture.pubsub.subscribe(appChannel.SHOW_VIEW, _onShowView);
					subTokens[appChannel.SWITCH_VIEW] = aperture.pubsub.subscribe(appChannel.SWITCH_VIEW, _onSwitchView);
					subTokens[appChannel.REQUEST_REGISTERED_VIEWS] = aperture.pubsub.subscribe(appChannel.REQUEST_REGISTERED_VIEWS, _onRequestRegisteredViews);
					subTokens[appChannel.VIEW_INITIALIZED] = aperture.pubsub.subscribe(appChannel.VIEW_INITIALIZED, _onViewInitialized);
					subTokens[appChannel.LOGOUT_REQUEST] = aperture.pubsub.subscribe(appChannel.LOGOUT_REQUEST, _onLogout);
					subTokens[appChannel.EXPORT_CAPTURED_IMAGE_REQUEST] = aperture.pubsub.subscribe(appChannel.EXPORT_CAPTURED_IMAGE_REQUEST, _onExportCapture);
					subTokens[appChannel.OPEN_EXTERNAL_LINK_REQUEST] = aperture.pubsub.subscribe(appChannel.OPEN_EXTERNAL_LINK_REQUEST, _onOpenExternalLink);

					_UIObjectState.subscriberTokens = subTokens;
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

		var module = {
			getActiveView: function () { return _UIObjectState.activeView; },
			isActiveView: function (viewTitle) { return _UIObjectState.activeView === viewTitle; },
			getSessionId: function () { return _UIObjectState.sessionId; }
		};

		if (constants.UNIT_TESTS_ENABLED) {
			module.setSessionId = function (sessionId) {
				_UIObjectState.sessionId = sessionId;
			};
		}

		return module;
	}
);

