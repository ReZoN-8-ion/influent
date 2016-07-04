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
	['lib/module', 'lib/communication/applicationChannels'],
	function(modules, appChannel) {


		// Look-and-feel Settings
		var FADE_TIME = 500;
		var LOCK_COLUMN_AFTER = 2000;
		var UNLOCK_COLUMN_AFTER = 0;
		var PUMP_INTERVAL = 100;
		var OVERLAY_OPACITY = 0.8;

		var module = {};

		var _state = {
			capture: false,
			requestQueue: [],
			contextLock: [],
			overlayTimers: [],
			updatePump: null,
			subscriberTokens : null,
			handlers: []
		};

		var _initializeModule = function() {
		};

		//--------------------------------------------------------------------------------------------------------------

		var _sendRestRequest = function (request) {

			if (request && !request.sent) {
				request.sent = true;

				var payload = {};
				payload.async = request.async;
				if (request.method === 'GET') {
					payload.params = request.data;
				} else if (request.method === 'POST') {
					payload.postData = request.data;
					payload.contentType = request.contentType ? request.contentType : 'application/json';
				}

				aperture.io.rest(
					request.resource,
					request.method,
					function () {

						if (request.callback) {
							request.callback.apply(undefined, arguments);
						}
					},
					payload
				);
				return true;
			}

			return false;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _handleRestResponse = function (callback) {
			var argsArray = Array.prototype.slice.call(arguments);
			if (callback) {
				callback.apply(undefined, argsArray.slice(1));
			}

			// Remove this request from its queue
			for(var i = _state.requestQueue.length; i--;) {
				if(_state.requestQueue[i] === this) {
					_state.requestQueue.splice(i, 1);
					break;
				}
			}

			if (_state.contextLock[this.contextId] === this) {
				delete _state.contextLock[this.contextId];
			}

			aperture.util.forEach(_state.handlers, function(handler) {
				handler();
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var _processRestRequests = function () {

			// Fade handlers
			var fadeInOverlay = function(context) {
				var overlay = $('#' + context).find('.columnOverlay');
				overlay.show();
				overlay.fadeTo(FADE_TIME, OVERLAY_OPACITY);
			};

			var fadeOutOverlay = function(context) {
				var overlay = $('#' + context).find('.columnOverlay');
				clearTimeout(_state.overlayTimers[context]);
				delete _state.overlayTimers[context];

				if (overlay.is(':visible')) {
					overlay.fadeTo(FADE_TIME, 0, function () {
						overlay.hide();
					});
				}

			};

			for (var i = 0; i < _state.requestQueue.length; ++i) {

				var request = _state.requestQueue[i];
				if (!request) {
					continue;
				}

				// Process all immediate requests, but only the first non-immediate request
				if (!request.immediate) {
					if (_state.contextLock[request.contextId]) {
						continue;
					} else {
						_state.contextLock[request.contextId] = request;
					}
				}

				if (!request.sent) {

					if (_sendRestRequest(request)) {

						// Bind the callback to the appropriate queue
						request.callback = _.bind(_handleRestResponse, request, request.callback);

						// If we might need to lock the column, then start a timer to fade in the overlay
						if (!request.immediate &&
							request.contextId &&
							request.contextId !== 'null' &&
							!_state.overlayTimers[request.contextId]) {

							_state.overlayTimers[request.contextId] = setTimeout(_.bind(fadeInOverlay, undefined, request.contextId), LOCK_COLUMN_AFTER);
						}
					}
				}
			}

			for (var context in _state.overlayTimers) {
				if (_state.overlayTimers.hasOwnProperty(context)) {

					// Reset the column if it is unlocked
					if (!_state.contextLock[context]) {
						if (_state.overlayTimers[context]) {
							setTimeout(_.bind(fadeOutOverlay, undefined, context), UNLOCK_COLUMN_AFTER);
						}
					}
				}
			}
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onRestRequest = function(channel, data) {

			if (channel !== appChannel.SEND_REST_REQUEST) {
				return;
			}
			var request = module.request(data.resource, data.method, data.async)
								.inContext(data.contextId)
								.withData(data.data, data.contentType)
								.then(data.callback);

			_queueRestRequest(request);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _queueRestRequest = function(request) {

			request.sent = false;

			if (_state.capture) {
				request.immediate = true;
			} else {
				request.immediate = false;

				switch (request.resource) {
					// Queued resources
					case '/aggregatedlinks' :
					case '/relatedlinks' :
					case '/modifycontext' :
					case '/chart' :
						break;

					// Immediate resources
					default :
						request.immediate = true;
						break;
				}
			}

			// Optimization
			//_aggregateRequests();

			var len = _state.requestQueue.push(request);
			return _state.requestQueue[len - 1];
		};

		//--------------------------------------------------------------------------------------------------------------

		/*
		var _aggregateRequests = function() {

			var i, request;
			for (i = _state.requestQueue.length - 1; i >= 0; i--) {

				request = _state.requestQueue[i];

				if (request.sent) {
					continue;
				}

				// TODO: Do aggregation here.

			}
		};
		*/

		//--------------------------------------------------------------------------------------------------------------

		var _moduleConstructor = function(sandbox){

			_state.capture = sandbox.spec.capture;

			return {
				start : function(){
					var subTokens = {};

					// Subscribe to the appropriate calls.
					subTokens[appChannel.ALL_MODULES_STARTED] = aperture.pubsub.subscribe(appChannel.ALL_MODULES_STARTED, _initializeModule);
					subTokens[appChannel.SEND_REST_REQUEST] = aperture.pubsub.subscribe(appChannel.SEND_REST_REQUEST, _onRestRequest);
					_state.subscriberTokens = subTokens;

					_state.updatePump = setInterval(_processRestRequests, PUMP_INTERVAL);

				},
				end : function(){
					for (var token in _state.subscriberTokens) {
						if (_state.subscriberTokens.hasOwnProperty(token)) {
							aperture.pubsub.unsubscribe(_state.subscriberTokens[token]);
						}
					}

					clearInterval(_state.updatePump);
				}
			};
		};

		//--------------------------------------------------------------------------------------------------------------

		module.getPendingRequests = function() {
			var count = 0;
			for (var i = 0; i < _state.requestQueue.length; i++) {
				count += _state.requestQueue[i].length;
			}

			return count;
		};

		module.addRestListener = function(listener) {
			if( listener && typeof listener !== 'function') {
				return;
			}

			_state.handlers.push(listener);
		};

		module.removeRestListener = function(listener) {
			if( listener && typeof listener !== 'function') {
				return;
			}

			_state.handlers.splice(aperture.util.indexOf(_state.handlers, listener), 1);
		};

		module.request = function(resource, method, async) {

			var request = {
				resource: resource,
				method : method ? method : 'POST',
				async : async
			};

			request = _queueRestRequest(request);

			request.inContext = function(contextId) {
				this.contextId = contextId;
				return this;
			};

			request.withData = function(data, contentType) {

				this.data = data;
				this.contentType = contentType;

				return this;
			};

			request.then = function(callback) {
				this.callback = callback;

				return this;
			};

			return request;
		};

		//--------------------------------------------------------------------------------------------------------------

		// Register the module with the system
		modules.register('infRest', _moduleConstructor);

		return module;
	}
);
