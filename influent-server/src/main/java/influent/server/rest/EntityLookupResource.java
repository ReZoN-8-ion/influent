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
import influent.idl.FL_LevelOfDetail;
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


public class EntityLookupResource extends ApertureServerResource{
	
	private final FL_DataAccess service;
	private final ClusterContextCache contextCache;
	
	
	
	@Inject
	public EntityLookupResource(FL_DataAccess service, ClusterContextCache contextCache) {
		this.service = service;
		this.contextCache = contextCache;
	}
	
	
	
	
	@Post("json")
	public StringRepresentation lookup(String jsonData) throws ResourceException {

		JSONObject result = new JSONObject();
		try {
			JSONProperties request = new JSONProperties(jsonData);
			
			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}
			
			final String contextid = request.getString("contextid", null);
			
			// get the root node ID from the form
			List<String> entityIds = Lists.newArrayList(request.getStrings("entities"));
			
			List<String> clusterIds = InfluentId.filterInfluentIds(entityIds, InfluentId.CLUSTER);
			List<String> clusterSummaryIds = InfluentId.filterInfluentIds(entityIds, InfluentId.CLUSTER_SUMMARY);
			clusterIds.addAll(clusterSummaryIds);
			
			List<String> accountIds = InfluentId.filterInfluentIds(entityIds, InfluentId.ACCOUNT);
			
			// If there are any owners, look those up as accounts:
			List<String> ownerIds = InfluentId.filterInfluentIds(entityIds, InfluentId.ACCOUNT_OWNER);
			clusterIds.addAll(ownerIds);	
			
			PermitSet permits = new PermitSet();
			List<FL_Cluster> clusterResults = new ArrayList<FL_Cluster>();
			
			if (!clusterIds.isEmpty()) {
				try {
					ContextRead contextRO = contextCache.getReadOnly(contextid, permits);
					clusterResults.addAll(contextRO.getClusters(clusterIds));									
				} finally {
					permits.revoke();
				}
			}
		
			List<FL_Entity> entityResults = service.getEntities(accountIds, FL_LevelOfDetail.FULL);

			JSONArray ja = new JSONArray();
			
			for (FL_Entity e : entityResults) {
				ja.put(UISerializationHelper.toUIJson(e));	
			}
			for (FL_Cluster ec : clusterResults) {
				ja.put(UISerializationHelper.toUIJson(ec));
			}
			
			result.put("data", ja);
			result.put("sessionId", sessionId);
			
			return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
		}
		catch (JSONException e) {
		throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Unable to create JSON object from supplied options string",
				e
			);
		} catch (AvroRemoteException e) {
			throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"Unable to create JSON object from supplied options string",
					e
				);
		}
	}
}
