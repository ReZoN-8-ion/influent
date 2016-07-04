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

import influent.idl.FL_Cluster;
import influent.idl.FL_Entity;
import influent.idl.FL_Geocoding;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.clustering.utils.ClustererProperties;
import influent.server.utilities.InfluentId;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import oculus.aperture.spi.common.Properties;

public class GeneralEntityClusterer extends BaseEntityClusterer {
	private FL_Geocoding geoCoder;
	private EntityClusterFactory clusterFactory;
	private Properties pMgr;
	private List<EntityClusterer> clusterStages;
	private int MAX_CLUSTER_SIZE = 10;

	@Override
	public void init(Object[] args) {
		try {
			this.clusterFactory = (EntityClusterFactory)args[0];
			this.geoCoder = (FL_Geocoding)args[1];
			this.pMgr = (Properties)args[2];
			this.MAX_CLUSTER_SIZE = pMgr.getInteger(ClustererProperties.MAX_CLUSTER_SIZE, 10);
			this.clusterStages = createClusterStages(pMgr);
		}
		catch (Exception e) {
			throw new IllegalArgumentException("Invalid initialization parameters.", e);
		}
	}
	
	private List<EntityClusterer> createClusterStages(Properties pMgr) throws Exception{
		List<EntityClusterer> clusterStages = new ArrayList<EntityClusterer>();
		
		try {
			String[] clusterFields = pMgr.getString(ClustererProperties.CLUSTER_FIELDS, "GEO:geo,TYPE:categorical,LABEL:label").split(",");
		
			for (String field : clusterFields) {
				String[] tokens = field.split(":");  // TagOrFieldName, Type, Fuzzy (if label feature)
				if (tokens.length > 1) {
					String tagOrFieldName = tokens[0];
					String type = tokens[1];
				
					if (type.equalsIgnoreCase("categorical")) {
						CategoricalEntityClusterer clusterer = new CategoricalEntityClusterer();
						Object[] params = {clusterFactory, tagOrFieldName}; 
						clusterer.init(params);
						clusterStages.add(clusterer);
					}
					else if (type.equalsIgnoreCase("label")) {
						// first group alphabetically - adjust alpha bucket size based upon max cluster size property
						LabelEntityClusterer clusterer = new LabelEntityClusterer();
						int bucketSize = Math.max((int)Math.ceil(26.0 / MAX_CLUSTER_SIZE), 1);
						Object[] params = {clusterFactory, tagOrFieldName, true, pMgr, bucketSize}; 
						clusterer.init(params);
						clusterStages.add(clusterer);
							
						// cluster again by alpha only if bucket size above was greater than 1
						if (bucketSize > 1) {
							clusterer = new LabelEntityClusterer();
							Object[] params2 = {clusterFactory, tagOrFieldName, true, pMgr, 1}; 
							clusterer.init(params2);
							clusterStages.add(clusterer);
						} 
						
						// next cluster by edit distance or finger print
						clusterer = new LabelEntityClusterer();
						Object[] params3 = {clusterFactory, tagOrFieldName, false, pMgr, MAX_CLUSTER_SIZE}; 
						clusterer.init(params3);
						clusterStages.add(clusterer);
					}
					else if (type.equalsIgnoreCase("geo")) {
						GeoEntityClusterer clusterer = new GeoEntityClusterer();
						Object[] params = {clusterFactory, tagOrFieldName, geoCoder, GeoEntityClusterer.GEO_LEVEL.Continent}; 
						clusterer.init(params);
						clusterStages.add(clusterer);
					
						clusterer = new GeoEntityClusterer();
						Object[] params2 = {clusterFactory, tagOrFieldName, geoCoder, GeoEntityClusterer.GEO_LEVEL.Region}; 
						clusterer.init(params2);
						clusterStages.add(clusterer);
					
						clusterer = new GeoEntityClusterer();
						Object[] params3 = {clusterFactory, tagOrFieldName, geoCoder, GeoEntityClusterer.GEO_LEVEL.Country}; 
						clusterer.init(params3);
						clusterStages.add(clusterer);
					
						clusterer = new GeoEntityClusterer();
						Object[] params4 = {clusterFactory, tagOrFieldName, geoCoder, GeoEntityClusterer.GEO_LEVEL.LatLon}; 
						clusterer.init(params4);
						clusterStages.add(clusterer);
					}
					else if (type.equalsIgnoreCase("topic")) {
						Double k = tokens.length == 3 ? Double.parseDouble(tokens[2]) : 0.5;  
						TopicEntityClusterer clusterer = new TopicEntityClusterer();
						Object[] params = {clusterFactory, tagOrFieldName, k}; 
						clusterer.init(params);
						clusterStages.add(clusterer);
					}
					else if (type.equalsIgnoreCase("numeric")) {
						Double k = tokens.length == 3 ? Double.parseDouble(tokens[2]) : 100;  
						NumericEntityClusterer clusterer = new NumericEntityClusterer();
						Object[] params = {clusterFactory, tagOrFieldName, k, MAX_CLUSTER_SIZE}; 
						clusterer.init(params);
						clusterStages.add(clusterer);
					}
					else {
						log.error("Invalid cluster field type specified for '{}' in clusterer.properties - verify the value of entity.clusterer.clusterfields", tagOrFieldName);
					}
				}
				else {
					log.error("Invalid cluster field '{}' specified in clusterer.properties - verify the value of entity.clusterer.clusterfields", field);
				}
			}
		} catch (Exception e) {
			log.error("Invalid cluster field specified in clusterer.properties - verify the value of entity.clusterer.clusterfields");
		}
		
		if (clusterStages.isEmpty()) {
			log.error("No valid cluster fields have been specified in clusterer.properties");
			throw new Exception("No valid cluster fields have been specified in clusterer.properties");
		}
		
		// last stage ensures no leaf cluster contains more than max cluster size
		MaxSizeEntityClusterer clusterer = new MaxSizeEntityClusterer();
		Object[] params = {clusterFactory, MAX_CLUSTER_SIZE};
		clusterer.init(params);
		clusterStages.add(clusterer);
		
		return clusterStages;
	}
	
	private List<FL_Cluster> getSubClusters(FL_Cluster cluster, ClusterContext context) {
		List<FL_Cluster> subClusters = new LinkedList<FL_Cluster>();
		
		for (String id : cluster.getSubclusters()) {
			subClusters.add( context.clusters.get(id) );
		}
		return subClusters;
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, 
										  Collection<FL_Cluster> immutableClusters, 
										  Collection<FL_Cluster> clusters, 
										  ClusterContext context) {
		throw new UnsupportedOperationException();
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, 
										  Collection<FL_Cluster> immutableClusters, 
										  ClusterContext context) {
		
		// sanity check that the clusterer has been configured and invoked with valid input
		if (clusterStages == null || clusterStages.isEmpty() || context == null) return null;
		
		// filter out immutable root clusters and re-cluster them to avoid being modified
		Collection<FL_Cluster> allRoots = context.roots.values();
		immutableClusters.addAll( filterImmutableClusters(allRoots) );
		List<FL_Cluster> mutableRoots = filterMutableClusters(allRoots); 
		
		// first stage generates root objects in entity cluster hierarchy
		ClusterContext results = clusterStages.get(0).clusterEntities(entities, immutableClusters, mutableRoots, context);
		
		// add the new/modified roots to the context roots
		context.roots.putAll(results.roots);
		
		// keep track of the modified roots - only they need to have their summaries recomputed
		Map<String, FL_Cluster> modifiedRoots = new HashMap<String, FL_Cluster>(results.roots);
		
		// find the candidate clusters to split
		Collection<FL_Cluster> clustersToSplit = new LinkedList<FL_Cluster>();
		findClustersToSplit(results.roots, clustersToSplit);
		
		// add the roots to the allClusters map in context
		context.clusters.putAll(results.roots);
		
		// keep track of a repeatable stages results to determine when it no longer is successful at clustering entities
		int prevResultCount = 0;
		
		//
		// Top down Divisive hierarchical clustering using binning and k-means clustering - each stage clusters by a distinct feature
		//
		int currentStage = 1;
		while (!clustersToSplit.isEmpty()) {
			EntityClusterer clusterer = clusterStages.get(currentStage); 
					
			Map<String, FL_Cluster> stageResults = new HashMap<String, FL_Cluster>();
			
			for (FL_Cluster cluster : clustersToSplit) {
				// sub-cluster the entity cluster
				results = clusterer.clusterEntities( getChildEntities(cluster, context, false), getSubClusters(cluster, context), context );
				
				// update the cluster children to be the sub-clustering results
				// and update the root and parent of the children
				updateClusterReferences(cluster, results.roots);

				// store the new/modified clusters in the context
				context.clusters.putAll(results.roots);
					
				// schedule the cluster for further splitting on another stage
				stageResults.putAll(results.roots);
			}
			// update the clusters to split for next stage
			clustersToSplit.clear();
			findClustersToSplit(stageResults, clustersToSplit);
			if ( isCompletedStage(currentStage, prevResultCount, stageResults.size()) ) {
				currentStage = Math.min(clusterStages.size()-1, ++currentStage); // iterate through stages and stay on last stage until done
				prevResultCount = 0; // reset prev result count since we are in a new stage
			} else {
				prevResultCount = stageResults.size(); // still in the current stage so update the results produced this iteration
			}
		}
		
		// lastly update the modified clusters summaries
		clusterFactory.updateClusterProperties(modifiedRoots, context, true);
		
		// return back the modified context
		return context;
	}
	
	private boolean isRepeatableStage(int currentStage) {
		EntityClusterer clusterer = clusterStages.get(currentStage);
		return (clusterer instanceof NumericEntityClusterer || clusterer instanceof LabelEntityClusterer);
	}
	
	private boolean isCompletedStage(int currentStage, int prevResultCount, int curResultCount) {
		boolean completed = true;
		
		// if the stage is repeatable and we are still producing more clusters than it's not complete
		if ( isRepeatableStage(currentStage) && prevResultCount != curResultCount ) {
			completed = false;
		}
		return completed;
	}
	
	private boolean isCandidate(FL_Cluster cluster) {
		int numEntityMembers = cluster.getMembers().size();
		int numMutables = InfluentId.filterInfluentIds(cluster.getSubclusters(), InfluentId.CLUSTER).size();
		int numImmutables = numEntityMembers + cluster.getSubclusters().size() - numMutables;
		boolean tooLarge = numImmutables > MAX_CLUSTER_SIZE;
		boolean nonLeaf = (numImmutables > 0 && numMutables > 0);
		boolean immutable = isImmutableCluster(cluster);
		return ( !immutable && (tooLarge || nonLeaf) );
	}
	
	private void findClustersToSplit(Map<String, FL_Cluster> candidates, Collection<FL_Cluster> splitQueue) {
		for (String id : candidates.keySet()) {
			FL_Cluster c = candidates.get(id);
			if (isCandidate(c))  {
				splitQueue.add(c);
			}
		}
	}

	private void updateClusterReferences(FL_Cluster cluster, Map<String, FL_Cluster> children) {
		List<String> childClusterIds = new LinkedList<String>();
		
		String parentId = cluster.getUid();
		String rootId = cluster.getRoot() == null ? parentId : cluster.getRoot();
		
		for (String id : children.keySet()) {
			FL_Cluster c = children.get(id);
			c.setParent(parentId);
			c.setRoot(rootId);
			childClusterIds.add(c.getUid());
		}
		cluster.getMembers().clear();
		List<String> mutableSubClusters = InfluentId.filterInfluentIds(cluster.getSubclusters(), InfluentId.CLUSTER);
		Set<String> uniqueIds = new HashSet<String>(mutableSubClusters);
		uniqueIds.addAll(childClusterIds);
		cluster.setSubclusters(new LinkedList<String>(uniqueIds));
	}
}
