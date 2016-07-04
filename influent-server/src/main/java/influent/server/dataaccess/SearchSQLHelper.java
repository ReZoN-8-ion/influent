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

import com.google.common.base.Predicate;
import com.google.common.collect.Iterables;
import influent.idl.*;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.LinkHelper;
import influent.idlhelper.PropertyDescriptorHelper;
import influent.idlhelper.PropertyHelper;
import influent.idlhelper.PropertyMatchDescriptorHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.sql.*;
import influent.server.utilities.InfluentId;
import influent.server.utilities.PropertyField;
import influent.server.utilities.SQLConnectionPool;
import org.apache.avro.AvroRemoteException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.Reader;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.*;

import static influent.server.configuration.ApplicationConfiguration.SystemPropertyKey.FIN_ENTITY;
import static influent.server.configuration.ApplicationConfiguration.SystemPropertyKey.FIN_LINK;

/**
 * Helper class to help create a SQL statement from a list of {@link FL_PropertyMatchDescriptor}s.
 * It's expected that this class will be extended in order to supply any special fields.
 *
 * @author cregnier
 *
 */
public class SearchSQLHelper {


	private static final Logger s_logger = LoggerFactory.getLogger(SearchSQLHelper.class);

	private static final int ID_BATCH_SIZE = 30;


	//----------------------------------------------------------------------

	protected final SQLBuilder _sqlBuilder;
	private final SQLConnectionPool _connectionPool;
	private final ApplicationConfiguration _applicationConfiguration;
	private Class<?> _helperType;
	private final boolean _isMultiType;

	//----------------------------------------------------------------------



	public SearchSQLHelper(
			SQLBuilder sqlBuilder,
			SQLConnectionPool connectionPool,
			ApplicationConfiguration applicationConfiguration,
	        Class<?> helperType
	) {
		_sqlBuilder = sqlBuilder;
		_connectionPool = connectionPool;
		_applicationConfiguration = applicationConfiguration;
		_helperType = helperType;
		_isMultiType = _applicationConfiguration.hasMultipleEntityTypes();
	}


	protected Logger getLogger() {
		return s_logger;
	}


	protected SQLBuilder getSQLBuilder() {
		return _sqlBuilder;
	}

	private FL_PropertyDescriptors getDescriptors() {
		if (_helperType == FL_Entity.class) {
			return _applicationConfiguration.getEntityDescriptors();
		} else {
			return _applicationConfiguration.getLinkDescriptors();
		}
	}

	private String _mapKey(String key, String type) {
		return PropertyDescriptorHelper.mapKey(key, getDescriptors().getProperties(), type);
	}

	private List<FL_OrderBy> _mapOrderBy(List<FL_OrderBy> orderBy, String type) {
		return PropertyDescriptorHelper.mapOrderBy(orderBy, getDescriptors().getProperties(), type);
	}


	/**
	 * Builds a {@link SQLFilter} for the given term that's treated as the given special field.
	 * @param term
	 * @param type
	 * @return
	 */
	public SQLFilter buildSpecialTermFilter(FL_PropertyMatchDescriptor term, String type) {
		SQLFilter filter = null;

		// Only handle ENTITY terms. ENTITY and LINKED pairs are processed in _buildSpecialIdPairs
		if (term.getKey().equals(FL_RequiredPropertyKey.ENTITY.name())) {
			FL_PropertyMatchDescriptor fromTerm = FL_PropertyMatchDescriptor.newBuilder(term)
				.setKey( FL_RequiredPropertyKey.FROM.name())
				.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(_mapKey(FL_RequiredPropertyKey.FROM.name(), type)).build()))
				.build();
			FL_PropertyMatchDescriptor toTerm = FL_PropertyMatchDescriptor.newBuilder(term)
				.setKey( FL_RequiredPropertyKey.TO.name())
				.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(_mapKey(FL_RequiredPropertyKey.TO.name(), type)).build()))
				.build();

			filter = _sqlBuilder.or(_buildFilterColumn(fromTerm, type), _buildFilterColumn(toTerm, type));
		} else if (term.getKey().equals(FL_RequiredPropertyKey.LINKED.name())) {
			FL_PropertyMatchDescriptor transIdTerm = FL_PropertyMatchDescriptor.newBuilder(term)
					.setKey(FL_RequiredPropertyKey.LINKED.name())
					.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(FL_RequiredPropertyKey.LINKED.name()).build()))
					.build();
			filter = _sqlBuilder.group(_buildFilterColumn(transIdTerm, type));
		}

		return filter;
	}

	/**
	 * Determines if the given field is one of the IDs for the current data set.
	 * @param field
	 * @return
	 */
	public boolean isIdField(String field) {
		if (_helperType == FL_Link.class) {
			return  field.equals(FL_RequiredPropertyKey.FROM.name()) ||
					field.equals(FL_RequiredPropertyKey.TO.name()) ||
					field.equals(FL_RequiredPropertyKey.ENTITY.name()) ||
					field.equals(FL_RequiredPropertyKey.LINKED.name());
		}
		
		return field.equals(FL_RequiredPropertyKey.ENTITY.name());
	}

	SQLFilterColumn _buildFilterColumn(FL_PropertyMatchDescriptor term, String type) {

		String fieldName = _sqlBuilder.escape(PropertyMatchDescriptorHelper.getFieldname(term, type));
		
		SQLFilterColumn filter = _sqlBuilder.filter();
		filter.column(fieldName);

		Object range = term.getRange();
		if (range instanceof FL_SingletonRange) {
			FL_SingletonRange srange = (FL_SingletonRange)range;
			
			String val = formatColumnValue(srange.getType(), srange.getValue().toString());

			boolean hasWildcard = val.matches(".*[\\*\\?].*");

			if (hasWildcard) {
				//use a LIKE query
				val = val.replace('*', '%');
				val = val.replace('?', '_');
				filter.like(val);

				if (!term.getInclude())
					filter.not();
			}
			else {
				//use an EQ query
				if (term.getInclude()) {
					filter.eq(val);
				}
				else {
					filter.notEq(val);
				}
			}
		}
		else if (range instanceof FL_ListRange) {
			FL_ListRange lrange = (FL_ListRange)range;
			List<Object> values = ((FL_ListRange)range).getValues();
			List<Object> values2 = new ArrayList<Object>();

			for (Object obj : values) {
				values2.add(formatColumnValue(lrange.getType(), (String)obj));
			}

			filter.in(values2);

			if (!term.getInclude())
				filter.not();
		}
		else if (range instanceof FL_BoundedRange) {
			FL_BoundedRange brange = (FL_BoundedRange)range;
			String start = formatColumnValue(brange.getType(), brange.getStart().toString());
			String end = formatColumnValue(brange.getType(), brange.getEnd().toString());
			if (start.contains("*")) {
				filter.lessThanEq(end);
			} else if (end.contains("*")) {
				filter.greaterThanEq(start);
			} else {
				filter.between(start, end);
			}

			if (!term.getInclude())
				filter.not();
		}
		else {
			throw new UnsupportedOperationException("Trying to create a filter for term " + term.getKey() + " of an unsupported range type " + range.getClass());
		}

		return filter;
	}


	/**
	 * General method to build a {@link SQLFilter} from a {@link FL_PropertyMatchDescriptor}.
	 * This can handle {@link FL_RequiredPropertyKey}s and ID related fields along with normal fields.
	 * @param term
	 * @return
	 */
	public SQLFilter buildTermFilter(FL_PropertyMatchDescriptor term, String type) {

		if (isSpecialDescriptor(term)) {
			//got a special field so handle that separately
			return buildSpecialTermFilter(term, type);
		}
		else {
			//handle normal fields in a general way
			SQLFilterColumn filter = _buildFilterColumn(term, type);

			return filter;
		}
	}

	/**
	 * Builds all the filters for each term in the list of terms
	 */
	public SQLFilter buildListOfFilters(Iterable<FL_PropertyMatchDescriptor> terms, String type, SQLFilterGroup group) {

		boolean hasSpecialIdPairs = _buildSpecialIdPairs(terms, type, group);

		for (FL_PropertyMatchDescriptor term : terms) {

			// Skip special id terms if we've already handled them elsewhere
			if (hasSpecialIdPairs &&
				(term.getKey().equals(FL_RequiredPropertyKey.ENTITY.name()) ||
				term.getKey().equals(FL_RequiredPropertyKey.LINKED.name()))) {
				continue;
			}

			group.addFilter(buildTermFilter(term, type));
		}
		return group;
	}
	
	/**
	 * Returns true if the descriptor has a special {@link FL_RequiredPropertyKey}
	 * @param property
	 * @return
	 */
	protected boolean isSpecialDescriptor(FL_PropertyMatchDescriptor property) {
		return isSpecialDescriptor(property.getKey());
	}
	protected boolean isSpecialDescriptor(String key) {
		return _helperType == FL_Link.class && (
			key.equals(FL_RequiredPropertyKey.ENTITY.name()) ||
			key.equals(FL_RequiredPropertyKey.LINKED.name())
		);
	}

	/**
	 * Top level method that will pull out all optional and required terms
	 * separately so they can be turned into separate AND/OR filters.
	 * 
	 * @param terms
	 * @return
	 */
	public SQLFilter buildTermsFilter(List<FL_PropertyMatchDescriptor> terms, String type) {
		//split the list into two, one list with constraints == OPTIONAL_EQUALS for OR clauses, and all others which will be AND'ed
		Iterable<FL_PropertyMatchDescriptor> orTerms = Iterables.filter(terms, new Predicate<FL_PropertyMatchDescriptor>() {
			@Override
			public boolean apply(FL_PropertyMatchDescriptor input) {
				return FL_Constraint.OPTIONAL_EQUALS.equals(input.getConstraint()) || FL_Constraint.FUZZY_PARTIAL_OPTIONAL.equals(input.getConstraint());
			}
		});
		Iterable<FL_PropertyMatchDescriptor> andTerms = Iterables.filter(terms, new Predicate<FL_PropertyMatchDescriptor>() {
			@Override
			public boolean apply(FL_PropertyMatchDescriptor input) {
				return FL_Constraint.REQUIRED_EQUALS.equals(input.getConstraint()) || FL_Constraint.FUZZY_REQUIRED.equals(input.getConstraint());
			}
		});

		SQLFilterGroup filter = _sqlBuilder.and();
		filter.addFilter(buildListOfFilters(orTerms, type, _sqlBuilder.or()));
		filter.addFilter(buildListOfFilters(andTerms, type, _sqlBuilder.and()));
		return filter;
	}

	/***
	 * Fetch the specified columns per matching top 1000 rows in database using
	 * filter term criteria.
	 *
	 * @param table
	 * @param columns
	 * @param terms
	 * @param type
	 * @param orderBy
	 * @return
	 */
	public List<List<Object>> fetchColumnsForTerms(
			String table,
			List<String> columns,
			List<FL_PropertyMatchDescriptor> terms,
			String type,
			List<FL_OrderBy> orderBy,
	        boolean limitResults
	) {

		Connection connection = null;
		List<List<Object>> results = new ArrayList<List<Object>>();

		if (terms.size() == 0) {
			return results;
		}

		try {
			List<List<FL_PropertyMatchDescriptor>> groupedFilterTerms = _groupFilterTerms(terms);

			SQLSelect query = _sqlBuilder.select();

			if (limitResults) {
				//uses top 1000 to be quicker, but doesn't allow proper pagination
				query.top(1000);
			}

			for (String column : columns) {
				query.column(_sqlBuilder.escape(column));
			}

			// Create top level query
			SQLFrom fromClause = _sqlBuilder.from();
			SQLSelect fromQuery = _createQuery(type, table, columns, groupedFilterTerms);
			fromClause.fromQuery(fromQuery).as("f");
			query.from(fromClause);

			// set the sort order if specified
			if (orderBy != null) {
				orderBy = _mapOrderBy(orderBy, type);
				
				for (FL_OrderBy ob : orderBy) {

					if (ob.getPropertyKey().equals(FL_ReservedPropertyKey.MATCH.name())) {
						continue;
					}

					query.orderBy(_sqlBuilder.escape(ob.getPropertyKey()), ob.getAscending());
				}
			}
			
			// Build the sql string
			String sql = query.build();

			connection = _connectionPool.getConnection();
			Statement stmt = connection.createStatement();

			s_logger.trace("Executing sql statement: " + sql);

			if (stmt.execute(sql)) {
				ResultSet rs = stmt.getResultSet();
				while (rs.next()) {

					// Map the results against the requested columns
					List<Object> resultList = new ArrayList<Object>();
					for (String column : columns) {
						String columnName = _sqlBuilder.unescape(column);
						Object obj = rs.getObject(columnName);

						resultList.add(obj);
					}
					results.add(resultList);
				}
			}

		} catch (Exception e) {
			e.printStackTrace();
		}
		finally {
			try {
				connection.close();
			} catch (SQLException e) {
				s_logger.trace("Error closing connection ", e);
			}
		}

		return results;
	}


	private InfluentId influentIDFromRaw(char entityClass, String rawId, Class<?> objectType) {
		FL_PropertyDescriptors descriptors = objectType == FL_Entity.class ?
				_applicationConfiguration.getEntityDescriptors() :
				_applicationConfiguration.getLinkDescriptors();

		if (descriptors.getTypes().size() > 1) {
			return InfluentId.fromTypedId(entityClass, rawId);
		} else {
			String type = descriptors.getTypes().get(0).getKey();
			return InfluentId.fromNativeId(entityClass, type, rawId);
		}
	}

	private FL_Property propertyFromQueryResult(
			FL_PropertyDescriptor pd,
			List<Object> valueList,
			FL_LevelOfDetail levelOfDetail) {

		// Test to see if the property is set hidden, or if it's hidden by Level of Detail
		boolean isHidden = pd.getLevelOfDetail().equals(FL_LevelOfDetail.HIDDEN) ||
				(levelOfDetail.equals(FL_LevelOfDetail.SUMMARY) && pd.getLevelOfDetail().equals(FL_LevelOfDetail.FULL));

		Object range;
		// Create a list range, or a singleton range depending on how many values we got
		if (valueList.size() > 1) {
			range = FL_ListRange.newBuilder()
					.setType(pd.getPropertyType())
					.setValues(valueList)
					.build();
		} else {
			range = FL_SingletonRange.newBuilder()
					.setType(pd.getPropertyType())
					.setValue(valueList.get(0))
					.build();
		}

		return new PropertyHelper(
			pd.getKey(),
			pd.getFriendlyText(),
			null,
			null,
			pd.getTags(),
			isHidden,
			range
		);
	}



	public List<Object> getObjectsFromTerms(
			Map<String, List<FL_PropertyMatchDescriptor>> termMap,
			List<FL_OrderBy> orderBy,
			FL_LevelOfDetail levelOfDetail,
	        boolean limitResults
	) throws AvroRemoteException {


		List<Object> results = new ArrayList<Object>();

		for (Map.Entry<String, List<FL_PropertyMatchDescriptor>> entry : termMap.entrySet()) {

			String type = entry.getKey();
			String table;
			if (_helperType == FL_Entity.class) {
				table = _applicationConfiguration.getTable(type, FIN_ENTITY.name(), FIN_ENTITY.name());
			} else {
				table = _applicationConfiguration.getTable(type, FIN_LINK.name(), FIN_LINK.name());
			}

			List<String> columns = new ArrayList<String>();
			Map<String, FL_PropertyDescriptor> columnMap = new HashMap<String, FL_PropertyDescriptor>();
			List<FL_PropertyDescriptor> composites = new ArrayList<FL_PropertyDescriptor>();

			for (FL_PropertyDescriptor prop : getDescriptors().getProperties()) {
				if (prop.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.ENTITY.name()) ||
					prop.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.LINKED.name())) {
					continue;
				}

				for (FL_TypeMapping map : prop.getMemberOf()) {
					if (map.getType().equalsIgnoreCase(entry.getKey())) {
						// non-primitive objects need decomposition
						if (_applicationConfiguration.isCompositeProperty(prop.getKey())) {
							List<PropertyField> fields = _applicationConfiguration.getFields(prop.getKey());
							if (fields != null) {
								for (PropertyField field : fields) {
									final String fieldKey = PropertyDescriptorHelper.getFieldname(field.getProperty(), entry.getKey(), null);

									if (fieldKey != null) {
										if (!columns.contains(fieldKey)) {
											columns.add(fieldKey);
											columnMap.put(fieldKey, prop);
										}
									}
								}
							}
							composites.add(prop);
						} else {
							if (!columns.contains(map.getMemberKey())) {
								String memberKey = map.getMemberKey();
								columns.add(memberKey);
								columnMap.put(memberKey, prop);
							}
						}
					}
				}
			}

			List<List<Object>> queryResults = fetchColumnsForTerms(table, columns, entry.getValue(), entry.getKey(), orderBy, limitResults);
			List<Object> valueList;

			for (List<Object> result : queryResults) {
				List<FL_Property> props = new ArrayList<FL_Property>();

				// Process columns
				for (int colIdx = 0; colIdx < result.size(); colIdx++) {
					Object columnObj = result.get(colIdx);
					String memberKey = columns.get(colIdx);
					FL_PropertyDescriptor pd = columnMap.get(memberKey);

					// Skip composites, those are handled separately
					if (composites.contains(pd)) {
						continue;
					}

					valueList = getPropertyValuesFromColumn(columnObj, pd);

					if (valueList == null || valueList.isEmpty()) {
						continue;
					}

					// Add the property
					props.add(propertyFromQueryResult(pd, valueList, levelOfDetail));
				}

				// Handle composite properties

				for (FL_PropertyDescriptor pd : composites) {

					if (pd.getPropertyType() == FL_PropertyType.GEO) {
						valueList = new ArrayList<Object>();
						List<Object> textValues = getCompositeFieldValues(pd, result, columns, type, "text");
						List<Object> ccValues = getCompositeFieldValues(pd, result, columns, type, "cc");
						List<Object> latValues = getCompositeFieldValues(pd, result, columns, type, "lat");
						List<Object> lonValues = getCompositeFieldValues(pd, result, columns, type, "lon");

						// Assume we have the same number of values in all lists.
						for (int i = 0; i < latValues.size(); i++) {

							FL_GeoData.Builder geoDataBuilder = FL_GeoData.newBuilder()
									.setText(textValues != null ? (String) textValues.get(i) : null)
									.setCc(ccValues != null ? (String) ccValues.get(i) : null)
									.setLat(latValues != null ? parseLatLon(latValues.get(i)) : null)
									.setLon(lonValues != null ? parseLatLon(lonValues.get(i)) : null);

							valueList.add(geoDataBuilder.build());
						}

						// Add the property
						props.add(propertyFromQueryResult(pd, valueList, levelOfDetail));

					} else {
						throw new UnsupportedOperationException("Unhandled composite type: " + pd.getPropertyType().name());
					}
				}

				String uid = getUIDFromProperties(props, FL_RequiredPropertyKey.ID, _helperType);

				if (_helperType == FL_Entity.class) {

					results.add(new EntityHelper(uid, type, Collections.singletonList(FL_EntityTag.ACCOUNT), null, null, props));
				} else {

					String fromId = getUIDFromProperties(props, FL_RequiredPropertyKey.FROM, FL_Entity.class);
					String toId = getUIDFromProperties(props, FL_RequiredPropertyKey.TO, FL_Entity.class);
					String linkType = InfluentId.fromInfluentId(uid).getIdType();
					results.add(new LinkHelper(uid, fromId, toId, linkType, props, null));
				}
			}
		}

		return results;
	}



	String getUIDFromProperties(List<FL_Property> propList, FL_RequiredPropertyKey key, Class<?> objectType) {
		FL_Property idProp = PropertyHelper.getPropertyByKey(propList, key.name());
		String idVal = idProp != null ? PropertyHelper.getValue(idProp).toString() : null;
		return influentIDFromRaw(InfluentId.ACCOUNT, idVal, objectType).toString();
	}



	private Double parseLatLon(Object value) {
		// Lat/Lon conversion helper function

		if (value instanceof Float) {
			Float f = (Float) value;
			return f.doubleValue();
		} else if (value instanceof String) {
			return Double.parseDouble(value.toString());
		}

		return (Double)value;
	}



	protected List<Object> getCompositeFieldValues(
			FL_PropertyDescriptor pd,
			List<Object> result,
			List<String> colMap,
			String type,
			String fieldName
	) throws AvroRemoteException {
		// Get values for fields in composite properties

		PropertyField pf = _applicationConfiguration.getField(pd.getKey(), fieldName);
		if (pf != null) {
			FL_PropertyDescriptor linkedProperty = pf.getProperty();

			final String memberKey = PropertyDescriptorHelper.getFieldname(linkedProperty, type, null);

			if (memberKey != null) {

				Object column = null;
				for (int i = 0; i < colMap.size(); i++) {
					if (colMap.get(i).equals(memberKey)) {
						column = result.get(i);
					}
				}
				return getPropertyValuesFromColumn(column, linkedProperty);
			}
		}

		return null;
	}

	protected List<Object> getPropertyValuesFromColumn(
			Object column,
			FL_PropertyDescriptor pd
	) throws AvroRemoteException {
		// Get values for a property from the results set

		if (column == null) {
			return null;
		}

		boolean isMultiValue = pd.getMultiValue();

		final FL_PropertyType dataType = pd.getPropertyType();
		List<Object> values = new ArrayList<Object>();

		try {
			// If the column is a clob, convert it to a string first
			if (column instanceof Clob) {
				StringBuilder sb = new StringBuilder();
				Clob clob = (Clob) (column);
				Reader reader = clob.getCharacterStream();
				BufferedReader bufferedReader = new BufferedReader(reader);

				String line;
				while (null != (line = bufferedReader.readLine())) {
					sb.append(line);
				}
				bufferedReader.close();
				column = sb.toString();
			}
		} catch (Exception e) {
			throw new AvroRemoteException(e);
		}

		if (isMultiValue) {
			// Multivalue properties should always be strings. Split them up.
			values.addAll(Arrays.asList(column.toString().split(",")));
		} else {
			values.add(column);
		}

		if (values.isEmpty()) {
			return null;
		}

		for (int i = 0; i < values.size(); i++) {
			Object val = values.get(i);

			switch (dataType) {
				case DATE:
					Timestamp dateValue;
					if (val instanceof Long) {
						dateValue = new Timestamp((Long)val);
					} else {
						dateValue = (Timestamp) val;
					}

					val = dateValue.getTime();
					break;
				case STRING:
					val = val.toString();
					break;
			}

			values.set(i, val);
		}

		return values;

	}




	// Create a sub query around batched terms
	private SQLSelect _createSubQuery(String type, String table, List<String> columns, List<FL_PropertyMatchDescriptor> terms) {
		SQLSelect groupQuery = _sqlBuilder.select();
		
		for (String column : columns) {
			groupQuery.column(_sqlBuilder.escape(column));
		}
		
		groupQuery.from(table, "f")
				.where(buildTermsFilter(terms, type));
		
		return groupQuery;
	}

	// Create a top level query containing subqueries
	private SQLSelect _createQuery(String type, String table, List<String> columns, List<List<FL_PropertyMatchDescriptor>> groupedTerms) {
		// create a search query by type
		SQLSelect typeQuery = _sqlBuilder.select();
		
		for (String column : columns) {
			typeQuery.column(_sqlBuilder.escape(column));
		}
		
		// construct a sub-query to select results from - this will be a union of grouped term queries
		SQLFrom fromClause = _sqlBuilder.from();
		SQLSelect fromQuery = _createSubQuery(type, table, columns, groupedTerms.get(0));
		fromClause.fromQuery(fromQuery).as("f");
		
		// union any other group term queries together
		for (int i=1; i < groupedTerms.size(); i++) {
			SQLSelect query = _createSubQuery(type, table, columns, groupedTerms.get(i));
			fromQuery.union(query);
			fromQuery = query;
		}
		
		typeQuery.from(fromClause);
		
		return typeQuery;
	}



	private boolean _buildSpecialIdPairs(Iterable<FL_PropertyMatchDescriptor> terms, String type, SQLFilterGroup group) {
		FL_PropertyMatchDescriptor entityIDTerm = null;
		FL_PropertyMatchDescriptor linkedIDTerm = null;

		boolean hasMultipleEntityIDs = false;
		boolean hasMultipleLinkedIDs = false;

		// Check for ENTITY and LINKED pairs
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
			s_logger.error("Multiple ENTITY or LINKED terms specified");
			return false;
		}

		// If both are defined, build a special group term such that ENTITY:A,B LINKED:C,D
		// Becomes filter (_from IN(A,B) AND _to IN(C,D)) OR (_from IN(C,D) AND _to IN(A,B))
		if (entityIDTerm != null && linkedIDTerm != null) {
			FL_PropertyMatchDescriptor fromEntityIDTerm = FL_PropertyMatchDescriptor.newBuilder(entityIDTerm)
					.setKey(FL_RequiredPropertyKey.FROM.name())
					.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(_mapKey(FL_RequiredPropertyKey.FROM.name(), type)).build()))
					.build();
			FL_PropertyMatchDescriptor toLinkedIDTerm = FL_PropertyMatchDescriptor.newBuilder(linkedIDTerm)
					.setKey(FL_RequiredPropertyKey.TO.name())
					.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(_mapKey(FL_RequiredPropertyKey.TO.name(), type)).build()))
					.build();

			FL_PropertyMatchDescriptor fromLinkedIDTerm = FL_PropertyMatchDescriptor.newBuilder(linkedIDTerm)
					.setKey(FL_RequiredPropertyKey.FROM.name())
					.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(_mapKey(FL_RequiredPropertyKey.FROM.name(), type)).build()))
					.build();
			FL_PropertyMatchDescriptor toEntityIDTerm = FL_PropertyMatchDescriptor.newBuilder(entityIDTerm)
					.setKey(FL_RequiredPropertyKey.TO.name())
					.setTypeMappings(Collections.singletonList(FL_TypeMapping.newBuilder().setType(type).setMemberKey(_mapKey(FL_RequiredPropertyKey.TO.name(), type)).build()))
					.build();


			SQLFilter entityIDFilter = _sqlBuilder.and(_buildFilterColumn(fromEntityIDTerm, type), _buildFilterColumn(toLinkedIDTerm, type));
			SQLFilter linkedIDFilter = _sqlBuilder.and(_buildFilterColumn(fromLinkedIDTerm, type), _buildFilterColumn(toEntityIDTerm, type));
			SQLFilter both = _sqlBuilder.or(entityIDFilter, linkedIDFilter);

			group.addFilter(both);

			return true;
		}

		return false;
	}



	// Group filter terms into batches for faster execution
	private List<List<FL_PropertyMatchDescriptor>> _groupFilterTerms(List<FL_PropertyMatchDescriptor> filterTerms) {
		List<List<FL_PropertyMatchDescriptor>> groupedFilterTerms = new LinkedList<List<FL_PropertyMatchDescriptor>>();

		List<FL_PropertyMatchDescriptor> generalFilterTerms = new LinkedList<FL_PropertyMatchDescriptor>();

		// Map of id term lists by id term type
		Map<String,List<FL_PropertyMatchDescriptor>> idFilterTermsMap = new HashMap<String, List<FL_PropertyMatchDescriptor>>();

		// separate out id filters and general term filters
		for (FL_PropertyMatchDescriptor filterTerm : filterTerms) {
			String key = filterTerm.getKey();
			if (isIdField(key)) {
				List<FL_PropertyMatchDescriptor> pmd = idFilterTermsMap.get(key);
				if (pmd == null) {
					pmd = new ArrayList<FL_PropertyMatchDescriptor>();
				}
				pmd.add(filterTerm);
				idFilterTermsMap.put(key, pmd);
			} else {
				generalFilterTerms.add(filterTerm);
			}
		}

		// Find the largest id-list contributor to the query. This will be the one that gets batched.
		// All other terms (including id terms) will be grouped in their entirety with this term.
		String largestIdField = null;
		int largestIdFieldCount = 0;
		for (Map.Entry<String, List<FL_PropertyMatchDescriptor>> entry : idFilterTermsMap.entrySet()) {
			int rangeTotal = 0;
			for (int i=0; i < entry.getValue().size(); i++) {
				// collect up all the filter ids for processing into batches
				FL_PropertyMatchDescriptor pmd = entry.getValue().get(i);
				Object range = pmd.getRange();
				if (range instanceof FL_SingletonRange) {
					rangeTotal += 1;
				} else if (range instanceof FL_ListRange) {
					rangeTotal += ((FL_ListRange) range).getValues().size();
				}
			}

			if (largestIdField == null || rangeTotal > largestIdFieldCount) {
				largestIdFieldCount = rangeTotal;
				largestIdField = entry.getKey();
			}
		}

		// create the initial batch for the term
		List<FL_PropertyMatchDescriptor> batch = new LinkedList<FL_PropertyMatchDescriptor>();
		List<Object> batchFilterIds = new ArrayList<Object>();

		// Add general terms
		batch.addAll(generalFilterTerms);
		// Add unbatched id terms
		for (Map.Entry<String, List<FL_PropertyMatchDescriptor>> entry : idFilterTermsMap.entrySet()) {
			if (!entry.getKey().equals(largestIdField)) {
				batch.addAll(entry.getValue());
			}
		}
		groupedFilterTerms.add(batch);

		if (largestIdField != null) {
			List<FL_PropertyMatchDescriptor> idFilterTerms = idFilterTermsMap.get(largestIdField);//entry.getValue();
			for (int i = 0; i < idFilterTerms.size(); i++) {
				// collect up all the filter ids for processing into batches
				FL_PropertyMatchDescriptor pmd = idFilterTerms.get(i);
				Object range = pmd.getRange();
				List<Object> filterIds = null;
				if (range instanceof FL_SingletonRange) {
					filterIds = Collections.singletonList(((FL_SingletonRange) range).getValue());
				} else if (range instanceof FL_ListRange) {
					filterIds = ((FL_ListRange) range).getValues();
				}

				if (filterIds != null) {
					for (int j = 0; j < filterIds.size(); j++) {
						batchFilterIds.add(filterIds.get(j));

						boolean lastItem = (i == idFilterTerms.size() - 1) && (j == filterIds.size() - 1);

						if (batchFilterIds.size() >= ID_BATCH_SIZE || lastItem) {
							// we have filled up the batch - create a property match descriptor for this batch of filter ids
							FL_PropertyMatchDescriptor batchedPmd = FL_PropertyMatchDescriptor.newBuilder(pmd)
									.setRange(FL_ListRange.newBuilder().setType(FL_PropertyType.STRING).setValues(batchFilterIds).build())
									.build();
							batch.add(batchedPmd);

							if (!lastItem) {
								// create a new batch
								batch = new LinkedList<FL_PropertyMatchDescriptor>();
								batchFilterIds = new ArrayList<Object>();

								// Add general terms
								batch.addAll(generalFilterTerms);
								// Add unbatched id terms
								for (Map.Entry<String, List<FL_PropertyMatchDescriptor>> entry : idFilterTermsMap.entrySet()) {
									if (!entry.getKey().equals(largestIdField)) {
										batch.addAll(entry.getValue());
									}
								}
								groupedFilterTerms.add(batch);
							}
						}
					}
				}
			}
		}

		if (groupedFilterTerms.isEmpty()) groupedFilterTerms.add(generalFilterTerms);

		return groupedFilterTerms;
	}



	private String formatColumnValue(FL_PropertyType type, String value) {
		if (type.equals(FL_PropertyType.DOUBLE) || type.equals(FL_PropertyType.FLOAT) || type.equals(FL_PropertyType.INTEGER) || type.equals(FL_PropertyType.LONG)) {
			return value;
		} else {
			return String.format("\'%s\'", value);
		}
	}
}
