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

define( [ 'lib/util/xfUtil' ],
	function( xfUtil ) {
		function openImage() {
			var url = $(this).css('background-image');
			url = url.substr(4, url.length-5);
			
			window.open(url, '_blank');
			
			return false;
		}
		
		function carousel(imgUrls, image) {
			image.click(openImage);
			
			if (imgUrls.length > 1) {
				var currentIdx = 0;
				var controlDiv = image.find('.infSearchResultImageCarouselControls');
				
				image.hover(function() {
					controlDiv.css('visibility','visible');
				}, function() {
					controlDiv.css('visibility','hidden');
				});
	
				image.find('#prevCarouselButton').click(function() {
					currentIdx--;
					if (currentIdx < 0) {
						currentIdx = imgUrls.length-1;
					}
					image.css('background-image','url('+ imgUrls[currentIdx]+ ')');
					return false;
				});

				image.find('#nextCarouselButton').click(function() {
					currentIdx++;
					if (currentIdx > imgUrls.length-1) {
						currentIdx = 0;
					}
					image.css('background-image','url('+ imgUrls[currentIdx]+ ')');
					return false;
				});
			}
		}
		
		return carousel;
	}
);
