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

(function ($) {
	/**
	 * Transparent extension of jQuery-ui draggable that automatically suspends and resumes render requests for influent
	 * rendering system
	 *
	 * @params {Object} spec
	 * jQuery-ui draggable specification
	 *
	 * @returns {Object}
	 * jQuery draggable object.
	 */
	$.fn.influentDraggable = function (spec) {

		var influentSpec = $.extend(true, {}, spec);

		influentSpec.start = function(event,ui) {
			aperture.pubsub.publish('suspend-rendering-request');
			if (spec.hasOwnProperty('start')) {
				spec.start(event,ui);
			}
		};

		influentSpec.stop = function(event,ui) {
			aperture.pubsub.publish('resume-rendering-request');
			if (spec.hasOwnProperty('stop')) {
				spec.stop(event,ui);
			}
		};

		$(this).draggable(influentSpec);

		return this;
	};

	/**
	 * jQuery plugin to replace text strings
	 *
	 * Taken from @link http://net.tutsplus.com/tutorials/javascript-ajax/spotlight-jquery-replacetext/
	 *
	 * eg:
	 *     $('#resltsContainer').highlight(searchTerm, '.bold')
	 */

	$.fn.highlight = function (str, className) {
		var regex = new RegExp(str, "gi");
		return this.each(function () {
			this.innerHTML = this.innerHTML.replace(regex, function(matched) {
				return "<span class=\"" + className + "\">" + matched + "</span>";
			});
		});
	};

	$.fn.clickAndDblClick = function(onClick, onDblClick, toleranceOverride) {
		var DELAY = toleranceOverride || 300, clicks = 0, timer = null;
		$(this).click(function(e) {
			clicks++;
			if (clicks === 1) {
				timer = setTimeout(function() {
					onClick(e);
					clicks = 0;
				}, DELAY);
			} else {
				clearTimeout(timer);
				onDblClick(e);
				clicks = 0;
			}
		});
		$(this).dblclick(function(e) {
			e.preventDefault();
		});
	}
}(jQuery));
