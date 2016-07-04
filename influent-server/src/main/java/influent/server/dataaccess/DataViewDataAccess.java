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
import influent.idlhelper.PropertyHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.data.PropertyMatchBuilder;
import influent.server.sql.SQLBuilder;
import influent.server.utilities.SQLConnectionPool;
import influent.server.utilities.InfluentId;
import org.apache.avro.AvroRemoteException;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import oculus.aperture.spi.common.Properties;

import java.sql.*;
import java.util.*;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static influent.server.configuration.ApplicationConfiguration.SystemPropertyKey.*;


public class DataViewDataAccess implements FL_DataAccess {

	protected final SQLConnectionPool _connectionPool;
	protected final FL_EntitySearch _search;
	private final DataNamespaceHandler _namespaceHandler;
	private final boolean _isMultiType;
	protected final ApplicationConfiguration _applicationConfiguration;
	protected final SearchSQLHelper _sqlHelper;
	protected final SQLBuilder _sqlBuilder;

	private static Pattern COLUMN_PATTERN = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*", 0);

	protected static final Logger s_logger = LoggerFactory.getLogger(DataViewDataAccess.class);

	protected Logger getLogger() {
		return s_logger;
	}



	public DataViewDataAccess(
		Properties config,
		SQLConnectionPool connectionPool,
		FL_EntitySearch search,
		DataNamespaceHandler namespaceHandler,
		SQLBuilder sqlBuilder
	) throws ClassNotFoundException, SQLException {

		// TODO: ehCacheConfig!!
		_connectionPool = connectionPool;
		_search = search;
		_namespaceHandler = namespaceHandler;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
		_isMultiType = _applicationConfiguration.hasMultipleEntityTypes();
		_sqlBuilder = sqlBuilder;
		_sqlHelper = new SearchSQLHelper(
				_sqlBuilder,
				_connectionPool,
				_applicationConfiguration,
				FL_Entity.class
		);
	}




	protected DataNamespaceHandler getNamespaceHandler() {
		return _namespaceHandler;
	}




	protected FL_PropertyDescriptors getDescriptors() {
		return _applicationConfiguration.getEntityDescriptors();
	}



	private ApplicationConfiguration.SystemColumnType _getIdColumnType() {
		if (_isMultiType) {
			// Multitype IDs are always strings
			return ApplicationConfiguration.SystemColumnType.STRING;
		} else {
			// There is only one type, so get the column type for it
			String typeString = getDescriptors().getTypes().get(0).getKey();
			return _applicationConfiguration.getColumnType(typeString, FIN_ENTITY.name(), ENTITY_ID.name());
		}
	}


	private InfluentId influentIDFromRaw(char entityClass, String entityType, String rawId) {
		if (_isMultiType) {
			return InfluentId.fromTypedId(entityClass, rawId);
		} else {
			return InfluentId.fromNativeId(entityClass, entityType, rawId);
		}
	}

	private String rawFromInfluentID(InfluentId infId) {
		if (_isMultiType) {
			return infId.getTypedId();
		} else {
			return infId.getNativeId();
		}
	}


	private String typeFromRaw(String rawId) {
		if (_isMultiType) {
			return InfluentId.fromTypedId(InfluentId.ACCOUNT, rawId).getIdType();
		} else {
			return getDescriptors().getTypes().get(0).getKey();
		}
	}


	@Override
	public List<FL_Entity> getEntities(
		List<String> entities,
		FL_LevelOfDetail levelOfDetail
	) throws AvroRemoteException {

		List<FL_Entity> results = new LinkedList<FL_Entity>();

		if (entities == null || entities.isEmpty()) {
			return results;
		}

		StringBuilder sb = new StringBuilder();
		sb.append(FL_RequiredPropertyKey.ENTITY.name() + ":\"");
		for (String id : entities) {
			sb.append(id);
			sb.append(",");
		}
		sb.deleteCharAt(sb.length() - 1);
		sb.append("\" ");

		final PropertyMatchBuilder terms = new PropertyMatchBuilder(sb.toString(), getDescriptors(), false, _isMultiType);
		Map<String, List<FL_PropertyMatchDescriptor>> termMap = terms.getDescriptorMap();

		List<Object> objects = _sqlHelper.getObjectsFromTerms(termMap, null, levelOfDetail, false);
		for (Object object : objects) {
			FL_Entity entity = (FL_Entity)object;

			// Match incoming entity class
			InfluentId infId = InfluentId.fromInfluentId(entity.getUid());
			for (String id : entities) {
				InfluentId infId2 = InfluentId.fromInfluentId(id);
				if (infId.getTypedId().equals(infId2.getTypedId())) {
					entity.setUid(infId2.toString());

					if (infId2.getIdClass() == InfluentId.ACCOUNT_OWNER) {
						List<FL_EntityTag> tags = entity.getTags();
						tags.remove(FL_EntityTag.ACCOUNT);
						tags.add(FL_EntityTag.ACCOUNT_OWNER);
						entity.setTags(tags);
					}

				}
			}

			results.add((FL_Entity)object);
		}

		return results;
	}



	@Override
	public List<FL_DataSummary> getDataSummary() {
		List<FL_DataSummary> ret = new ArrayList<FL_DataSummary>();
		try {

			String dataSummaryTable = _applicationConfiguration.getTable(DATA_SUMMARY.name(), DATA_SUMMARY.name());
			String summaryKeyColumn = _applicationConfiguration.getColumn(DATA_SUMMARY.name(), SUMMARY_KEY.name());
			String summaryLabelColumn = _applicationConfiguration.getColumn(DATA_SUMMARY.name(), SUMMARY_LABEL.name());
			String summaryValueColumn = _applicationConfiguration.getColumn(DATA_SUMMARY.name(), SUMMARY_VALUE.name());
			String summaryOrderColumn = _applicationConfiguration.getColumn(DATA_SUMMARY.name(), SUMMARY_ORDER.name());

			Connection con = _connectionPool.getConnection();
			Statement stmt = con.createStatement();
			ResultSet rs = stmt.executeQuery(String.format("SELECT %s, %s, %s FROM %s ORDER BY %s ASC", summaryKeyColumn, summaryLabelColumn,
				summaryValueColumn, dataSummaryTable, summaryOrderColumn));
			while (rs.next()) {
				String key = rs.getString("SummaryKey");
				String label = rs.getString("SummaryLabel");
				String value = rs.getString("SummaryValue");

				FL_DataSummary tmp = FL_DataSummary.newBuilder()
					.setKey(key)
					.setLabel(label)
					.setValue(value)
					.build();

				ret.add(tmp);
			}
		} catch (Exception e) {
			System.out.println("Error while retrieving summary from data source");
			e.printStackTrace();
		}
		return ret;
	}



	@Override
	public Map<String, List<FL_Link>> getFlowAggregation(
		List<String> entities,
		List<String> focusEntities,
		FL_DirectionFilter direction,
		FL_LinkEntityTypeFilter entityTypeFilter,
		FL_DateRange date
	) throws AvroRemoteException {

		Map<String, List<FL_Link>> results = new HashMap<String, List<FL_Link>>();

		FL_PropertyDescriptors linkDescriptors = _applicationConfiguration.getLinkDescriptors();

		DateTime startDate = DataAccessHelper.getStartDate(date);
		DateTime endDate = DataAccessHelper.getEndDate(date);

		Connection connection = null;
		try {
			connection = _connectionPool.getConnection();
			for (FL_TypeDescriptor td : linkDescriptors.getTypes()) {

				String type = td.getKey();

				// get tables
				String finFlowTable = _applicationConfiguration.getTable(type, FIN_FLOW.name(), FIN_FLOW.name());
				String finFlowIntervalTable = _applicationConfiguration.getIntervalTable(type, FIN_FLOW_BUCKETS.name(), date.getDurationPerBin().getInterval());

				// get columns
				String finFlowFromEntityIdColumn = _applicationConfiguration.getColumn(type, FIN_FLOW_BUCKETS.name(), FROM_ENTITY_ID.name());
				String finFlowFromEntityTypeColumn = _applicationConfiguration.getColumn(type, FIN_FLOW_BUCKETS.name(), FROM_ENTITY_TYPE.name());
				String finFlowToEntityIdColumn = _applicationConfiguration.getColumn(type, FIN_FLOW_BUCKETS.name(), TO_ENTITY_ID.name());
				String finFlowToEntityTypeColumn = _applicationConfiguration.getColumn(type, FIN_FLOW_BUCKETS.name(), TO_ENTITY_TYPE.name());
				String finFlowAmountColumn = _applicationConfiguration.getColumn(type, FIN_FLOW_BUCKETS.name(), AMOUNT.name());
				String finFlowDateColumn = _applicationConfiguration.getColumn(type, FIN_FLOW_BUCKETS.name(), PERIOD_DATE.name());

				Statement stmt = connection.createStatement();

				List<String> idsCopy = new ArrayList<String>(entities); // copy the ids as we will take 100 at a time to process and the take method is destructive
				String focusIds = createIdListFromCollection(focusEntities);

				while (idsCopy.size() > 0) {
					List<String> tempSubList = (idsCopy.size() > 100) ? idsCopy.subList(0, 99) : idsCopy; // get the next 100
					List<String> subIds = new ArrayList<String>(tempSubList); // copy as the next step is destructive
					tempSubList.clear(); // this clears the IDs from idsCopy as tempSubList is backed by idsCopy
					
					String ids = createIdListFromCollection(subIds);

					String sourceDirectionClause = finFlowFromEntityIdColumn + " in (" + ids + ")";
					String destDirectionClause = finFlowToEntityIdColumn + " in (" + ids + ")";

					if (focusIds != null) {
						sourceDirectionClause += " and " + finFlowToEntityIdColumn + " in (" + focusIds + ")";
						destDirectionClause += " and " + finFlowFromEntityIdColumn + " in (" + focusIds + ")";
					}
					String directionClause = (direction == FL_DirectionFilter.BOTH) ? sourceDirectionClause + " and " + destDirectionClause : (direction == FL_DirectionFilter.DESTINATION) ? destDirectionClause : (direction == FL_DirectionFilter.SOURCE) ? sourceDirectionClause : "1=1";
					String entityTypeClause = linkEntityTypeClause(
						direction,
						entityTypeFilter,
						finFlowFromEntityTypeColumn,
						finFlowToEntityTypeColumn
					);

					String dateRespectingFlowSQL = "select " + finFlowFromEntityIdColumn + ", " + finFlowToEntityIdColumn + ", sum(" + finFlowAmountColumn + ") as " + finFlowAmountColumn + " from " + finFlowIntervalTable + " where " + finFlowDateColumn + " between '" + getNamespaceHandler().formatDate(startDate) + "' and '" + getNamespaceHandler().formatDate(endDate) + "' and " + directionClause + " and " + entityTypeClause + " group by " + finFlowFromEntityIdColumn + ", " + finFlowToEntityIdColumn;
					String flowSQL = "select " + finFlowFromEntityIdColumn + ", " + finFlowFromEntityTypeColumn + ", " + finFlowToEntityIdColumn + ", " + finFlowToEntityTypeColumn + " from " + finFlowTable + " where " + directionClause + " and " + entityTypeClause;

					Map<String, Map<String, Double>> fromToAmountMap = new HashMap<String, Map<String, Double>>();

					getLogger().trace(dateRespectingFlowSQL);
					if (stmt.execute(dateRespectingFlowSQL)) {
						ResultSet rs = stmt.getResultSet();
						while (rs.next()) {
							String from = rs.getString(finFlowFromEntityIdColumn);
							String to = rs.getString(finFlowToEntityIdColumn);
							Double amount = rs.getDouble(finFlowAmountColumn);
							if (fromToAmountMap.containsKey(from)) {
								if (fromToAmountMap.get(from).containsKey(to)) {
									fromToAmountMap.get(from).put(to, fromToAmountMap.get(from).get(to) + amount);
									getLogger().warn("Duplicate entity to entity link discovered: " + from + " to " + to + ". The link has been aggregated.");
								} else {
									fromToAmountMap.get(from).put(to, amount);
								}
							} else {
								Map<String, Double> toAmountMap = new HashMap<String, Double>();
								toAmountMap.put(to, amount);
								fromToAmountMap.put(from, toAmountMap);
							}
						}
					}
					getLogger().trace(flowSQL);
					if (stmt.execute(flowSQL)) {
						ResultSet rs = stmt.getResultSet();
						while (rs.next()) {
							String from = rs.getString(finFlowFromEntityIdColumn);
							char fromClass = rs.getString(finFlowFromEntityTypeColumn).toLowerCase().charAt(0);
							String fromType = typeFromRaw(from);
							String to = rs.getString(finFlowToEntityIdColumn);
							char toClass = rs.getString(finFlowToEntityTypeColumn).toLowerCase().charAt(0);
							String toType = typeFromRaw(to);

							// globalize this for return
							String keyId = InfluentId.fromNativeId(InfluentId.LINK, type, from + "_" + to).toString();

							List<FL_Link> linkList = results.get(keyId);
							if (linkList == null) {
								linkList = new LinkedList<FL_Link>();
								results.put(keyId, linkList);
							}

							// only use the amount calculated above with the date respecting FLOW map
							Double amount = (fromToAmountMap.containsKey(from) && fromToAmountMap.get(from).containsKey(to)) ? amount = fromToAmountMap.get(from).get(to) : 0.0;
							List<FL_Property> properties = new ArrayList<FL_Property>();
							properties.add(new PropertyHelper(FL_PropertyTag.AMOUNT, amount));

							// globalize these for return
							from = influentIDFromRaw(fromClass, fromType, from).toString();
							to = influentIDFromRaw(toClass, toType, to).toString();

							//Finally, create the link between the two, and add it to the map.
							FL_Link link = FL_Link.newBuilder()
								.setUid(keyId)
								.setLinkTypes(null)
								.setSource(from)
								.setTarget(to)
								.setType(type)
								.setDirected(true)
								.setProvenance(null)
								.setUncertainty(null)
								.setProperties(properties)
								.build();
							linkList.add(link);
						}
						rs.close();
					}
				}

				stmt.close();
			}

			connection.close();
		} catch (ClassNotFoundException e) {
			throw new AvroRemoteException(e);
		} catch (SQLException e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}

		return results;
	}




	private String createIdListFromCollection(List<String> ids) {
		if (ids == null || ids.isEmpty()) return null;

		StringBuilder resultString = new StringBuilder();

		ApplicationConfiguration.SystemColumnType idType = _getIdColumnType();

		for (String id : ids) {
			InfluentId infId = InfluentId.fromInfluentId(id);
			resultString.append(getNamespaceHandler().toSQLId(rawFromInfluentID(infId), idType));
			resultString.append(",");
		}

		resultString.deleteCharAt(resultString.lastIndexOf(","));

		return resultString.toString();
	}


	@Override
	public Map<String, List<FL_Link>> getTimeSeriesAggregation(
		List<String> entities,
		List<String> focusEntities,
		FL_DateRange date
	) throws AvroRemoteException {

		Map<String, List<FL_Link>> results = new HashMap<String, List<FL_Link>>();

		FL_PropertyDescriptors linkDescriptors = _applicationConfiguration.getLinkDescriptors();
		FL_PropertyDescriptors entityDescriptors = _applicationConfiguration.getEntityDescriptors();

		DateTime startDate = DataAccessHelper.getStartDate(date);
		DateTime endDate = DataAccessHelper.getEndDate(date);
		String focusIds = createIdListFromCollection(focusEntities);

		Connection connection = null;
		try {
			connection = _connectionPool.getConnection();

			if (focusEntities != null && focusEntities.size() > 0) {
				for (FL_TypeDescriptor td : linkDescriptors.getTypes()) {

					String linkType = td.getKey();

					String finFlowIntervalTable = _applicationConfiguration.getIntervalTable(linkType, FIN_FLOW_BUCKETS.name(), date.getDurationPerBin().getInterval());
					String finFlowFromEntityIdColumn = _applicationConfiguration.getColumn(linkType, FIN_FLOW_BUCKETS.name(), FROM_ENTITY_ID.name());
					String finFlowFromEntityTypeColumn = _applicationConfiguration.getColumn(linkType, FIN_FLOW_BUCKETS.name(), FROM_ENTITY_TYPE.name());
					String finFlowToEntityIdColumn = _applicationConfiguration.getColumn(linkType, FIN_FLOW_BUCKETS.name(), TO_ENTITY_ID.name());
					String finFlowToEntityTypeColumn = _applicationConfiguration.getColumn(linkType, FIN_FLOW_BUCKETS.name(), TO_ENTITY_TYPE.name());
					String finFlowAmountColumn = _applicationConfiguration.getColumn(linkType, FIN_FLOW_BUCKETS.name(), AMOUNT.name());
					String finFlowDateColumn = _applicationConfiguration.getColumn(linkType, FIN_FLOW_BUCKETS.name(), PERIOD_DATE.name());

					Statement stmt = connection.createStatement();

					List<String> idsCopy = new ArrayList<String>(entities); // copy the ids as we will take 100 at a time to process and the take method is destructive
					while (idsCopy.size() > 0) {
						List<String> tempSubList = (idsCopy.size() > 100) ? idsCopy.subList(0, 99) : idsCopy; // get the next 100
						List<String> subIds = new ArrayList<String>(tempSubList); // copy as the next step is destructive
						tempSubList.clear(); // this clears the IDs from idsCopy as tempSubList is backed by idsCopy

						String ids = createIdListFromCollection(subIds);

						String focusedSQL = buildStatementForFocusFlow(
								ids,
								focusIds,
								finFlowFromEntityIdColumn,
								finFlowFromEntityTypeColumn,
								finFlowToEntityIdColumn,
								finFlowToEntityTypeColumn,
								finFlowDateColumn,
								finFlowAmountColumn,
								finFlowIntervalTable,
								startDate,
								endDate
						);

						getLogger().trace(focusedSQL);

						if (stmt.execute(focusedSQL)) {
							ResultSet rs = stmt.getResultSet();
							while (rs.next()) {

								String from = rs.getString(finFlowFromEntityIdColumn);
								char fromClass = rs.getString(finFlowFromEntityTypeColumn).toLowerCase().charAt(0);
								String fromType = typeFromRaw(from);
								String to = rs.getString(finFlowToEntityIdColumn);
								char toClass = rs.getString(finFlowToEntityTypeColumn).toLowerCase().charAt(0);
								String toType = typeFromRaw(to);

								Double amount = rs.getDouble(finFlowAmountColumn);
								Date rsDate = rs.getDate(finFlowDateColumn);

								// globalize these for return
								String globalFrom = InfluentId.fromNativeId(fromClass, fromType, from).toString();
								String globalTo = InfluentId.fromNativeId(toClass, toType, to).toString();

								String keyId = globalFrom;
								if (subIds.contains(globalTo)) {
									keyId = globalTo;
								}

								List<FL_Link> linkList = results.get(keyId);
								if (linkList == null) {
									linkList = new LinkedList<FL_Link>();
									results.put(keyId, linkList);
								}

								// only use the amount calculated above with the date respecting FLOW map
								List<FL_Property> properties = new ArrayList<FL_Property>();
								properties.add(new PropertyHelper(FL_PropertyTag.AMOUNT, amount));
								properties.add(new PropertyHelper(FL_PropertyTag.DATE, rsDate));

								FL_Link link = FL_Link.newBuilder()
									.setUid(InfluentId.fromNativeId(InfluentId.LINK, linkType, UUID.randomUUID().toString()).toString())
									.setSource(globalFrom)
									.setTarget(globalTo)
									.setLinkTypes(null)
									.setType(linkType)
									.setDirected(true)
									.setProvenance(null)
									.setUncertainty(null)
									.setProperties(properties)
									.build();
								linkList.add(link);
							}
							rs.close();
						}
					}
					stmt.close();
				}
			}

			Map<String, List<String>> entitiesByType = _namespaceHandler.entitiesByType(entities);
			for (Map.Entry<String, List<String>> entry : entitiesByType.entrySet()) {

				String entityType = entry.getKey();
				List<String> entitySubgroup = entry.getValue();

				if (entitySubgroup == null || entitySubgroup.isEmpty()) {
					continue;
				}

				String finEntityIntervalTable = _applicationConfiguration.getIntervalTable(entityType, FIN_ENTITY_BUCKETS.name(), date.getDurationPerBin().getInterval());
				String finEntityEntityIdColumn = _applicationConfiguration.getColumn(entityType, FIN_ENTITY_BUCKETS.name(), ENTITY_ID.name());
				String finEntityInboundAmountColumn = _applicationConfiguration.getColumn(entityType, FIN_ENTITY_BUCKETS.name(), INBOUND_AMOUNT.name());
				String finEntityOutboundAmountColumn = _applicationConfiguration.getColumn(entityType, FIN_ENTITY_BUCKETS.name(), OUTBOUND_AMOUNT.name());
				String finEntityDateColumn = _applicationConfiguration.getColumn(entityType, FIN_ENTITY_BUCKETS.name(), PERIOD_DATE.name());

				Statement stmt = connection.createStatement();

				// process entities in batches
				List<String> idsCopy = new ArrayList<String>(entitySubgroup); // copy the ids as we will take 1000 at a time to process and the take method is destructive
				while (idsCopy.size() > 0) {
					List<String> tempSubList = (idsCopy.size() > 1000) ? idsCopy.subList(0, 999) : idsCopy; // get the next 1000
					List<String> subIds = new ArrayList<String>(tempSubList); // copy as the next step is destructive
					tempSubList.clear(); // this clears the IDs from idsCopy as tempSubList is backed by idsCopy

					String ids = createIdListFromCollection(subIds);

					String tsSQL = buildStatementForTimeSeriesAggregation(
						ids,
						finEntityEntityIdColumn,
						finEntityDateColumn,
						finEntityInboundAmountColumn,
						finEntityOutboundAmountColumn,
						finEntityIntervalTable,
						startDate,
						endDate
					);

					getLogger().trace(tsSQL);

					if (stmt.execute(tsSQL)) {
						ResultSet rs = stmt.getResultSet();
						while (rs.next()) {
							String entity = rs.getString(finEntityEntityIdColumn);
							Double inboundAmount = rs.getDouble(finEntityInboundAmountColumn);
							Double outboundAmount = rs.getDouble(finEntityOutboundAmountColumn);
							Date rsDate = rs.getDate(finEntityDateColumn);

							// globalize this for return
							entity = influentIDFromRaw(InfluentId.ACCOUNT, entityType, entity).toString();

							List<FL_Link> linkList = results.get(entity);
							if (linkList == null) {
								linkList = new LinkedList<FL_Link>();
								results.put(entity, linkList);
							}

							List<FL_Property> inProperties = new ArrayList<FL_Property>();
							inProperties.add(new PropertyHelper(FL_PropertyTag.AMOUNT, inboundAmount));
							inProperties.add(new PropertyHelper(FL_PropertyTag.DATE, rsDate));

							List<FL_Property> outProperties = new ArrayList<FL_Property>();
							outProperties.add(new PropertyHelper(FL_PropertyTag.AMOUNT, outboundAmount));
							outProperties.add(new PropertyHelper(FL_PropertyTag.DATE, rsDate));

							FL_Link inLink = FL_Link.newBuilder()
								.setUid(InfluentId.fromNativeId(InfluentId.LINK, linkDescriptors.getTypes().get(0).getKey(), UUID.randomUUID().toString()).toString())
								.setLinkTypes(null)
								.setSource(null)
								.setTarget(entity)
								.setType(linkDescriptors.getTypes().get(0).getKey())
								.setDirected(false)
								.setProvenance(null)
								.setUncertainty(null)
								.setProperties(inProperties)
								.build();
							FL_Link outLink = FL_Link.newBuilder()
								.setUid(InfluentId.fromNativeId(InfluentId.LINK, linkDescriptors.getTypes().get(0).getKey(), UUID.randomUUID().toString()).toString())
								.setLinkTypes(null)
								.setSource(entity)
								.setTarget(null)
								.setType(linkDescriptors.getTypes().get(0).getKey())
								.setDirected(false)
								.setProvenance(null)
								.setUncertainty(null)
								.setProperties(outProperties)
								.build();
							linkList.add(inLink);
							linkList.add(outLink);
						}
						rs.close();
					}
				}
				stmt.close();
			}
			connection.close();
		} catch (ClassNotFoundException e) {
			throw new AvroRemoteException(e);
		} catch (SQLException e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				if (connection != null) {
					connection.close();
				}
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}

		return results;
	}




	protected String buildStatementForTimeSeriesAggregation(
		String ids,
		String finEntityEntityIdColumn,
		String finEntityDateColumn,
		String finEntityInboundAmountColumn,
		String finEntityOutboundAmountColumn,
		String finEntityIntervalTable,
		DateTime startDate,
		DateTime endDate

	) {
		if (finEntityEntityIdColumn == null ||
			finEntityDateColumn == null ||
			finEntityInboundAmountColumn == null ||
			finEntityOutboundAmountColumn == null ||
			finEntityIntervalTable == null ||
			startDate == null ||
			endDate == null
			) {
			getLogger().error("buildStatementForTimeSeriesAggregation: Invalid parameter");
			return null;
		}

		StringBuilder sb = new StringBuilder();

		sb.append("SELECT ");
		sb.append(finEntityEntityIdColumn);
		sb.append(", ");
		sb.append(finEntityDateColumn);
		sb.append(", ");
		sb.append(finEntityInboundAmountColumn);
		sb.append(", ");
		sb.append(finEntityOutboundAmountColumn);
		sb.append(" FROM ");
		sb.append(finEntityIntervalTable);
		sb.append(" WHERE ");
		sb.append(finEntityDateColumn);
		sb.append(" BETWEEN '");
		sb.append(getNamespaceHandler().formatDate(startDate));
		sb.append("' AND '");
		sb.append(getNamespaceHandler().formatDate(endDate));
		sb.append("'");

		if (ids.length() > 0) {
			sb.append(" AND ");
			sb.append(finEntityEntityIdColumn);
			sb.append(" IN (");
			sb.append(ids);
			sb.append(") ");
		}

		return sb.toString();
	}




	protected String buildStatementForFocusFlow(
		String ids,
		String focusIds,
		String finFlowFromEntityIdColumn,
		String finFlowFromEntityTypeColumn,
		String finFlowToEntityIdColumn,
		String finFlowToEntityTypeColumn,
		String finFlowDateColumn,
		String finFlowAmountColumn,
		String finFlowIntervalTable,
		DateTime startDate,
		DateTime endDate
	) {
		if (finFlowFromEntityIdColumn == null ||
			finFlowFromEntityTypeColumn == null ||
			finFlowToEntityIdColumn == null ||
			finFlowToEntityTypeColumn == null ||
			finFlowDateColumn == null ||
			finFlowAmountColumn == null ||
			finFlowIntervalTable == null ||
			startDate == null ||
			endDate == null
		) {
			getLogger().error("buildStatementForFlow: Invalid parameter");
			return null;
		}

		StringBuilder sb = new StringBuilder();

		sb.append("SELECT ");
		sb.append(finFlowFromEntityIdColumn);
		sb.append(", ");
		sb.append(finFlowFromEntityTypeColumn);
		sb.append(", ");
		sb.append(finFlowToEntityIdColumn);
		sb.append(", ");
		sb.append(finFlowToEntityTypeColumn);
		sb.append(", ");
		sb.append(finFlowDateColumn);
		sb.append(", ");
		sb.append(finFlowAmountColumn);
		sb.append(" FROM ");
		sb.append(finFlowIntervalTable);
		sb.append(" WHERE ");
		sb.append(finFlowDateColumn);
		sb.append(" BETWEEN '");
		sb.append(getNamespaceHandler().formatDate(startDate));
		sb.append("' AND '");
		sb.append(getNamespaceHandler().formatDate(endDate));
		sb.append("'");
		if (ids.length() > 0) {
			sb.append(" AND ");
			sb.append(finFlowFromEntityIdColumn);
			sb.append(" IN (");
			sb.append(ids);
			sb.append(") ");
		}
		if (focusIds.length() > 0) {
			sb.append(" AND ");
			sb.append(finFlowToEntityIdColumn);
			sb.append(" IN (");
			sb.append(focusIds);
			sb.append(") ");
		}
		sb.append(" UNION ");
		sb.append("SELECT ");
		sb.append(finFlowFromEntityIdColumn);
		sb.append(", ");
		sb.append(finFlowFromEntityTypeColumn);
		sb.append(", ");
		sb.append(finFlowToEntityIdColumn);
		sb.append(", ");
		sb.append(finFlowToEntityTypeColumn);
		sb.append(", ");
		sb.append(finFlowDateColumn);
		sb.append(", ");
		sb.append(finFlowAmountColumn);
		sb.append(" FROM ");
		sb.append(finFlowIntervalTable);
		sb.append(" WHERE ");
		sb.append(finFlowDateColumn);
		sb.append(" BETWEEN '");
		sb.append(getNamespaceHandler().formatDate(startDate));
		sb.append("' AND '");
		sb.append(getNamespaceHandler().formatDate(endDate));
		sb.append("'");
		if (ids.length() > 0) {
			sb.append(" AND ");
			sb.append(finFlowToEntityIdColumn);
			sb.append(" IN (");
			sb.append(ids);
			sb.append(") ");
		}
		if (focusIds.length() > 0) {
			sb.append(" AND ");
			sb.append(finFlowFromEntityIdColumn);
			sb.append(" IN (");
			sb.append(focusIds);
			sb.append(") ");
		}

		return sb.toString();
	}




	@Override
	public Map<String, List<FL_Entity>> getAccounts(
		List<String> entities
	) throws AvroRemoteException {
		Map<String, List<FL_Entity>> map = new HashMap<String, List<FL_Entity>>();
		for (FL_Entity entity : getEntities(entities, FL_LevelOfDetail.SUMMARY)) {
			map.put(entity.getUid(), Collections.singletonList(entity));
		}
		return map;
	}




	public String getClientState(
		String sessionId
	) throws AvroRemoteException {
		String data = null;
		Connection connection = null;
		try {
			connection = _connectionPool.getConnection();

			String clientStateTableName = _applicationConfiguration.getTable(CLIENT_STATE.name(), CLIENT_STATE.name());

			// Create prepared statement
			PreparedStatement stmt = connection.prepareStatement(
				"SELECT data " +
					"FROM " + clientStateTableName + " " +
					"WHERE sessionId = ?"
			);
			stmt.setString(1, sessionId);

			// Log prepared statement
			getLogger().trace(stmt.toString());

			// Execute prepared statement and evaluate results
			ResultSet rs = stmt.executeQuery();
			while (rs.next()) {
				data = rs.getString("data");
			}
			rs.close();

			// Close prepared statement
			stmt.close();

			connection.close();
		} catch (ClassNotFoundException e) {
			throw new AvroRemoteException(e);
		} catch (SQLException e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}

		return data;
	}




	public void setClientState(
		String sessionId,
		String state
	) throws AvroRemoteException {
		Connection connection = null;
		try {
			connection = _connectionPool.getConnection();

			String clientStateTableName = _applicationConfiguration.getTable(CLIENT_STATE.name(), CLIENT_STATE.name());
			boolean exists = false;

			// Create prepared statement
			PreparedStatement stmt = connection.prepareStatement(
				"SELECT sessionId " +
					"FROM " + clientStateTableName + " " +
					"WHERE sessionId = ?"
			);
			stmt.setString(1, sessionId);

			// Execute prepared statement and evaluate results
			ResultSet rs = stmt.executeQuery();
			while (rs.next()) {
				exists = true;
			}
			rs.close();

			// Close prepared statement
			stmt.close();

			String data = state.replaceAll("'", "''");
			DateTime now = new DateTime();

			if (exists) {
				// Create UPDATE prepared statement
				PreparedStatement pstmt = connection.prepareStatement(
					"UPDATE " + clientStateTableName + " " +
						"SET data = ?, modified = ? " +
						"WHERE sessionId = ?"
				);
				pstmt.setString(1, data);
				pstmt.setString(2, getNamespaceHandler().formatDate(now));
				pstmt.setString(3, sessionId);

				// Log prepared statement
				getLogger().trace(pstmt.toString());

				// Execute prepared statement and evaluate results
				pstmt.executeUpdate();

				// Close prepared statement
				pstmt.close();
			} else {
				// Create INSERT prepared statement
				PreparedStatement pstmt = connection.prepareStatement(
					"INSERT INTO " + clientStateTableName + " (sessionId, created, modified, data)" +
						"VALUES (?, ?, ?, ?) "
				);
				pstmt.setString(2, sessionId);
				pstmt.setString(3, getNamespaceHandler().formatDate(now));
				pstmt.setString(4, getNamespaceHandler().formatDate(now));
				pstmt.setString(5, data);

				// Log prepared statement
				getLogger().trace(pstmt.toString());

				// Execute prepared statement and evaluate results
				pstmt.executeUpdate();

				// Close prepared statement
				pstmt.close();
			}

			connection.close();
		} catch (ClassNotFoundException e) {
			throw new AvroRemoteException(e);
		} catch (SQLException e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
	}


	private static String unescapeColumnName(
		String columnName
	) {
		Matcher m = COLUMN_PATTERN.matcher(columnName);
		if (m.find()) {
			return m.group();
		}
		return columnName;
	}




	private String linkEntityTypeClause(
		FL_DirectionFilter direction,
		FL_LinkEntityTypeFilter entityType,
		String finFlowFromEntityTypeColumn,
		String finFlowToEntityTypeColumn
	) {
		if (entityType == FL_LinkEntityTypeFilter.ANY) return " 1=1 ";

		StringBuilder clause = new StringBuilder();
		String type = "A";
		if (entityType == FL_LinkEntityTypeFilter.ACCOUNT_OWNER) {
			type = "O";
		} else if (entityType == FL_LinkEntityTypeFilter.CLUSTER_SUMMARY) {
			type = "S";
		}

		// reverse direction - we are filtering on other entity
		switch (direction) {
			case DESTINATION:
				clause.append(" " + finFlowFromEntityTypeColumn + " = '" + type + "' ");
				break;
			case SOURCE:
				clause.append(" " + finFlowToEntityTypeColumn + " = '" + type + "' ");
				break;
			case BOTH:
				clause.append(" " + finFlowFromEntityTypeColumn + " = '" + type + "' AND " + finFlowToEntityTypeColumn + " = '" + type + "' ");
				break;
		}

		return clause.toString();
	}
}
