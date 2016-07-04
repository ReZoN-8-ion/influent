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
	[],
	function() {

		var guid = {};

		guid.generateGuid = function () {
			var result = '';
			for (var i = 0; i < 32; i++) {
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					result = result + '-';
				}
				result = result + Math.floor(Math.random() * 16).toString(16).toUpperCase();
			}

			return result;
		};

		return guid;
	}
);
