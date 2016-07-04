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

define([],
	function() {
		return {
			createInstance : function(spec) {
				// Dialog will close when any button is pressed so developer doesn't have to remember to call
				// $(this).dialog("close") for each0 button they write
				var autoCloseButtons = {};
				
				aperture.util.forEach(spec.buttons, function(callback, key) {
					autoCloseButtons[key] = function() {
						callback();
						$(this).dialog('close');
					};
				});
						
				var dialogContents =  '<div id="dialog-confirm">'
					+   (!spec.noIcon ? '<p><span class="ui-icon ui-icon-alert" style="float: left; margin: 0 7px 20px 0;"></span>' : '') + spec.contents + '</p>'
					+ '</div>';
				var dialogDiv = $('<div></div>');

				dialogDiv.html(dialogContents);
				$('body').append(dialogDiv);
				dialogDiv.dialog({
					zIndex:30000000,
					minHeight:'auto',
					resizable:false,
					modal:true,
					title:spec.title,
					// These two lines prevent the "x" from appearing in the corner of dialogs.   It's annoying to handle closing the dialog
					// this way so this is how we can prevent the user from doing this
					closeOnEscape: false,
					open: function(event, ui) { $(this).parent().children().children('.ui-dialog-titlebar-close').hide(); },
					buttons: autoCloseButtons,
					resizeStop: function(event, ui) {
					},
					close: function(event, ui) {
						$(this).dialog('destroy');
						$(this).remove();
					}
				});
			}
		};
	}
);
