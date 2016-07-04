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

import influent.idl.FL_DataAccess;
import influent.server.utilities.GuidValidator;
import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;

import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.inject.Inject;

/**
 * Ledger Resource is intended to work with a jQuery DataTable on the front end, as such it
 * handles the parameters sent by them, and returns data in the format it expects.
 * 
 *
 */

public class DataSummaryResource extends ApertureServerResource {
	
	private final FL_DataAccess dataAccess;
	
	
	@Inject
	public DataSummaryResource(FL_DataAccess dataAccess) {
		this.dataAccess = dataAccess;
	}
	
	@Post("json")
	public StringRepresentation getDataSummary(String jsonData) throws ResourceException {
		
		try {
			JSONProperties request = new JSONProperties(jsonData);
			
			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}
			
			return new StringRepresentation(dataAccess.getDataSummary().toString());
		} catch (AvroRemoteException are) {
			throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"Data access error.",
					are
				);
		} catch (JSONException je) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"JSON parse error.",
				je
			);
		}
	}	
}
