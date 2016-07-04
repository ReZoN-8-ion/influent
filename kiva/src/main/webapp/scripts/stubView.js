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
	[

	],
	function(

		){
		aperture.log.info('loaded Kiva stub view module');

		//--------------------------------------------------------------------------------------------------------------

		// return the module to the plugin in config.js
		return {
			onData : function (type, propertyMatchDescriptors, container) {

				var elem = $(container.canvas).find('.infSearchResultScroll');

				if ($(container.canvas).is(':visible')) {
					$(elem).append('<div><h3>onData: Container visible!!<h3></div>');
				} else {
					$(elem).append('<div><h3>onData: Container not visible!!<h3></div>');
				}

				$(elem).append('<div><h4>View called with following parameters:<h4></div>');
				$(elem).append('<div>type: ' + type + ' pmd: ' + JSON.stringify(propertyMatchDescriptors) + '</div>');

				if (type === 'entities') {
					container.search.entities(propertyMatchDescriptors, function (response, restInfo) {
						$(elem).append('<div><h4>Entities search result:<h4></div>');
						$(elem).append('<div><b>success:</b> ' + restInfo.success + '</div>');
						$(elem).append('<div><b>response:</b> ' + JSON.stringify(response) + '</div>');
					}, '', '', 'FULL');
				}
				if (type === 'links') {
					container.search.links(propertyMatchDescriptors, function (response, restInfo) {
						$(elem).append('<div><h4>Entities search result:<h4></div>');
						$(elem).append('<div><b>success:</b> ' + restInfo.success + '</div>');
						$(elem).append('<div><b>response:</b> ' + JSON.stringify(response) + '</div>');
					}, '', '', 'FULL');
				}

				container.events.stateChange(propertyMatchDescriptors);
			},

			onInit : function (container) {
				var elem = $(container).find('.infSearchResultScroll');
				if (elem.length === 0) {
					elem = $('<div></div>');
					elem.addClass('infSearchResultScroll');
					$(container).append(elem);
				}
				$(elem).append('<div><h3>Stub view initialized!!<h3></div>');
				if ($(container).is(':visible')) {
					$(elem).append('<div><h3>onInit: Container visible!!<h3></div>');
				} else {
					$(elem).append('<div><h3>onInit: Container not visible!!<h3></div>');
				}

//				if ($(container).is(':hidden')) {
//					$(elem).append('<div><h3>onInit: Container hidden!!<h3></div>');
//				} else {
//					$(elem).append('<div><h3>onInit: Container not hidden!!<h3></div>');
//				}
			},

			onShow : function (container) {
				var elem = $(container).find('.infSearchResultScroll');

				if ($(container).is(':visible')) {
					$(elem).append('<div><h3>onShow: Container visible!!<h3></div>');
				} else {
					$(elem).append('<div><h3>onShow: Container not visible!!<h3></div>');
				}

//				if ($(container).is(':hidden')) {
//					$(elem).append('<div><h3>onShow: Container hidden!!<h3></div>');
//				} else {
//					$(elem).append('<div><h3>onShow: Container not hidden!!<h3></div>');
//				}
			},

			onHide : function (container) {
				var elem = $(container).find('.infSearchResultScroll');

				if ($(container).is(':visible')) {
					$(elem).append('<div><h3>onHide: Container visible!!<h3></div>');
				} else {
					$(elem).append('<div><h3>onHide: Container not visible!!<h3></div>');
				}

//				if ($(container).is(':hidden')) {
//					$(elem).append('<div><h3>onHide: Container hidden!!<h3></div>');
//				} else {
//					$(elem).append('<div><h3>onHide: Container not hidden!!<h3></div>');
//				}
			}
		};
	}
);
