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

define(['lib/communication/applicationChannels'], function(appChannel) {

	/*
	 * TODO Make hard-coded stuff configurable
	 */

	var Sandbox = function(spec, parentSandbox) {

			// JQuery element for the given div
		var jqElem = $('#' + spec.div),

			// these all link back to singletons in app. parent pre-empts local
			state  = parentSandbox? parentSandbox.spec.state  : spec.state,

			listeners = [ /* {
								callback: function(changeEvent),
									variables: ["mode","aoi",...],
									context: object
								}*/
									],

			/**
			 * Runs a jquery scoped to the modules div.  The results will be limited
			 * to the children of the module's sandbox div.
			 *
			 * Idea stolen from backbone.js
			 */
			local$ = function(selector) {
				return $(selector, jqElem);
			},


			/* ------------------------ State / Subscription -------------------------- */

			/**
			 * Subscribes the state change messages.
			 * @param callback the function that will be called on state change.  Should be
			 *		a function that expects two arguments in the form:
			 *		<code>function(changeObject, newState)</code>
			 * @param variables (optional) an array of strings containing the names
			 *		of the state variables that the subscriber wishes to be notified
			 *		about.  If not provided, notifies on all changes.
			 * @param context (optional) if provided, the callback will be called in the
			 *		scope of this object.
			 */
			subscribe = function( callback, variables, context ) {
				var listener = {
					callback : callback,
					variables : variables,
					context : context
				};

				for( var i = listeners.length-1; i > -1; i-- ) {
					var existing = listeners[i];
					if( existing.callback === callback ) {
						// This callback is already registered as a listener, simply
						// update the info and return
						listeners[i] = listener;
						return;
					}
				}

				// Not yet registered, add
				listeners.push(listener);
			},

			/**
			 * Gets the current application state object
			 */
			getState = function() {
				return state;
			},

			/**
			 * Unsubscribe method will unsubscribe the provided callback function listener
			 * from change notifications
			 */
			unsubscribe = function( callback ) {
				for( var i = listeners.length-1; i > -1; i-- ) {
					var existing = listeners[i];
					if( existing.callback === callback ) {
						// Found it, remove it
						listeners.splice(i,1);
						return;
					}
				}
			},

			/**
			 * Publishes a state change to the bus.  The object passed in should be
			 * a simple JS object containing just the new components of the state to
			 * change.  Eg:
			 * <code>
			 * publish( { mode:"factors" }
			 * </code>
			 * will change the mode to factors.  There is no need to pass in a full
			 * state object.  If the full object is passed in it may appear to other
			 * listeners that all fields of the state were changed.
			 */
			publish = function( stateChanges ) {
				// Publish event
				aperture.pubsub.publish( appChannel.STATE_REQUEST, stateChanges );
			},

			/**
			 * Internal function that listens on state changes and keeps local
			 * state object up to date
			 */
			onStateChange = function( channel, changeEvent ) {
				// Update the local state with the new state
				state = _.clone(changeEvent.state);

				var stateChanges = changeEvent.changes;

				// Notify all of this sandbox's listeners
				_.each( listeners, function(listener) {
					var notify = false;
					if( listener.variables ) {
						// Listener has a variable restriction, only notify
						// if one of the variables of interest changed
						for( var i = listener.variables.length-1; i > -1; i-- ) {
							if( stateChanges.hasOwnProperty( listener.variables[i] ) ) {
								notify = true;
								break;
							}
						}
					} else {
						notify = true;
					}

					if( notify ) {
						if( listener.context ) {
							listener.callback.call( listener.context, stateChanges, state );
						} else {
							listener.callback( stateChanges, state );
						}
					}
				} );
			},


			/*
			 * Subscribe to state changes locally
			 */
			myToken = aperture.pubsub.subscribe( appChannel.STATE, onStateChange ),


			/**
			 * Destroys this sandbox, unhooks subscribers
			 */
			destroy = function() {
				aperture.pubsub.unsubscribe( myToken );
			};

		/*
		 * Expose public API
		 * See jsdocs on functions above
		 */
		this.destroy = destroy;
		this.subscribe = subscribe;
		this.unsubscribe = unsubscribe;
		this.publishState = publish;
		this.state = getState;
		this.$ = local$;

		// Expose access to the div that the module can exist in
		this.dom = jqElem;

		// XXX: Expose spec?
		this.spec = spec;
	};

	return Sandbox;
});
