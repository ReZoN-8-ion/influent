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
define([], function() {

		var createDescriptor = function(descriptors, prop, key, dataId) {
			var typeMappings = [];
			typeMappings.push({
				type: dataId.type,
				memberKey: prop.typeMappings[dataId.type]
			});

			var matchDescriptor = {
				key : key,
				range : {
					value: dataId.dataId,
					type: prop.propertyType
				},
				typeMappings : typeMappings
			};
			if (!descriptors.hasOwnProperty(dataId.type)) {
				descriptors[dataId.type] = [];
			}
			descriptors[dataId.type].push(matchDescriptor);
		};

		return {
			getIdDescriptors: function(dataIds, searchParams, key) {
				var descriptors = {};
				var matchKey;
				var prop;


				var descriptorProps = searchParams.getPropertiesByTags('ID');
				if (descriptorProps.length > 0) {
					prop = descriptorProps[0];
					matchKey = key ? key : prop.key;
				} else {
					return {};
				}

				for (var i = 0; i < dataIds.length; i++) {
					createDescriptor(descriptors, prop, matchKey, dataIds[i]);
				}

				return descriptors;
			},

			getLinkIdDescriptors: function(dataIds, searchParams) {
				var descriptors = {};

				var fromProp = searchParams.getProperty('FROM');
				var toProp = searchParams.getProperty('TO');
				if (!fromProp || !toProp) {
					return {};
				}

				for (var i = 0; i < dataIds.length; i++) {
					createDescriptor(descriptors, fromProp, fromProp.key, dataIds[i]);
					createDescriptor(descriptors, toProp, toProp.key, dataIds[i]);
				}

				return descriptors;
			},

			getQueryFromDescriptors : function(descriptors, searchType, searchParams) {
				var query = ''.concat('SEARCHTYPE:', searchType, ' ');
				var isMultitype = searchParams[searchType].getNumTypes() > 1;
				for (var type in descriptors) {
					if (descriptors.hasOwnProperty(type)) {
						for (var i = 0; i < descriptors[type].length; i++) {
							var desc = descriptors[type][i];
							query += ' ' + desc.key + ':"' + desc.range.value + '"';
							if (isMultitype) {
								query += ' TYPE:' + type + ' ';
							}
						}
					}
				}
				return query.trim();
			},

			/**
			 * We expect query to be in the format:
			 * SEARCHTYPE:searchtype ((key:keyvalue...) type:typevalue)...
			 */
			getDescriptorsFromQuery : function(query, searchParams) {
				var searchTypeRE = /SEARCHTYPE:(entities|links)( |$)/;
				var searchType = searchTypeRE.exec(query);
				if (searchType.length < 2) {
					aperture.log.error('getDescriptorsFromQuery: no search type specified');
					return {};
				}
				searchType = searchType[1];
				query = query.replace(searchTypeRE, '');

				var typeRE = /TYPE:[^:\s]+\s?/g;
				var typeTerms = query.match(typeRE);

				if (!typeTerms && searchParams[searchType].getNumTypes() === 1) {
					typeTerms = ['TYPE:' + Object.keys(searchParams[searchType].getTypeMap())[0]];
				}

				var descriptorSplit = query.split(typeRE).filter(function(elem) {return elem.length !== 0;});

				if (typeTerms.length !== descriptorSplit.length) {
					aperture.log.error('getDescriptorsFromQuery: has unmatched descriptors/typeMapping');
					return {};
				}

				var descriptorProps = searchParams[searchType].getPropertiesByTags('ID');
				var prop;
				if (descriptorProps.length > 0) {
					prop = descriptorProps[0];
				} else {
					return;
				}

				var matchDescriptorMap = {};
				for (var i = 0; i < descriptorSplit.length; i++) {
					var typeMappings = [];
					var type = typeTerms[i].trim().replace(/TYPE:/, '');
					typeMappings.push({
						type : type,
						memberKey : prop.typeMappings[type]
					});

					var terms = descriptorSplit[i].trim().split(' ');
					var matchDescriptors = [];
					for (var j = 0; j < terms.length; j++) {
						var reg = /([^:\s]+):(\"([^\"]*)\"|[^:]*)( |$)/gi;
						var res = reg.exec(terms[j]);
						var key = res[1];
						var value =  res[3] !== undefined ? res[3] : res[2];
						matchDescriptors.push({
							key : key,
							range : {
								value : value,
								type : prop.propertyType
							},
							typeMappings : typeMappings
						});
					}
					if (matchDescriptorMap.hasOwnProperty(type)) {
						matchDescriptorMap[type] = matchDescriptorMap[type].concat(matchDescriptors);
					} else {
						matchDescriptorMap[type] = matchDescriptors;
					}

				}

				return {
					searchType : searchType,
					matchDescriptorMap : matchDescriptorMap
				};
			}
		};
	}
);
