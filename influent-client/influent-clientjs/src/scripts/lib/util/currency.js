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

define([], function() {

	return {
		formatNumber: function(number) {
			var suffix = '';

			number = Math.abs(number);

			if (number >= 1000000000) {
				suffix = 'B';
				number *= 0.000000001;
			} else if (number >= 1000000) {
				suffix = 'M';
				number *= 0.000001;
			} else if (number >= 1000) {
				suffix = 'K';
				number *= 0.001;
			}

			number = Math.round(number);

			var i,
				s = number.toString();

			for (i= s.length-3; i>0; i-= 3) {
				s = s.substring(0, i).concat(',').concat(s.substring(i));
			}

			return s + suffix;
		},




		formatBalance: function(number, prefix) {
			var suffix = '';
			var sign = (number < 0) ? '-' : '';

			number = Math.abs(number);

			if (number >= 1000000000) {
				suffix = 'B';
				number *= 0.000000001;
			} else if (number >= 1000000) {
				suffix = 'M';
				number *= 0.000001;
			} else if (number >= 1000) {
				suffix = 'K';
				number *= 0.001;
			}

			number = Math.round(number);
			if (number === 0) {
				sign = '';
			}

			var i,
				s = number.toString();

			for (i= s.length-3; i>0; i-= 3) {
				s = s.substring(0, i).concat(',').concat(s.substring(i));
			}

			return sign + prefix+ s + suffix;
		}
	};
});
