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
package influent.server.dataaccess;

import influent.idl.*;
import influent.idlhelper.PropertyDescriptorHelper;
import influent.idlhelper.PropertyMatchDescriptorHelper;
import influent.server.utilities.PropertyField;

import java.util.*;

/**
 */
public class SearchSolrHelper {

	/**
	 * Returns an OR'd series of Solr clauses to represent the map of terms specified.

	 * @param termMap
	 * @param propertyDescriptors
	 * @param fieldMapper
	 *
	 * @return
	 * 		The solr query string or null if not a valid query.
	 */
	public static String toSolrQuery(Map<String, List<FL_PropertyMatchDescriptor>> termMap, FL_PropertyDescriptors propertyDescriptors,  PropertyField.Provider fieldMapper) {

		StringBuilder query = new StringBuilder();
		boolean subsequentType = false;

		// Build the query by type
		for (Map.Entry<String, List<FL_PropertyMatchDescriptor>> entry : termMap.entrySet()) {

			// Create a query fragment for this type
			StringBuilder queryFragment = new StringBuilder();

			List<FL_PropertyMatchDescriptor> termsByType = entry.getValue();

			final List<FL_PropertyMatchDescriptor> orsAnds = new ArrayList<FL_PropertyMatchDescriptor>(termsByType.size());
			final List<FL_PropertyMatchDescriptor> nots = new ArrayList<FL_PropertyMatchDescriptor>(termsByType.size());
			
			// separate ors/ands from nots
			for (FL_PropertyMatchDescriptor term : termsByType) {
				(PropertyMatchDescriptorHelper.isExclusion(term)? nots : orsAnds).add(term);
			}
		
			// not valid
			if (orsAnds.isEmpty()) {
				return null;
			}

			// ORs / ANDs
			queryFragment.append(_getTermsFragment(orsAnds, entry.getKey(), propertyDescriptors, fieldMapper));
			
			// nots
			if (!nots.isEmpty()) {
				queryFragment.insert(0, "(");
				queryFragment.append(") AND ");
				queryFragment.append(_getTermsFragment(nots, entry.getKey(), propertyDescriptors, fieldMapper));
			}

			// Check fragment is not already in the query
			if (query.indexOf(queryFragment.toString()) == -1) {

				// bracket the fragment
				if (subsequentType) {
					query.append(" OR (");
				} else {
					query.append(" (");
					subsequentType = true;
				}

				// Add fragment to query
				query.append(queryFragment);

				query.append(") ");

			}
		}
		
		String solrGroupField = propertyDescriptors.getGroupField();
		if (solrGroupField != null) {
			String groupJoin = String.format("{!join from=%s to=%s}", solrGroupField, solrGroupField);
			query.insert(0, groupJoin);
		}

		return query.toString();
	}


	// Returns the solr query fragment for the property match descriptor
	private static String _getDescriptorFragment(String type, FL_PropertyMatchDescriptor descriptor, FL_PropertyDescriptors propertyDescriptors) {

		// Get MemberKey from descriptor using the appropriate type
		String memberKey = null;
		for (FL_TypeMapping mapping : descriptor.getTypeMappings()) {
			if (mapping.getType().equals(type)) {
				memberKey = mapping.getMemberKey();
				break;
			}
		}

		Collection<Object> values;
		boolean isRange = false;
		String start = "", end = "";

		final Object r = descriptor.getRange();

		if (r instanceof FL_SingletonRange) {
			values = Collections.singleton(((FL_SingletonRange)r).getValue());
		} else if (r instanceof FL_ListRange) {
			values = ((FL_ListRange)r).getValues();
		}  else if (r instanceof FL_BoundedRange) {
			isRange = true;
			start = (String)((FL_BoundedRange)r).getStart();
			end = (String)((FL_BoundedRange)r).getEnd();
			values = null;
		} else {
			values = null;
		}

		final StringBuilder s = new StringBuilder();

		// NOT
		if (PropertyMatchDescriptorHelper.isExclusion(descriptor)) {
			s.append("-");
		}

		s.append(memberKey);

		if (FL_Constraint.FUZZY_PARTIAL_OPTIONAL.equals(descriptor.getConstraint()) || FL_Constraint.FUZZY_REQUIRED.equals(descriptor.getConstraint())) {
			s.append(":(");

			for (Object value : values) {

				s.append("(");
				String valueStr = (String)value;
				String[] tokens = _escapeQueryChars(valueStr).split("\\s");
				for (int i = 0; i < tokens.length; i++) {
					if (tokens[i].length() == 0)
						continue;

					s.append(tokens[i]);
					s.append("~");
					if (descriptor.getSimilarity() != null)
						s.append(descriptor.getSimilarity());

					if (i < tokens.length - 1) {
						s.append(" AND ");
					}
				}
				s.append(") ");
			}

			s.append(")");

		} else if (isRange) {

			if (start.equals("*")) {
				s.append(String.format(":[* TO %s]", end));
			} else if (end.equals("*")) {
				s.append(String.format(":[%s TO *]", start));
			} else {
				s.append(String.format(":[%s TO %s]", start, end));
			}

		} else { // not | required / equals
			s.append(":(");

			for (Object value : values) {
				s.append("\"");
				s.append(value);
				s.append("\" ");
			}

			s.setLength(s.length()-1);
			s.append(")");
		}


		if (descriptor.getWeight() != null && descriptor.getWeight() != 1.0) {
			s.append("^");
			s.append(descriptor.getWeight());
		}

		return s.toString();
	}

	// Returns the solr query fragment for the from/to id pair
	static private String _getIdPairFragment(FL_PropertyMatchDescriptor fromTerm,
											 FL_PropertyMatchDescriptor toTerm,
											 String type,
											 FL_PropertyDescriptors propertyDescriptors,
											 String operation) {

		StringBuilder queryFragment = new StringBuilder();

		FL_PropertyMatchDescriptor fromEntityIDTerm = FL_PropertyMatchDescriptor.newBuilder(fromTerm)
				.setKey(FL_RequiredPropertyKey.FROM.name())
				.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder()
						.setType(type)
						.setMemberKey(PropertyDescriptorHelper.mapKey(FL_RequiredPropertyKey.FROM.name(), propertyDescriptors.getProperties(), type))
						.build()))
				.build();

		FL_PropertyMatchDescriptor toEntityIDTerm = FL_PropertyMatchDescriptor.newBuilder(toTerm)
				.setKey(FL_RequiredPropertyKey.TO.name())
				.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder()
						.setType(type)
						.setMemberKey(PropertyDescriptorHelper.mapKey(FL_RequiredPropertyKey.TO.name(), propertyDescriptors.getProperties(), type))
						.build()))
				.build();

		queryFragment.append("(");
		queryFragment.append(_getDescriptorFragment(type, fromEntityIDTerm, propertyDescriptors));
		queryFragment.append(" ");
		queryFragment.append(operation);                                            // AND/OR
		queryFragment.append(" ");
		queryFragment.append(_getDescriptorFragment(type, toEntityIDTerm, propertyDescriptors));
		queryFragment.append(") ");

		return queryFragment.toString();
	}

	// Returns the solr query fragment for the listed terms
	static private String _getTermsFragment(List<FL_PropertyMatchDescriptor> terms,
											String type,
											FL_PropertyDescriptors propertyDescriptors,
											PropertyField.Provider fieldMapper) {

		StringBuilder queryFragment = new StringBuilder();

		FL_PropertyMatchDescriptor entityIDTerm = null;
		FL_PropertyMatchDescriptor linkedIDTerm = null;

		boolean hasMultipleEntityIDs = false;
		boolean hasMultipleLinkedIDs = false;

		for (FL_PropertyMatchDescriptor term : terms) {
			if (term.getKey().equals(FL_RequiredPropertyKey.ENTITY.name())) {
				if (entityIDTerm != null) {
					hasMultipleEntityIDs = true;
				} else {
					entityIDTerm = term;
				}
			} else if (term.getKey().equals(FL_RequiredPropertyKey.LINKED.name())) {
				if (linkedIDTerm != null) {
					hasMultipleLinkedIDs = true;
				} else {
					linkedIDTerm = term;
				}
			}
		}

		// TODO: Handle cases where multiple ENTITY or LINKED terms have been specified. Currently throws an error
		if (hasMultipleEntityIDs && hasMultipleLinkedIDs) {
			//s_logger.error("Multiple ENTITY or LINKED terms specified");
			//return false;
		}

		// Test FROM propertyKey to see if ENTITY/LINKED keys for this term should be handled as a transactional to/from pairs, or as a single IDs.
		boolean handleEntityKeyAsTransaction = PropertyDescriptorHelper.find(FL_RequiredPropertyKey.FROM.name(), propertyDescriptors.getProperties()) != null;
		boolean handlePairedEntityKeys = (entityIDTerm != null && linkedIDTerm != null);

		// NOTE: constraints are currently only all OPTIONAL, or all REQUIRED
		FL_PropertyMatchDescriptor firstTerm = terms.get(0);
		String conjunction = " AND ";
		if (firstTerm.getConstraint().equals(FL_Constraint.OPTIONAL_EQUALS) || firstTerm.getConstraint().equals(FL_Constraint.FUZZY_PARTIAL_OPTIONAL)) {
			conjunction = " OR ";
		}

		for (int i = 0; i < terms.size(); i++) {

			FL_PropertyMatchDescriptor term = terms.get(i);


			if (handleEntityKeyAsTransaction &&
				(term.getKey().equals(FL_RequiredPropertyKey.ENTITY.name()) ||
				 term.getKey().equals(FL_RequiredPropertyKey.LINKED.name()))) {

				// Don't handle paired keys here. Do them at the end.
				if (handlePairedEntityKeys) {
					continue;
				}

				// If this is not the first term, prepend a conjunction.
				if (i != 0) {
					queryFragment.append(conjunction);
				}
				queryFragment.append(_getIdPairFragment(term, term, type, propertyDescriptors, "OR"));

			} else {

				List<PropertyField> fields = fieldMapper.getFields(term.getKey());

				// If this is not the first term, prepend a conjunction.
				if (i != 0) {
					queryFragment.append(conjunction);
				}

				if (fields != null) {
					final ArrayList <FL_PropertyMatchDescriptor> mirrors = new ArrayList<FL_PropertyMatchDescriptor>();
					for (PropertyField field : fields) {
						if (field.isSearchable()) {
							mirrors.add(
								FL_PropertyMatchDescriptor.newBuilder(term)
									.setKey(field.getKey())
									.setTypeMappings(field.getProperty().getMemberOf())
									.build()
							);
						}
					}

					if (!mirrors.isEmpty()) {
						if (mirrors.size() > 1) {
							queryFragment.append("(");
						}
						queryFragment.append(_getDescriptorFragment(type, mirrors.get(0), propertyDescriptors));

						for (int m = 1; m < mirrors.size(); m++) {
							queryFragment.append(" OR ");
							queryFragment.append(_getDescriptorFragment(type, mirrors.get(m), propertyDescriptors));
						}
						if (mirrors.size() > 1) {
							queryFragment.append(")");
						}
					}

				} else {
					queryFragment.append(_getDescriptorFragment(type, term, propertyDescriptors));
				}
			}

		}
		if (handlePairedEntityKeys) {
			queryFragment.append(conjunction);
			queryFragment.append("((");
			queryFragment.append(_getIdPairFragment(entityIDTerm, linkedIDTerm, type, propertyDescriptors, "AND"));
			queryFragment.append(") OR (");
			queryFragment.append(_getIdPairFragment(linkedIDTerm, entityIDTerm, type, propertyDescriptors, "AND"));
			queryFragment.append(")) ");
		}
		return queryFragment.toString();
	}

	/**
	 * See org.apache.solr.client.solrj.util.ClientUtils
	 * See: {@link org.apache.lucene.queryparser.classic queryparser syntax}
	 * for more information on Escaping Special Characters
	 */
	private static String _escapeQueryChars(String s) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			// These characters are part of the query syntax and must be escaped
			if (c == '\\' || c == '+' || c == '-' || c == '!'  || c == '(' || c == ')' || c == ':'
					|| c == '^' || c == '[' || c == ']' || c == '\"' || c == '{' || c == '}' || c == '~'
					|| c == '*' || c == '?' || c == '|' || c == '&'  || c == ';' || c == '/') {
				sb.append('\\');
			}
			sb.append(c);
		}
		return sb.toString();
	}
}

