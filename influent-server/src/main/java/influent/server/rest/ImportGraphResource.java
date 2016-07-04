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

import influent.server.spi.ImportDataService;

import java.util.List;

import javax.xml.bind.JAXBException;

import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.store.ConflictException;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.ext.fileupload.RestletFileUpload;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.inject.Inject;
import com.google.inject.name.Named;

public class ImportGraphResource extends ApertureServerResource {

	private final ImportDataService service;
	
	
	
	@Inject
	public ImportGraphResource(
		ImportDataService service,
		@Named("influent.charts.maxage") Integer maxCacheAge
	) {
		this.service = service;
	}
	
	
	
	
	@Post
	public StringRepresentation getCapturedImage(Representation entity) throws ResourceException {
	
		if (entity == null || !MediaType.MULTIPART_FORM_DATA.equals(entity.getMediaType(), true)) return null;

		DiskFileItemFactory factory = new DiskFileItemFactory();
        factory.setSizeThreshold(1000240);
        RestletFileUpload upload = new RestletFileUpload(factory);

		try {
            List<FileItem> items = upload.parseRequest(getRequest());
            String xmlData = new String(items.get(0).get());
			
			JSONObject influentState = executeTask(xmlData); // hit the service to get the JSONObject
			
			if (influentState == null) {
				throw new ResourceException(
					Status.SERVER_ERROR_INTERNAL,
					"XML processing failed to complete for an unknown reason."
				);
			}
			
			return new StringRepresentation(influentState.toString(), MediaType.TEXT_PLAIN);
		
		} catch (Exception e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Unable to create JSON object from supplied options string",
				e
			);
		}
	}
	
	
	

	private JSONObject executeTask(String xmlData) throws ConflictException, JSONException, JAXBException {
		return service.importFromXML(xmlData);
	}
}
