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

		/**
		 * Calculates and returns a percent change from two values
		 */
		calc : function (from, to) {
			if (from == null || to == null) {
				return 0;
			}

			var chg= from === 0? (to === 0? 0 : (to > 0? 1000 : -1000))
					: (100* (to - from) / Math.abs(from));

			return chg;
		},

		/**
		 * Returns true if pct change is nominal (very close to zero).
		 */
		isNominal : function (pctChange) {
			return (pctChange && Math.abs(pctChange).toFixed(1) === '0.0');
		},

		/**
		 * Formats a percent change with consistent treatment
		 */
		format : function (pctChange) {
			if (this.isNominal(pctChange)) {
				return '~UNCH';
			}
			if (!pctChange) {
				return 'UNCH';
			}

			// either one or zero decimals, that's it.
			var s = pctChange.toFixed(Math.abs(pctChange) < 1? 1 : 0);

			// if positive
			if (pctChange > 0) {
				if (pctChange > 1000) {
					return '+1000+%';
				}

				return '+' + s + '%';
			}

			if (pctChange < -1000) {
				return '-1000+%';
			}

			return s + '%';
		}
	};
});
