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
		'lib/util/date',
		'lib/util/xfUtil',
		'moment',
		'hbs!templates/criteria/fieldSelector'
	],
	function(
		constants,
		date,
		xfUtil,
		moment,
		fieldSelectorTemplate
	) {

		var CUSTOM_JQUERY_EVENT = 'component.change';
		var _supportsWeight = true;

		// Range operators
		var LESS_THAN = 'less than';
		var GREATER_THAN = 'greater than';
		var BETWEEN = 'between';
		var IS = 'is';

		var _advancedSearchFuzzyLevels =
			aperture.config.get()['influent.config']['advancedSearchFuzzyLevels'];

		
		/**
		 * Return the module for access by clients, which exposes a fn for
		 * adding new criteria ui to a canvas and returning an interface to control it.
		 */
		return {

			createInstance : function(canvas) {

				var _UIObjectState = {
					canvas : canvas
				};


				/**
				 * Returns true if fuzzy option is allowed by the range type and constraint
				 */
				function _fuzzyAllowed(descriptor) {
					// SINGLETON, LIST, BOUNDED, DISTRIBUTION
					switch (descriptor.range) {
						case 'SINGLETON':
						case 'LIST':
							break;
						default:
							return false;
					}

					// REQUIRED_EQUALS, FUZZY_PARTIAL_OPTIONAL, NOT, OPTIONAL_EQUALS, FUZZY_REQUIRED
					switch (descriptor.constraint) {
						case 'FUZZY_PARTIAL_OPTIONAL':
						case 'FUZZY_REQUIRED':
							return true;
					}
				}

				/**
				 * Default validation fn
				 */
				function _unchecked(value) {
					return true;
				}

				/**
				 * Validation fns for each type.
				 * TODO: validate.
				 */
				var _typeValidators = {
					'BOOLEAN' : _unchecked,
					'DOUBLE' : _unchecked,
					'FLOAT' : _unchecked,
					'LONG' : _unchecked,
					'INTEGER' : _unchecked,
					'STRING' : _unchecked,
					'DATE' : _unchecked,
					'GEO' : _unchecked
				};

				/**
				 * add the ui for the value editor and return the setter/getter fn
				 */
				function _constraintUI(parent) {
					var opt = $('<select class="advancedsearch-constraint"></select>')
						.appendTo(parent);

					return {
						add : function(value, label) {
							$('<option></option>')
								.attr('value', value)
								.html(label || value)
								.appendTo(opt);
							return this;
						},
						value : function(value) {
							if (arguments.length !== 0) {
								opt.val(value);
								return this;
							}
							return opt.val();
						},
						change : function(callback) {
							opt.change(function() {
								aperture.log.log({
									type: aperture.log.draperType.USER,
									workflow: aperture.log.draperWorkflow.WF_GETDATA,
									activity: 'select_filter_menu_option',
									description: 'Criteria constraint changed'
								});
								callback();
							});
							return this;
						},
						clear : function() {
							opt.empty();
							return this;
						}
					};
				}

				/**
				 * add the ui for the date editor and return the value api
				 * TO DO: support customizations via plugin api
				 */
				function _rangeUI(descriptor, parent, operator) {
					operator.add(BETWEEN);
					operator.add(IS);
					operator.add(GREATER_THAN);
					operator.add(LESS_THAN);

					function committed(changed) {
						changed.call(this, true);
					}

					function keypress(changed, e) {
						aperture.log.log({
							type: aperture.log.draperType.USER,
							workflow: aperture.log.draperWorkflow.WF_GETDATA,
							activity: 'enter_filter_text',
							description: 'Entering text into search criteria'
						});

						if (e.which) {
							changed.call(this, false);
						}
					}

					var start, end;
					var _createElements = function() {
						start = end = undefined;
						parent.empty();

						if (operator.value() === BETWEEN ||
							operator.value() === IS ||
							operator.value() === GREATER_THAN) {
							if (descriptor.propertyType === 'DATE') {
								start = $('<input class="criteria-datepicker-start" type="text">');
								start.datepicker({
									format: constants.BOOTSTRAP_DATE_FORMAT,
									autoclose: true,
									forceParse: false,
									multidateSeparator: ';'
								});
								start.appendTo(parent);
							} else {
								start = $('<input class="advancedsearch-input"/>').appendTo(parent);
							}
						}

						if (operator.value() === BETWEEN) {
							parent.append(' and ');
						}

						if (operator.value() === BETWEEN ||
							operator.value() === LESS_THAN) {
							if (descriptor.propertyType === 'DATE') {
								end = $('<input class="criteria-datepicker-end" type="text">');
								end.datepicker({
									format: constants.BOOTSTRAP_DATE_FORMAT,
									autoclose: true,
									forceParse: false,
									multidateSeparator: ';'
								});
								end.appendTo(parent);
							} else {
								end = $('<input class="advancedsearch-input"/>').appendTo(parent);
							}
						}

						if (operator.value() === BETWEEN) {
							start.width(84);
							end.width(84);
						}
					};

					_createElements();

					operator.change(function() {
						_createElements();
					});

					// set from text or get as text
					return {
						validate : _typeValidators[descriptor.type],
						remove : function() {
							parent.empty();
						},
						change : function(callback) {
							if (start) {
								start.keypress(aperture.util.bind(keypress,this, callback))
									.change(aperture.util.bind(committed,this, callback));
							}

							if (end) {
								end.keypress(aperture.util.bind(keypress,this, callback))
									.change(aperture.util.bind(committed,this, callback));
							}

						},
						value : function(text) {
							if (!text) {
								if (operator.value() === IS) {
									var val;
									if (descriptor.propertyType === 'DATE') {
										if (moment(start.datepicker('getDate')).isValid()) {
											val = moment(start.datepicker('getDate')).format(constants.QUERY_DATE_FORMAT);
										} else {
											val = '';
										}
									} else {
										val = start.val();
									}
									if (val) {
										return descriptor.key + ':' + val;
									} else {
										return '';
									}
								} else {
									var startVal, endVal;
									if (descriptor.propertyType === 'DATE') {
										if (start) {
											if (moment(start.datepicker('getDate')).isValid()) {
												startVal = moment(start.datepicker('getDate')).format(constants.QUERY_DATE_FORMAT);
											} else {
												startVal = '';
											}
										} else {
											startVal = '*';
										}

										if (end) {
											if (moment(end.datepicker('getDate')).isValid()) {
												endVal = moment(end.datepicker('getDate')).format(constants.QUERY_DATE_FORMAT);
											} else {
												endVal = '';
											}
										} else {
											endVal = '*';
										}
									} else {
										startVal = start ? start.val() : '*';
										endVal = end ? end.val() : '*';
									}
									if (startVal || endVal) {
										return descriptor.key + ':[' + (startVal ? startVal : '*') + ' TO ' + (endVal ? endVal : '*') + ']';
									} else {
										return '';
									}
								}
							} else {
								var match = /([^:\s]+):(.+?)\s*$/.exec(text||'');
								var value, key;

								if (match != null) {
									key = match[1];

									if (key === descriptor.key) {
										value = match[2];
										if (value.charAt(0) === '"') {
											value = value.substring(1, value.length - 1);
										}
									} else {
										aperture.log.error('key does not match descriptor in advanced search term');
									}
								}

								if (value) {
									var chunks = value.substring(value.indexOf('[') + 1, value.indexOf(']')).split(' TO ');

									if (!chunks[0]) {
										// Not a range
										operator.value(IS);

										_createElements();

										if (descriptor.propertyType === 'DATE') {
											start.datepicker('setDate', moment(value, constants.QUERY_DATE_FORMAT).toDate());
										} else {
											start.val(value);
										}
									} else {
										// Range
										var startString = chunks[0];
										var hasStart = false;
										var hasEnd = false;
										if (startString && startString !== '*') {
											hasStart = true;
										}
										var endString = chunks[1];
										if (endString && endString !== '*') {
											hasEnd = true;
										}

										if (hasStart && hasEnd) {
											operator.value(BETWEEN);
										} else if (hasStart) {
											operator.value(GREATER_THAN);
										} else {
											operator.value(LESS_THAN);
										}

										_createElements();

										if (hasStart) {
											if (descriptor.propertyType === 'DATE') {
												start.datepicker('setDate', moment(startString, constants.QUERY_DATE_FORMAT).toDate());
											} else {
												start.val(startString);
											}
										}

										if (hasEnd) {
											if (descriptor.propertyType === 'DATE') {
												end.datepicker('setDate', moment(endString, constants.QUERY_DATE_FORMAT).toDate());
											} else {
												end.val(endString);
											}
										}
									}
								}
							}
						}
					};
				}

				/**
				 * add the ui for the value editor and return the value api
				 * TO DO: support customizations via plugin api
				 */
				function _valueUI(descriptor, parent, operator, boost) {
					operator.add('is');

					if (_fuzzyAllowed(descriptor)) {

						if (_advancedSearchFuzzyLevels == null) {
							operator.add('fuzzy', 'is ~like');
						} else {
							aperture.util.forEach(_advancedSearchFuzzyLevels, function(value, key) {
								operator.add('fuzzy_' + value, key);
							});
						}
					}

					operator.add('not', 'is NOT');

					function committed(changed) {
						changed.call(this, true);
					}
					function keypress(changed, e) {
						aperture.log.log({
							type: aperture.log.draperType.USER,
							workflow: aperture.log.draperWorkflow.WF_GETDATA,
							activity: 'enter_filter_text',
							description: 'Entering text into search criteria'
						});

						if (e.which) {
							changed.call(this, false);
						}
					}

					var val = $('<input class="advancedsearch-input"/>').appendTo(parent);

					// set from text or get as text
					return {
						validate : _typeValidators[descriptor.type],
						remove : function() {
							val.remove();
						},
						change : function(callback) {
							val.keypress(aperture.util.bind(keypress,this, callback))
								.change(aperture.util.bind(committed,this, callback));
						},
						value : function(text) {
							var weight = 0;
							var fuzzySimilarity = 0;
							var key;

							if (arguments.length !== 0) {
								var match = /([^:\s]+):(.+?)\s*$/.exec(text||'');
								var value = '';
								var not= false, fuzzy= false;

								if (match != null) {
									key = match[1];

									if ((not = (key.charAt(0) === '-'))) {
										key = key.substr(1);
									}

									if (key === descriptor.key) {
										value = match[2];

										var bmatch = /\^([\.0-9]+)$/.exec(value);
										if (bmatch != null) {
											weight = Number(bmatch[1]);

											if (!isNaN(weight) && weight > 0) {
												boost.value(weight);

												value = value.substring(0, value.length - bmatch[1].length - 1);
											}
										}

										if (value.charAt(0) === '"') {
											value = value.substring(1, value.length-1);
										} else if (!_advancedSearchFuzzyLevels) {
											fuzzy = true;
										}

										if (_advancedSearchFuzzyLevels != null) {

											var fmatch = /\~([\.0-9]+)$/.exec(value);
											if (fmatch != null) {
												fuzzySimilarity = Number(fmatch[1]);

												if (!isNaN(fuzzySimilarity) && fuzzySimilarity > 0) {
													value = value.substring(0, value.length - fmatch[1].length - 1);
												}
											}
										}
									} else {
										aperture.log.error('key does not match descriptor in advanced search term');
									}
								}

								if (not) {
									operator.value('not');
								} else if (fuzzySimilarity > 0) {
									operator.value('fuzzy_' + fuzzySimilarity);
								} else if (fuzzy) {
									operator.value('fuzzy');
								} else {
									operator.value('is');
								}

								val.val(value);

							} else {
								var inputValue = val.val();

								text = '';
								if (inputValue !== '') {
									key = descriptor.key;
									if (operator.value() === 'not') {
										text += '-' + key + ':' + inputValue;
									} else if (operator.value() === 'fuzzy') {
										text += key + ':' + inputValue + '~';
									} else if (operator.value().indexOf('fuzzy_') !== -1) {
										var fuzz = Number(operator.value().substring('fuzzy_'.length, operator.value().length));
										text += key + ':' + inputValue  + '~' + fuzz;
									} else {
										text += key + ':"' + inputValue + '"';
									}

									weight = boost.value();

									if (weight !== 1) {
										text += '^' + weight;
									}
								}

								return text;
							}
						}
					};
				}

				function _boostUI(parent) {
					var _boost= 0;
					var api;

					// don't show the ui in this case.
					if (!_supportsWeight) {
						api = {
							value : function(boost) {
								if (arguments.length !== 0) {
									_boost = boost;
								} else {
									return _boost;
								}
							},
							change: function(callback) {
								return this;
							}
						};

					} else {
						var set = $('<div class="advancedsearch-boost"></div>')
							.appendTo(parent);

						xfUtil.makeTooltip(set, 'boost the weight of this criteria');

						api =  {
							value : function(boost) {
								var kids = set.children();
								if (arguments.length !== 0) {
									if (_boost !== boost) {
										_boost = boost;
										var i = Math.ceil(boost);
										var selected = kids.filter(function() {
											var x = Number($(this).attr('id'));
											return x <= i;
										});

										selected.addClass('advancedsearch-boost-selected');
										kids.not(selected).removeClass('advancedsearch-boost-selected');
									}
								} else {
									return _boost;
								}
							},

							change : function(callback) {
								set.on(CUSTOM_JQUERY_EVENT, aperture.util.bind(callback,this));
								return this;
							}
						};

						var highlight = function(elem) {
							var i = Number($(elem).attr('id'));
							var kids = set.children();
							var selected = kids.filter(function() {
								var x = Number($(this).attr('id'));
								return x <= i;
							});

							selected.addClass('advancedsearch-boost-hover');
							kids.not(selected).removeClass('advancedsearch-boost-hover');
						};

						var down = false;

						[1,2,3,4,5].forEach(function(i) {
							$('<span class="advancedsearch-boost-one"></span>')
								.attr('id', String(i))
								.appendTo(set)
								.hover(function() {
									highlight(this);
								})
								.mousedown(function(e) {
									down = true;
									e.preventDefault();
									e.stopImmediatePropagation();
								})
								.mouseup(function() {
									if (down) {
										down = false;
										var level = Number($(this).attr('id'));
										api.value(level);

										aperture.log.log({
											type: aperture.log.draperType.USER,
											workflow: aperture.log.draperWorkflow.WF_GETDATA,
											activity: 'select_filter_menu_option',
											description: 'Boosting criteria',
											data: {
												level : level
											}
										});
									}
								});
						});

					}

					api.value(1);
					return api;
				}

				var _descriptorHasTag = function(descriptor, tag) {
					if (descriptor.tags) {
						for (var i = 0; i < descriptor.tags.length; i++) {
							if (descriptor.tags[i] === tag) {
								return true;
							}
						}
					}

					return false;
				};

				/**
				 * Enables the field choices specified.
				 */
				function _enableMultiVal(allow) {
		//			if (allow) {
		//				$('.advancedsearch-param').css('color','');
		//			} else {
					_UIObjectState.canvas.find('.advancedsearch-paramchoice').each(function(i, elem) {
						var key = $(elem).val();

						_UIObjectState.canvas.find('.advancedsearch-param[value="' +key+ '"]')
							.not(':selected').css('color','#aaa');
					});
//			}
				}

				/**
				 * Creates a field selector
				 */
				function _fieldSelector(descriptors, descriptor) {
					return $(fieldSelectorTemplate(descriptors)).val(descriptor.key);
				}

				/**
				 * Enables the field choices specified.
				 */
				function _removeButton() {

					var removeButton = $('<div class="advancedsearch-remove-button"></div>');
					xfUtil.makeTooltip(removeButton, 'remove this criteria');

					return removeButton;
				}

				var allowMultival = false;

				return {

					/**
					 * @returns the criteria list.
					 */
					list: function () {
						var ui;
						ui = [];

						_UIObjectState.canvas.find('.advancedsearch-criteria').each(function (i, elem) {
							ui.push($(elem).data('api'));
						});

						return ui;
					},

					/**
					 * Sets or gets the option which specifies whether multiple values
					 * are allowed for the same field.
					 */
					multival: function (allow) {
						if (arguments.length !== 0) {
							if (allowMultival !== allow) {
								allowMultival = allow;

								_enableMultiVal(allow);
							}

							return this;
						}

						return allowMultival;
					},

					/**
					 * Sets or gets the option which specifies whether weight editing is allowed.
					 */
					weighted: function (allow) {
						_supportsWeight = allow;

						if (arguments.length !== 0) {
							_supportsWeight = allow;

							return this;
						}

						return _supportsWeight;
					},

					/**
					 * Creates a new criteria ui and appends it to the canvas.
					 *
					 * @param descriptors
					 *  the list of descriptors provided by the custom search implementation.
					 *
					 * @param descriptor
					 *  the selected descriptor
					 *
					 * @returns Object
					 *  an interface to the new criteria object.
					 */
					add: function (descriptors, descriptor) {
						var _ui = $('<div></div>')
							.addClass('advancedsearch-criteria')
							.appendTo(_UIObjectState.canvas)
							.append(_removeButton().click(function () {
								api.remove();

								aperture.log.log({
									type: aperture.log.draperType.USER,
									workflow: aperture.log.draperWorkflow.WF_GETDATA,
									activity: 'select_filter_menu_option',
									description: 'Criteria removed'
								});
							}));

						// set up wrapper callbacks
						function changed(committed) {
							_ui.trigger(CUSTOM_JQUERY_EVENT, [committed]);
						}

						function onChange(callback, e, committed) {
							callback.call(this, committed);
						}

						var boost = _boostUI(_ui).change(aperture.util.bind(changed, this, true));

						var _left = $('<div></div>')
							.addClass('advancedsearch-criteria-left')
							.appendTo(_ui);
						var _right = $('<div></div>')
							.addClass('advancedsearch-criteria-right')
							.css('margin-right', _supportsWeight ? 75 : 25)
							.appendTo(_ui);


						var _privates = {key: descriptor.key};
						var api = null;

						function onFieldSelectorChange() {
							var descriptor = null;
							for (var i = 0; i < descriptors.length && descriptor === null; i++) {
								if (descriptors[i].key === $(this).val()) {
									descriptor = descriptors[i];
								}
							}
							_privates.key = descriptor.key;
							_privates.operator.clear();
							_privates.editor.remove();

							if (_descriptorHasTag(descriptor, 'DATE') || _descriptorHasTag(descriptor, 'AMOUNT')) {
								_privates.editor = _rangeUI(descriptor, _right, _privates.operator);
							} else {
								_privates.editor = _valueUI(descriptor, _right, _privates.operator, boost);
							}

							_privates.editor.change(changed);

							if (!constants.UNIT_TESTS_ENABLED) {
								aperture.log.log({
									type: aperture.log.draperType.USER,
									workflow: aperture.log.draperWorkflow.WF_GETDATA,
									activity: 'select_filter_menu_option',
									description: 'Criteria field changed',
									data: {
										field: descriptor.friendlyText ? descriptor.friendlyText : descriptor.key
									}
								});
							}
						}

						// create the field selector.
						var fieldSelector = _fieldSelector(descriptors, descriptor)
							.appendTo(_left)
							.change(onFieldSelectorChange);

						// create the editor
						_privates.operator = _constraintUI(_left).change(aperture.util.bind(changed, this, true));

						if (_descriptorHasTag(descriptor, 'DATE') || _descriptorHasTag(descriptor, 'AMOUNT')) {
							_privates.editor = _rangeUI(descriptor, _right, _privates.operator);

						} else {
							_privates.editor = _valueUI(descriptor, _right, _privates.operator, boost);
						}

						_privates.editor.change(changed);

						// strip this out from the options in others.
						if (!allowMultival) {
							_enableMultiVal(false);
						}

						api = {

							/**
							 * @returns the key of the descriptor being edited.
							 */
							key: function () {
								return _privates.key;
							},

							/**
							 * Gets or sets the value
							 *
							 * @param [text] the value
							 * @returns the value.
							 */
							value: function (text) {
								if (arguments.length !== 0) {
									_privates.editor.value(text);
									return this;

								} else {
									return _privates.editor.value();
								}
							},

							/**
							 * Validates and returns true if valid, else false.
							 * An implementation may choose to modify the content in this
							 * call to make it valid (for instance, reformatting a date).
							 *
							 * @returns
							 */
							validate: function () {
								return _privates.editor.validate();
							},

							/**
							 * Sets a callback to receive change notifications.
							 * This method will take a single callback only.
							 */
							change: function (callback) {
								if (callback) {
									_ui.on(CUSTOM_JQUERY_EVENT, aperture.util.bind(onChange, this, callback));
								} else {
									_ui.trigger(CUSTOM_JQUERY_EVENT);
								}
								return this;
							},

							/**
							 * Removes the ui from the canvas.
							 */
							remove: function () {
								_ui.remove();
							}
						};
						if (constants.UNIT_TESTS_ENABLED) {
							api['getElement'] = function() { return _ui; };
							api['getFieldSelector'] = function() { return fieldSelector; };
							api['onFieldSelectorChange'] = function(paramChoice) { onFieldSelectorChange.call(paramChoice); };
							api['getEditor'] = function() { return _privates.editor; };
						}

						_ui.data('api', api);

						return api;
					}
				};
			}
		};
	}
);
