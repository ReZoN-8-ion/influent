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

define('templates/helpers/valueOfPropertyWithTag', ['hbs/handlebars'], function(Handlebars) {

	/**
	* Returns the value of the first property found with a given tag.  (ie/ 'DATE')
	* @param propertyMap
	*	The map of properties past to the context handler template
	* @param tag
	*	String value of the tag we're looking for (ie/ 'DATE','ANNOTATION', etc)
	*/
	function valueOfPropertyWithTag(propertyMap,tag) {
		var taggedPropKey = null;
		for(var prop in propertyMap) {
			if (propertyMap.hasOwnProperty(prop)) {
				for (var i = 0; i < propertyMap[prop].tags.length; i++) {
					if (propertyMap[prop].tags[i].toLowerCase() === tag.toLowerCase()) {
						taggedPropKey = prop;
					}
				}
				if (taggedPropKey !== null) {
					break;
				}
			}
		}
		if (taggedPropKey) {
			return propertyMap[taggedPropKey].value;
		} else {
			return null;
		}
	}

	Handlebars.registerHelper('valueOfPropertyWithTag', valueOfPropertyWithTag);
	return valueOfPropertyWithTag;
});
