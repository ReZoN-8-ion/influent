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

import java.util.Collection;

public interface EntityClusterer {
	
	/***
	 * Method to pass arbitrary initialization parameters to entity clusterer
	 * 
	 * @param args
	 */
	public void init(Object[] args);
	
	/***
	 * Cluster the list of entities into Entity Cluster objects.
	 * 
	 * @param entities to cluster
	 * @return
	 */
	public ClusterContext clusterEntities(Collection<FL_Entity> entities);
	
	/***
	 * Cluster the list of entities into Entity Cluster objects. 
	 * 
	 * @param entities to cluster
	 * @param clusters is a list of existing cluster the entities should be merged with
	 * @param context is the current cluster hierarchy in the context
	 * @return
	 */
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, Collection<FL_Cluster> clusters, ClusterContext context);
	
	/***
	 * Cluster the list of entities and immutable clusters into Entity Cluster objects. 
	 * 
	 * @param entities to cluster
	 * @param immutable clusters are clusters that are treated as atomic entities (their contents can't be altered)
	 * @param clusters is a list of existing clusters the entities and immutable clusters should be merged with
	 * @param context is the current cluster hierarchy in the context
	 * @return
	 */
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, Collection<FL_Cluster> immutableClusters, Collection<FL_Cluster> clusters, ClusterContext context);
	
	/***
	 * Cluster the list of entities into Entity Cluster objects. 
	 * 
	 * @param entities to cluster
	 * @param context is the current cluster hierarchy in the context
	 * @return
	 */
	public ClusterContext clusterEntities(Collection<FL_Entity> entities, ClusterContext context);
}
