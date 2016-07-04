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

import influent.server.Version;
import influent.server.spi.ExportDataService;

import java.util.Collections;
import java.util.Map;

import javax.xml.bind.JAXBException;

import oculus.aperture.capture.phantom.data.ProcessedTaskInfo;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.CacheDirective;
import org.restlet.data.Status;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.common.collect.Maps;
import com.google.inject.Inject;
import com.google.inject.name.Named;

public class ExportGraphResource extends ApertureServerResource {

	private final ExportDataService service;
	private final int maxCacheAge;

	
	
	@Inject
	public ExportGraphResource(
		ExportDataService service,
		@Named("influent.charts.maxage") Integer maxCacheAge
	) {
		this.service = service;
		this.maxCacheAge = maxCacheAge;
	}
	
	
	
	
	@Post("json")
	public Representation getCapturedImage(String jsonData) throws ResourceException {
	
		try {
			JSONObject jsonObj = new JSONObject(jsonData);

			// Get the persistence data
			JSONObject data = new JSONObject(jsonObj.getString("data").trim());
			
			Representation rep = executeTask(data);
			
			getResponse().setCacheDirectives(
				Collections.singletonList(
					CacheDirective.maxAge(maxCacheAge)
				)
			);

			if (rep == null) {
				throw new ResourceException(
					Status.SERVER_ERROR_INTERNAL,
					"XML processing failed to complete for an unknown reason."
				);
			}
			
			return rep;
		
		} catch (Exception e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Unable to create JSON object from supplied options string",
				e
			);
		}
	}
	
	
	

	private Representation executeTask(JSONObject data) throws ConflictException, JSONException, JAXBException {

		// execute
		DocumentDescriptor taskInfo = service.exportToXMLDoc(data, Version.VERSION);

		Map<String,Object> response = Maps.newHashMap();
		
		// process result.
		if (taskInfo != ProcessedTaskInfo.NONE) {
			
			// Return a response containing a JSON block with the id/rev
			response.put("id", taskInfo.getId());
			response.put("store", taskInfo.getStore());
			
			// if have a revision append it.
			if (taskInfo.getRevision() != null) {
				response.put("rev", taskInfo.getRevision());
			}
			
		} else {
			return null;
		}

		// Return a JSON response
		return new JsonRepresentation(response);
	}
}
