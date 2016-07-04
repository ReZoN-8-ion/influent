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
package influent.server.rest;

import influent.idl.FL_Cluster;
import influent.idl.FL_Clustering;
import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_DataAccess;
import influent.idl.FL_Entity;
import influent.idl.FL_LevelOfDetail;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.clustering.utils.ClusterContextCache.PermitSet;
import influent.server.clustering.utils.ContextCollapser;
import influent.server.clustering.utils.ContextReadWrite;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.utilities.GuidValidator;
import influent.server.utilities.Pair;
import influent.server.utilities.InfluentId;
import influent.server.utilities.UISerializationHelper;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;

import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;

import org.apache.avro.AvroRemoteException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.common.collect.Lists;
import com.google.inject.Inject;

public class ModifyContextResource extends ApertureServerResource{
	
	private final FL_Clustering clusterer;
	private final FL_ClusteringDataAccess clusterAccess;
	private final EntityClusterFactory clusterFactory;
	private final FL_DataAccess entityAccess;
	private final ClusterContextCache contextCache;

	private static final String OK_RESPONSE = "{\"response\":\"ok\"}";

	
	
	@Inject
	public ModifyContextResource(
		FL_ClusteringDataAccess clusterAccess,
		FL_Clustering clusterer, 
		FL_DataAccess entityAccess,
		EntityClusterFactory clusterFactory,
		ClusterContextCache contextCache
	) {
		this.clusterer = clusterer;
		this.clusterAccess = clusterAccess;
		this.entityAccess = entityAccess;
		this.clusterFactory = clusterFactory;
		this.contextCache = contextCache;
	}
	
	
	
	
	private StringRepresentation createReponse(List<Object> modifiedRootObjects, String targetContextId, String sessionId) throws JSONException {
		JSONObject result = new JSONObject();
		
		// return back context id modified (or created) and list of root level entity objects		
		if (modifiedRootObjects != null) {
			//This will be a mix of EntityClusters and FL_Entities
			JSONArray ja = new JSONArray();
			for (Object o : modifiedRootObjects) {
				if (o instanceof FL_Entity) {
					ja.put(UISerializationHelper.toUIJson((FL_Entity)o));
				} else if (o instanceof FL_Cluster) {
					ja.put(UISerializationHelper.toUIJson((FL_Cluster)o));
				}
			}
			
			result.put("targets", ja);
		}
		
		result.put("contextId", targetContextId);
		result.put("sessionId", sessionId);

		return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
	}
	
	
	
	@Post 
	public StringRepresentation modifyContext (String jsonData) throws ResourceException {
		
		try {
			JSONProperties request = new JSONProperties(jsonData);

			String erroneousArgument = null;
			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}

			final String srcContextId = request.getString("sourceContextId", null); // source context to insert entities from
			if (srcContextId != null && !GuidValidator.validateContextString(srcContextId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "srcContextId is not a valid context id");
			}
			
			final String targetContextId = request.getString("targetContextId", null);  // the context to modify
			if (targetContextId != null && !GuidValidator.validateContextString(targetContextId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "targetContextId is not a valid context id");
			}
			
			final String edit = request.getString("edit", null); //Allowed values, 'insert', 'remove', 'create'

			// The "entities" to operate on
			final List<String> entityIds = Lists.newArrayList(request.getStrings("entityIds"));
			
			PermitSet permits = new PermitSet();

			try {
				
				final ContextReadWrite targetContextRW;
				if (targetContextId == null) {
					targetContextRW = null;
				} else {
					targetContextRW = contextCache.getReadWrite(targetContextId, permits);
				}
		
				// INSERT OP
				if (edit.equalsIgnoreCase("insert")) {
					if (targetContextId == null) {
						erroneousArgument = "'targetContextId'";
					}
					else if (entityIds == null || entityIds.size() == 0) {
						erroneousArgument = "'entityIds'";
					} else {
						return createReponse( insert(entityIds, srcContextId, targetContextRW, sessionId), targetContextId, sessionId);
					}
					
				// REMOVE OP
				} else if (edit.equalsIgnoreCase("remove")) {
					if (srcContextId == null) {
						erroneousArgument = "'srcContextId'";
					}
					else if (targetContextId == null) {
						erroneousArgument = "'targetContextId'";
					}
					else if (entityIds == null || entityIds.size() == 0) {
						erroneousArgument = "'entityIds'";
					} else {
						return createReponse( remove(entityIds, targetContextRW, sessionId), targetContextId, sessionId );
					}
					
				// CREATE OP
				} else if (edit.equalsIgnoreCase("create")) {
					if (srcContextId == null) {
						erroneousArgument = "'srcContextId'";
					}
					else if (targetContextId == null) {
						erroneousArgument = "'targetContextId'";
					}
					else {
						create(targetContextRW, srcContextId, sessionId);
						return new StringRepresentation(OK_RESPONSE, MediaType.APPLICATION_JSON);
					}
					
				// DELETE OP
				} else if (edit.equalsIgnoreCase("delete")) {
					if (entityIds == null || entityIds.size() == 0) {
						erroneousArgument = "'entityIds'";
					} else {
						delete(targetContextRW, entityIds, sessionId);
						return new StringRepresentation(OK_RESPONSE, MediaType.APPLICATION_JSON);
					}
				}
				// INVALID OP
				else {
					erroneousArgument = "edit";
				}
				
			} finally {
				permits.revoke();
			}
			
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Argument" + erroneousArgument + " is invalid; unable to modify context"
			);
			
		} catch (JSONException je) {
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Failed to parse modify context request", je);
		} catch (AvroRemoteException are) {
			throw new ResourceException(Status.SERVER_ERROR_INTERNAL, "Error serializing context modifications.", are);
		} catch (IllegalArgumentException iae) {
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Failed to execute modify context request", iae);
		}
	}
	
	
	
	
	private void create(
		ContextReadWrite parentContext,
		String contextId,
		String sessionId
	) throws AvroRemoteException {
		if (contextId != null && !contextId.isEmpty()) {
			// associate context with parent
			parentContext.addChildContext(contextId);
		}
	}
	
	
	
	
	private void delete(
		ContextReadWrite parentContext,
		List<String> contextIds,
		String sessionId
	) throws AvroRemoteException {
				
		for (String contextId : contextIds) {
			// delete the context
			contextCache.remove(contextId);
			
			if (parentContext != null) {
				// un-associate context with parent
				parentContext.removeChildContext(contextId);
			}
		}
	}
	
	
	
	
	private List<Object> insert(
		List<String> childIds, 
		String sourceContextId,
		ContextReadWrite targetContext,
		String sessionId
	) throws JSONException, AvroRemoteException, IllegalArgumentException {
		
		String targetContextId = targetContext.getUid();
			
		List<String> eIds = InfluentId.filterInfluentIds(childIds, InfluentId.ACCOUNT);
		List<String> cIds = InfluentId.filterInfluentIds(childIds, InfluentId.CLUSTER);
		List<String> oIds = InfluentId.filterInfluentIds(childIds, InfluentId.ACCOUNT_OWNER);
		List<String> sIds = InfluentId.filterInfluentIds(childIds, InfluentId.CLUSTER_SUMMARY);
		
		if (sourceContextId == null && cIds.size() > 0) {
			throw new IllegalArgumentException("It is not valid to attempt to insert clusters or cluster summaries into a context without a valid source context id.");
		}
		
		// lookup the accounts 
		List<FL_Entity> accounts = entityAccess.getEntities(eIds, FL_LevelOfDetail.SUMMARY);
		
		// lookup clusters
		List<FL_Cluster> clusters;
		if (sourceContextId != null) {
			clusters = clusterAccess.getClusters(cIds, sourceContextId);	
		} else {
			clusters = new ArrayList<FL_Cluster>();
		}
		
		// lookup owners
		clusters.addAll( clusterAccess.getAccountOwners(oIds) );
					
		// lookup cluster summaries
		clusters.addAll( clusterAccess.getClusterSummary(sIds) );
		
		// cluster the new entities
		clusterer.clusterEntities(accounts, clusters, sourceContextId, targetContext.getUid());
		
		// collapse context entity cluster hierarchy by simplifying the tree for usability
		// returns root level entities that have no containing cluster and all the simplified clusters in the context
		Pair<Collection<FL_Entity>, Collection<FL_Cluster>> simpleContext = ContextCollapser.collapse(targetContext, false, null);
		
		// construct list of clusters that need to be added to context
		clusters = new ArrayList<FL_Cluster>(simpleContext.second);
		
		// construct list of root entities to be added to context
		List<FL_Entity> entities = new ArrayList<FL_Entity>(simpleContext.first);
		
		List<Object> rootObjects = new ArrayList<Object>();
		
		// files want a single root cluster so we create one and give it an id same as the target context
		if (targetContextId.startsWith("file")) {
			// we set the the root id to be the same id as the file context id

			String rootId = InfluentId.fromNativeId(InfluentId.CLUSTER, "cluster", targetContextId).getInfluentId();
			int version = 1;
			
			// grab the previous version number if the file cluster exists and increment
			FL_Cluster prevFile = targetContext.getCluster(rootId);
			if (prevFile != null) {
				version = prevFile.getVersion() + 1;
			}
			
			// find the old roots as these will be the subclusters of the root cluster
			List<FL_Cluster> oldRoots = new LinkedList<FL_Cluster>();
			for (FL_Cluster cluster : clusters) {
				if (cluster.getParent() == null || cluster.getParent().equalsIgnoreCase(rootId)) {
					cluster.setParent(rootId);
					oldRoots.add(cluster);
				}
			}
			
			// update the root cluster by rebuilding it
			FL_Cluster rootCluster = clusterFactory.toCluster(rootId, entities, oldRoots);
			rootCluster.setVersion(version);
			
			// add the root cluster to the list of clusters that have been updated
			clusters.add(rootCluster);
			
			// add the root cluster to the root objects returned
			rootObjects.add(rootCluster);
		}
		else {
			rootObjects.addAll(clusters);
			rootObjects.addAll(entities);
		}
		
		// revise the file context stored in the cache to use the new simplified context
		targetContext.setSimplifiedContext(clusters, entities);
		
		return rootObjects;
	}
	
	
	
	
	private boolean isFile(String id) {
		return InfluentId.hasIdClass(id, InfluentId.CLUSTER) && id.contains("file");
	}
	
	
	
	
	private List<String> childIdsToRemove(List<String> childIds, ContextReadWrite targetContext) {
		List<String> ids = new LinkedList<String>();
		
		for (String childId : childIds) {
			if ( isFile(childId) ) {
				// remove everything in the context
				ids.addAll( targetContext.getContext().roots.keySet() );
			}
			else {
				ids.add(childId);
			}
		}
		return ids;
	}
	
	
	
	
	private List<Object> remove(
		List<String> childIds, 
		ContextReadWrite targetContext,
		String sessionId
	) throws JSONException, AvroRemoteException {
		
		String targetContextId = targetContext.getUid();
		
		List<String> removalIds = childIdsToRemove(childIds, targetContext);

		// find the ancestors of the childIds to be removed - we return revised versions of ancestors to UI to update display
		Collection<String> ancestorIds = EntityClusterFactory.findAncestorIds(removalIds, targetContext);
				
		// remove the children from the cluster context
		clusterAccess.removeMembers(removalIds, targetContextId);

        // collapse context entity cluster hierarchy by simplifying the tree for usability
		// returns root level entities that have no containing cluster and all the simplified clusters in the context
		Pair<Collection<FL_Entity>, Collection<FL_Cluster>> simpleContext = ContextCollapser.collapse(targetContext, false, null);

		// fetch the root entities
		List<FL_Entity> entities = new ArrayList<FL_Entity>(simpleContext.first);	
		List<FL_Cluster> clusters = new ArrayList<FL_Cluster>(simpleContext.second);
		
		List<Object> modifiedAncestors = new ArrayList<Object>();
		
		// files want a single root cluster so we create one and give it an id same as the target context
		if (targetContextId.startsWith("file")) {
			// we set the the root id to be the same id as the file context id

			String rootId = InfluentId.fromNativeId(InfluentId.CLUSTER, "cluster", targetContextId).getInfluentId();
			int version = 1;
			
			// grab the previous version number if the file cluster exists and increment
			FL_Cluster prevFile = targetContext.getCluster(rootId);
			if (prevFile != null) {
				version = prevFile.getVersion() + 1;
			}
			
			// find the old roots as these will be the subclusters of the root cluster
			List<FL_Cluster> oldRoots = new LinkedList<FL_Cluster>();
			for (FL_Cluster cluster : clusters) {
				if (cluster.getParent() == null) {
					oldRoots.add(cluster);
				}
			}
						
			// only create a file cluster if it isn't empty
			if (!entities.isEmpty() || !oldRoots.isEmpty()) {
				// update the root cluster by rebuilding it
				FL_Cluster rootCluster = clusterFactory.toCluster(rootId, entities, oldRoots);
				rootCluster.setVersion(version);
				
				// add the root cluster to the list of clusters that have been updated
				clusters.add(rootCluster);
				
				// add the file to the ancestor list
				ancestorIds.add(rootId);
			}
		}
		
		// revise the context stored in the cache to use the new simplified context
		targetContext.setSimplifiedContext(clusters, entities);
		
		// fetch the modified ancestors
		modifiedAncestors.addAll( targetContext.getClusters(ancestorIds) );
		
		return modifiedAncestors;
	}
}
