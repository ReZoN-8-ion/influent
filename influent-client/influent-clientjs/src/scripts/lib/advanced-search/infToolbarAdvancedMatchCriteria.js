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
		'lib/constants',
		'hbs!templates/viewToolbar/infToolbarAdvancedMatchCriteriaBody',
		'lib/ui/criteria',
		'lib/ui/ordering',
		'moment',
		'lib/advanced-search/infSearchParams',
		'modules/infRest',
		'modules/infWorkspace'
	],
	function(
		constants,
		infToolbarAdvancedMatchCriteriaBodyTemplate,
		criteriaUI,
		orderingUI,
		moment,
		infSearchParams,
		infRest,
		infWorkspace
		) {
		var module = {};

		var NAME_VALUE_PATTERN = '([^:\\s]+)\\s*:\\s*(.+?)\\s*(([^:\\s]+):|$)';

		module.createInstance = function (view, canvas, searchParams) {

			var instance = {};

			var _UIObjectState = {
				selectedTypes : [],
				criteria : null,
				ordering : null,
				canvas : canvas,
				view : view
			};

			var _enableAdvancedSearchMatchType =
				aperture.config.get()['influent.config']['enableAdvancedSearchMatchType'];
			var _weighted =
				aperture.config.get()['influent.config']['enableAdvancedSearchWeightedTerms'];
			var _advancedSearchFuzzyLevels =
				aperture.config.get()['influent.config']['advancedSearchFuzzyLevels'];

			if (!_weighted) {
				_weighted = true;
			}

			// Find the defined fuzzy match level closest to 50%
			var _fuzzyMatchPreference = 0.5;
			var _fuzzyMatchWeight = null;

			aperture.util.forEach(_advancedSearchFuzzyLevels, function (value) {
				if (_fuzzyMatchWeight == null ||
					Math.abs(value - _fuzzyMatchPreference) < Math.abs(_fuzzyMatchWeight - _fuzzyMatchPreference)) {
					_fuzzyMatchWeight = value;
				}
			});

			//----------------------------------------------------------------------------------------------------------
			// Private Methods
			//----------------------------------------------------------------------------------------------------------

			var _$ = function(selector) {
				return _UIObjectState.canvas.find(selector);
			};

			//----------------------------------------------------------------------------------------------------------

			function _onAnyAll() {
				var matchType = _$('.advancedSearchbooleanOperation:checked').val();

				_UIObjectState.criteria.multival(matchType === 'any');

				aperture.log.log({
					type: aperture.log.draperType.USER,
					workflow: aperture.log.draperWorkflow.WF_GETDATA,
					activity: 'select_filter_menu_option',
					description: 'Changed advanced search boolean operation',
					data : {
						matchType : matchType
					}
				});
			}

			//----------------------------------------------------------------------------------------------------------

			function _buildMultiTypeSelect() {

				var typeOptions = _UIObjectState.canvas.find('.advancedsearch-entity-type');
				typeOptions.change(function () {
					var selectPickerButton = _$(typeOptions.next().children()[0]);
					if ($(this).val() === null) {
						selectPickerButton.removeClass('btn-default').addClass('btn-danger');
					} else {
						selectPickerButton.removeClass('btn-danger').addClass('btn-default');
					}

					var val = $(this).val();
					if (!aperture.util.isArray(val)) {
						val = [val];
					}
					_UIObjectState.selectedTypes = val;

					var text = instance.assembleSearchString();
					instance.setFieldsFromString(text);

					aperture.log.log({
						type: aperture.log.draperType.USER,
						workflow: aperture.log.draperWorkflow.WF_GETDATA,
						activity: 'select_filter_menu_option',
						description: 'Changed advanced search entity type',
						data: {
							type: $(this).val()
						}
					});
				});


				// build type options.
				var firstVal = null;
				var ungroupedTypes = {};
				var hasUngroupedTypes = false;
				var hasGroupedTypes = false;
				var groupKeyMap = {};
				aperture.util.forEach(searchParams.getTypeMap(), function (type, key) {
					if (!firstVal) {
						firstVal = key;
					}

					var optGroup = null;
					if (type.group) {
						optGroup = typeOptions.find('optgroup[label="' + type.group + '"]');
						if (!optGroup || optGroup.length === 0) {
							optGroup = $('<optgroup/>').attr('label', type.group);
							if (type.exclusive) {
								optGroup.attr('data-max-options', '1');
							}
							optGroup.appendTo(typeOptions);
						}
						$('<option></option>')
							.attr('value', key)
							.html(type.friendlyText ? type.friendlyText : type.key)
							.appendTo(optGroup);
						hasGroupedTypes = true;

						var groupKeys = groupKeyMap[type.group];
						if (!groupKeys) {
							groupKeys = [];
						}
						groupKeys.push(key);
						groupKeyMap[type.group] = groupKeys;
					} else {
						ungroupedTypes[key] = type;
						hasUngroupedTypes = true;
					}
				});

				if (hasUngroupedTypes) {
					if (hasGroupedTypes) {
						typeOptions.append('<option data-divider="true"></option>');
					}
					aperture.util.forEach(ungroupedTypes, function (type, key) {
						$('<option></option>')
							.attr('value', key)
							.html(type.friendlyText ? type.friendlyText : type.key)
							.appendTo(typeOptions);
					});
				}

				typeOptions.selectpicker({
					actionsBox : true,
					headerCallback: function (groupName) {
						var i;
						var currentValues = typeOptions.selectpicker('val') || [];
						var groupKeys = groupKeyMap[groupName];


						// If all group keys are currently selected, we want to deselect them
						var bRemoveGroupKeys = true;
						for (i = 0; i < groupKeys.length && bRemoveGroupKeys; i++) {
							bRemoveGroupKeys &= (currentValues.indexOf(groupKeys[i]) !== -1);
						}

						// Remove group keys from the current selection, otherwise, add them avoiding duplicates
						if (bRemoveGroupKeys) {
							for (i = 0; i < groupKeys.length; i++) {
								currentValues.splice(currentValues.indexOf(groupKeys[i]), 1);
							}
						} else {
							for (i = 0; i < groupKeys.length; i++) {
								if (currentValues.indexOf(groupKeys[i]) === -1) {
									currentValues.push(groupKeys[i]);
								}
							}
						}
						typeOptions.selectpicker('val', currentValues);
						_UIObjectState.selectedTypes = currentValues;
					}
				});
				typeOptions.selectpicker('val', firstVal);
				_UIObjectState.selectedTypes = [firstVal];

			}

			//----------------------------------------------------------------------------------------------------------

			function _addDefaultCriteriaRows(typeArr) {
				if (!aperture.util.isArray(typeArr)) {
					typeArr = [typeArr];
				}
				var intersectingProps = searchParams.getIntersectingProperties(typeArr);

				// Create an array of default criteria
				var defaultCriteria = [];
				intersectingProps.forEach(function(prop) {
					if (prop.defaultTerm) {
						defaultCriteria.push({
							key: prop.key,
							text: prop.key+':'+'""'
						});
					}
				});

				// If no default criteria are specified, pick the first property we find, otherwise add each criteria row
				if (defaultCriteria.length === 0) {
					if (intersectingProps.length > 0) {
						_addCriteriaRow(typeArr,undefined);
					}
				} else {
					defaultCriteria.forEach(function(c){
						_addCriteriaRow(typeArr,c);
					});
				}
			}

			//----------------------------------------------------------------------------------------------------------

			function _addDefaultOrderingRows(typeArr) {
				if (!aperture.util.isArray(typeArr)) {
					typeArr = [typeArr];
				}
				var intersectingProps = searchParams.getIntersectingProperties(typeArr);

				// Set default first orderby
				var orderByList = searchParams.getOrderByList();

				// Create an array of default criteria
				var defaultOrdering = [];
				intersectingProps.forEach(function(prop) {
					orderByList.forEach(function(orderBy) {
						if (orderBy.propertyKey === prop.key) {
							defaultOrdering.push({
								key: prop.key,
								text: prop.key+':'+'""'
							});
						}
					});
				});

				// Add any default ordering
				defaultOrdering.forEach(function(c){
					_addOrderingRow(typeArr,c);
				});
			}

			//----------------------------------------------------------------------------------------------------------

			function _addCriteriaRow(typeArr, criteria) {
				if (!aperture.util.isArray(typeArr)) {
					typeArr = [typeArr];
				}

				if (criteria === null) {
					_addDefaultCriteriaRows(typeArr);
					return;
				}

				var property;
				var intersectingProps = searchParams.getIntersectingProperties(typeArr);
				if (criteria === undefined) {
					var usedProps = _UIObjectState.criteria.list();
					intersectingProps.forEach(function(prop) {
						if (!property) {
							var used = false;
							usedProps.forEach(function (usedProp) {
								if (prop.key === usedProp.key()) {
									used = true;
								}
							});
							if (!used) {
								property = prop;
							}
						}
					});
				} else {
					for (var i = 0; i < intersectingProps.length; i++) {
						if (intersectingProps[i].key === criteria.key) {
							property = intersectingProps[i];
							break;
						}
					}
				}

				if (property) {
					var row = _UIObjectState.criteria.add(intersectingProps,property);
					if (criteria) {
						row.value(criteria.text);
					}
				}
			}

			//----------------------------------------------------------------------------------------------------------

			function _addOrderingRow(typeArr, ordering) {
				if (!aperture.util.isArray(typeArr)) {
					typeArr = [typeArr];
				}

				if (ordering === null) {
					_addDefaultOrderingRows(typeArr);
					return;
				}

				var property;
				var intersectingProps = searchParams.getSortableIntersectingProperties(typeArr);
				if (ordering === undefined) {
					var usedProps = _UIObjectState.ordering.list();
					intersectingProps.forEach(function(prop) {
						if (!property) {
							var used = false;
							usedProps.forEach(function (usedProp) {
								if (prop.key === usedProp.key()) {
									used = true;
								}
							});
							if (!used) {
								property = prop;
							}
						}
					});
				} else {
					for (var i = 0; i < intersectingProps.length; i++) {
						if (intersectingProps[i].key === ordering.key) {
							property = intersectingProps[i];
							break;
						}
					}
				}

				if (property) {
					var row = _UIObjectState.ordering.add(intersectingProps, property);
					row.direction(ordering && ordering.direction ? ordering.direction : 'ascending');
				}
			}

			//----------------------------------------------------------------------------------------------------------

			function _addBlankCriteriaRow() {
				_addCriteriaRow(_UIObjectState.selectedTypes/*instance.getSelectTypeValue()*/, null);
			}

			//----------------------------------------------------------------------------------------------------------

			function _clear() {
				// Remove criteria
				_UIObjectState.criteria.list().forEach(function(ui) {
					ui.remove();
				});

				// Remove ordering
				_UIObjectState.ordering.list().forEach(function(ui) {
					ui.remove();
				});
			}

			//----------------------------------------------------------------------------------------------------------

			function parseQuery(searchString) {
				var nameValuePattern = new RegExp(NAME_VALUE_PATTERN);
				var match = nameValuePattern.exec(searchString);
				var criteria = {list: [], map: {}};
				var key;
				var matchlen;

				while (match != null) {
					key = match[1];

					if (key.charAt(0) === '-') {
						key = key.substr(1);
					}

					var isMultitermKey = (key === 'TYPE' || key === 'ORDER');

					if (!criteria.map[key] || isMultitermKey) {
						criteria.list.push({
							key: key,
							text: match[1] + ':' + match[2]
						});
					}

					if (isMultitermKey) {
						if (!criteria.map[key]) {
							criteria.map[key] = [match[2]];
						} else {
							criteria.map[key].push(match[2]);
						}
					} else {
						criteria.map[key] = match[2];
					}


					matchlen = match[0].length - match[3].length;
					if (matchlen >= searchString.length) {
						break;
					}

					searchString = searchString.substr(matchlen);
					match = nameValuePattern.exec(searchString);
				}


				return criteria;
			}

			//----------------------------------------------------------------------------------------------------------

			var _getEntityDetails = function(entity, callback) {
				aperture.io.rest(
					'/entitydetails',
					'POST',
					function(response, restInfo) {
						callback(response, restInfo);
					},
					{
						postData : {
							sessionId : infWorkspace.getSessionId(),
							entityId : entity.uid
						},
						contentType: 'application/json'
					}
				);
			};

			//----------------------------------------------------------------------------------------------------------

			function _seedFromEntities(entities) {

				var map = {MATCH : 'any'};
				var list = [{key: 'uid', text: ''}];
				var entitiesString = '';

				if (!entities || entities.length === 0) {
					aperture.log.warn('no entities found for population request');
					return;
				}

				map.TYPE = searchParams.getEntityTypes(entities);
				var orderByList = searchParams.getOrderByList();
				if (orderByList && orderByList.length > 0) {
					map.ORDER = orderByList[0].propertyKey;
				}

				var intersectingPropertiesMap = searchParams.getIntersectingPropertiesMap(map.TYPE);

				aperture.util.forEach(entities, function (entity) {
					entitiesString += entity.uid + ', ';

					aperture.util.forEach(intersectingPropertiesMap, function (p) {
						JSON.stringify(entity);
						JSON.stringify(p);
						var property = entity.properties[p.key];

						if (property && property.value && property.value !== '') {
							var useIt = false;

							if (property.tags) {
								for (var j = 0; j < property.tags.length; j++) {

									// Only use shared identifiers
									if (property.tags[j] === 'SHARED_IDENTIFIER') {
										useIt = true;
										break;
									}
								}
							}

							// Don't seed any empty values
							if (property.value === '') {
								useIt = false;
							}

							if (useIt) {
								// Escape commas when seeding from raw entity values
								if (typeof property.value === 'string' || property.value instanceof String) {
									property.value = property.value.replace(/,/g, '\\,');
								}

								if (map.hasOwnProperty(p.key)) {
									if (map[p.key].indexOf(property.value) === -1) {
										map[p.key] += ', ' + property.value;
									}
								} else {
									map[p.key] = String(property.value);
									list.push({
										key: p.key,
										text: '',
										ordinal: intersectingPropertiesMap[p.key].order
									});
								}
							}
						}
					});
				});

				map.uid = entitiesString.substring(0, entitiesString.length - 2);

				// copy final values into list as text
				list.forEach(function (p) {
					p.text = p.key + ':' + map[p.key];

					var _isTagged = function (tag) {
						var property = null;
						aperture.util.forEach(intersectingPropertiesMap, function (prop) {
							if (prop.key === p.key) {
								property = prop;
							}
						});

						if (property && property.tags) {
							for (var i = 0; i < property.tags.length; i++) {
								if (property.tags[i] === tag) {
									return true;
								}
							}
						}

						return false;
					};

					if (!_isTagged('DATE') && !_isTagged('AMOUNT')) {
						p.text += (_fuzzyMatchWeight ? '~' + _fuzzyMatchWeight : '');
					}
				});

				list.sort(function (a, b) {
					return a.ordinal - b.ordinal;
				});

				_setFieldsFromProperties({
					map: map,
					list: list
				});
			}

			//----------------------------------------------------------------------------------------------------------

			function _seedFromTransactions(transactions) {

				var map = {MATCH : 'any'};
				var list = [];

				if (!transactions || transactions.length === 0) {
					aperture.log.warn('no transactions found for population request');
					return;
				}

				//transactions = transactions[0].entities;
				var tagMap = {};
				map.TYPE = searchParams.getTransactionTypes(transactions);
				var orderByList = searchParams.getOrderByList();
				if (orderByList && orderByList.length > 0) {
					map.ORDER = orderByList[0].propertyKey;
				}

				var intersectingPropertiesMap = searchParams.getIntersectingPropertiesMap(map.TYPE);

				var addRangeToTagMap = function(tag, property) {
					// Adds special tagged ranges to the tap map by min/maxing

					if (!tagMap[tag]) {
						tagMap[tag] = {};
					}

					if (!tagMap[tag][property.key]) {
						tagMap[tag][property.key] = {};
						tagMap[tag][property.key]['min'] = property.value;
						tagMap[tag][property.key]['max'] = property.value;
					} else {
						tagMap[tag][property.key]['min'] = Math.min(tagMap[tag][property.key]['min'], property.value);
						tagMap[tag][property.key]['max'] = Math.max(tagMap[tag][property.key]['max'], property.value);
					}
				};

				// Tag special fields
				aperture.util.forEach(transactions, function (transaction) {
					aperture.util.forEach(intersectingPropertiesMap, function (p) {
						var property = transaction.properties[p.key];

						if (property && property.value && property.value !== '') {

							if (property.tags) {
								for (var j = 0; j < property.tags.length; j++) {

									// Handle ranges by min/maxing
									if (property.tags[j] === 'DATE' ||
										property.tags[j] === 'AMOUNT') {
										transaction.properties[p.key].tagged = property.tags[j];
										addRangeToTagMap(property.tags[j], property);
										break;
									}
								}
							}
						}
					});
				});

				aperture.util.forEach(transactions, function (transaction) {
					aperture.util.forEach(intersectingPropertiesMap, function (p) {
						var property = transaction.properties[p.key];
						var useIt = true;

						if (property && property.value && property.value !== '') {

							var val = property.value;
							// Don't seed any empty values
							if (val === '') {
								useIt = false;
							}
							if (property.tags) {
								for (var j = 0; j < property.tags.length; j++) {

									// Dont process anything with an ID or GEO tag for seeding
									if (property.tags[j] === 'ID' ||
										property.tags[j] === 'GEO') {
										useIt = false;
										break;
									}
								}
							}

							if (useIt) {

								// Resolve special tags
								if (property.tagged === 'DATE' ||
									property.tagged === 'AMOUNT') {

									var min = tagMap[property.tagged][property.key]['min'];
									var max = tagMap[property.tagged][property.key]['max'];

									// Only make make it a range if the min and max are different
									if (min !== max) {

										if (property.tagged === 'DATE') {
											min = moment(min).format(constants.QUERY_DATE_FORMAT);
											max = moment(max).format(constants.QUERY_DATE_FORMAT);
										}

										val = '[' + min + ' TO ' +
													max + ']';
									} else {
										if (property.tagged === 'DATE') {
											val = moment(val).format(constants.QUERY_DATE_FORMAT);
										}
									}
								}

								if (map.hasOwnProperty(p.key)) {
									if (map[p.key].indexOf(val) === -1) {
										map[p.key] += ', ' + val;
									}
								} else {
									map[p.key] = String(val);

									list.push({
										key: p.key,
										text: '',
										ordinal: intersectingPropertiesMap[p.key].order
									});
								}
							}
						}
					});
				});

				// copy final values into list as text
				list.forEach(function(p) {
					p.text = p.key + ':' + map[p.key];

					var _isTagged = function(tag) {
						var property = null;
						aperture.util.forEach(intersectingPropertiesMap, function (prop) {
							if (prop.key === p.key) {
								property = prop;
							}
						});

						if (property && property.tags) {
							for (var i = 0; i < property.tags.length; i++) {
								if (property.tags[i] === tag) {
									return true;
								}
							}
						}

						return false;
					};

					if (!_isTagged('DATE') && !_isTagged('AMOUNT')) {
						p.text += (_fuzzyMatchWeight ? '~' + _fuzzyMatchWeight : '');
					}
				});

				list.sort(function(a,b) {
					return a.ordinal - b.ordinal;
				});

				_setFieldsFromProperties({
					map: map,
					list: list
				});
			}

			//----------------------------------------------------------------------------------------------------------

			function _setFieldsFromProperties(criteria) {
				var typeOpt = _$('.advancedsearch-entity-type');

				if (criteria.map.TYPE) {
					typeOpt.selectpicker('val', criteria.map.TYPE);
					_UIObjectState.selectedTypes = criteria.map.TYPE;
				} else if (criteria.list.length > 0) {
					var types = searchParams.getTypesFromCriteriaList(criteria.list);
					if (types.length > 0) {
						typeOpt.selectpicker('val',types);
						_UIObjectState.selectedTypes = types;
					}
					criteria.map.TYPE = types;
				}

				var matchtype = criteria.map.MATCH;
				if (!matchtype) {
					matchtype = 'any';
				}

				var matchtypeSel = '[value='+ matchtype + ']';

				var pair = _$('.advancedSearchbooleanOperation');
				pair.not(matchtypeSel).prop('checked',false);
				pair.filter(matchtypeSel).prop('checked',true);

				var intersectingProperties = searchParams.getIntersectingPropertiesMap(criteria.map.TYPE);
				criteria.list.forEach(function(c) {
					if (intersectingProperties[c.key]) {
						_addCriteriaRow(criteria.map.TYPE, c);
					} else if (c.key === 'ORDER') {

						// Order properties have keys as values. Build a new property from the key
						var match = /([^:\s]+):(.+?)\s*$/.exec(c.text||'');
						var value = match[2];
						var direction = 'descending';
						if (value.charAt(value.length - 1) === '^') {
							direction = 'ascending';
							value = match[2].replace('^', '');
						}
						_addOrderingRow(criteria.map.TYPE, {
							key: value,
							direction: direction
						});
					}
				});

				if (_UIObjectState.criteria.list().length === 0) {
					_addBlankCriteriaRow();
				}

				if (_UIObjectState.ordering.list().length === 0) {
					_addOrderingRow(_UIObjectState.selectedTypes, null);
				}
			}

			//----------------------------------------------------------------------------------------------------------

			var _onCriteriaAdd = function(event) {
				_addCriteriaRow(_UIObjectState.selectedTypes, undefined);

				if (!constants.UNIT_TESTS_ENABLED) {
					aperture.log.log({
						type: aperture.log.draperType.USER,
						workflow: aperture.log.draperWorkflow.WF_GETDATA,
						activity: 'select_filter_menu_option',
						description: 'Adding new search criteria'
					});
				}
			};

			//----------------------------------------------------------------------------------------------------------

			var _onOrderingAdd = function(event) {
				_addOrderingRow(_UIObjectState.selectedTypes, undefined);

				if (!constants.UNIT_TESTS_ENABLED) {
					aperture.log.log({
						type: aperture.log.draperType.USER,
						workflow: aperture.log.draperWorkflow.WF_GETDATA,
						activity: 'select_filter_menu_option',
						description: 'Adding new search ordering'
					});
				}
			};

			//----------------------------------------------------------------------------------------------------------
			// Public
			//----------------------------------------------------------------------------------------------------------

			instance.parseQuery = parseQuery;

			//----------------------------------------------------------------------------------------------------------

			instance.build = function(parent) {
				if (_UIObjectState.canvas) {
					_UIObjectState.canvas.empty();
				}

				var searchTarget = '';
				switch (_UIObjectState.view) {
					case require('views/infAccountsView').name():
						searchTarget = 'accounts';
						break;
					case require('views/infTransactionsView').name():
						searchTarget = 'transactions';
						break;
				}

				var isMultitype = searchParams.getNumTypes() > 1;
				var bodyContents = $(infToolbarAdvancedMatchCriteriaBodyTemplate({
					multitype: isMultitype,
					searchTarget: searchTarget,
					view : view
				}));

				_UIObjectState.canvas.append(bodyContents);

				// Initialize criteria UI
				_UIObjectState.criteria = criteriaUI.createInstance(bodyContents.find('.advancedsearch-criteria-container'));
				_UIObjectState.criteria.weighted(_weighted);

				// Build a type dropdown if there is more than one type, otherwise set the type
				if (isMultitype) {
					_buildMultiTypeSelect();
				} else {
					_UIObjectState.selectedTypes = Object.keys(searchParams.getTypeMap());
				}

				// ANY / ALL option, is optional
				if (_enableAdvancedSearchMatchType) {
					var anyAllLine = canvas.find('.advancedsearch-any-all-line');
					anyAllLine.find('input').change(_onAnyAll);
				}

				canvas.find('.advancedsearch-criteria-add').click(_onCriteriaAdd);

				_UIObjectState.ordering = orderingUI.createInstance(bodyContents.find('.advancedsearch-ordering-container'));
				canvas.find('.advancedsearch-ordering-add').click(_onOrderingAdd);
			};

			//----------------------------------------------------------------------------------------------------------

			instance.assembleSearchString = function() {
				var searchString = '';
				var selectedTypes = _UIObjectState.selectedTypes;
				var numSpecifiedCriteria = 0;
				_UIObjectState.criteria.list().forEach(function(ui) {
					var val = ui.value();
					if (val && val.length !== 0) {
						searchString += val + ' ';
						numSpecifiedCriteria++;
					}
				});

				// Remove trailing space
				searchString = searchString.substring(0, searchString.length - 1);

				if(searchString.length > 0) {
					// Add type selection if there is more than one type available
					if (searchParams.getNumTypes() > 1 && selectedTypes) {
						for (var valIdx = 0; valIdx < selectedTypes.length; valIdx++) {
							searchString += ' TYPE:' + selectedTypes[valIdx];
						}
					}

					// Add match type if there is more than one searchable criteria
					if (numSpecifiedCriteria > 1 && _enableAdvancedSearchMatchType) {
						var anyall = _$('.advancedSearchbooleanOperation:checked').val();
						searchString += ' MATCH:' + anyall;
					}

					// Add ordering, if any
					_UIObjectState.ordering.list().forEach(function(ui) {
						searchString += ' ORDER:' + ui.key();
						if (ui.direction() === 'ascending') {
							searchString += '^';
						}
					});
				}

				return searchString;
			};

			//----------------------------------------------------------------------------------------------------------

			instance.setFieldsFromString = function(searchString) {
				_clear();

				if (searchString == null || searchString.length === 0) {
					_addBlankCriteriaRow();
					_addOrderingRow(_UIObjectState.selectedTypes, null);
					return;
				}

				var criteria = parseQuery(searchString);
				_setFieldsFromProperties(criteria);
			};

			//----------------------------------------------------------------------------------------------------------

			instance.setFieldsFromDataIds = function(dataIds) {
				_clear();

				infRest.request( '/containedentities' ).inContext( _UIObjectState.contextId ).withData({

					sessionId : infWorkspace.getSessionId(),
					queryId: (new Date()).getTime(),
					entitySets : [{
						contextId : _UIObjectState.contextId,
						entities : dataIds
					}],
					details : true

				}).then(function (response) {

					_seedFromEntities(response.data[0].entities);

					if (_UIObjectState.criteria.list().length === 0) {
						_addBlankCriteriaRow();
					}
					if (_UIObjectState.ordering.list().length === 0) {
						_addOrderingRow(_UIObjectState.selectedTypes, null);
					}
				});
			};

			//----------------------------------------------------------------------------------------------------------

			instance.setFieldsFromEntitySpecs = function(specs) {
				_clear();

				var entityList = [];
				var resultsCount = 0;
				aperture.util.forEach(specs, function (entity) {
					_getEntityDetails(entity, function(e) {
						entityList.push(e);
						if (++resultsCount >= specs.length) {
							_seedFromEntities(entityList);

							if (_UIObjectState.criteria.list().length === 0) {
								_addBlankCriteriaRow();
							}
							if (_UIObjectState.ordering.list().length === 0) {
								_addOrderingRow(_UIObjectState.selectedTypes, null);
							}
						}
					});
				});

			};

			//----------------------------------------------------------------------------------------------------------

			instance.setFieldsFromTransactionSpecs = function(specs) {
				_clear();

				_seedFromTransactions(specs);

				if (_UIObjectState.criteria.list().length === 0) {
					_addBlankCriteriaRow();
				}
				if (_UIObjectState.ordering.list().length === 0) {
					_addOrderingRow(_UIObjectState.selectedTypes, null);
				}
			};

			//----------------------------------------------------------------------------------------------------------

			instance.getSearchParams = function() {
				return searchParams;
			};

			//----------------------------------------------------------------------------------------------------------

			if (constants.UNIT_TESTS_ENABLED) {
				instance.seedFromEntities = _seedFromEntities;
				instance.clear = _clear;
				instance.getState = function()          { return _UIObjectState; };
				instance.getCriteriaRows = function()   { return _UIObjectState.criteria.list(); };
				instance.getOrderingRows = function()      { return _UIObjectState.ordering.list(); };
				instance.onCriteriaAdd = _onCriteriaAdd;
			}

			return instance;
		};

		return module;
	}
);
