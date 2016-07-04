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

/**
 * This helper will delegate its results to a callback.
 *
 * Ex.
 * template.hbs:
 * <span>{{callback myCallback this}}</span>
 *
 * code.js:
 * template({
 *     myCallback: function(){ return 'hi';}
 * });
 *
 * Will result in the callback 'myCallback' being called and inserting 'hi' into the span element.
 *
 */
define('templates/helpers/callback', ['hbs/handlebars'], function(Handlebars) {
	/**
	 *
	 * @param callbackName
	 *   The name of the callback function parameter in options.data
	 * @param context
	 *   The context that's passed to the function
	 * @returns {SafeString}
	 */
	function callback(cb, context) {
		var result;

		if (cb && cb != null) {
			result = cb(context);
		}

		if (!result || result === null) {
			result = '';
		}

		return new Handlebars.SafeString(result);
	}

	Handlebars.registerHelper('callback', callback);
	return callback;
});
