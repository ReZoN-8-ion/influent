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
		'lib/util/xfUtil',
		'lib/util/date',
		'moment'
	],
	function(
		constants,
		xfUtil,
		date,
		moment
	) {
		var SEPARATOR = ', ';
		var USD_FORMATTER = aperture.Format.getCurrencyFormat(0.01, '$');
		var AMT_FORMATTER = aperture.Format.getNumberFormat();

		var FORMATTERS = {
			'USD': function(value) {
				return USD_FORMATTER.format(value);
			}, 
			
			'AMOUNT': function(value) {
				return AMT_FORMATTER.format(value);
			}, 
			
			'DATE': function(value) {
				var m = moment(new Date(value));
				if (!m.isValid()) {
					m = moment(new Date(parseInt(value, 10)));   // If date is invalid, try it as a unix timestamp
				}

				if (m.hour() || m.minute() || m.second() || m.millisecond()) {
					return m.format(constants.DATE_FORMAT + ' ' + constants.TIME_FORMAT);
				} else {
					return m.format(constants.DATE_FORMAT);
				}

			}, 
			
			'GEO': function(value) {
				return value.text;
			},
			
			'IMAGE': function(value) {
				return '<a target="_blank" title="click to view full size" href="'+ value + '"><img src="' + value + '"/></a>';
			}
		};
		
		FORMATTERS.COUNT = FORMATTERS.AMOUNT;

		function formatter(property) {
			
			var tags = property.tags;

			// has precedence over the AMOUNT tag.
			if (tags.indexOf('USD') !== -1) {
				return FORMATTERS.USD;
			}

			var fn= FORMATTERS[getPropertyType(property)];
			if (fn) {
				return fn;
			}
			
			for (var i=0; i< tags.length; i++) {
				fn = FORMATTERS[tags[i]];
				if (fn) {
					return fn;
				}
			}
			
			return String;
		}

		function getPropertyType(property) {
			if (property.range != null) {
				return property.range.type;
			} else if (property.valueType != null) {
				return property.valueType;
			} else {
				return undefined;
			}
		}

		function getEntityURL(id) {
			return xfUtil.getViewURL(constants.VIEWS.ACCOUNTS.NAME) + '?query=' + encodeURIComponent('ENTITY:"' + id + '"');
		}
		
		return {
			getEntityCount: function(dataElement) {
				return (dataElement.accounttype === constants.ACCOUNT_TYPES.ENTITY) ? 1 : dataElement['properties'].count.value;
			},

			getValueByTag: function(dataElement, tag) {
				for (var propKey in dataElement.properties) {
					if (dataElement.properties.hasOwnProperty(propKey)) {
						var property = dataElement.properties[propKey];
						if (property.tags) {
							for (var j = 0; j < property.tags.length; j++) {
								if (property.tags[j] === tag) {
									return property.value; // handles singleton values only
								}
							}
						}
					}
				}
				return null;
			},

			getCommonPropertyKeysByTags: function(dataElements, tags) {
				var keyCounts = {};

				for (var i = 0; i < dataElements.length; i++) {
					var properties = this.getPropertiesByTags(dataElements[i], tags, true);
					for (var j = 0; j < properties.length; j++) {
						var key = properties[j].key;
						if (!keyCounts[key]) {
							keyCounts[key] = 0;
						}
						keyCounts[key] = keyCounts[key] + 1;

					}
				}

				var commonKeyArray = [];
				for (var commonKey in keyCounts) {
					if (keyCounts.hasOwnProperty(commonKey) && keyCounts[commonKey] === dataElements.length) {
						commonKeyArray.push(commonKey);
					}
				}
				return commonKeyArray;
			},

			getCommonPropertiesByTags: function(dataElements, tags, bCountryCodeGeo) {

				var isGeoEqual = function (geo1, geo2) {
					if (bCountryCodeGeo) {
						return geo1.cc === geo2.cc;
					} else {
						return _.isEqual(geo1, geo2);
					}
				};

				var commonKeys = this.getCommonPropertyKeysByTags(dataElements, tags);
				var commonProperties = {};
				var ignoredKeys = {};

				for (var i = 0; i < dataElements.length; i++) {
					var dataElement = dataElements[i];
					for (var key in dataElement.properties) {
						if (dataElement.properties.hasOwnProperty(key) && !ignoredKeys[key] && commonKeys.indexOf(key) !== -1) {
							if (!commonProperties[key]) {
								commonProperties[key] = dataElement.properties[key];
							} else {
								var commonValue = commonProperties[key].value;
								var currentValue = dataElement.properties[key].value;

								var bDiffers = dataElement.properties[key].tags.indexOf('GEO') !== -1 ? !isGeoEqual(commonValue, currentValue) : !_.isEqual(commonValue, currentValue);

								if (bDiffers || commonValue === '') {
									delete commonProperties[key];
									ignoredKeys[key] = true;
								}
							}
						}
					}
				}

				return commonProperties;
			},

			getPropertiesByTags: function(dataElement, tags, bIncludeKey) {
				if (dataElement == null ||
					tags == null
				) {
					return [];
				}

				var ret = [];
				var addedKeys = {};
				for (var propKey in dataElement.properties) {
					if (dataElement.properties.hasOwnProperty(propKey)) {
						var property = dataElement.properties[propKey];
						if (property.tags) {
							for (var j = 0; j < property.tags.length; j++) {
								if (tags.indexOf(property.tags[j]) !== -1) {
									if (addedKeys[propKey] === undefined) {
										if (bIncludeKey) {
											property.key = propKey;
										}
										ret.push(property);
										addedKeys[propKey] = true;
									}
								}
							}
						}
					}
				}
				return ret;
			},

			getPropertiesByValueType: function(dataElement, type) {
				var ret = [];

				for (var propKey in dataElement.properties) {
					if (dataElement.properties.hasOwnProperty(propKey)) {
						var property = dataElement.properties[propKey];
						if (property.range && property.range.type === type) {
							ret.push(property);
						}
					}
				}
				return ret;
			},

			getPropertiesByTag: function(dataElement, tag, bIncludeKey) {
				return this.getPropertiesByTags(dataElement, [tag], bIncludeKey);
			},

			getFirstPropertyByTagOrName: function(dataElement, tag, bIncludeKey) {
				var r = this.getPropertiesByTags(dataElement, [tag], bIncludeKey);
				
				return r && r.length && r.length > 0? r[0] : dataElement.properties[tag];
			},

			getTagFromProperty: function(property, tag) {
				var retTag = null;
				if (property.tags) {
					for (var i = 0; i < property.tags.length; i++) {
						if (property.tags[i] === tag) {
							retTag = property.tags[i];
							break;
						}
					}
				}
				return retTag;
			},

			isPropertyType: function(property, type) {
				for (var i = 0; i < property.tags.length; i++) {
					if (property.tags[i] === type) {
						return true;
					}
				}

				return false;
			},

			getFormattedValue: function(property, linkId, numDisplayVals) {
				var text = '', 
					n = 0,
					numVals,
					range = property.range,
					link = property.tags.indexOf('ENTITY') !== -1,
					fn = formatter(property),
					separator = (fn === FORMATTERS.IMAGE? ' ': SEPARATOR);

				if (property.hasOwnProperty('link') && typeof linkId === 'undefined') {
					linkId = property.link;
				}

				var getText = function(value, id) {
					if (link) {
						property.tags.push('HTML');
						return '<a href=' + getEntityURL(id) + '>' + fn(value) + '</a>';
					} else {
						return fn(value);
					}
				};

				// distribution or list?
				if (range) {
					var subset, id;
					if (range.rangeType === 'DISTRIBUTION' && range.distribution) {
						numVals = numDisplayVals && range.distribution.length > numDisplayVals ? numDisplayVals : range.distribution.length;
						for (n = 0; n < numVals; n++) {
							id = link ? linkId[n] : null;
							text += getText(range.distribution[n].range, id) + separator;
						}
						subset = numVals === range.distribution.length ? false : true;
					} else if (range.values) {
						numVals = numDisplayVals && range.values.length > numDisplayVals ? numDisplayVals : range.values.length;
						for (n = 0; n < numVals; n++) {
							id = link ? linkId[n] : null;
							text += getText(range.values[n], id) + separator;
						}
						subset = numVals === range.values.length ? false : true;
					}
					text = text.length !== 0? text.substr(0, text.length - separator.length) : '';
					text += subset ? '...' : '';

					return text;
				}
				
				// else normal
				return getText(property.value, linkId);
			},
			
			/**
			 * Create optionally ordered list of property term matches from raw property data.
			 */
			getPropertyTermMatches: function(properties, searchTerms, options) {
				var that = this,
					sort = options && options.sorted,
					plain = options && options.plainText,
					result = 
					properties.filter(function(prop) {
						
						// skip images in plain text request
						// skip hidden properties
						if ((plain && getPropertyType(prop) === 'IMAGE') || prop.isHidden) {
							return false;
						}
						
						var text = that.getFormattedValue(prop);

						// skip null or empty text
						return text != null && text.trim().length !== 0;
						
					}).map(function(prop, index) {
					
						
						// remove html characters for parsing.
						var text = that.getFormattedValue(prop),
							isHTML = prop.tags.indexOf('HTML') !== -1 || getPropertyType(prop) === 'IMAGE',
							plainText = xfUtil.removeSpecialCharacters(text, isHTML),
							matchCount = 0, 
							terms = null;
						
						// look for matches
						searchTerms.forEach(function(term) {
							if (term.key === '*' || term.key === prop.key) {
								var regex = new RegExp(term.value
									.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
									.replace(/\s/, '\\s'), 'gi'); // all, case insensitive
									
								var matches = plainText.match(regex);
								
								if (matches && matches.length) {
									matchCount += matches.length;
									if (terms) {
										terms.push(term.value);
									} else {
										terms = [term.value];
									}
								}
							}
						});
						
						return {
							index: index,
							key: prop.key,
							friendlyText : prop.friendlyText,
							value: plain? plainText : text,
							isHTML : isHTML && !plain,
							matchTerms: terms,
							matchCount: matchCount,
							tags: prop.tags,
							uncertainty: prop.uncertainty,
							provenance: prop.provenance
						};
							
					// sort descending based on match count, longest string, original index
					});

				if (sort) {
					result.sort(function (i, j) {
						if (i.matchCount > j.matchCount) {
							return -1;
						} else if (i.matchCount < j.matchCount) {
							return 1;
						} else {
							return i.index - j.index;
						}
					});
				}
				
				return result;
			}

		};
	}
);
