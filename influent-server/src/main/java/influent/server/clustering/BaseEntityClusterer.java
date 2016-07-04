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

package influent.server.clustering;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import influent.idl.FL_Cluster;
import influent.idl.FL_DistributionRange;
import influent.idl.FL_Entity;
import influent.idl.FL_Frequency;
import influent.idl.FL_PropertyTag;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.PropertyHelper;
import influent.idlhelper.SingletonRangeHelper;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.utilities.InfluentId;

public abstract class BaseEntityClusterer implements EntityClusterer {
	protected static final Logger log = LoggerFactory.getLogger("influent");
	
	protected String clusterField;
	protected EntityClusterFactory clusterFactory;
	
	protected Map<String, FL_Entity> createEntityIndex(Collection<FL_Entity> entities) {
		Map<String, FL_Entity> index = new HashMap<String, FL_Entity>();
		
		for (FL_Entity entity : entities) {
			index.put(entity.getUid(), entity);
		}
		return index;
	}
	
	protected Map<String, FL_Cluster> createClusterIndex(Collection<FL_Cluster> clusters) {
		Map<String, FL_Cluster> index = new HashMap<String, FL_Cluster>();
		
		for (FL_Cluster cluster : clusters) {
			index.put(cluster.getUid(), cluster);
		}
		return index;
	}
	
	protected PropertyHelper getFirstProperty(FL_Entity entity, String tagOrName) {
		PropertyHelper prop = null;
		FL_PropertyTag tag = null;
		
		try {
			tag = FL_PropertyTag.valueOf(tagOrName);
		}
		catch (Exception e) { /* ignore */ }
		
		if (tag != null) {
			prop = EntityHelper.getFirstPropertyByTag(entity, tag);
		}
		if (prop == null) {
			prop = EntityHelper.getFirstProperty(entity, tagOrName);
		}
		return prop;
	}
	
	protected PropertyHelper getFirstProperty(FL_Cluster cluster, String tagOrName) {
		PropertyHelper prop = null;
		FL_PropertyTag tag = null;
		
		try {
			tag = FL_PropertyTag.valueOf(tagOrName);
		} catch (Exception e) { /* ignore */ }
		
		if (tag != null) {
			prop = ClusterHelper.getFirstPropertyByTag(cluster, tag);
		}
		if (prop == null) {
			prop = ClusterHelper.getFirstProperty(cluster, tagOrName);
		}
		return prop;
	}
	
	protected String toClusterPropertyName(String propName) {
		return "_" + propName;
	}
	
	protected void addClusterProperty(FL_Cluster cluster, String propName, Object value) {
		String clusterPropName = toClusterPropertyName(propName);
		PropertyHelper prop = getFirstProperty(cluster, clusterPropName);
		if (prop == null) {
			prop = new PropertyHelper(clusterPropName, value, FL_PropertyTag.CONSTRUCTED);
			cluster.getProperties().add(prop);
		}
		else {
			prop.setRange( SingletonRangeHelper.fromUnknown(value) );
		}
	}
	
	protected List<FL_Entity> getChildEntities(FL_Cluster cluster, ClusterContext context, boolean recurse) {
		List<FL_Entity> entities = new LinkedList<FL_Entity>();
		
		for (String entityId : cluster.getMembers()) {
			FL_Entity entity = context.entities.get(entityId);
			entities.add(entity);
		}
		
		if (recurse) {
			for (String subClusterId : cluster.getSubclusters()) {
				FL_Cluster subCluster = context.clusters.get(subClusterId);
				entities.addAll( getChildEntities(subCluster, context, true) );
			}
		}
		return entities;
	}
	
	protected FL_Entity getFirstChildEntity(FL_Cluster cluster, ClusterContext context) {
		if (!cluster.getMembers().isEmpty()) {
			FL_Entity child = context.entities.get(cluster.getMembers().get(0));
			return child;
		}
		else if (!cluster.getSubclusters().isEmpty()) {
			FL_Cluster child = context.clusters.get(cluster.getSubclusters().get(0));
			return getFirstChildEntity(child, context);
		}
		return null;
	}
	
	public static boolean isImmutableCluster(String clusterId) {
		return (InfluentId.hasIdClass(clusterId, InfluentId.ACCOUNT_OWNER) || InfluentId.hasIdClass(clusterId, InfluentId.CLUSTER_SUMMARY));
	}
	
	public static boolean isImmutableCluster(FL_Cluster cluster) {
		String id = cluster.getUid();
		return (InfluentId.hasIdClass(id, InfluentId.ACCOUNT_OWNER) || InfluentId.hasIdClass(id, InfluentId.CLUSTER_SUMMARY));
	}
	
	public static List<FL_Cluster> filterImmutableClusters(Collection<FL_Cluster> clusters) {
		List<FL_Cluster> immutableClusters = new ArrayList<FL_Cluster>();
		
		if (clusters == null) return immutableClusters;
		
		for (FL_Cluster cluster : clusters) {
			if (isImmutableCluster(cluster)) {
				immutableClusters.add(cluster);
			}
		}
		return immutableClusters;
	}
	
	public static List<FL_Cluster> filterMutableClusters(Collection<FL_Cluster> clusters) {
		List<FL_Cluster> mutableClusters = new ArrayList<FL_Cluster>();
		
		if (clusters == null) return mutableClusters;
		
		for (FL_Cluster cluster : clusters) {
			if (!isImmutableCluster(cluster)) {
				mutableClusters.add(cluster);
			}
		}
		return mutableClusters;
	}
	
	protected String getBucketKey(FL_Cluster cluster, ClusterContext context) {
		String value = "Unknown";
		
		// first attempt to fetch cached computed cluster property for bucket value
		PropertyHelper prop = getFirstProperty(cluster, toClusterPropertyName(clusterField));
					
		if (prop == null) {
			// if not found attempt to fetch clusterField on cluster
			prop = getFirstProperty(cluster, clusterField);
		}
		
		// if none found then attempt to read bucket value from first child
		if (prop == null) {
			FL_Entity firstChild = getFirstChildEntity(cluster, context);
			if (firstChild != null) {
				prop = getFirstProperty(firstChild, clusterField);
			}
		}
		if (prop != null && prop.getRange() != null) {
			try {
				if (prop.getRange() instanceof FL_DistributionRange) {
					@SuppressWarnings("unchecked")
					List<FL_Frequency> dist = (List<FL_Frequency>)prop.getValue();
					if (!dist.isEmpty()) {
						FL_Frequency freq = dist.get(0);
						value = (String)freq.getRange();	
					}
				}
				else {
					value = (String)prop.getValue();
				}
			}
			catch (Exception e) {
				log.error("Bucket field is not a string! Ignoring.");
			}
		}
		return value;
	}
	
	protected String getBucketKey(FL_Entity entity) {
		String value = "UNKNOWN";
		PropertyHelper prop = getFirstProperty(entity, clusterField);
		if (prop != null) {
			try {
				value = (String)prop.getValue();
			}
			catch (Exception e) {
				log.error("Categorical field is not a string! Ignoring.");
			}
		}
		return value;
	}
	
	protected Map<String, FL_Cluster> mergeClusterBuckets(Map<String, List<FL_Cluster>> srcBuckets, Map<String, FL_Cluster> dstBuckets) {
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		// merge buckets that have the same bucket id or create a new cluster if no previous bucket exists
		for (String bucketId : srcBuckets.keySet()) {
			if (dstBuckets.containsKey(bucketId)) {
				// merge with the prev bucket
				FL_Cluster dstCluster = dstBuckets.get(bucketId);
				List<FL_Cluster> clusters = srcBuckets.get(bucketId);
				
				for (FL_Cluster cluster : clusters) {
					// make src clusters sub clusters of dst cluster
					ClusterHelper.addSubCluster(dstCluster, cluster);
				
					// update the src cluster parent
					cluster.setParent( dstCluster.getUid() );
				
					// cache the computed cluster property
					addClusterProperty(cluster, clusterField, bucketId);
				}
				
				// add the dst cluster to the modified cluster list
				modifiedClusters.put(dstCluster.getUid(), dstCluster);
			}
			else {
				// create a new bucket in dst buckets
				List<FL_Cluster> clusters = srcBuckets.get(bucketId);
				
				FL_Cluster dstCluster = clusterFactory.toCluster(null, clusters);
				
				// update the clusters parent
				for (FL_Cluster cluster : clusters) {
					cluster.setParent( dstCluster.getUid() );
				}
				
				// cache the computed cluster property
				addClusterProperty(dstCluster, clusterField, bucketId);
				
				// add to the dst buckets
				dstBuckets.put(bucketId, dstCluster);
				
				// add the dst cluster to the modified clsuter list 
				modifiedClusters.put(dstCluster.getUid(), dstCluster);
			}
		}		
		return modifiedClusters;
	}
	
	protected Map<String, FL_Cluster> mergeEntityBuckets(Map<String, List<FL_Entity>> srcBuckets, Map<String, FL_Cluster> dstBuckets) {
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		// merge buckets that have the same bucket id or create a new cluster if no previous bucket exists
		for (String bucketId : srcBuckets.keySet()) {
			if (dstBuckets.containsKey(bucketId)) {
				// merge with the prev bucket
				FL_Cluster cluster = dstBuckets.get(bucketId);
				
				List<FL_Entity> entities = srcBuckets.get(bucketId);
				ClusterHelper.addMembers(cluster, entities);
				
				EntityClusterFactory.setEntityCluster(entities, cluster);
				
				modifiedClusters.put(cluster.getUid(), cluster);
			}
			else {
				List<FL_Entity> entities = srcBuckets.get(bucketId);
				FL_Cluster cluster = clusterFactory.toCluster(entities, null);
				modifiedClusters.put(cluster.getUid(), cluster);
			}
		}		
		return modifiedClusters;
	}
	
	protected Collection<FL_Cluster> findNewClusters(Map<String, FL_Cluster> modified, Collection<FL_Cluster> existing) {
		Map<String, FL_Cluster> newClusters = new HashMap<String, FL_Cluster>(modified); 
		
		for (FL_Cluster cluster : existing) {
			newClusters.remove(cluster.getUid());
		}
		return newClusters.values();
	}
	
	protected Map<String, FL_Cluster> retrieveClusterBuckets(Collection<FL_Cluster> clusters, ClusterContext context) {
		Map<String, FL_Cluster> buckets = new HashMap<String, FL_Cluster>();
		
		for (FL_Cluster cluster : clusters) {
			String key = getBucketKey(cluster, context);
			buckets.put(key, cluster);
		}
		return buckets;
	}
	
	protected Map<String, List<FL_Cluster>> bucketClusters(Collection<FL_Cluster> clusters, ClusterContext context) {
		Map<String, List<FL_Cluster>> buckets = new HashMap<String, List<FL_Cluster>>();
		
		for (FL_Cluster cluster : clusters) {
			String key = getBucketKey(cluster, context);
			if (!buckets.containsKey(key)) {
				buckets.put(key, new LinkedList<FL_Cluster>());
			}
			buckets.get(key).add(cluster);
		}
		return buckets;
	}
	
	protected Map<String, List<FL_Entity>> bucketEntities(Collection<FL_Entity> entities) {
		Map<String, List<FL_Entity>> buckets = new HashMap<String, List<FL_Entity>>();
		
		for (FL_Entity entity : entities) {
			String key = getBucketKey(entity);
			if (!buckets.containsKey(key)) {
				buckets.put(key, new LinkedList<FL_Entity>());
			}
			buckets.get(key).add(entity);
		}
		return buckets;
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities) {
		return this.clusterEntities(entities, new ClusterContext());
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, ClusterContext context) {
		return this.clusterEntities(entities, new ArrayList<FL_Cluster>(0), context);
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, Collection<FL_Cluster> clusters, ClusterContext context) {
		List<FL_Cluster> immutableClusters = filterImmutableClusters(clusters);
		List<FL_Cluster> mutableClusters = filterMutableClusters(clusters);
		return this.clusterEntities(entities, immutableClusters, mutableClusters, context);
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities,
										Collection<FL_Cluster> immutableClusters,
										Collection<FL_Cluster> clusters, 
										ClusterContext context) {
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		// fetch previous buckets
		Map<String, FL_Cluster> mutableBuckets = retrieveClusterBuckets(clusters, context);
		
		// bucket immutables
		Map<String, List<FL_Cluster>> immutableBuckets = bucketClusters(immutableClusters, context);
		Map<String, List<FL_Entity>> entityBuckets = bucketEntities(entities);
		
		// merge new buckets into previous buckets
		modifiedClusters.putAll( mergeClusterBuckets(immutableBuckets, mutableBuckets) );
		modifiedClusters.putAll( mergeEntityBuckets(entityBuckets, mutableBuckets) );
				
		ClusterContext result = new ClusterContext();
		result.roots.putAll(modifiedClusters);
		result.clusters.putAll(modifiedClusters);
		return result;
	}
}
