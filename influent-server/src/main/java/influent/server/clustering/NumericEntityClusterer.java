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

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import com.oculusinfo.ml.DataSet;
import com.oculusinfo.ml.Instance;
import com.oculusinfo.ml.feature.numeric.NumericVectorFeature;
import com.oculusinfo.ml.feature.numeric.centroid.MeanNumericVectorCentroid;
import com.oculusinfo.ml.feature.numeric.distance.EuclideanDistance;
import com.oculusinfo.ml.unsupervised.cluster.BaseClusterer;
import com.oculusinfo.ml.unsupervised.cluster.Cluster;
import com.oculusinfo.ml.unsupervised.cluster.ClusterResult;
import com.oculusinfo.ml.unsupervised.cluster.kmeans.KMeans;
import com.oculusinfo.ml.unsupervised.cluster.dpmeans.DPMeans;

import influent.idl.FL_Cluster;
import influent.idl.FL_Entity;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.clustering.utils.EntityClusterFactory;

public class NumericEntityClusterer extends BaseEntityClusterer {

	private int MAX_CLUSTER_SIZE = 5;
	private double THRESHOLD = 100.0;
	
	@Override
	public void init(Object[] args) {
		try {
			clusterFactory = (EntityClusterFactory)args[0];
			clusterField = (String)args[1];
			THRESHOLD = (Double)args[2];
			MAX_CLUSTER_SIZE = (Integer)args[3];
		 }
		 catch (Exception e) {
			 throw new IllegalArgumentException("Invalid initialization parameters.", e);
		 }
	}
	
	private Instance createInstance(String id, Double value) {
		Instance inst = new Instance(id);
		
		NumericVectorFeature feature = new NumericVectorFeature("num");
		feature.setValue(new double[]{value});
		inst.addFeature( feature );
		
		return inst;
	}
	
	private Double getDoubleValue(PropertyHelper property) {
		Double val = null;
		
		// try to read the double value of the entity
		if (property != null && property.getRange() != null) {
			Object v = property.getValue();
			if (v instanceof Double) {
				val = (Double)v;
			}
			else if (v instanceof Float) {
				val = (double)(Float)v;
			}
			else if (v instanceof Long) {
				val = (double)(Long)v;
			}
			else if (v instanceof Integer) {
				val = (double)(Integer)v;
			}
		}
		return val;
	}
	
	private DataSet createDataSet(Collection<FL_Entity> entities, Collection<FL_Cluster> immutableClusters, ClusterContext context) {
		DataSet ds = new DataSet();
		
		for (FL_Entity entity : entities) {			
			PropertyHelper prop = getFirstProperty(entity, clusterField);
			if (prop != null) {
				Double val = getDoubleValue(prop);
				
				if (val != null) {
					Instance inst = createInstance(entity.getUid(), val);
					ds.add(inst);
				}
			}
			else {
				// No valid clusterField property found default to -1
				Instance inst = createInstance(entity.getUid(), -1.0);
				ds.add(inst);
			}
		}
		for (FL_Cluster immutableCluster : immutableClusters) {
			PropertyHelper prop = getFirstProperty(immutableCluster, toClusterPropertyName(clusterField));
			if (prop == null) {
				FL_Entity firstChild = getFirstChildEntity(immutableCluster, context);
				if (firstChild != null) {
					prop = getFirstProperty(firstChild, clusterField);
				}
			}
			if (prop != null) {
				Double val = getDoubleValue(prop);
				
				if (val != null) {
					Instance inst = createInstance(immutableCluster.getUid(), val);
					ds.add(inst);
				}
			}
			else {
				// No valid clusterField property found default to -1
				Instance inst = createInstance(immutableCluster.getUid(), -1.0);
				ds.add(inst);
			}
		}
		return ds;
	}
	
	private DataSet createDataSet(Collection<FL_Cluster> entities, ClusterContext context) {
		DataSet ds = new DataSet();
		
		for (FL_Cluster entity : entities) {
			PropertyHelper prop = getFirstProperty(entity, toClusterPropertyName(clusterField));
			if (prop == null) {
				FL_Entity firstChild = getFirstChildEntity(entity, context);
				if (firstChild != null) {
					prop = getFirstProperty(firstChild, clusterField);
				}
			}
			if (prop != null) {
				double val = getDoubleValue(prop);
				Instance inst = createInstance(entity.getUid(), val);
				ds.add(inst);
			}
			else {
				// No valid clusterField property found default to 0.0
				Instance inst = createInstance(entity.getUid(), 0.0);
				ds.add(inst);
			}
		}
		return ds;
	}
	
	private BaseClusterer createNumericClusterer(boolean kmeans) {
		BaseClusterer clusterer = null;
		
		if (kmeans) {
			clusterer = new KMeans(MAX_CLUSTER_SIZE, 5, true); 
		} else {
			DPMeans dpMeans = new DPMeans(3, true);
			dpMeans.setThreshold(THRESHOLD);
			clusterer = dpMeans; 
		}
		clusterer.registerFeatureType("num", MeanNumericVectorCentroid.class, new EuclideanDistance(1.0));
		
		return clusterer;
	}
	
	private ClusterContext secondStageClustering(Collection<FL_Entity> entities, 
											Collection<FL_Cluster> immutableClusters,
											Collection<FL_Cluster> mergeClusters,
											Collection<FL_Cluster> clusters, 
											ClusterContext context) {
		Map<String, FL_Entity> entityIndex = createEntityIndex(entities);
		Map<String, FL_Cluster> mergeClusterIndex = createClusterIndex(mergeClusters);
		Map<String, FL_Cluster> immutableClusterIndex = createClusterIndex(immutableClusters);
		Map<String, FL_Cluster> clusterIndex = createClusterIndex(clusters);
		
		DataSet ds = createDataSet(mergeClusters, context);
		
		BaseClusterer clusterer = createNumericClusterer(true);
		
		List<Cluster> existingClusters = new LinkedList<Cluster>();
		
		for (FL_Cluster cluster : clusters) {			
			double val = 0;
			PropertyHelper prop = getFirstProperty(cluster, toClusterPropertyName(clusterField));
			if (prop != null) {
				val = getDoubleValue(prop);
			}
			Cluster c = clusterer.createCluster();
			c.setId(cluster.getUid());
			NumericVectorFeature feature = new NumericVectorFeature("num");
			feature.setValue(new double[]{val});
			c.addFeature(feature);
			existingClusters.add(c);
		}
		
		ClusterResult rs = null; 
		if (existingClusters.isEmpty()) {
			rs = clusterer.doCluster(ds);
		}
		else {
			rs = clusterer.doIncrementalCluster(ds, existingClusters);
		}
		// clean up
		clusterer.terminate();
		
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		for (Cluster c : rs) {
			List<FL_Cluster> subClusters = new LinkedList<FL_Cluster>();
			List<FL_Entity> members = new LinkedList<FL_Entity>();
			
			for (Instance inst : c.getMembers()) {
				FL_Cluster mergeCluster = mergeClusterIndex.get(inst.getId());
				
				for (String entityId : mergeCluster.getMembers()) {				
					if ( entityIndex.containsKey(entityId) ) {
						members.add( entityIndex.get(entityId) );
					}
				}
				
				for (String subClusterId : mergeCluster.getSubclusters()) {
					if ( immutableClusterIndex.containsKey(subClusterId) ){
						subClusters.add( immutableClusterIndex.get(subClusterId) );
					}
				}
			}
			
			FL_Cluster cluster = clusterIndex.get(c.getId());
			if (cluster == null) {
				cluster = clusterFactory.toCluster(members, subClusters);
				// cache the cluster property
				NumericVectorFeature feature = (NumericVectorFeature)c.getFeature("num");
				double value = feature.getValue()[0];
				addClusterProperty(cluster, clusterField, value);
			}
			else {
				ClusterHelper.addMembers(cluster, members);
				EntityClusterFactory.setEntityCluster(members, cluster);
				
				for (FL_Cluster subCluster : subClusters) {
					ClusterHelper.addSubCluster(cluster, subCluster);
					subCluster.setParent(cluster.getUid());
				}	
				
				// cache the cluster property
				NumericVectorFeature feature = (NumericVectorFeature)c.getFeature("num");
				double value = feature.getValue()[0];
				addClusterProperty(cluster, clusterField, value);
			}
			modifiedClusters.put(cluster.getUid(), cluster);
		}
		
		ClusterContext result = new ClusterContext();
		result.roots.putAll(modifiedClusters);
		result.clusters.putAll(modifiedClusters);
	
		return result;
	}
	
	public ClusterContext firstStageClustering(Collection<FL_Entity> entities, 
										  Collection<FL_Cluster> immutableClusters, 
										  Collection<FL_Cluster> clusters, 
										  ClusterContext context) {
		
		Map<String, FL_Entity> entityIndex = createEntityIndex(entities);
		Map<String, FL_Cluster> immutableClusterIndex = createClusterIndex(immutableClusters);
		Map<String, FL_Cluster> clusterIndex = createClusterIndex(clusters);
		
		DataSet ds = createDataSet(entities, immutableClusters, context);
		
		// first cluster using dp-means to control max difference of members
		BaseClusterer clusterer = createNumericClusterer(false);
		
		List<Cluster> existingClusters = new LinkedList<Cluster>();
		
		for (FL_Cluster cluster : clusters) {			
			double val = 0;
			PropertyHelper prop = getFirstProperty(cluster, toClusterPropertyName(clusterField));
			if (prop != null) {
				val = getDoubleValue(prop);
			}
			Cluster c = clusterer.createCluster();
			c.setId(cluster.getUid());
			NumericVectorFeature feature = new NumericVectorFeature("num");
			feature.setValue(new double[]{val});
			c.addFeature(feature);
			existingClusters.add(c);
		}
		
		ClusterResult rs = null; 
		if (existingClusters.isEmpty()) {
			rs = clusterer.doCluster(ds);
		}
		else {
			rs = clusterer.doIncrementalCluster(ds, existingClusters);
		}
		// clean up
		clusterer.terminate();
		
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		for (Cluster c : rs) {
			List<FL_Cluster> subClusters = new LinkedList<FL_Cluster>();
			List<FL_Entity> members = new LinkedList<FL_Entity>();
			
			for (Instance inst : c.getMembers()) {
				String id = inst.getId();
				if ( entityIndex.containsKey(id) ) {
					members.add( entityIndex.get(id) );
				}
				else if ( immutableClusterIndex.containsKey(id) ){
					subClusters.add( immutableClusterIndex.get(id) );
				}
			}
			
			FL_Cluster cluster = clusterIndex.get(c.getId());
			if (cluster == null) {
				cluster = clusterFactory.toCluster(members, subClusters);
				// cache the cluster property
				NumericVectorFeature feature = (NumericVectorFeature)c.getFeature("num");
				double value = feature.getValue()[0];
				addClusterProperty(cluster, clusterField, value);
			}
			else {
				ClusterHelper.addMembers(cluster, members);
				EntityClusterFactory.setEntityCluster(members, cluster);
				
				for (FL_Cluster subCluster : subClusters) {
					ClusterHelper.addSubCluster(cluster, subCluster);
					subCluster.setParent(cluster.getUid());
				}	
				
				// cache the cluster property
				NumericVectorFeature feature = (NumericVectorFeature)c.getFeature("num");
				double value = feature.getValue()[0];
				addClusterProperty(cluster, clusterField, value);
			}
			modifiedClusters.put(cluster.getUid(), cluster);
		}
		
		ClusterContext result = new ClusterContext();
		result.roots.putAll(modifiedClusters);
		result.clusters.putAll(modifiedClusters);
		
		return result;
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, 
										  Collection<FL_Cluster> immutableClusters, 
										  Collection<FL_Cluster> clusters, 
										  ClusterContext context) {
		ClusterContext modifiedClusters = firstStageClustering(entities, immutableClusters, clusters, context);
		
		Collection<FL_Cluster> newClusters = findNewClusters(modifiedClusters.roots, clusters);
		
		int totalClusters = newClusters.size() + clusters.size();
		
		if (totalClusters > MAX_CLUSTER_SIZE) {
			modifiedClusters = secondStageClustering(entities, immutableClusters, newClusters, clusters, context);
		}
		return modifiedClusters;
	}
	
}
