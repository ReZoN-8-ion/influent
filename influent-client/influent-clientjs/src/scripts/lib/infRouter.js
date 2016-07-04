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

define([
		'lib/communication/applicationChannels',
		'router',
		'modules/infHeader'
	],
	function(
		appChannel,
		RouterModule,
		infHeader
	) {
		var Router = RouterModule['default'];      //this is an ES6 compliant module, need to pull out 'default'

		//--------------------------------------------------------------------------------------------------------------
		// Private Variables
		//--------------------------------------------------------------------------------------------------------------

		var _UIObjectState = {
			UIType : 'infRouterModule',
			subscriberTokens : null,
			router : new Router(),
			historyState : null,
			handlers : {}
		};


		/**
		 * Retrieves the current route along with any query params.
		 * @returns {string}
		 * @private
		 */
		var _getRoute = function() {
			var route = window.location.hash.replace(/^#/,'');
			if (route.length === 0 || route.charAt(0) !== '/') {
				route = '/' + route;
			}
			return route;
		};

		/**
		 * Sets the current route and query params.
		 * If the route hasn't been registered as a proper route, then the transition will be to '/'
		 * @param routeName
		 * @param params
		 * @private
		 */
		var _setRoute = function(routeName, params) {
			_UIObjectState.router.transitionTo(_findHandlerFromRoute(routeName), {queryParams: params});
		};

		/**
		 * Looks for a route handler that's set up for the given route.
		 * A matching route handler will be look like the following:
		 * route:           handler:
		 *      posts               PostsView
		 *      comments            CommentsView
		 *      about               AboutView
		 *
		 * Returns the string name of the handler if one is found, otherwise null.
		 * @param routeName
		 * @returns {*}
		 * @private
		 */
		var _findHandlerFromRoute = function(routeName) {
			if (routeName.charAt(0) === '/') {
				routeName = routeName.replace(/^\//, '');
			}

			//find the handler that matches
			var re = new RegExp('^' + routeName + 'View$', 'i');
			var handler;
			for (handler in _UIObjectState.handlers) {
				if (re.test(handler)) {
					return handler;
				}
			}
			return null;
		};

		/**
		 * Registers a new route path to the named route.
		 * A route handler will be set up that matches the routeName with 'View' appended to it.
		 * @param routeName
		 * @param route
		 * @private
		 */
		var _registerRoute = function(routeName, routePath) {
			//the route string that will be used to match url paths
			var route = (routePath && routePath.length > 0)? routePath : '/' + routeName.toLowerCase();
			var handlerName = routeName + 'View';   //the name of the handler that handlers the routes

			//check if the route has already been registered
			if (_UIObjectState.handlers[handlerName] !== undefined) {
				throw 'The route "' + routeName + '" has already been registered to a view';
			}

			//register the new route
			_UIObjectState.router.map(function(match) {
				match(route).to(handlerName);
			});

			//register the handler for the new route
			_UIObjectState.handlers[handlerName] = {
				model : function(params) {
					//pass on the params as the model so setup can pass these to the view
					return params;
				},
				setup : function(model) {
					var title = aperture.config.get()['influent.config'].title || 'Name Me';
					var handlerInfos = (_UIObjectState.router.activeTransition)? _UIObjectState.router.activeTransition.handlerInfos : _UIObjectState.router.state.handlerInfos;
					if (handlerInfos.length > 0) {
						title = title + ' - ' + handlerInfos[handlerInfos.length - 1].handler.routeName;
					}
					document.title = title;

					//need to select the view
					aperture.pubsub.publish(appChannel.SHOW_VIEW, {
						title : routeName,
						params : model
					});
				},

				routeName : routeName,

				events: {
					// This event gets called by the router whenever it detects query params have changed.
					// When a transition occurs to the same route but with different params, this is the only
					// callback that will be fired, and the model/setup will not be recalled.
					queryParamsDidChange: function(changed, all, removed) {
						aperture.pubsub.publish(appChannel.VIEW_PARAMS_CHANGED, {
							title : routeName,
							changed : changed,
							all: all,
							removed: removed
						});
						return true;
					},

					// This event gets called by the router to determine what the final query params that
					// should be passed to the new state are. We essentially copy over all the new query
					// params into the final query params array. All of these query params will be appended
					// to the route. To hide a param from the route you can add 'visible:false" into the
					// final query param object.
					finalizeQueryParamChange: function(newQueryParams, finalQueryParamsArray, transition) {
						for (var k in newQueryParams) {
							if (newQueryParams.hasOwnProperty(k)) {
								finalQueryParamsArray.push({key: k, value: newQueryParams[k]});
							}
						}
						return true;
					}
				}
			};

		};

		/**
		 * Adds another url path to an existing route.
		 * This allows setting up multiple paths to a single route.
		 * For example, '/main' and '/' might both go to the same route.
		 *
		 * Setting routePath to null or the empty string will result in the default pathing scheme
		 * @param routeName
		 * @param routePath
		 * @private
		 */
		var _addRoute = function(routeName, routePath) {
			//make sure routeName already exists
			var handlerName = _findHandlerFromRoute(routeName);
			if (!handlerName) {
				throw 'The route ' + routeName + ' has not been registered yet';
			}

			if (!routePath || routePath.length === 0) {
				routePath = '/' + routeName.toLowerCase();
			}

			//register the new route
			_UIObjectState.router.map(function(match) {
				match(routePath).to(handlerName);
			});
		};

		// router needs to know how to get our different route handlers
		_UIObjectState.router.getHandler = function(name) {
			return _UIObjectState.handlers[name];
		};

		// provide the router callback for when the route changes. At this point the browser url needs to be updated.
		_UIObjectState.router.updateURL = function(url) {
			window.location.hash = url;
		};

		// listen for any changes to routes, and then inform the router of the new route/params
		$(window).on('hashchange', function(e){
			_UIObjectState.router.handleURL(_getRoute());
		});


		/**
		 * The callback for the REGISTER_VIEW event.
		 * If the view data contains 'routes' then all of the route paths will be associated with
		 * this route. Using a null route path or '' will add a path with the default pathing scheme.
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onRegisterView = function(eventChannel, data) {
			var routePaths = data.routes;
			if (routePaths && routePaths.length > 0) {
				//register the first route
				_registerRoute(data.title, data.routes[0]);

				if (routePaths.length > 1) {
					//loop through the rest of the routes and add them as well
					var index;
					for (index = 1; index < routePaths.length; ++index) {
						_addRoute(data.title, data.routes[index]);
					}
				}
			}
			else {
				//register the route with a default path
				_registerRoute(data.title);
			}
		};

		/**
		 * The callback for the SELECT_VIEW event.
		 * This will try to set the route to the provided title and query params.
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onSelectView = function(eventChannel, data) {
			_setRoute(data.title, data.queryParams);
		};

		/**
		 * The callback for the ALL_MODULES_STARTED event.
		 * Should be triggered after all the views have been registered, so this will then
		 * have the router handle the current URL and try to trigger the necessary view.
		 * @param eventChannel
		 * @param data
		 * @private
		 */
		var _onAllViewsInitialized = function(eventChannel, data) {
			_UIObjectState.router.handleURL(_getRoute());
		};

		//register for the required events
		_UIObjectState.subscriberTokens = {};
		_UIObjectState.subscriberTokens[appChannel.REGISTER_VIEW] = aperture.pubsub.subscribe(appChannel.REGISTER_VIEW, _onRegisterView);
		_UIObjectState.subscriberTokens[appChannel.SELECT_VIEW] = aperture.pubsub.subscribe(appChannel.SELECT_VIEW, _onSelectView);
		_UIObjectState.subscriberTokens[appChannel.ALL_VIEWS_INITIALIZED] = aperture.pubsub.subscribe(appChannel.ALL_VIEWS_INITIALIZED, _onAllViewsInitialized);

		//--------------------------------------------------------------------------------------------------------------
		// Public
		//--------------------------------------------------------------------------------------------------------------

		var infRouterModule = {
			getRoute : _getRoute,
			setRoute : _setRoute,
			registerRoute : _registerRoute,
			addRoute : _addRoute
		};

		return infRouterModule;
	}
);
