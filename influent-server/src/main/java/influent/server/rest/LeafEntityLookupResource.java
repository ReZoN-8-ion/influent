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
import influent.idl.FL_DataAccess;
import influent.idl.FL_Entity;
import influent.idl.FL_EntityTag;
import influent.idl.FL_LevelOfDetail;
import influent.idl.FL_PropertyTag;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.clustering.utils.ClusterContextCache.PermitSet;
import influent.server.clustering.utils.ContextRead;
import influent.server.utilities.GuidValidator;
import influent.server.utilities.InfluentId;
import influent.server.utilities.UISerializationHelper;

import java.util.ArrayList;
import java.util.List;

import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.common.Properties;

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



public class LeafEntityLookupResource extends ApertureServerResource{
	
	private final FL_DataAccess service;
	private final ClusterContextCache contextCache;
	
	
	
	@Inject
	public LeafEntityLookupResource(FL_DataAccess service, ClusterContextCache contextCache) {
		this.service = service;
		this.contextCache = contextCache;
	}
	
	
	
	
	private void getContainedEntitiesHelper(List<String> clusterIds, List<String> leafEntities, ContextRead context) {
		
		if (clusterIds == null || clusterIds.size() == 0) {
			return;
		}
		
		List<FL_Cluster> clusterResults = context.getClusters(clusterIds);
		for (FL_Cluster result : clusterResults) {
			PropertyHelper ownerIdProp = ClusterHelper.getFirstPropertyByTag(result, FL_PropertyTag.ACCOUNT_OWNER);
			
			if (result.getTags().contains(FL_EntityTag.ACCOUNT_OWNER)) {
				leafEntities.add((String)result.getUid());
			} else if (ownerIdProp != null) {
				leafEntities.add((String)ownerIdProp.getValue());
			} else {
				if (result.getMembers() != null && result.getMembers().size() > 0 ) {
					leafEntities.addAll(result.getMembers());
				}
				
				getContainedEntitiesHelper(result.getSubclusters(), leafEntities, context);
			}
		}
	}
	
	
	
	
	@Post("json")
	public StringRepresentation getContainedEntities(String jsonData) throws ResourceException {
		
		JSONObject result = new JSONObject();
		
		try {
			JSONProperties request = new JSONProperties(jsonData);
			
			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}

			// Details or no?
			final Boolean details = request.getBoolean("details", false);
			
			// get the root node ID from the form
			Iterable<Properties> sets = request.getPropertiesSets("entitySets");
			JSONArray resultSets = new JSONArray();
			
			
			for (Properties set : sets) {
				final String contextid = set.getString("contextId", null);
				
				final List<String> entityIds = Lists.newArrayList(set.getStrings("entities"));
			
				PermitSet permits = new PermitSet();
				
				final List<String> clusterIds = InfluentId.filterInfluentIds(entityIds, InfluentId.CLUSTER);
				final List<String> leafIds = new ArrayList<String>();
				if (!clusterIds.isEmpty()) {
					try {
						final ContextRead contextRO = contextCache.getReadOnly(contextid, permits);
						if (contextRO != null) {
							getContainedEntitiesHelper(clusterIds, leafIds, contextRO);
						}
					} finally {
						permits.revoke();
					}
				}
				
				List<String> accountIds = InfluentId.filterInfluentIds(entityIds, InfluentId.ACCOUNT);
				accountIds.addAll(InfluentId.filterInfluentIds(entityIds, InfluentId.ACCOUNT_OWNER));
				accountIds.addAll(InfluentId.filterInfluentIds(entityIds, InfluentId.CLUSTER_SUMMARY));
				accountIds.addAll(leafIds);
				
				JSONArray ja = new JSONArray();
				
				if (details) {
					List<FL_Entity> entityResults = service.getEntities(
						accountIds, FL_LevelOfDetail.FULL
					);
						
					for (FL_Entity e : entityResults) {
						ja.put(UISerializationHelper.toUIJson(e));	
					}
				} else {
					for (String id : accountIds) {
						ja.put(id);
					}
				}
				
				JSONObject resultSet = new JSONObject();
				resultSet.put("contextId", contextid);
				resultSet.put("entities", ja);
				
				resultSets.put(resultSet);
			}
			
			result.put("data", resultSets);
			result.put("sessionId", sessionId);
			
			return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
		
		} catch (JSONException e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Unable to create JSON object from supplied options string",
				e
			);
		} catch (AvroRemoteException e) {
			throw new ResourceException(
				Status.SERVER_ERROR_INTERNAL,
				"Unable to retrieve entities",
				e
			);
		}
	}
}
