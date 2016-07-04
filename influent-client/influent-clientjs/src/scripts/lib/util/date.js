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

define(['lib/util/duration'], function(mDuration) {

	var months = [
		'January', 'February', 'March', 'April', 'May', 'June', 'July',
		'August', 'September', 'October', 'November', 'December'
	],

	// some useful constants
	secondInMillis = 1000,
	minuteInMillis = secondInMillis * 60,
	hourInMillis   = minuteInMillis * 60,
	dayInMillis    = hourInMillis * 24,

	/**
	 * Private implementation : add (or subtract) duration to date and return new date
	 */
	add = function(date, duration, sign) {
		if (!duration) {
			return date;
		}
		if (!duration.tokens) {
			duration = mDuration.parse(duration);

			if (!duration) {
				return null;
			}
		}

		// clone the parameter
		date = new Date(date.getTime());

		var timePart = false;

		// process each part
		for (var p = 0; p < duration.tokens.length; p++) {
			var part = duration.tokens[p];

			if (part.symbol === 'T') {
				timePart = true;
				continue;
			}

			// else only process if it a valid and non-zero number.
			if (part.number) {
				switch (part.symbol) {
				case 'Y': // years
					// length of year varies but is unbounded so just set it in years
					date.setFullYear(date.getFullYear() + sign * part.number);
					break;

				case 'M':
					if (!timePart) { // months
						// month is the only trick bit because the duration of a month varies
						var m = date.getMonth()/*0-11*/ + sign * part.number;

						// handle rollover
						if (m > 11) {
							date.setFullYear(date.getFullYear() + Math.floor(m/12));
							m = m % 12;
						}
						else if (m < 0) {
							date.setFullYear(date.getFullYear() - Math.ceil(-m/12));
							m = 12 - ((-m) % 12);
						}

						date.setMonth(m);
					}
					else { // minutes
						date.setTime(date.getTime() + minuteInMillis * sign * part.number);
					}
					break;

				case 'D': // days
					date.setTime(date.getTime() + dayInMillis * sign * part.number);
					break;

				case 'H': // hours
					date.setTime(date.getTime() + hourInMillis * sign * part.number);
					break;

				case 'S': // seconds
					date.setTime(date.getTime() + secondInMillis * sign * part.number);
					break;
				}
			}
		}

		return date;
	};

	return {

		/**
		 * ISO date comparisons (yyyy-mm-dd)
		 *  1: d1 > d2
		 *  0: d1 = d2
		 * -1: d1 < d2
		 */
		compare : function (d1, d2) {
			d1 = $.trim(d1).split('-');
			d2 = $.trim(d2).split('-');

			if (d1[0] === d2[0]){
				if (d1[1] === d2[1]) {
					return d1[2] === d2[2] ? 0 : ((d1[2] > d2[2]) ? 1 : -1);
				}
				else {
					return (d1[1] > d2[1]) ? 1 : -1;
				}
			}
			else {
				return (d1[0] > d2[0]) ? 1 : -1;
			}
		},

		toUTC : function (d) {
			var da = d.split('-');
			return Date.UTC(parseInt(da[0], 10), parseInt(da[1], 10) - 1, parseInt(da[2], 10) + 1, 0, 0, 0);
		},

		/**
		 * Formats in displayable form
		 */
		format : function( date, shortForm ) {

			if (shortForm) {
				var month = String((date.getMonth())+1);

				// Pad the month if it's only a single digit.
				if (month.length === 1){
					month = '0' + month;
				}
				var day = String(date.getDate());

				if (day.length === 1){
					day = '0' + day;
				}
				return date.getFullYear() + '-' + month + '-' + day;
			}

			return months[date.getMonth()] + ' ' +
				date.getDate() + ', ' +
				date.getFullYear();
		},

		/**
		 * Converts a Javascript date object into a string format we use on Influent server
		 *    'DD-MM-YYYY'
		 */
		stringify : function( date ) {
			if (!date) {
				return '';
			} else {
				return date.getUTCFullYear() +  '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
			}
		},

		/**
		 * Add duration to date and return new date
		 */
		after : function(date, duration) {
			return add(date, duration, 1);
		},

		/**
		 * Subtract duration from date and return new date
		 */
		before : function(date, duration) {
			return add(date, duration, -1);
		}

	};
});
