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

define(['lib/communication/applicationChannels'],
	function(appChannel) {

		var _UIObjectState = {
			showing : false,
			previousState : null,
			previousFilters : null,
			element : null
		};

		//--------------------------------------------------------------------------------------------------------------

		var _onSearchFilterChange = function(e) {
			var currentState = _getState();
			_UIObjectState.previousState = currentState;

			aperture.pubsub.publish(appChannel.SEARCH_FILTER_CHANGED, currentState);
		};

		//--------------------------------------------------------------------------------------------------------------

		var _getState = function() {
			var selectElements = _UIObjectState.element.find('select');
			var state = {};
			$.each(selectElements, function(idx,selectElem) {
				var select = $(selectElem);
				var key = select.attr('key');
				var value = $(this).find(':selected').attr('influentAnyOption') === 'true' ? '*' : $(this).val();
				state[key] = value;
			});
			return state;
		};

		//--------------------------------------------------------------------------------------------------------------

		var _setState = function(state) {
			$(_UIObjectState.element).find('select').each(function(index,selectElement) {
				var selectKey = $(selectElement).attr('key');
				var storedValue = state[selectKey];

				if (!storedValue){
					return;
				}

				var options = $(selectElement).find('option');
				for (var i = 0; i < options.length; i++) {
					var optionVal = $(options[i]).val();
					if (optionVal === storedValue) {
						$(options[i]).prop('selected',true);
						break;
					}
				}
			});
		};

		//--------------------------------------------------------------------------------------------------------------

		var searchFilter = {
			create : function(searchResponse) {

				var buckets;
				if (_UIObjectState.previousFilters) {
					buckets = _UIObjectState.previousFilters;
				} else {
					buckets = searchResponse.searchFilters;
					_UIObjectState.previousFilters = searchResponse.searchFilters;
				}

				var tools = $('.infSearchTools');
				if (tools.length) {
					tools.empty();
				} else {
					tools = $('<div/>').addClass('infSearchTools');
				}
				if (!_UIObjectState.showing) {
					tools.css('display','none');
				}
				_UIObjectState.element = tools;
				for (var key in buckets) {
					if (buckets.hasOwnProperty(key)) {
						var propertyValues = buckets[key];
						var select = $('<select/>').attr('key',key);

						var blankOption = $('<option>Any</option>').attr('influentAnyOption',true).attr('value','*');
						select.append(blankOption);

						for (var i = 0; i < propertyValues.values.length; i++) {
							$('<option value="' + propertyValues.values[i] + '">' + propertyValues.values[i] + '</option>').appendTo(select);
						}

						tools.append(propertyValues.friendlyText + ':').append(select);
					}
				}
				var clearBtn = $('<button/>').html('Clear').addClass('simpleViewFileCreateButton').button().click(function() {
					var selectElements = $(_UIObjectState.element).find('select');
					selectElements.unbind('change');
					$.each(selectElements, function(index,element) {
						$(element).find('option[influentAnyOption=true]').prop('selected',true);
					});
					searchFilter.clearState();
					_onSearchFilterChange();
				});
				tools.append(clearBtn);

				// apply previous state
				if (_UIObjectState.previousState != null) {
					_setState(_UIObjectState.previousState);
				}

				tools.find('select').change(_onSearchFilterChange);

				return tools;
			},
			clearState : function() {
				_UIObjectState.previousState = null;
				_UIObjectState.previousFilters = null;
			},
			setShowing : function(bShow) {
				_UIObjectState.showing = bShow;
			},
			getShowing : function() {
				return _UIObjectState.showing;
			}
		};
		return searchFilter;
	}
);
