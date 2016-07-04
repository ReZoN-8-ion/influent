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
package influent.server.clustering.utils;

import influent.idl.FL_Cluster;
import influent.idl.FL_DistributionRange;
import influent.idl.FL_Entity;
import influent.idl.FL_EntityTag;
import influent.idl.FL_Frequency;
import influent.idl.FL_GeoData;
import influent.idl.FL_Geocoding;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_PropertyType;
import influent.idl.FL_RangeType;
import influent.idl.FL_Uncertainty;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.PropertyHelper;
import influent.idlhelper.SingletonRangeHelper;
import influent.server.clustering.ClusterContext;
import influent.server.clustering.ClusterDistributionProperty;
import influent.server.utilities.IdGenerator;
import influent.server.utilities.InfluentId;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import oculus.aperture.spi.common.Properties;

import org.apache.avro.AvroRemoteException;

public class EntityClusterFactory {
	
	protected final FL_Geocoding geocoder;
	protected final IdGenerator idGenerator;
	protected final List<ClusterDistributionProperty> distProperties = new ArrayList<ClusterDistributionProperty>();
	
	private class Distribution {
		public final Map<Object, Double> frequencies = new HashMap<Object, Double>();
		public final Set<FL_PropertyTag> tags = new HashSet<FL_PropertyTag>();
		public final Boolean normalize;
		public Distribution(boolean normalize) {
			this.normalize = normalize;
		}
		
		@Override
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("(");
			
			String delim = "";
		
			for (Entry<Object, Double> entry : frequencies.entrySet()) {
				str.append(delim).append(entry.getKey()).append("=").append(entry.getValue());
				delim = ",";
			}
			str.append(")");
			
			return str.toString();
		}
	}
	
	public EntityClusterFactory(IdGenerator idGen, FL_Geocoding geocoding, Properties pMgr) {
		this.idGenerator = idGen;
		this.geocoder = geocoding;
		initDistProperties(pMgr);
	}
	
	private void initDistProperties(Properties pMgr) {
		String[] properties = pMgr.getString(ClustererProperties.CLUSTER_PROPERTIES, "TYPE:type-dist,GEO:location-dist").split(",");
		
		for (String property : properties) {
			String[] tokens = property.split(":");
			boolean normalize = (tokens.length == 3) ? Boolean.parseBoolean(tokens[2]) : false;
			distProperties.add( new ClusterDistributionProperty(tokens[0], tokens[1], normalize) );
		}
	}
	
	protected static void increment(Object key, double increment, Map<Object, Double> index) {
		double count = 0;
		
		if (index.containsKey(key)) {
			count = index.get(key);
		}
		count += increment;
		index.put(key, count);
	}
	
	protected static void increment(List<FL_Frequency> stats, Map<Object, Double> index) {
		for (FL_Frequency freq : stats) {
			Object key = null;
			double count = freq.getFrequency();
			
			if (freq.getRange() instanceof FL_GeoData) {
				key = ((FL_GeoData)freq.getRange()).getCc();
			}
			else if (freq.getRange() instanceof Number) {
				key = 0;
				count = ((Number)freq.getRange()).doubleValue();
			}
			else {
				key = freq.getRange();
			}
			
			increment(key, count, index);
		}
	}
	
	protected String getRepresentativeLabel(List<FL_Entity> entities, List<FL_Cluster> clusters) {
		// if we have entities pick the first label we find
		if (entities != null && !entities.isEmpty()) {
			for (FL_Entity entity : entities) {
				PropertyHelper labelProp = EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.LABEL);
				if (labelProp != null) {
					return (String)labelProp.getValue();
				}
			}
		}
		else if (clusters != null && !clusters.isEmpty()) { // otherwise, if we have clusters then pick the first label we find
			for (FL_Cluster cluster : clusters) {
				PropertyHelper labelProp = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
				if (labelProp != null) {
					return (String)labelProp.getValue();
				}
			}
		}
		return "";
	}
	
	protected PropertyHelper getFirstProperty(FL_Entity entity, String tagOrName) {
		PropertyHelper prop = null;
		FL_PropertyTag tag = null;
		
		try {
			tag = FL_PropertyTag.valueOf(tagOrName);
		}
		catch (Exception e) { }
		
		if (tag != null) {
			prop = EntityHelper.getFirstPropertyByTag(entity, tag);
		}
		if (prop == null) {
			prop = EntityHelper.getFirstProperty(entity, tagOrName);
		}
		return prop;
	}
	
	private Map<String, Distribution> initDistSummaries() {
		Map<String, Distribution> distSummaries = new HashMap<String, Distribution>();
		
		for (ClusterDistributionProperty distProp : this.distProperties) {
			distSummaries.put(distProp.clusterFieldName, new Distribution(distProp.normalize));
		}
		
		return distSummaries;
	}
	
	private void updateDistSummaries(FL_Entity entity, Map<String, Distribution> distSummaries) {
		for (ClusterDistributionProperty distProp : this.distProperties) {
			PropertyHelper prop = getFirstProperty(entity, distProp.entityTagOrFieldName);
			if (prop != null) {
				Object value = prop.getValue();
				if (value != null) {
					Distribution distribution = distSummaries.get(distProp.clusterFieldName);
					distribution.tags.addAll( prop.getTags() );
					
					if (value instanceof FL_GeoData) {
						String cc = ((FL_GeoData)value).getCc();
						if (cc != null && !cc.isEmpty()) {
							increment(cc, 1, distribution.frequencies);
						}
					}
					else if (prop.hasTag(FL_PropertyTag.TOPIC)) {
						@SuppressWarnings("unchecked")
						List<FL_Frequency> dist = (List<FL_Frequency>)value;
						for (FL_Frequency freq : dist) {
							String range = (String) freq.getRange();
							increment( range, freq.getFrequency(), distribution.frequencies );
						}
					}
					else if (value instanceof String) {
						increment( (String)value, 1, distribution.frequencies );
					}
					else if (value instanceof Number) {
						increment( 0, ((Number)value).doubleValue(), distribution.frequencies );
					}
					// all other value types are ignored
				}
			}
		}
	}
	
	@SuppressWarnings("unchecked")
	private void updateDistSummaries(FL_Cluster cluster, Map<String, Distribution> distSummaries) {
		for (ClusterDistributionProperty distProp : this.distProperties) {
			PropertyHelper prop = ClusterHelper.getFirstProperty(cluster, distProp.clusterFieldName);
			if (prop != null) {
				Distribution distribution = distSummaries.get(distProp.clusterFieldName);
				
				distribution.tags.addAll( prop.getTags() );
				increment( (List<FL_Frequency>)prop.getValue(), distribution.frequencies );
			}
		}
	}
	
	protected List<FL_Property> createDistProperties(Map<String, Distribution> distSummaries, 
												List<FL_Entity> members, List<FL_Cluster> subClusters, int decendentCount) {
		List<FL_Property> properties = new ArrayList<FL_Property>(distSummaries.size());
		
		for (String fieldName : distSummaries.keySet()) {
			Distribution distribution = distSummaries.get(fieldName);
			
			List<FL_Frequency> freqs = new ArrayList<FL_Frequency>();
			boolean isGeo = distribution.tags.contains(FL_PropertyTag.GEO);
			FL_PropertyType type = isGeo ? FL_PropertyType.GEO : FL_PropertyType.STRING;
			
			double total = 0;
			
			for (Object key : distribution.frequencies.keySet()) {
				Object range = key;
				double freq = distribution.frequencies.get(key);
				
				if (isGeo) {
					FL_GeoData geo = FL_GeoData.newBuilder().setText(null).setLat(null).setLon(null).setCc((String)key).build();
					try {
						geocoder.geocode(Collections.singletonList(geo));
					} catch (AvroRemoteException e) { /* ignore */ }
					range = geo;
				} else if (key instanceof Number) {  // compute the average for the numeric value
					double size = (members != null ? members.size() : 0) + (subClusters != null ? subClusters.size() : 0);  // range is the average stat value
					range = freq / size;
					freq = decendentCount; 
				} 
				
				freqs.add(FL_Frequency.newBuilder().setRange(range).setFrequency(freq).build());
				total += freq;
			}
			
			if (distribution.normalize) {
				for (FL_Frequency freq : freqs) {
					double f = freq.getFrequency();
					if (f != 0 ) {
						freq.setFrequency( f / total );
					}
				}
			}
			
			FL_DistributionRange range = FL_DistributionRange.newBuilder().setDistribution(freqs).setRangeType(FL_RangeType.DISTRIBUTION).setType(type).setIsProbability(false).build();
			FL_Property dist = FL_Property.newBuilder()
					.setKey(fieldName)
					.setFriendlyText(fieldName)
					.setRange(range)
					.setProvenance(null)
					.setUncertainty(null)
					.setTags(new ArrayList<FL_PropertyTag>(distribution.tags))
					.build();
			properties.add(dist);
		}
			
		return properties;
	}
	
	public void updateClusterProperties(FL_Cluster cluster, ClusterContext context, boolean updateChildren) {
		updateClusterProperties(cluster, context.entities, context.clusters, updateChildren);
	}
	
	public void updateClusterProperties(Map<String, FL_Cluster> clusters, ClusterContext context, boolean updateChildren) {
		updateClusterProperties(clusters, context.entities, context.clusters, updateChildren);
	}
	
	public void updateClusterProperties(Map<String, FL_Cluster> clusters, 
										Map<String, FL_Entity> relatedEntities, 
										Map<String, FL_Cluster> relatedClusters,
										boolean updateChildren) {
		for (String id : clusters.keySet()) {
			FL_Cluster cluster = clusters.get(id);
			updateClusterProperties(cluster, relatedEntities, relatedClusters, updateChildren);
		}
	}
	
	public void updateClusterProperties(FL_Cluster cluster, 
										Map<String, FL_Entity> relatedEntities, 
										Map<String, FL_Cluster> relatedClusters, 
										boolean updateChildren) {
		List<FL_Entity> members = new ArrayList<FL_Entity>(cluster.getMembers().size());
		List<FL_Cluster> subClusters = new ArrayList<FL_Cluster>(cluster.getSubclusters().size());
		
		// Find all the member entities for this cluster
		for (String memberId : cluster.getMembers()) {
			FL_Entity member = relatedEntities.get(memberId);

			if (member == null) continue;  // member is not present - consider it removed
			members.add(member);
		}
		// update members
		List<String> memberIds = cluster.getMembers();
		memberIds.clear();
		for (FL_Entity member : members) {
			memberIds.add(member.getUid());
		}
		
		// Find all the sub clusters for this cluster
		// depth first search update sub clusters properties if updateChildren is requested
		for (String subClusterId : cluster.getSubclusters()) {
			FL_Cluster subCluster = relatedClusters.get(subClusterId);
			
			if (subCluster == null) continue;  // sub cluster is not present - consider it removed
			subClusters.add(subCluster);
			// only update sub cluster if update children is true and not an immutable cluster
			if ((updateChildren) && !InfluentId.hasIdClass(subCluster.getUid(), InfluentId.CLUSTER_SUMMARY)) {
				updateClusterProperties(subCluster, relatedEntities, relatedClusters, true);
			}
		}
		// update subclusters
		List<String> subClusterIds = cluster.getSubclusters();
		subClusterIds.clear();
		for (FL_Cluster subCluster : subClusters) {
			subClusterIds.add(subCluster.getUid());
		}
		
		// compute the new cluster properties
		List<FL_Property> updatedProps = computeClusterProperties(members, subClusters);
		
		// update the cluster properties - only replace the updated properties
		for (FL_Property updatedProp : updatedProps) {
			PropertyHelper oldProp = ClusterHelper.getFirstProperty(cluster, updatedProp.getKey());
			
			if (oldProp == null) {
				// property doesn't exist yet - add it to cluster
				cluster.getProperties().add(updatedProp);
			} else {
				// otherwise update the range
				Object oldRange = oldProp.getRange();
				if (oldRange instanceof FL_DistributionRange) {
					FL_DistributionRange oldDistRange = (FL_DistributionRange)oldRange;
					FL_DistributionRange newDistRange = (FL_DistributionRange)updatedProp.getRange();
					oldDistRange.setDistribution(newDistRange.getDistribution());
				}
				else {
					oldProp.setRange(updatedProp.getRange());
				}
			}
		}
	}
	
	protected List<FL_Property> computeClusterProperties(List<FL_Entity> members, List<FL_Cluster> subClusters) {
		List<FL_Property> properties = new LinkedList<FL_Property>();
		
		// initialize decendentCount to number of entities - if there are any
		int decendentCount = members == null ? 0 : members.size();
		int outDegree = -1;
		int inDegree = -1;
		double avgConfidence = 0;
				
		Map<String, Distribution> distSummaries = initDistSummaries();
		
		// first process the entities
		if (members != null) {
			for (FL_Entity entity : members) {
				updateDistSummaries(entity, distSummaries);
				
				PropertyHelper inFlow = EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.INFLOWING);
				if (inFlow != null) {
					inDegree += (Integer)inFlow.getValue();
				}
				PropertyHelper outFlow = EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.OUTFLOWING);
				if (outFlow != null) {
					outDegree += (Integer)outFlow.getValue();
				}
				
				FL_Uncertainty pConfidence = entity.getUncertainty();
				double confidence = pConfidence != null? pConfidence.getConfidence() : 1.0;
				
				avgConfidence += confidence;
			}
		}
		
		// next process the sub clusters
		if (subClusters != null) {
			for (FL_Cluster cluster : subClusters) {
				int count = (Integer)ClusterHelper.getFirstProperty(cluster, "count").getValue(); 
				decendentCount += count;
				
				PropertyHelper inFlow = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
				if (inFlow != null) {
					inDegree += (Integer)inFlow.getValue();
				}
				
				PropertyHelper outFlow = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
				if (outFlow != null) {
					outDegree += (Integer)outFlow.getValue();
				}
			
				updateDistSummaries(cluster, distSummaries);
			
				FL_Uncertainty pConfidence = cluster.getUncertainty();
				double confidence = pConfidence != null? pConfidence.getConfidence() : 1.0;
			
				avgConfidence += count * confidence;
			}
		}
		
		if (decendentCount > 0) {
			avgConfidence /= decendentCount;
		}
		
		// Create mandatory cluster properites
		FL_Property p = new PropertyHelper(
				"count",
				"count",
				decendentCount,
				FL_PropertyType.INTEGER,
				FL_PropertyTag.STAT);
		properties.add(p);
		
		if (inDegree > -1) {
			p = new PropertyHelper(
					"inDegree",
					"Inbound Sources",
					(inDegree + 1),
					FL_PropertyType.INTEGER,
					FL_PropertyTag.INFLOWING);
			properties.add(p);
		}
		
		if (outDegree > -1) {
			p = new PropertyHelper(
					"outDegree",
					"Outbound Targets",
					(outDegree + 1),
					FL_PropertyType.INTEGER,
					FL_PropertyTag.OUTFLOWING);
			properties.add(p);
		}
		
		// compute the representative label for the cluster and set as name
		String label = getRepresentativeLabel(members, subClusters);
		p = new PropertyHelper(
				"name",
				"name",
				label,
				FL_PropertyType.STRING,
				FL_PropertyTag.TEXT);
		properties.add(p);
		
		// Add the cluster distribution properties
		properties.addAll( createDistProperties(distSummaries, members, subClusters, decendentCount) );

		// add a confidence property
		p = new PropertyHelper(
				"confidence",
				"confidence",
				avgConfidence,
				FL_PropertyType.DOUBLE,
				FL_PropertyTag.STAT);
		properties.add(p);
		
		return properties;
	}

	public FL_Cluster toCluster(List<FL_Entity> entities) {
		return toCluster(entities, new ArrayList<FL_Cluster>(0));
	}
	
	public FL_Cluster toCluster(List<FL_Entity> entities, List<FL_Cluster> subClusters) {
		String clusterId = idGenerator.nextId();
		return toCluster(clusterId, entities, subClusters);
	}
	
	public FL_Cluster toCluster(String clusterId, List<FL_Entity> entities, List<FL_Cluster> subClusters) {
		
		
		List<String> childEntityIds = new LinkedList<String>();
		List<String> childClusterIds = new LinkedList<String>();
		
		// create the cluster entity properties
		List<FL_Property> properties = computeClusterProperties(entities, subClusters); 
		
		// add entity members if there are any
		if (entities != null) {
			for (FL_Entity entity : entities) {
				childEntityIds.add(entity.getUid());
			}
		}
		
		// add sub clusters if there are any
		if (subClusters != null) {
			for (FL_Cluster cluster : subClusters) {
				cluster.setParent(clusterId);  // sub cluster is now a child of new cluster
				childClusterIds.add(cluster.getUid());
			}
		}
		
		// retrieve the cluster label and average confidence from the properties
		String label = "";
		double avgConfidence = 0;
		for (FL_Property prop : properties) {
			if (prop.getKey().equals("confidence")) {
				avgConfidence = (Double)PropertyHelper.from(prop).getValue();
			} else if (prop.getKey().equals("name")) {
				label = (String)PropertyHelper.from(prop).getValue();
			}
		}

		// create the entity cluster and return
		ClusterHelper cluster = new ClusterHelper(clusterId, 
											label,
											FL_EntityTag.CLUSTER,
											properties,
											new LinkedList<String>(childEntityIds),
											new LinkedList<String>(childClusterIds),
											null,
											null,
											-1);
		cluster.setUncertainty(FL_Uncertainty.newBuilder().setConfidence(avgConfidence).build());
		
		// lastly associate cluster with each entity
		if (entities != null) {
			setEntityCluster(entities, cluster);
		}
		
		return cluster;
	}
	
	public FL_Cluster toAccountOwnerSummary(FL_Entity owner, List<FL_Entity> accounts, List<FL_Cluster> accountClusters) {
		FL_Cluster ownerCluster = this.toCluster(accounts, accountClusters);
		
		String rawId = InfluentId.fromInfluentId(owner.getUid()).getNativeId();
		String namespace = InfluentId.fromInfluentId(owner.getUid()).getIdType();
		
		ownerCluster.setUid( InfluentId.fromNativeId(InfluentId.ACCOUNT_OWNER, namespace, rawId).getInfluentId() );
		ownerCluster.getTags().add(FL_EntityTag.ACCOUNT_OWNER);
		
		FL_Property label = ClusterHelper.getFirstPropertyByTag(ownerCluster, FL_PropertyTag.LABEL);
		label.setRange( SingletonRangeHelper.from( (String)EntityHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL).getValue()) );
		
		for (FL_Cluster cluster : accountClusters) {
			cluster.setParent(ownerCluster.getUid());
			cluster.setRoot(ownerCluster.getUid());
		}
		
		return ownerCluster;
	}
	
	public static void setEntityCluster(List<FL_Entity> entities, FL_Cluster cluster) {
		for (FL_Entity entity : entities) {
			setEntityCluster(entity, cluster);
		}
	}
	
	public static void setEntityCluster(FL_Entity entity, FL_Cluster cluster) {		
		PropertyHelper p = EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.CLUSTER);
		if (p != null) {
			p.setRange( SingletonRangeHelper.from(cluster.getUid()) );
		}
		else {
			p = new PropertyHelper(
					"cluster",
					cluster.getUid(),
					FL_PropertyTag.CLUSTER);
			List<FL_Property> properties = new ArrayList<FL_Property>(entity.getProperties());
			properties.add(p);
			entity.setProperties(properties);
		}
	}
	
	public static Collection<String> findAncestorIds(Collection<String> objectIds, ContextRead targetContext) {
		Collection<String> ancestors = new HashSet<String>();
		
		for (String objectId : objectIds) {
			ancestors.addAll( findAncestorIds(objectId, targetContext) );
		}
		return ancestors;
	}
	
	public static Collection<String> findAncestorIds(String objectId, ContextRead targetContext) {
		Collection<String> ancestors = new HashSet<String>();
		
		FL_Cluster parent = null;
		
		// find parent
		if (InfluentId.hasIdClass(objectId, InfluentId.ACCOUNT)) {
			FL_Entity entity = targetContext.getEntity(objectId);
			if (entity != null) {
				String parentId = ClusterHelper.getEntityParent(entity);
				parent = targetContext.getContext().clusters.get(parentId);
			}
		}
		else {  // cluster object
			FL_Cluster targetCluster = targetContext.getContext().clusters.get(objectId);
			if (targetCluster != null) {
				parent = targetContext.getContext().clusters.get(targetCluster.getParent());
			}
		}
		
		// find all ancestors
		while (parent != null) {
			ancestors.add(parent.getUid());
			parent = targetContext.getContext().clusters.get(parent.getParent());
		}
		return ancestors;
	}
}
