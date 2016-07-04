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
import influent.idlhelper.ClusterHelper;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.utilities.InfluentId;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class MaxSizeEntityClusterer extends BaseEntityClusterer {
	private int maxClusterSize = 20;
	
	@Override
	public void init(Object[] args) {
		try {
			clusterFactory = (EntityClusterFactory)args[0];
			maxClusterSize = (Integer)args[1];
		}
		catch (Exception e) {
			throw new IllegalArgumentException("Invalid initialization parameters.", e);
		}
	}

	private boolean isFull(FL_Cluster cluster) {
		int numEntityMembers = cluster.getMembers().size();
		int numMutables = InfluentId.filterInfluentIds(cluster.getSubclusters(), InfluentId.CLUSTER).size();
		int numImmutables = numEntityMembers + cluster.getSubclusters().size() - numMutables;
		return numImmutables >= maxClusterSize;
	}
	
	private void addImmutableMember(FL_Cluster cluster, Object immutable) {
		if (immutable instanceof FL_Entity) {
			FL_Entity entity = (FL_Entity)immutable;
			ClusterHelper.addMember(cluster, entity);
			EntityClusterFactory.setEntityCluster(entity, cluster);
		}
		else /* otherwise must be FL_Cluster */ {
			FL_Cluster subCluster = (FL_Cluster)immutable;
			ClusterHelper.addSubCluster(cluster, subCluster);
			subCluster.setParent(cluster.getUid());
		}
	}
	
	private FL_Cluster createSingletonCluster(Object immutable) {
		if (immutable instanceof FL_Entity) {
			FL_Entity entity = (FL_Entity)immutable;
			return clusterFactory.toCluster(Collections.singletonList(entity));
		}
		else /* otherwise must be FL_Cluster */ {
			FL_Cluster subCluster = (FL_Cluster)immutable;
			return clusterFactory.toCluster(null, Collections.singletonList(subCluster));
		}
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, 
										Collection<FL_Cluster> immutableClusters,
										Collection<FL_Cluster> clusters, 
										ClusterContext context) {
		
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		List<FL_Cluster> fullClusters = new ArrayList<FL_Cluster>(maxClusterSize);
		List<FL_Cluster> nonFullClusters = new LinkedList<FL_Cluster>();
		
		// Find clusters that have room for more members
		for (FL_Cluster cluster : clusters) {
			if ( isFull(cluster) ) {
				fullClusters.add( cluster );
			}
			else {
				nonFullClusters.add( cluster );
			}
		}
		
		int candidateCluster = 0;
		
		// iterate through the immutables to be clustered
		// if there are existing clusters not yet full then add entity to first one
		// if all existing clusters are full then create a new cluster to fill up if max clusters hasn't been reached
		// otherwise overflow clusters in a round robin fashion
		List<Object> immutables = new ArrayList<Object>(entities.size() + immutableClusters.size());
		immutables.addAll(entities);
		immutables.addAll(immutableClusters);
		
		for (Object immutable : immutables) {
			if (!nonFullClusters.isEmpty()) {
				FL_Cluster cluster = nonFullClusters.get(0);
				addImmutableMember(cluster, immutable);
				modifiedClusters.put(cluster.getUid(), cluster);
				if ( isFull(cluster) ) {
					nonFullClusters.remove(0);
					fullClusters.add(cluster);
				}
			}
			else if (fullClusters.size() < maxClusterSize) {
				FL_Cluster cluster = createSingletonCluster(immutable);
				modifiedClusters.put(cluster.getUid(), cluster);
				nonFullClusters.add(cluster);
			}
			else {
				FL_Cluster cluster = fullClusters.get(candidateCluster);
				addImmutableMember(cluster, immutable);
				modifiedClusters.put(cluster.getUid(), cluster);
				candidateCluster = (candidateCluster + 1) % maxClusterSize;
			}
		}
		
		ClusterContext result = new ClusterContext();
		result.roots.putAll(modifiedClusters);
		result.clusters.putAll(modifiedClusters);
		return result;
	}
}
