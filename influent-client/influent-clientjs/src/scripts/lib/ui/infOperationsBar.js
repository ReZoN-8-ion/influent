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
		'lib/communication/applicationChannels',
		'hbs!templates/operationsBar/infOperationsBarButton'
	],
	function(
		appChannel,
		infOperationsBarButtonTemplate
	) {
		var operationsBarModule = (function() {
			var operationsBarInterface = {};

			operationsBarInterface.create = function(canvas) {

				var _UIObjectState = {
					canvas : null
				};

				if (canvas == null) {
					_UIObjectState.canvas = $('<div class="infOperationsBar"/>');
				} else {
					_UIObjectState.canvas = canvas;
				}

				// -----------------------------------------------------------------------------------------------------
				//	PUBLIC INTERFACE
				//--------------------------------------------------------------------------------------------------
				var operationsBarObject = { _buttons: [] };

				operationsBarObject.getElement = function() {
					return _UIObjectState.canvas;
				};

				//------------------------------------------------------------------------------------------------------

				operationsBarObject.buttons = function(buttons) {
					if (arguments.length === 0) {
						return this._buttons;
					}
					
					this._buttons = buttons;
					
					$.each(buttons, function(idx, button) {
						var buttonSpec = {
							title : button.title,
							iconClass : button.icon,
							annotationIconClass : button.annotationIcon
						};
						if (button.switchesTo) {
							buttonSpec['switchesTo'] = button.switchesTo;
						}
						if (button.requiresSelection) {
							buttonSpec['requiresSelection'] = button.requiresSelection;
						}
						_UIObjectState.canvas.append(infOperationsBarButtonTemplate(buttonSpec));

						var buttonElement = _UIObjectState.canvas.children().last();
						if (button.callback) {
							buttonElement.click(function() {
								button.callback();
							});
						}

						if (!button.callback || button.requiresSelection) {
							buttonElement.addClass('disabled');
						}
					});
				};

				//------------------------------------------------------------------------------------------------------

				operationsBarObject.enableButtons = function(enable) {
					var $buttons = _UIObjectState.canvas.find('.btn');
					$buttons.each(function(idx, button) {
						var $button = $(button);
						if ( $button.hasClass('requiresSelection')) {
							if (enable && $button.hasClass('disabled')) {
								$button.removeClass('disabled');
							} else if (!enable && !$button.hasClass('disabled')) {
								$button.addClass('disabled');
							}
						}
					});
				};

				//------------------------------------------------------------------------------------------------------

				return operationsBarObject;
			};

			return operationsBarInterface;
		})();

		return operationsBarModule;
	}
);
