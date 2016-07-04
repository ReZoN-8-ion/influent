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
		'lib/constants'
	],
	function(
		constants
	) {

		var NAME_VALUE_PATTERN = '([^:\\s]+):\\s*([^:]+[^\\s])(\\s|$)';
		
		//--------------------------------------------------------------------------------------------------------------

		/**
		 *
		 * @param searchString
		 * @returns {*}
		 */
		function parse(searchString) {
			var matchNameValue = new RegExp(NAME_VALUE_PATTERN, 'g'),
				match;
			
			// match pattern fieldname:[-]["]one two["|~#.#][^#]
			// - = not
			// " = exact match
			// ~ = fuzzy match, with threshold #.#
			// ^ = boost importance, with weight #
			if (searchString.indexOf(':') !== -1) {
				var list = [], 
					key,
					value,
					not,
					boost,
					fuzzy,
					quoted,
					suffix;
				
				while ((match = matchNameValue.exec(searchString)) !== null) {
					key = match[1];
					
					if ((not =(key.charAt(0) === '-')) === true) {
						key = key.substr(1);
					}

					value = match[2];
					suffix = value.match(/\^([\.0-9]+)$/);
					
					if (suffix) {
						value = value.substr(0, value.length - suffix[0].length);
						boost = Number(suffix[1]) || null;
					} else {
						boost = null;
					}
					
					suffix = value.match(/\~([\.0-9]+)$/);
					
					if (suffix) {
						value = value.substr(0, value.length - suffix[0].length);
						fuzzy = Number(suffix[1]) || null;
					} else {
						fuzzy = null;
					}

					if ((quoted = (value.charAt(0) === '"' && value.charAt(value.length-1) === '"')) === true) {
						value = value.substr(1, value.length-2);
					}
					
					list.push({
						key: key,
						not: not,
						boost: boost,
						fuzzy: fuzzy,
						quoted : quoted,
						value: value
					});
					
				}
				
				return list;
			}
			
			return [{key: '*', value: searchString}];
		}

		//--------------------------------------------------------------------------------------------------------------

		/**
		 * Create ordered list of snippet key/value pairs from raw property data.
		 *
		 * @param response
		 * @returns {{getTypesFromCriteriaList: getTypesFromCriteriaList, getIntersectingProperties: getIntersectingProperties, getIntersectingPropertiesMap: getIntersectingPropertiesMap, getEntityType: getEntityType, getEntityTypes: getEntityTypes, getTransactionTypes: getTransactionTypes, getMatchingTerms: getMatchingTerms, getTypeMap: Function}}
		 */
		function create(response) {

			var _propertyMap = {};
			var _typeMap = {};
			var _orderByList = [];
			var _searchHint = response.searchHint;
			
			aperture.util.forEach(response.types, function(property) {
				_typeMap[property.key] = property;
			});

			aperture.util.forEach(response.properties, function(property, idx) {
				property.order = idx;
				_propertyMap[property.key] = property;
				
				aperture.util.forEach(property.typeMappings, function(key, type) {
					if (!_typeMap[type].properties) {
						_typeMap[type].properties = {};
					}
					_typeMap[type].properties[property.key] = property;
				});
			});

			_orderByList = response.orderBy;

			//----------------------------------------------------------------------------------------------------------

			function hasAllProperties(object, stringArray) {
				var bHasAllProperties = true;
				if (stringArray && stringArray.length > 0) {
					for (var i = 0; i < stringArray.length && bHasAllProperties; i++) {
						bHasAllProperties &= object.hasOwnProperty(stringArray[i]);
					}
				}
				return bHasAllProperties;
			}

			//----------------------------------------------------------------------------------------------------------

			function getIntersectingProperties(typeArray) {
				var props = [];
				for (var key in _propertyMap) {
					if (_propertyMap.hasOwnProperty(key)) {
						if (hasAllProperties(_propertyMap[key].typeMappings, typeArray)) {
							props.push(_propertyMap[key]);
						}
					}
				}
				return props;
			}

			//----------------------------------------------------------------------------------------------------------

			function getSortableIntersectingProperties(typeArray) {
				var props = [];
				for (var key in _propertyMap) {
					if (_propertyMap.hasOwnProperty(key)) {
						if (hasAllProperties(_propertyMap[key].typeMappings, typeArray) && _propertyMap[key].sortable) {
							props.push(_propertyMap[key]);
						}
					}
				}

				//Add SCORE order property
				props.push({key: 'MATCH'});

				return props;
			}

			//----------------------------------------------------------------------------------------------------------

			function getOrderByList() {
				return _orderByList;
			}

			//----------------------------------------------------------------------------------------------------------

			function getTypesFromCriteriaList(properties) {
				function intersectTypeList(source,input) {
					if (source.length === 0) {
						return input;
					} else {
						return source.filter(function(str) {
							return input.indexOf(str) !== -1;
						});
					}
				}


				var types = [];
				for (var i = 0; i < properties.length; i++) {
					var property = _propertyMap[properties[i].key];
					if (!property) {
						continue;
					}

					var typeMappingsForProperty = property.typeMappings;
					var typeListForProperty = [];
					for (var key in typeMappingsForProperty) {
						if (typeMappingsForProperty.hasOwnProperty(key)) {
							typeListForProperty.push(key);
						}
					}
					types = intersectTypeList(types,typeListForProperty);
				}
				return types;
			}

			//----------------------------------------------------------------------------------------------------------
			function getIntersectingPropertiesMap(typeArray) {
				var props = {};
				for (var key in _propertyMap) {
					if (_propertyMap.hasOwnProperty(key)) {
						if (hasAllProperties(_propertyMap[key].typeMappings, typeArray)) {
							props[key] = _propertyMap[key];
						}
					}
				}
				return props;
			}

			//----------------------------------------------------------------------------------------------------------

			function getEntityType(entity) {
				return entity && entity.uid && entity.uid.split('.')[1];
			}

			//----------------------------------------------------------------------------------------------------------

			function getEntityTypes(entities) {
				var types = {};

				for (var i = 0; i < entities.length; i++) {
					var type = this.getEntityType(entities[i]);
					if (type) {
						types[type] = true;
					}
				}

				var typeArray = [];
				for (var typeKey in types) {
					if (types.hasOwnProperty(typeKey)) {
						typeArray.push(typeKey);
					}
				}

				return typeArray;
			}

			//----------------------------------------------------------------------------------------------------------

			function getTransactionTypes(transactions) {
				var types = {};

				for (var i = 0; i < transactions.length; i++) {
					var type = transactions[i].type;
					if (type) {
						types[type] = true;
					}
				}

				var typeArray = [];
				for (var typeKey in types) {
					if (types.hasOwnProperty(typeKey)) {
						typeArray.push(typeKey);
					}
				}

				return typeArray;
			}
			
			//----------------------------------------------------------------------------------------------------------

			function getMatchingTerms(searchString, entity) {
				var terms = parse(searchString);
				var type = this.getEntityType(entity);
				
				if (type) {
					var map= _typeMap[type];
					if (map) {
						map = map.properties;

						terms = terms.filter(function(term) {
							return term.key === '*' || map.hasOwnProperty(term.key);
						}).map(function(term) {
							if (term.key !== '*') {
								var mappedKey = map[term.key].typeMappings[type];
								if (mappedKey) {
									term.key = mappedKey;
								}
							}
							
							return term;
						});
					}
				}
				
				return terms;
			}

			//----------------------------------------------------------------------------------------------------------

			function getSearchHint() {
				return _searchHint;
			}

			//----------------------------------------------------------------------------------------------------------

			function getProperty(key) {
				if (_propertyMap.hasOwnProperty(key)) {
					return _propertyMap[key];
				} else {
					return undefined;
				}
			}

			//----------------------------------------------------------------------------------------------------------

			function getPropertiesByTags(tags) {
				var ret = [];
				var addedKeys = {};
				for (var propKey in _propertyMap) {
					if (_propertyMap.hasOwnProperty(propKey)) {
						var property = _propertyMap[propKey];
						if (property.tags) {
							for (var j = 0; j < property.tags.length; j++) {
								if (tags.indexOf(property.tags[j]) !== -1) {
									if (addedKeys[propKey] === undefined) {
										ret.push(property);
										addedKeys[propKey] = true;
									}
								}
							}
						}
					}
				}
				return ret;
			}

			//----------------------------------------------------------------------------------------------------------
			// public
			//----------------------------------------------------------------------------------------------------------

			var api = {
				getTypesFromCriteriaList : getTypesFromCriteriaList,
				getIntersectingProperties : getIntersectingProperties,
				getIntersectingPropertiesMap : getIntersectingPropertiesMap,
				getEntityType : getEntityType,
				getEntityTypes : getEntityTypes,
				getTransactionTypes : getTransactionTypes,
				getMatchingTerms : getMatchingTerms,
				getSearchHint : getSearchHint,
				getProperty : getProperty,
				getOrderByList : getOrderByList,
				getPropertiesByTags : getPropertiesByTags,
				getSortableIntersectingProperties : getSortableIntersectingProperties,
				getTypeMap : function() { return _typeMap; },
				getNumTypes : function() {
					var typeKeys = Object.keys(_typeMap);
					return typeKeys.length;
				}
			};
			
			if (constants.UNIT_TESTS_ENABLED) {
				api.getPropertyMap = function() { return _propertyMap; };
			}
			
			return api;
		}

		//--------------------------------------------------------------------------------------------------------------
		
		return {
			create : create,
			parse: parse
		};
	}
);
