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

import com.google.inject.Singleton;
import influent.idl.*;
import influent.idlhelper.ClusterHelper;
import influent.server.clustering.BaseEntityClusterer;
import influent.server.clustering.ClusterContext;
import influent.server.clustering.EntityClusterer;
import influent.server.clustering.utils.*;
import influent.server.clustering.utils.ClusterContextCache.PermitSet;
import influent.server.utilities.Pair;
import influent.server.utilities.SQLConnectionPool;
import influent.server.utilities.InfluentId;
import oculus.aperture.spi.common.Properties;
import org.apache.avro.AvroRemoteException;

import java.sql.SQLException;
import java.util.*;

/**
 * Dynamic clustering impl.
 * @author slangevi
 *
 */
@Singleton
public class DynamicClustering extends AbstractClusteringDataAccess implements FL_Clustering {
	
	private final ClusterContextCache _cache;
	
	public DynamicClustering(
		SQLConnectionPool connectionPool,
		DataNamespaceHandler namespaceHandler,
		FL_DataAccess entityAccess, 
		FL_Geocoding geocoding, 
		EntityClusterer clusterer, 
		EntityClusterFactory clusterFactory,
		Properties config,
		ClusterContextCache cache
	) throws ClassNotFoundException, SQLException {
	
		super(connectionPool, namespaceHandler, entityAccess, geocoding, clusterer, clusterFactory, config);
		
		_clusterer.init( new Object[] {_clusterFactory, _geoCoder, config} );
		
		_cache = cache;
	}
	
	@Override
	public List<String> clusterEntitiesById(
		List<String> entityIds,
		String sourceContextId,
		String targetContextId
	) throws AvroRemoteException {
				
		List<String> accountIds = InfluentId.filterInfluentIds(entityIds, InfluentId.ACCOUNT);
		List<String> clusterIds = InfluentId.filterInfluentIds(entityIds, InfluentId.CLUSTER);
		clusterIds.addAll( InfluentId.filterInfluentIds(entityIds, InfluentId.ACCOUNT_OWNER) );
		clusterIds.addAll( InfluentId.filterInfluentIds(entityIds, InfluentId.CLUSTER_SUMMARY) );
		
		List<FL_Entity> entities = _entityAccess.getEntities(accountIds, FL_LevelOfDetail.SUMMARY);
		List<FL_Cluster> clusters = getClusters(clusterIds, sourceContextId);
		
		return clusterEntities( entities, clusters, sourceContextId, targetContextId );
	}
	
	@Override
	public List<String> clusterEntities(
		List<FL_Entity> entities,
		List<FL_Cluster> clusters,
		String sourceContextId,
		String targetContextId
	) throws AvroRemoteException {

		List<String> rootIds = new ArrayList<String>();
		
		PermitSet permits = new PermitSet();
		
		// fetch the current context
		try {			
			// can be relatively long time to hold a lock on the context but not much to be done about it.
			ContextReadWrite contextRW = _cache.getReadWrite(targetContextId, permits);
			ClusterContext targetContext = contextRW.getContext();
			
			// create a default context if the passed in one is empty
			if (targetContext == null) {
				targetContext = new ClusterContext();
			}
					
			// list of entities to cluster
			List<FL_Entity> newEntities = new ArrayList<FL_Entity>(entities.size());
			
			// split clusters into mutable and immutable clusters
			List<FL_Cluster> mutableClusters = BaseEntityClusterer.filterMutableClusters(clusters);
			List<FL_Cluster> immutableClusters = BaseEntityClusterer.filterImmutableClusters(clusters);
			
			// list of immutable clusters to cluster
			List<FL_Cluster> newClusters = new ArrayList<FL_Cluster>();
		
			// mutable clusters we fetch their child entities and immutable clusters and cluster them
			Pair<List<FL_Entity>, List<FL_Cluster>> immutableChildren = getImmutableChildren(mutableClusters, sourceContextId);
			
			// add the discovered entities to the entities list
			entities.addAll(immutableChildren.first);
			
			// add the discovered immutable cluster to the immutableClusters list
			immutableClusters.addAll(immutableChildren.second);
			
			// filter out all entities that already belong to this context
			newEntities.addAll( filterExistingEntities(entities, targetContext) );
			
			// filter out all immutable clusters that already belong to this context
			newClusters.addAll( filterExistingClusters(immutableClusters, targetContext) );		
			
			// add new entities to context
			targetContext.addEntities(newEntities);
			
			// add immutable clusters to context
			targetContext.addClusters(newClusters);
			
			// add immutable cluster members to context
			targetContext.addEntities( getImmutableChildEntities(newClusters) );
			
			// nothing to do - return
			if (newEntities.isEmpty() && newClusters.isEmpty()) return rootIds;
			
			ClusterContext updatedContext = _clusterer.clusterEntities(newEntities, newClusters, targetContext);
			
			rootIds.addAll(updatedContext.roots.keySet());
			
			contextRW.setContext(updatedContext);
			
		} finally {
			permits.revoke();
		}
		return rootIds;
	}
	
	private List<FL_Entity> getImmutableChildEntities(List<FL_Cluster> immutableClusters) throws AvroRemoteException {
		List<FL_Entity> entities = new ArrayList<FL_Entity>();
		
		for (FL_Cluster immutableCluster : immutableClusters) {
			entities.addAll( _entityAccess.getEntities(immutableCluster.getMembers(), FL_LevelOfDetail.SUMMARY) );
		}
		return entities;
	}
	
	@Override
	public List<FL_Cluster> getClusters(
		List<String> clusterIds, 
		String contextId
	) throws AvroRemoteException {
		
		List<FL_Cluster> results = new ArrayList<FL_Cluster>();
		
		PermitSet permits = new PermitSet();
		
		// fetch the current context
		try {			
			final ContextRead contextRO = _cache.getReadOnly(contextId, permits);
			
			if (contextRO != null) {
				results.addAll( contextRO.getClusters(clusterIds) );
			}
		} finally {
			permits.revoke();
		}
		return results;
	}
	

	private void removeFromAncestor(FL_Entity entity, ClusterContext context) {
		if (entity != null) {
			String parentId = ClusterHelper.getEntityParent(entity);
			FL_Cluster parent = context.clusters.get(parentId);
			if (parent != null) {
				ClusterHelper.removeMember(parent, entity);
				if (parent.getMembers().isEmpty() && parent.getSubclusters().isEmpty()) {
					context.clusters.remove(parentId);
					if (parent.getParent() != null) {
						removeFromAncestor(parent, context);
					}
					else {
						context.roots.remove(parentId);
					}
				}
			}
		}
	}
		
	private void removeFromAncestor(FL_Cluster cluster, ClusterContext context) {
		if (cluster != null) {
			String parentId = cluster.getParent();
			if (parentId != null) {
				FL_Cluster parent = context.clusters.get(parentId);
				if (parent != null) {
					ClusterHelper.removeSubCluster(parent, cluster);
					if (parent.getMembers().isEmpty() && parent.getSubclusters().isEmpty()) {
						context.clusters.remove(parentId);
						if (parent.getParent() != null) {
							removeFromAncestor(parent, context);
						}
						else {
							context.roots.remove(parentId);
						}
					}
				}
			}
		}
	}
	
	
	
	@Override
	public long removeMembers(List<String> entityIds, String contextId)
			throws AvroRemoteException {
		
		PermitSet permits = new PermitSet();
		
		try {
			ContextReadWrite contextRW = _cache.getReadWrite(contextId, permits);
			ClusterContext context = contextRW.getContext();
		
			// first remove the members from the context
			long count = removeMembers(entityIds, context);
			
			// lastly update the clusters starting from the roots
			_clusterFactory.updateClusterProperties(context.roots, context, true);

			// update the raw cluster context stored in the context
			contextRW.setContext(context);
			
			return count; 
			
		} finally {
			permits.revoke();
		}
	}

	
	private long removeMembers(List<String> entityIds, ClusterContext context) 
			throws AvroRemoteException {
		int count = 0;
		
		// make local copy of list to avoid concurrent modification exceptions
		List<String> removeMembers = new ArrayList<String>(entityIds);
	
		if (context != null) {			
			for (String id : removeMembers) {
				if (InfluentId.hasIdClass(id, InfluentId.ACCOUNT)) {  // remove account
					// remove the entity from the context
					FL_Entity entity = context.entities.remove(id);
					if (entity != null) {
						removeFromAncestor(entity, context);
						count++;
					}
				}
				else {  // remove cluster
					// remove the cluster and all it's members and sub-clusters from the context
					FL_Cluster cluster = context.clusters.remove(id);
					if (cluster != null) {
						count++;
					
						// remove all entities from the context that were members of this cluster
						for (String eId : cluster.getMembers()) {
							context.entities.remove(eId);
						}
					
						// remove all sub-clusters from the context too!
						count += removeMembers(cluster.getSubclusters(), context);
						
						if (cluster.getParent() != null) {
							removeFromAncestor(cluster, context);
						}
						else {
							context.roots.remove(id);
						}
					}
				} 
			}
		}
		return count;
	}
	
	@Override
	public List<FL_Cluster> getContext(
		String contextId
	) throws AvroRemoteException {
		
		List<FL_Cluster> results = new ArrayList<FL_Cluster>();

		PermitSet permits = new PermitSet();
		
		try {
			final ContextRead contextRO = _cache.getReadOnly(contextId, permits);
			
			if (contextRO != null) {
				final ClusterContext context = contextRO.getContext();
				
				if (context != null) {
					for (FL_Cluster c : context.clusters.values()) {
						if (c!= null) {
							// return copies of the cluster to avoid tampering with the internal context!
							FL_Cluster copy = FL_Cluster.newBuilder(c).build();
							// the default avro builders use a immutable list for members and subclusters
							// set mutable version explicitly to ease cluster simplification
							copy.setMembers( new ArrayList<String>(c.getMembers()) );
							copy.setSubclusters( new ArrayList<String>(c.getSubclusters()) );
							results.add( copy );
						}
					}
				}
			}
		} finally {
			permits.revoke();
		}
		return results;
	}
	
	@Override
	public boolean clearContext(
		String contextId
	) throws AvroRemoteException {
		PermitSet permits = new PermitSet();
		
		try {
			ContextReadWrite contextRW = _cache.getReadWrite(contextId, permits);
			if (contextRW != null) {
				contextRW.setContext(null);
				return true;
			}
		} finally {
			permits.revoke();
		}
		return false;
	}
	
	@Override
	public Map<String, List<FL_Link>> getFlowAggregation(
		List<String> entityIds,
		List<String> focusEntityIds, 
		FL_DirectionFilter direction,
		FL_DateRange date, 
		String entitiesContextId,
		String focusContextId
	) throws AvroRemoteException {
		
		PermitSet permits = new PermitSet();
		
		try {
			final ContextRead contextRO = _cache.getReadOnly(entitiesContextId, permits);
			
			if (focusEntityIds == null || focusEntityIds.isEmpty()) {
				final ContextReadWrite focusContextRW = _cache.getReadWrite(focusContextId, permits);
				Map<String, List<FL_Link>> relatedLinks = EntityAggregatedLinks.getRelatedAggregatedLinks(entityIds, direction, date, _entityAccess, true, this, this, contextRO, focusContextRW, _cache);
				return relatedLinks;
			} else {
				final ContextRead focusContextRO = _cache.getReadOnly(focusContextId, permits);
				Map<String, List<FL_Link>> relatedLinks = EntityAggregatedLinks.getAggregatedLinks(entityIds, focusEntityIds, direction, date, _entityAccess, this, contextRO, focusContextRO);
				return relatedLinks;
			}
		} catch (DataAccessException e) {
			throw new AvroRemoteException(e);
		} finally {
			permits.revoke();
		}
	}
	
	@Override
	public Map<String, List<FL_Link>> getTimeSeriesAggregation(
		List<String> entityIds, 
		List<String> focusEntityIds,
		FL_DateRange date, 
		String entitiesContextId, 
		String focusContextId
	) throws AvroRemoteException {

		//Find leaf nodes for focii, and keep track of leaf id ->original cluster id
		Map<String,String> fociiIdMap = new HashMap<String, String>();
		List<String> fociiList = new ArrayList<String>();
		if (focusEntityIds != null) {			
			for (String focusid : focusEntityIds) {
				List<String> flids = getLeafIds(Collections.singletonList(focusid), focusContextId, false);
				fociiList.addAll(flids);
				for (String fli : flids) {
					
					// Point account owners and summaries to their owner account
					InfluentId id = InfluentId.fromInfluentId(fli);
					if (id.getIdClass() == InfluentId.ACCOUNT_OWNER ||
						id.getIdClass() == InfluentId.CLUSTER_SUMMARY) {
							fli = InfluentId.fromNativeId(InfluentId.ACCOUNT, id.getIdType(), id.getNativeId()).toString();
					} 				
					fociiIdMap.put(fli, focusid);
				}
			}
		}
		
		//Find leaf nodes for entities, and keep track of leaf id ->original cluster id
		Map<String,String> entIdMap = new HashMap<String, String>();
		List<String> leafList = new ArrayList<String>();
		for (String entid : entityIds) {
			List<String> elids = getLeafIds(Collections.singletonList(entid), entitiesContextId, false);
			leafList.addAll(elids);
			for (String eli : elids) {
				entIdMap.put(eli, entid);
			}
		}
		
		Map<String, List<FL_Link>> links = _entityAccess.getTimeSeriesAggregation(leafList, fociiList, date);
		
		//Change the ids on the links, so they map to the original clusters passed in, not the underlying leaf nodes.
		for (List<FL_Link> linklist : links.values()) {
			for (FL_Link link : linklist) {
				String source = link.getSource();
				String target = link.getTarget();
				// check if both sides of transaction in our focus
				if (fociiIdMap.containsKey(source) && fociiIdMap.containsKey(target)) {
					// only update one end point of transaction to parent focus entity (if applicable)
					if (entIdMap.containsKey(source)) {
						link.setTarget(fociiIdMap.get(target));
					} else {
						link.setSource(fociiIdMap.get(source));
					}
				} else {
					// update end point of transaction to parent focus entity (if applicable)
					if (source!=null && fociiIdMap.containsKey(source)) {
						link.setSource(fociiIdMap.get(source));
					}
					if (target!=null && fociiIdMap.containsKey(target)) {
						link.setTarget(fociiIdMap.get(target));
					}
				}
			}
		}
		return links;
	}
	
	private List<FL_Entity> filterExistingEntities(List<FL_Entity> entities, ClusterContext context) {
		// if context doesn't exist then all entities are new
		if (context == null) return entities;
		
		List<FL_Entity> newEntities = new ArrayList<FL_Entity>(entities.size());
		
		for (FL_Entity entity : entities) {
			String id = entity.getUid();
			if (!context.entities.containsKey(id)) {
				newEntities.add(entity);
			}
		}
		return newEntities;
	}
	
	private List<FL_Cluster> filterExistingClusters(List<FL_Cluster> clusters, ClusterContext context) {
		// if context doesn't exist then all entities are new
		if (context == null) return clusters;
				
		List<FL_Cluster> newClusters = new ArrayList<FL_Cluster>(clusters.size());
		
		for (FL_Cluster cluster : clusters) {
			String id = cluster.getUid();
			if (!context.clusters.containsKey(id)) {
				newClusters.add(cluster);
			}
		}
		return newClusters;
	}
	
	private Pair<List<FL_Entity>, List<FL_Cluster>> getImmutableChildren(List<FL_Cluster> clusters, String contextId) {		
		Pair<List<FL_Entity>, List<FL_Cluster>> children = new Pair<List<FL_Entity>, List<FL_Cluster>>();
		children.first = new ArrayList<FL_Entity>();
		children.second = new ArrayList<FL_Cluster>();
		
		if (clusters == null || clusters.isEmpty()) return children;
		
		PermitSet permits = new PermitSet();
		
		try {
			final ContextRead contextRO = _cache.getReadOnly(contextId, permits);
			
			if (contextRO != null) {
				for (FL_Cluster cluster : clusters) {
					children.first.addAll( contextRO.getEntities(cluster.getMembers()) );
					
					List<String> subClusterIds = InfluentId.filterInfluentIds(cluster.getSubclusters(), InfluentId.CLUSTER);
					List<String> immutableClusterIds = InfluentId.filterInfluentIds(cluster.getSubclusters(), InfluentId.ACCOUNT_OWNER);
					immutableClusterIds.addAll( InfluentId.filterInfluentIds(cluster.getSubclusters(), InfluentId.CLUSTER_SUMMARY) );
					
					children.second.addAll( contextRO.getClusters(immutableClusterIds) );
					
					Pair<List<FL_Entity>, List<FL_Cluster>> subChildren = getImmutableChildren( 
																				contextRO.getClusters(subClusterIds), contextId);
					children.first.addAll(subChildren.first);
					children.second.addAll(subChildren.second);
				}
			}
			
		} finally {
			permits.revoke();
		}
		return children;
	}
	
	@Override
	public List<String> getLeafIds(
		List<String> ids, 
		String context,
		boolean searchImmutableClusters
	) throws AvroRemoteException {
		if (ids == null || ids.isEmpty()) return Collections.emptyList();
		
		Set<String> lids = new HashSet<String>();

		lids.addAll(InfluentId.filterInfluentIds(ids, InfluentId.ACCOUNT));
		
		if (searchImmutableClusters) {
			// fetch cluster summary members
			Map<String, Set<String>> summaryMemberIds = this.getClusterSummaryMembers(InfluentId.filterInfluentIds(ids, InfluentId.CLUSTER_SUMMARY));
			for (String summaryId : summaryMemberIds.keySet()) {
				lids.addAll(summaryMemberIds.get(summaryId));
			}
		
			// fetch account owner members
			List<String> ownerIds = InfluentId.filterInfluentIds(ids, InfluentId.ACCOUNT_OWNER);
			if (context == null || context.isEmpty()) {
				// no valid context id - retrieve owner leaves from db
				Map<String, List<FL_Entity>> ownerAccounts = _entityAccess.getAccounts(ownerIds);
				for (String ownerId : ownerAccounts.keySet()) {
					for (FL_Entity account : ownerAccounts.get(ownerId)) {
						lids.add(account.getUid());
					}
				}
			} else {
				// context id was passed in - fetch the owner leaves from the context
				lids.addAll(getClusterLeafIds(ownerIds, context, searchImmutableClusters));
			}
			
		} else {
			lids.addAll(InfluentId.filterInfluentIds(ids, InfluentId.ACCOUNT_OWNER));
			lids.addAll(InfluentId.filterInfluentIds(ids, InfluentId.CLUSTER_SUMMARY));
		}
		
		lids.addAll(getClusterLeafIds(InfluentId.filterInfluentIds(ids, InfluentId.CLUSTER), context, searchImmutableClusters));
		
		return new ArrayList<String>(lids);
	}
	
	private Set<String> getClusterLeafIds(
		List<String> clusterIds, 
		String context,
		boolean searchImmutableClusters
	) throws AvroRemoteException {
		
		if (clusterIds == null || clusterIds.isEmpty()) return Collections.emptySet();
		
		Set<String> lids = new HashSet<String>();

		List<FL_Cluster> toSearch = getClusters(clusterIds, context);
		
		for (FL_Cluster flc : toSearch) {
			lids.addAll(flc.getMembers());
			if (flc.getSubclusters()!= null && !flc.getSubclusters().isEmpty()) {
				lids.addAll(getLeafIds(flc.getSubclusters(), context, searchImmutableClusters));
			}
		}
		return lids;
	}
}
