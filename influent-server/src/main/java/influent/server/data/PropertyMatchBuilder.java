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

package influent.server.data;

import influent.idl.FL_BoundedRange;
import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_Constraint;
import influent.idl.FL_ListRange;
import influent.idl.FL_OrderBy;
import influent.idl.FL_PropertyDescriptor;
import influent.idl.FL_PropertyDescriptors;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_PropertyType;
import influent.idl.FL_RequiredPropertyKey;
import influent.idl.FL_ReservedPropertyKey;
import influent.idl.FL_SearchableBy;
import influent.idl.FL_SingletonRange;
import influent.idl.FL_TypeMapping;
import influent.server.utilities.InfluentId;

import org.apache.avro.AvroRemoteException;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import org.joda.time.DateTime;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PropertyMatchBuilder {

	protected Map<String, List<FL_PropertyMatchDescriptor>> _descriptorMap = new HashMap<String, List<FL_PropertyMatchDescriptor>>();

	private String _matchType = null;
	private List<String> _dataTypes = null;
	private List<FL_OrderBy> _orderBy = null;
	private FL_ClusteringDataAccess _clusterDataAccess;

	private boolean _isLinkSearch = false;
	private boolean _isMultiType = false;

	static final Pattern freeTextRegEx =        Pattern.compile("\\A([^:]*)(\\s*$| [^:\\s]+:.*)");
	static final Pattern termRegEx =            Pattern.compile("([^:\\s]+):(\"([^\"]*)\"|[^:]*)( |$)");
	static final Pattern boostPattern =         Pattern.compile("\\^([\\.0-9]+)$");
	static final Pattern quotePattern =         Pattern.compile("((?<![\\\\])\")((?:.(?!(?<![\\\\])\\1))*.?)\\1");
	static final Pattern rangePattern =         Pattern.compile("\\[(.*)?\\s(?:TO|to)\\s(.*)?\\]");
	static final Pattern similarityPattern =    Pattern.compile("~([\\.0-9]+)?$");

	static final DateTimeFormatter dateFormatter = DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

	public PropertyMatchBuilder(String query,
	                            FL_PropertyDescriptors descriptors,
	                            boolean isLinkSearch,
	                            boolean isMultiType) {
		this(query, descriptors, null, isLinkSearch, isMultiType);
	}

	public PropertyMatchBuilder(String query,
	                            FL_PropertyDescriptors descriptors,
	                            FL_ClusteringDataAccess clusterDataAccess,
	                            boolean isLinkSearch,
	                            boolean isMultiType) {

		_isLinkSearch = isLinkSearch;
		_isMultiType = isMultiType;
		_clusterDataAccess = clusterDataAccess;

		// Special Terms
		Set<String> specialTermSet = _parseSpecialTags(termRegEx, query.trim(), descriptors);

		// Regular Terms
		Matcher termMatcher = termRegEx.matcher(query.trim());
		while (termMatcher.find()) {
			String termName = termMatcher.group(1).toString().trim();

			if (specialTermSet.contains(termName)) {
				continue;
			}

			String termValue = termMatcher.group(2).toString().trim();

			_parseTerm(termName, termValue, descriptors);
		}

		// Free text terms
		Matcher freeTextMatcher = freeTextRegEx.matcher(query);
		while (freeTextMatcher.find()) {
			String termValue = freeTextMatcher.group(1).toString().trim();

			_parseTerm(null, termValue, descriptors);
		}
	}

	public PropertyMatchBuilder(JSONObject pmdMap,
					            boolean isLinkSearch,
	                            boolean isMultiType) throws JSONException {
		
		_isLinkSearch = isLinkSearch;
		_isMultiType = isMultiType;
		
		for (String type : JSONObject.getNames(pmdMap)) {
			JSONArray pmds = pmdMap.getJSONArray(type);
			List<FL_PropertyMatchDescriptor> termList = new ArrayList<FL_PropertyMatchDescriptor>();
			for (int i = 0; i < pmds.length(); i++) {			
				// Start a term builder
				FL_PropertyMatchDescriptor.Builder termBuilder = FL_PropertyMatchDescriptor.newBuilder();
				JSONObject jObj = pmds.getJSONObject(i);
				if (!jObj.has("key") || !jObj.has("range")) {
					continue;
				}

				termBuilder.setKey(jObj.getString("key"));

				if (jObj.has("typeMappings")) {
					JSONArray jsonTypeMaps = jObj.getJSONArray("typeMappings");
					//TODO handle list range
					JSONObject rangeObj = jObj.getJSONObject("range");
					
					String key = jObj.getString("key");
					
					List<FL_TypeMapping> typeMaps = new ArrayList<FL_TypeMapping>();
					//We should only have one type map here
					for (int j = 0; j < jsonTypeMaps.length(); j++) {
						JSONObject typeMap = jsonTypeMaps.getJSONObject(j);
						
						FL_TypeMapping.Builder typeMapBuilder = FL_TypeMapping.newBuilder();
						typeMapBuilder.setMemberKey(typeMap.getString("memberKey"));
						typeMapBuilder.setType(typeMap.getString("type"));
						typeMaps.add(typeMapBuilder.build());
					}
					
					if (typeMaps.size() < 1) {
						continue;
					}
						
					termBuilder.setTypeMappings(typeMaps);
					
					List<Object> values = new ArrayList<Object>(Arrays.asList(rangeObj.getString("value")));
					
					if (key.equals(FL_RequiredPropertyKey.FROM.name()) ||
						key.equals(FL_RequiredPropertyKey.TO.name()) ||
						key.equals(FL_RequiredPropertyKey.ENTITY.name()) ||
						key.equals(FL_RequiredPropertyKey.ID.name()) ||
						key.equals(FL_RequiredPropertyKey.LINKED.name())) {
						
						values = processIds(values, typeMaps.get(0));

					}
					
					if (values.size() == 0) {
						// Stripped out all the values? Throw it out
						continue;
					} else if (values.size() == 1) {
						// Singletons
						termBuilder.setRange(FL_SingletonRange.newBuilder()
								.setType(FL_PropertyType.valueOf(rangeObj.getString("type")))
								.setValue(values.get(0))
								.build());
					} else {
						// Lists
						termBuilder.setRange(FL_ListRange.newBuilder()
								.setType(FL_PropertyType.valueOf(rangeObj.getString("type")))
								.setValues(new ArrayList<Object>(values)).build());
					}
				}

				//Populate the rest of the term, using default values if needed
				if (jObj.has("constraint")) {
					FL_Constraint con = FL_Constraint.valueOf(jObj.getString("constraint"));
					termBuilder.setConstraint(con);
				} else {
					termBuilder.setConstraint(FL_Constraint.OPTIONAL_EQUALS);
				}

				if (jObj.has("variable")) {
					termBuilder.setVariable(jObj.getString("variable"));
				} else {
					termBuilder.setVariable("");
				}

				if (jObj.has("weight")) {
					termBuilder.setWeight((float)jObj.getInt("weight"));
				} else {
					termBuilder.setWeight(new Float(1));
				}

				if (jObj.has("similarity")) {
					termBuilder.setWeight((float)jObj.getInt("similarity"));
				} else {
					termBuilder.setSimilarity(new Float(1));
				}

				if (jObj.has("include")) {
					termBuilder.setInclude(jObj.getBoolean("include"));
				} else {
					termBuilder.setInclude(true);
				}
				
				termList.add(termBuilder.build());
			}
			//Add descriptor to map
			_descriptorMap.put(type, termList);
		}
	}


	private Set<String> _parseSpecialTags(Pattern regex, String term, FL_PropertyDescriptors descriptors) {
		Matcher specialTagsMatcher = regex.matcher(term.trim());
		Set<String> specialTags = new HashSet<String>();
		while (specialTagsMatcher.find()) {
			
			String tagName = specialTagsMatcher.group(1).toString().trim();
			
			if (tagName.equals(FL_ReservedPropertyKey.TYPE.name())) {
				String dataType = specialTagsMatcher.group(2).toString().trim();
				dataType = dataType.replace("\"", "");
				dataType = dataType.trim();
				if (this._dataTypes == null) {
					this._dataTypes = new ArrayList<String>();
				}
				this._dataTypes.add(dataType);
				specialTags.add(FL_ReservedPropertyKey.TYPE.name());
				continue;
			}
			
			if (tagName.equals(FL_ReservedPropertyKey.MATCH.name())) {
				String matchTypeString = specialTagsMatcher.group(2).toString().trim();
				if (matchTypeString != null) {
					_matchType = matchTypeString;
				}
				_matchType = _matchType.replace("\"", "");
				_matchType = _matchType.trim();

				specialTags.add(FL_ReservedPropertyKey.MATCH.name());
				continue;
			}
			
			if (tagName.equals(FL_ReservedPropertyKey.ORDER.name())) {
				String order = specialTagsMatcher.group(2).toString().trim();
				if (order != null) {
					boolean asc= false;
					
					if (order.endsWith("^")) {
						asc = true;
						order = order.substring(0, order.length()-1);
					}
					
					order = order.replace("\"", "");
					order = order.trim();
					
					boolean canOrder = false;
					if (FL_ReservedPropertyKey.MATCH.name().equals(order)) {
						canOrder = true;
					} else {
						for (FL_PropertyDescriptor pd : descriptors.getProperties()) {
							String propertyKey = pd.getKey();
							if (propertyKey.equals(order)) {
								canOrder = pd.getSortable();
							}
						}
					}
					
					if (canOrder) {
						if (this._orderBy == null) {
							this._orderBy = new ArrayList<FL_OrderBy>();
						}
						
						this._orderBy.add(
							FL_OrderBy.newBuilder()
								.setAscending(asc)
								.setPropertyKey(order)
								.build());
						
						specialTags.add(FL_ReservedPropertyKey.ORDER.name());
					}
				}
				continue;
			}
			
		}
		return specialTags;
	}


	@SuppressWarnings("incomplete-switch")
	private boolean _typeCheckPropertyValue(FL_PropertyDescriptor pd, Object range) {

		Collection<Object> values = null;
		if (range instanceof FL_SingletonRange) {
			values = Collections.singleton(((FL_SingletonRange)range).getValue());
		} else if (range instanceof FL_ListRange) {
			values = ((FL_ListRange)range).getValues();
		}

		for (Object obj : values) {

			switch(pd.getPropertyType()) {
				case LONG: {
					Integer i = null;
					try {
						i = Integer.valueOf((String) obj);
					} catch (Exception e) {
					}

					if (i == null) {
						return false;
					}
					break;
				}
			}
		}

		return true;
	}
	
	private List<Object> processIds(List<Object> values, FL_TypeMapping typeMapping) {
		// Expand any leaf ids for transactions
		if (_isLinkSearch &&_clusterDataAccess != null) {

			int idListSize = values.size();
			for (int i = 0; i < idListSize; i++) {

				List<String> leafIds = null;
				String uid = (String)values.get(i);
				try {
					leafIds = _clusterDataAccess.getLeafIds(Collections.singletonList(uid), null, true);

					for (String id : leafIds) {
						if (!id.equals(uid)) {
							values.add(id);
						}
					}
				} catch (AvroRemoteException e) {
					e.printStackTrace();
				}
			}
		}

		for (ListIterator<Object> it = values.listIterator(); it.hasNext(); ) {
			String uid = (String)it.next();
			InfluentId tId = InfluentId.fromInfluentId(uid);
			String type = null;

			if (!_isLinkSearch) {
				type = tId.getIdType();
			}
			
			if (type == null || type.equals(typeMapping.getType())) {
				// This ID should be searched.
				if (_isMultiType) {
					it.set(tId.getTypedId());
				} else {
					it.set(tId.getNativeId());
				}
			} else {
				it.remove();
			}
		}
		return values;
	}


	private void _parseTerm(String termName, String termValue, FL_PropertyDescriptors descriptors) {

		if (termValue == null || termValue.isEmpty())
			return;

		boolean isQuoted = false;
		boolean isRange = false;
		boolean isFuzzy = false;
		boolean isNegation = false;

		// Start a term builder
		FL_PropertyMatchDescriptor.Builder termBuilder = FL_PropertyMatchDescriptor.newBuilder();


		boolean isFreeText = termName == null;

		if (!isFreeText) {

			// Negation
			if (termName.startsWith("-")) {
				termName = termName.substring(1);
				termBuilder.setInclude(false);
				isNegation = true;
			}
		}

		// Term Boosting
		Matcher boostMatch = boostPattern.matcher(termValue);
		if (boostMatch.find()) {
			String weightStr = boostMatch.group(1);

			try {
				Float weight= Float.valueOf(weightStr);
				termValue = termValue.substring(0, termValue.length()-weightStr.length()-1);

				termBuilder.setWeight(weight);

			} catch (Exception e) {
			}

		}

		// Fuzzy matching
		Matcher similarityMatch = similarityPattern.matcher(termValue);
		if (similarityMatch.find()) {
			String similarityStr = similarityMatch.group(1);

			try {
				Float similarity = similarityStr == null ? 0.5f : Float.valueOf(similarityStr);
				termValue = similarityMatch.group(1);

				termBuilder.setSimilarity(similarity);

				isFuzzy = true;

			} catch (Exception e) {
			}

		}


		// Quotes and ranges
		Matcher quoteMatch = quotePattern.matcher(termValue);
		Matcher rangeMatch = rangePattern.matcher(termValue);
		String rangeStart = null;
		String rangeEnd = null;

		if (quoteMatch.find()) {
			termValue = quoteMatch.group(2);
			isQuoted = true;
		}

		if (rangeMatch.find()) {
			isRange = true;
			rangeStart = rangeMatch.group(1);
			rangeEnd = rangeMatch.group(2);
		}

		// Constraints
		if (!isFuzzy && (isQuoted || isFreeText || isRange || isNegation)) {
			if (_matchType == null || _matchType.equalsIgnoreCase("any")) {
				termBuilder.setConstraint(FL_Constraint.OPTIONAL_EQUALS);
			} else {
				termBuilder.setConstraint(FL_Constraint.REQUIRED_EQUALS);
			}
		} else {
			if (_matchType == null || _matchType.equalsIgnoreCase("any")) {
				termBuilder.setConstraint(FL_Constraint.FUZZY_PARTIAL_OPTIONAL);
			} else {
				termBuilder.setConstraint(FL_Constraint.FUZZY_REQUIRED);
			}
		}

		// Match properties to Search Descriptors
		for (FL_PropertyDescriptor pd : descriptors.getProperties()) {
			String propertyKey = pd.getKey();
			if (propertyKey.equals(termName) || isFreeText) {

				for (FL_TypeMapping td : pd.getMemberOf()) {

					if (isFreeText && !FL_SearchableBy.FREE_TEXT.equals(pd.getSearchableBy())) {

						// If the term is freetext, but this isn't a freetext searchable property, continue;
						continue;
					} else if (_dataTypes != null &&
						!_dataTypes.contains(td.getType())) {

						// If the term doesn't match the given datatypes, then continue;
						continue;
					}

					termBuilder.setKey(pd.getKey());

					// Special handling for dates
					if (pd.getPropertyType() == FL_PropertyType.DATE) {

						// Dates become unfuzzied
						if (_matchType == null || _matchType.equalsIgnoreCase("any")) {
							termBuilder.setConstraint(FL_Constraint.OPTIONAL_EQUALS);
						} else {
							termBuilder.setConstraint(FL_Constraint.REQUIRED_EQUALS);
						}

						if (!isRange) {
							// Singleton dates become ranges across the whole 24h day
							DateTime date = new DateTime(termValue);
							rangeStart = dateFormatter.print(date.withTime(0, 0, 0, 0));
							rangeEnd = dateFormatter.print(date.withTime(23, 59, 59, 59));
							isRange = true;
						} else {
							if (!rangeStart.equals("*")) {
								DateTime startDate = new DateTime(rangeStart);
								rangeStart = dateFormatter.print(startDate.withTime(0, 0, 0, 0));               // From 0h on start date..
							}

							if (!rangeEnd.equals("*")) {
								DateTime endDate = new DateTime(rangeEnd);
								rangeEnd = dateFormatter.print(endDate.minusMillis(3));                         // .. to 23:59:59.997 exclusive of the end date (max SQL millisecond precision)
							}
						}
					}

					// Set the term value in the builder
					if (isRange) {
						termBuilder.setRange(FL_BoundedRange.newBuilder()
								.setStart(rangeStart)
								.setEnd(rangeEnd)
								.setInclusive(true)
								.setType(pd.getPropertyType())
								.build());
					} else {

						// freetext is comma/space delimited (as long as it's not quoted). Everything else is comma delimited.
						List<Object> values = new ArrayList<Object>(Arrays.asList(termValue.split(isFreeText && !isQuoted ? "(?<!\\\\)( |,)" : "(?<!\\\\),")));

						if (pd.getKey().equals(FL_RequiredPropertyKey.FROM.name()) ||
							pd.getKey().equals(FL_RequiredPropertyKey.TO.name()) ||
							pd.getKey().equals(FL_RequiredPropertyKey.ENTITY.name()) ||
							pd.getKey().equals(FL_RequiredPropertyKey.LINKED.name())) {
							
							values = processIds(values, td);

						}

						if (values.size() == 0) {
							// Stripped out all the values? Throw it out
							continue;
						} else if (values.size() == 1) {
							// Singletons
							termBuilder.setRange(FL_SingletonRange.newBuilder()
									.setType(pd.getPropertyType())
									.setValue(values.get(0))
									.build());
						} else {
							// Lists
							termBuilder.setRange(FL_ListRange.newBuilder()
									.setType(pd.getPropertyType())
									.setValues(new ArrayList<Object>(values)).build());
						}
					}

					if (isFreeText) {
						// Freetext, but not the correct type?
						if (!_typeCheckPropertyValue(pd, termBuilder.getRange())) {
							continue;
						}
					}

					termBuilder.setTypeMappings(Collections.singletonList(td));

					List<FL_PropertyMatchDescriptor> termList = _descriptorMap.get(td.getType());
					if (termList == null) {
						termList = new ArrayList<FL_PropertyMatchDescriptor>();
					}

					termList.add(termBuilder.build());

					_descriptorMap.put(td.getType(), termList);
				}
			}
		}

	}


	public Map<String, List<FL_PropertyMatchDescriptor>> getDescriptorMap() {
		return _descriptorMap;
	}


	/**
	 * @return the orderBy list
	 */
	public List<FL_OrderBy> getOrderBy() {
		return _orderBy;
	}

	
}
