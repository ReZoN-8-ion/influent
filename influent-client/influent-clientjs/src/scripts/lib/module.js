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

define(['lib/sandbox', 'underscore'], function(Sandbox) {

	var modules = {};

	return {
		/**
		 * Registers an application module with a given name and a constructor
		 * function.  The constructor must return an object that, at minimum,
		 * supports two functions: start() and end()
		 * @param name the name of the module
		 * @param constructor the constructor function
		 */
		register : function( name, constructor ) {
			modules[name] = {
				name: name,
				construct: constructor
			};
		},


		/**
		 * Creates an object capable of managing the execution of registered modules.
		 * Modules managed through this object are independent of any other manager
		 * created via this method.
		 *
		 * This object has an optional sandboxFactory function.
		 *
		 * @param sandboxFactory
		 * @returns object
		 */
		createManager : function( sandboxFactory ) {
			var activeModules = {};

			// If no constructor provided, use a trivial one
			if( _.isFunction(sandboxFactory) === false ) {
				sandboxFactory = function( spec ) {
					return new Sandbox(spec);
				};
			}

			return {
				/**
				 * Starts the module with the given name.  A specification object is given
				 * that will be used to pass settings to the object via its sandbox.  The
				 * spec should at least contain a property called "div" which is the id
				 * of the div into which the module will insert its view elements.  It may
				 * also contain configuration settings, parameters, etc.
				 *
				 * If the module is already started, this method will do nothing.
				 *
				 * @param name the name of the module to start
				 * @param spec the specification object containing information for the module.
				 * It must contain a "div" property containing the id of the DOM element in which the module
				 * should render.  It should also contain a state object with the current
				 * module/application state populated.
				 * @param id (optional) a unique identifier for the instantiation of this incarnation of this
				 * module.  If the same module is to be started twice in a single manager, unique ids are
				 * required.  The id, if used, must also be used to "end" the module.
				 */
				start : function( name, spec, id ) {
					if( !id ) {
						id = name;
					}

					if( modules[name] && !activeModules[id] ) {
						var sandbox = sandboxFactory( spec );

						var instance = modules[name].construct( sandbox );

						activeModules[id] = {
							instance : instance,
							sandbox : sandbox
						};

						instance.start();
					}
				},

				/**
				 * Ends the module with the given name or unique id.  This will most likely cause the module
				 * to remove all UI elements from the DOM and unsubscribe all listeners.  The
				 * module should expect to be garbage collected after this call.
				 *
				 * If the module has not been started, this call does nothing.
				 *
				 * @param id the name of the module to end, or if an id was used to start it,
				 * the id
				 */
				end : function( id ) {
					var module = activeModules[id];

					if( module ) {
						delete activeModules[id];

						module.instance.end();
						module.sandbox.destroy();
					}
				},


				/**
				 * Returns a list of all started modules by name/id
				 * @returns a list of strings
				 */
				getActive : function() {
					var result; result= [];
					_.each(activeModules, function(module) {
						if( module.instance ) {
							result.push(module.name);
						}
					} );
					return result;
				},

				/**
				 * Returns a module given  of all started modules by name/id
				 *
				 * @param id the name of the module to retrieve
				 *
				 * @returns a module with the given id, null otherwise
				 */
				getModule : function(id) {
					_.each(activeModules, function(module) {
						if(module.name === id) {
							return module;
						}
					});
					return null;
				}
			};
		}
	};
});


