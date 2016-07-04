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

import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_DataAccess;
import influent.idl.FL_Persistence;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.utilities.GuidValidator;

import java.util.Collections;

import oculus.aperture.common.rest.ApertureServerResource;

import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.CacheDirective;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;



public class RestoreStateResource extends ApertureServerResource{

	private final FL_Persistence persistence;
	@SuppressWarnings("unused")
	private final FL_ClusteringDataAccess clusterAccess;
	@SuppressWarnings("unused")
	private final FL_DataAccess entityAccess;
	@SuppressWarnings("unused")
	private final ClusterContextCache contextCache;

	@SuppressWarnings("unused")
	private static final Logger s_logger = LoggerFactory.getLogger(RestoreStateResource.class);
	
	
	
	@Inject
	public RestoreStateResource(FL_Persistence persistence, FL_ClusteringDataAccess clusterAccess, FL_DataAccess entityAccess, ClusterContextCache contextCache) {
		this.persistence = persistence;
		this.clusterAccess = clusterAccess;
		this.entityAccess = entityAccess;
		this.contextCache = contextCache;
	}
	
	
	
	
	@Post("json")
	public StringRepresentation restoreState(String jsonData) throws ResourceException {
		try {
			
			JSONObject jsonObj = new JSONObject(jsonData);
			
			String sessionId = jsonObj.getString("sessionId").trim();
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}
			
			if (sessionId == null || sessionId.length() == 0) {
				throw new ResourceException(
						Status.CLIENT_ERROR_BAD_REQUEST,
						"No sessionId found in persistence request"
					);
			}
			
			sessionId = sessionId.trim();

			String data = persistence.getData(sessionId);
			
			JSONObject result = new JSONObject();
			result.put("sessionId", sessionId);
			result.put("data", data);
			
			getResponse().setCacheDirectives(
				Collections.singletonList(
					CacheDirective.noCache()
				)
			);

			return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
			
		} catch (JSONException e) {
			throw new ResourceException(
				Status.SERVER_ERROR_INTERNAL,
				"Unable to create JSON object from persistence data",
				e
			);
		} catch (AvroRemoteException e) {
			throw new ResourceException(
				Status.SERVER_ERROR_INTERNAL,
				"Exception during AVRO persistence state deserialization",
				e
			);
		}
	}
}
