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
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.clustering.EntityClusterer;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.utilities.SQLConnectionPool;
import influent.server.utilities.InfluentId;
import oculus.aperture.spi.common.Properties;
import org.apache.avro.AvroRemoteException;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import static influent.server.configuration.ApplicationConfiguration.SystemPropertyKey.*;

public abstract class AbstractClusteringDataAccess implements FL_ClusteringDataAccess {

	protected final FL_DataAccess _entityAccess;
	protected final FL_Geocoding _geoCoder;
	protected final EntityClusterer _clusterer;
	protected final EntityClusterFactory _clusterFactory;
	protected final SQLConnectionPool _connectionPool;
	protected final DataNamespaceHandler _namespaceHandler;

	protected final ApplicationConfiguration _applicationConfiguration;

	protected static final Logger s_logger = LoggerFactory.getLogger(AbstractClusteringDataAccess.class);
	protected Logger getLogger() {
		return s_logger;
	}
	
	public AbstractClusteringDataAccess(
		SQLConnectionPool connectionPool,
		DataNamespaceHandler namespaceHandler,
		FL_DataAccess entityAccess, 
		FL_Geocoding geocoding, 
		EntityClusterer clusterer, 
		EntityClusterFactory clusterFactory,
		Properties config
	) throws ClassNotFoundException, SQLException {
		_connectionPool = connectionPool;
		_namespaceHandler = namespaceHandler;
		_entityAccess = entityAccess;
		_clusterer = clusterer;
		_clusterFactory = clusterFactory;
		_geoCoder = geocoding;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
	}
	
	
	
	
	protected DataNamespaceHandler getNamespaceHandler() {
		return _namespaceHandler;
	}




	protected FL_PropertyDescriptors getDescriptors() throws AvroRemoteException {
		return  _applicationConfiguration.getEntityDescriptors();
	}




	@Override
	public List<FL_Cluster> getAccountOwners(List<String> ownerIds) throws AvroRemoteException{
		List<FL_Cluster> ownerClusters = new LinkedList<FL_Cluster>();
		
		List<FL_Entity> ownerEntities = _entityAccess.getEntities(ownerIds, FL_LevelOfDetail.SUMMARY);
		
		List<String> accountOwnerSummaries = new LinkedList<String>();
		Map<String, FL_Entity> accountOwners = new HashMap<String, FL_Entity>();
		
		for (FL_Entity owner: ownerEntities) {
			PropertyHelper summary = EntityHelper.getFirstPropertyByTag(owner, FL_PropertyTag.CLUSTER_SUMMARY);
			if (summary != null) {
				accountOwnerSummaries.add((String)summary.getValue());
			}
			else {
				accountOwners.put(owner.getUid(), owner);
			}
		}
		
		// fetch all owner cluster summaries
		ownerClusters.addAll( getClusterSummary(accountOwnerSummaries) );

		// fetch all accounts for account owners
		Map<String, List<FL_Entity>> accountsForAccountOwners = _entityAccess.getAccounts( new ArrayList<String>(accountOwners.keySet()) );
		
		// construct owner clusters
		for (String id : accountOwners.keySet()) {
			FL_Entity owner = accountOwners.get(id);
			List<FL_Entity> accounts = accountsForAccountOwners.get(id);
			FL_Cluster ownerCluster = _clusterFactory.toAccountOwnerSummary(owner, accounts, new ArrayList<FL_Cluster>(0));
			addOwnerProperties(ownerCluster, owner);
			ownerClusters.add(ownerCluster);
		}
		return ownerClusters;
	}
	
	private void addOwnerProperties(FL_Cluster ownerCluster) throws AvroRemoteException {
		PropertyHelper prop = ClusterHelper.getFirstPropertyByTag(ownerCluster, FL_PropertyTag.ACCOUNT_OWNER);
		if (prop != null) {
			String ownerId = (String)prop.getValue();
			List<FL_Entity> ownerEntity = _entityAccess.getEntities( Collections.singletonList(ownerId), FL_LevelOfDetail.FULL );
			addOwnerProperties(ownerCluster, ownerEntity.get(0));
		}
	}
	
	private void addOwnerProperties(FL_Cluster ownerCluster, FL_Entity ownerEntity) {
		List<FL_PropertyTag> filter = Arrays.asList( FL_PropertyTag.ENTITY_TYPE,
													FL_PropertyTag.INFLOWING, 
													FL_PropertyTag.OUTFLOWING,
													FL_PropertyTag.TYPE );
		for (FL_Property property : ownerEntity.getProperties()) {
			List<FL_PropertyTag> tags = property.getTags();
			
			if (Collections.disjoint(tags, filter))  {
				ownerCluster.getProperties().add( PropertyHelper.newBuilder(property).build() );
			}
		}
	}
	
	@Override
	public List<FL_Cluster> getClusterSummary(
		List<String> clusterIds
	) throws AvroRemoteException {
		List<FL_Cluster> summaryClusters = new LinkedList<FL_Cluster>();
		
		if (clusterIds == null || clusterIds.isEmpty()) return summaryClusters;

		FL_PropertyDescriptors descriptors = getDescriptors();
		Map<String, List<String>> entitiesByType = _namespaceHandler.entitiesByType(clusterIds);

		Connection connection = null;
		try {

			connection = _connectionPool.getConnection();
		
			for (Map.Entry<String, List<String>> entry : entitiesByType.entrySet()) {

				String entityType = entry.getKey();
				List<String> entitySubgroup = entry.getValue();

				String namespace = null;
				for (FL_TypeDescriptor desc : descriptors.getTypes()) {
					if (desc.getKey().equalsIgnoreCase(entityType)) {
						namespace = desc.getNamespace();
					}
				}

				if (entitySubgroup == null || entitySubgroup.isEmpty()) {
					continue;
				}

				Map<String, Map<String, PropertyHelper>> entityPropMap = new HashMap<String, Map<String, PropertyHelper>>();

				String summaryTable = _applicationConfiguration.getTable(entityType, CLUSTER_SUMMARY.name(), CLUSTER_SUMMARY.name());
				String summaryPropertyColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY.name(), CLUSTER_SUMMARY_PROPERTY.name());
				String summaryTagColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY.name(), CLUSTER_SUMMARY_TAG.name());
				String summaryTypeColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY.name(), CLUSTER_SUMMARY_TYPE.name());
				String summaryValueColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY.name(), CLUSTER_SUMMARY_VALUE.name());
				String summaryStatColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY.name(), CLUSTER_SUMMARY_STAT.name());

				// process src nodes in batches
				List<String> idsCopy = new ArrayList<String>(entitySubgroup); // copy the ids as we will take 1000 at a time to process and the take method is destructive
				while (idsCopy.size() > 0) {
					List<String> tempSubList = (idsCopy.size() > 1000) ? idsCopy.subList(0, 999) : idsCopy; // get the next 1000
					List<String> subIds = new ArrayList<String>(tempSubList); // copy as the next step is destructive
					tempSubList.clear(); // this clears the IDs from idsCopy as tempSubList is backed by idsCopy 
				
					String finEntityTable = _applicationConfiguration.getTable(entityType, FIN_ENTITY.name(), FIN_ENTITY.name());
					String finEntityEntityIdColumn = _applicationConfiguration.getColumn(entityType, FIN_ENTITY.name(), ENTITY_ID.name());
					ApplicationConfiguration.SystemColumnType finEntityEntityIdColumnType = _applicationConfiguration.getColumnType(entityType, FIN_ENTITY.name(), ENTITY_ID.name());
					String finEntityUniqueInboundDegree = _applicationConfiguration.getColumn(entityType, FIN_ENTITY.name(), UNIQUE_INBOUND_DEGREE.name());
					String finEntityUniqueOutboundDegree = _applicationConfiguration.getColumn(entityType, FIN_ENTITY.name(), UNIQUE_OUTBOUND_DEGREE.name());
					
					Map<String, int[]> entityStats = new HashMap<String, int[]>();
	
					// Create prepared statement
					String preparedStatementString = buildPreparedStatementForInboundOutboundDegree(
						subIds.size(),
						finEntityEntityIdColumn, 
						finEntityUniqueInboundDegree,
						finEntityUniqueOutboundDegree, 
						finEntityTable,
						namespace
					);
					PreparedStatement stmt = connection.prepareStatement(preparedStatementString);
					
					int index = 1;
					
					for (int i = 0; i < subIds.size(); i++) {
						stmt.setString(index++, getNamespaceHandler().toSQLId(subIds.get(i), finEntityEntityIdColumnType));
					}
	
					// Execute prepared statement and evaluate results
					ResultSet rs = stmt.executeQuery();
					while (rs.next()) {
						String entityId = rs.getString(finEntityEntityIdColumn);
						int inDegree = rs.getInt(finEntityUniqueInboundDegree);
						int outDegree = rs.getInt(finEntityUniqueOutboundDegree);
					
						entityStats.put(entityId, new int[]{inDegree, outDegree});
					}
					rs.close();
					
					// Close prepared statement
					stmt.close();
	
					// Create prepared statement
					preparedStatementString = buildPreparedStatementForClusterSummary(
						subIds.size(),
						finEntityEntityIdColumn, 
						summaryPropertyColumn,
						summaryTagColumn, 
						summaryTypeColumn,
						summaryValueColumn,
						summaryStatColumn,
						summaryTable,
						namespace
					);
					stmt = connection.prepareStatement(preparedStatementString);
					
					index = 1;
					
					for (int i = 0; i < subIds.size(); i++) {
						stmt.setString(index++, getNamespaceHandler().toSQLId(subIds.get(i), finEntityEntityIdColumnType));
					}
					
					// Execute prepared statement and evaluate results
					rs = stmt.executeQuery();
					while (rs.next()) {
						String id = rs.getString(finEntityEntityIdColumn);
						String property = rs.getString(summaryPropertyColumn);
						String tag = rs.getString(summaryTagColumn);
						String type = rs.getString(summaryTypeColumn);
						String value = rs.getString(summaryValueColumn);
						float stat = rs.getFloat(summaryStatColumn);
						
						Map<String, PropertyHelper> propMap = entityPropMap.get(id);
						if (propMap == null) {
							propMap = new HashMap<String, PropertyHelper>();
							entityPropMap.put(id, propMap);
						}
						
						PropertyHelper prop = propMap.get(property);
						if (prop == null) {
							prop = createProperty(property, tag, type, value, stat);
							if (prop != null) {
								propMap.put(property, prop);
							}
						} else {
							updateProperty(prop, tag, type, value, stat);
						}
					}
					rs.close();
					
					// Close prepared statement
					stmt.close();
					
					for (String id : entityPropMap.keySet()) {
						int[] stats = entityStats.get(id);
						
						if (stats != null) {
							// add degree stats
							Map<String, PropertyHelper> propMap = entityPropMap.get(id);
							propMap.put("inboundDegree", new PropertyHelper("inboundDegree", stats[0], FL_PropertyTag.INFLOWING));
							propMap.put("outboundDegree", new PropertyHelper("outboundDegree", stats[1], FL_PropertyTag.OUTFLOWING));
						}
					}
					
					summaryClusters.addAll(createSummaryClusters(entityPropMap, entityType));
				}
			}

			connection.close();
			return summaryClusters;
			
		} catch (Exception e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
	}


	
	protected Map<String, Set<String>> getClusterSummaryMembers(List<String> clusterSummaryIds) throws AvroRemoteException {
		Map<String, Set<String>> memberIds = new HashMap<String, Set<String>>();

		FL_PropertyDescriptors descriptors = getDescriptors();
		Map<String, List<String>> entitiesByType = _namespaceHandler.entitiesByType(clusterSummaryIds);
		
		Connection connection = null;
		
		try {
			connection = _connectionPool.getConnection();
			
			for (Map.Entry<String, List<String>> entry : entitiesByType.entrySet()) {

				String entityType = entry.getKey();
				List<String> entitySubgroup = entry.getValue();

				if (entitySubgroup == null || entitySubgroup.isEmpty()) {
					continue;
				}

				String summaryMemberTable = _applicationConfiguration.getTable(entityType, CLUSTER_SUMMARY_MEMBERS.name(), CLUSTER_SUMMARY_MEMBERS.name());
				String summaryIdColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY_MEMBERS.name(), CLUSTER_SUMMARY_SUMMARY_ID.name());
				String summaryMemberIdColumn = _applicationConfiguration.getColumn(entityType, CLUSTER_SUMMARY_MEMBERS.name(), CLUSTER_SUMMARY_ENTITY_ID.name());

				// process src nodes in batches 
				List<String> idsCopy = new ArrayList<String>(entitySubgroup); // copy the ids as we will take 1000 at a time to process and the take method is destructive
				while (idsCopy.size() > 0) {
					List<String> tempSubList = (idsCopy.size() > 1000) ? idsCopy.subList(0, 999) : idsCopy; // get the next 1000
					List<String> subIds = new ArrayList<String>(tempSubList); // copy as the next step is destructive
					tempSubList.clear(); // this clears the IDs from idsCopy as tempSubList is backed by idsCopy
					
					// Create prepared statement
					String preparedStatementString = buildPreparedStatementForClusterSummaryMembers(
						subIds.size(),
						summaryIdColumn, 
						summaryMemberIdColumn,
						summaryMemberTable 
					);
					PreparedStatement stmt = connection.prepareStatement(preparedStatementString);
					
					int index = 1;
					
					for (int i = 0; i < subIds.size(); i++) {
						stmt.setString(index++, getNamespaceHandler().toSQLId(subIds.get(i), ApplicationConfiguration.SystemColumnType.STRING));
					}
	
					// Execute prepared statement and evaluate results
					ResultSet rs = stmt.executeQuery();
					while (rs.next()) {
						String summaryId = rs.getString(summaryIdColumn);
						String memberId = rs.getString(summaryMemberIdColumn);
					
						if (!memberIds.containsKey(summaryId)) {
							memberIds.put(summaryId, new HashSet<String>());
						}
						memberIds.get(summaryId).add(memberId);
					}
					rs.close();
					
					// Close prepared statement
					stmt.close();
				}
			}
			
			return memberIds;
		
		} catch (Exception e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
	}
	


	private Object getPropertyValue(FL_PropertyType type, String value) {
		Object propValue = null;
		
		switch (type) {
		case BOOLEAN:
			propValue = Boolean.parseBoolean(value);
			break;
		case DOUBLE:
			propValue = Double.parseDouble(value);
			break;
		case LONG:
			propValue = Long.parseLong(value);
			break;
		case INTEGER:
			propValue = Integer.parseInt(value);
			break;
		case DATE:
			propValue = DateTime.parse(value);
			break;
		case STRING:
		default:
			propValue = value;
			break;
		}
		
		return propValue;
	}
	
	
	
	
	protected PropertyHelper createProperty(String property, String tag, String type, String value, float stat) {
		boolean isDist = (stat > 0);
		
		if (isDist && (value == null || value.isEmpty())) {
			return null;
		}
		
		
		FL_PropertyTag propTag = FL_PropertyTag.valueOf(tag);
		FL_PropertyType propType = FL_PropertyType.valueOf(type);
		
		PropertyHelper prop = null;
		Object propValue = null;
		String friendlyText = null;
		
		// handle special properties
		if (propTag == FL_PropertyTag.COUNTRY_CODE) {
			friendlyText = "Location Distribution";
			propTag = FL_PropertyTag.GEO;
			FL_GeoData geo = FL_GeoData.newBuilder().setText(null).setLat(null).setLon(null).setCc(value).build();
			try {
				_geoCoder.geocode(Collections.singletonList(geo));
			} catch (AvroRemoteException e) { /* ignore - we do our best to geo code */ }
			
			propValue = geo;
		} else if (propTag == FL_PropertyTag.TYPE) {
			friendlyText = "Type Distribution";
			propValue = value;
		} else {  // otherwise we build non-special properties
			propValue = getPropertyValue(propType, value);
			friendlyText = property;
		}
		
		if (isDist) {
			List<FL_Frequency> freqs = new ArrayList<FL_Frequency>();
			freqs.add(FL_Frequency.newBuilder().setRange(propValue).setFrequency(new Double(stat)).build());
			FL_DistributionRange range = FL_DistributionRange.newBuilder().setDistribution(freqs).setRangeType(FL_RangeType.DISTRIBUTION).setType(propType).setIsProbability(false).build();
			prop = new PropertyHelper(property, friendlyText, null, null, Collections.singletonList(propTag), range);
		} else {
			prop = new PropertyHelper(property, friendlyText, propValue, propType, propTag);
		}
			
		return prop;
	}
	
	
	
	
	@SuppressWarnings("unchecked")
	protected void updateProperty(PropertyHelper property, String tag, String type, String value, float stat) {
		if (value == null || value.isEmpty()) {
			return;
		}
		
		FL_PropertyTag propTag = FL_PropertyTag.valueOf(tag);
		FL_PropertyType propType = FL_PropertyType.valueOf(type);
		
		Object propValue = null;
		
		if (propTag == FL_PropertyTag.COUNTRY_CODE) {
			FL_GeoData geo = FL_GeoData.newBuilder().setText(null).setLat(null).setLon(null).setCc(value).build();
			try {
				_geoCoder.geocode(Collections.singletonList(geo));
			} catch (AvroRemoteException e) { /* ignore - we do our best to geo code */ }
			
			propValue = geo;
		} else {
			propValue = getPropertyValue(propType, value);
		}
		
		// update distribution range - assumes updateProperty is only applied to distribution properties - which should be the case
		List<FL_Frequency> freqs = (List<FL_Frequency>)property.getValue();
		
		freqs.add(FL_Frequency.newBuilder().setRange(propValue).setFrequency(new Double(stat)).build());
	}
	
	
	
	
	@SuppressWarnings("unchecked")
	protected List<FL_Cluster> createSummaryClusters(Map<String, Map<String, PropertyHelper>> entityPropMap, String entityType) throws AvroRemoteException {
		List<FL_Cluster> summaries = new ArrayList<FL_Cluster>(entityPropMap.size());
		
		for (String id : entityPropMap.keySet()) {
			List<FL_EntityTag> tagList = new LinkedList<FL_EntityTag>();
			tagList.add(FL_EntityTag.CLUSTER_SUMMARY);
			String label = "";
			
			Map<String, PropertyHelper> propMap = entityPropMap.get(id);
			
			List<FL_Property> props = new ArrayList<FL_Property>(propMap.size());
			
			for (String prop : propMap.keySet()) {
				PropertyHelper p = propMap.get(prop);
				if (p.hasTag(FL_PropertyTag.LABEL)) {
					Object val = p.getValue();
					if (val instanceof String) {
						label = (String)p.getValue();
					} else {
						List<FL_Frequency> freqs = (List<FL_Frequency>)val;
						label = (freqs.isEmpty()) ? "Unknown" : (String)freqs.get(0).getRange();
					}
				} else if (p.getKey().equalsIgnoreCase("UNBRANCHABLE")) {
					tagList.add(FL_EntityTag.UNBRANCHABLE);
				} else {
					props.add(p);
				}
			}
			
			summaries.add(
				new ClusterHelper(
					getNamespaceHandler().globalFromLocalEntityId(InfluentId.CLUSTER_SUMMARY, entityType, id),
					label,
					tagList,
					props,
					new ArrayList<String>(0),
					new ArrayList<String>(0),
					null,
					null,
					-1
				)
			);
		}
		for (FL_Cluster summary: summaries) {
			addOwnerProperties(summary);
		}
		return summaries;
	}
	
	
	
	
	private String buildPreparedStatementForInboundOutboundDegree(
		int numIds,
		String finEntityEntityIdColumn,
		String finEntityUniqueInboundDegree,
		String finEntityUniqueOutboundDegree, 
		String finEntityTable,
        String namespace
	) {
		if (numIds < 1 || 
			finEntityEntityIdColumn == null ||
			finEntityUniqueInboundDegree == null ||
			finEntityUniqueOutboundDegree == null ||
			finEntityTable == null
		) {
			getLogger().error("buildPreparedStatementForInboundOutboundDegree: Invalid parameter");
			return null;
		}

		StringBuilder sb = new StringBuilder();
		
		sb.append("SELECT " + finEntityEntityIdColumn + ", " + finEntityUniqueInboundDegree + ", " + finEntityUniqueOutboundDegree + " ");
		sb.append("FROM " + finEntityTable + " ");
		sb.append("WHERE " + finEntityEntityIdColumn + " IN (");
		for (int i = 1; i < numIds; i++) {
			sb.append("?, ");
		}
		sb.append("?) ");
		
		return sb.toString();
	}
	
	
	
	
	private String buildPreparedStatementForClusterSummary(
		int numIds,
		String finEntityEntityIdColumn, 
		String summaryPropertyColumn,
		String summaryTagColumn, 
		String summaryTypeColumn,
		String summaryValueColumn, 
		String summaryStatColumn,
		String summaryTable,
        String namespace
	) {
		if (numIds < 1 || 
			finEntityEntityIdColumn == null ||
			summaryPropertyColumn == null ||
			summaryTagColumn == null ||
			summaryTypeColumn == null ||
			summaryValueColumn == null ||
			summaryStatColumn == null ||
			summaryTable == null
		) {
			getLogger().error("buildPreparedStatementForClusterSummary: Invalid parameter");
			return null;
		}
		
		StringBuilder sb = new StringBuilder();
		
		sb.append("SELECT " + finEntityEntityIdColumn + ", " + summaryPropertyColumn + ", " + summaryTagColumn + ", " + summaryTypeColumn + ", " + summaryValueColumn + ", " + summaryStatColumn + " ");
		sb.append("FROM " + summaryTable + " ");
		sb.append("WHERE " + finEntityEntityIdColumn + " IN (");
		for (int i = 1; i < numIds; i++) {
			sb.append("?, ");
		}
		sb.append("?) ");
		sb.append("ORDER BY " + finEntityEntityIdColumn + ", " + summaryPropertyColumn + ", " + summaryStatColumn + " DESC");
		
		return sb.toString();
	}
	
	
	
	private String buildPreparedStatementForClusterSummaryMembers(
			int numIds,
			String summaryIdColumn,
			String summaryMemberIdColumn,
			String summaryMemberTable
	) {
		if (numIds < 1 || 
			summaryIdColumn == null ||
			summaryMemberIdColumn == null ||
			summaryMemberTable == null
		) {
			getLogger().error("buildPreparedStatementForClusterSummaryMembers: Invalid parameter");
			return null;
		}
		
		StringBuilder sb = new StringBuilder();
		
		sb.append("SELECT " + summaryIdColumn + ", " + summaryMemberIdColumn + " ");
		sb.append("FROM " + summaryMemberTable + " ");
		sb.append("WHERE " + summaryIdColumn + " IN (");
		for (int i = 1; i < numIds; i++) {
			sb.append("?, ");
		}
		sb.append("?) ");
		sb.append("ORDER BY " + summaryIdColumn + ", " + summaryMemberIdColumn + " DESC");
		
		return sb.toString();
	}
}
