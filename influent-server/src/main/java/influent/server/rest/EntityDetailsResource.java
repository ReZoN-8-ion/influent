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
import influent.idl.FL_Entity;
import influent.idl.FL_LevelOfDetail;
import influent.server.dataaccess.DataAccessException;
import influent.server.dataaccess.DataAccessHelper;
import influent.server.spi.EntityPropertiesViewService;

import java.util.List;

import oculus.aperture.common.rest.ApertureServerResource;

import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;

public class EntityDetailsResource extends ApertureServerResource {

    private static final Logger s_logger = LoggerFactory.getLogger(EntityDetailsResource.class);

    private FL_DataAccess service;
    private EntityPropertiesViewService propView;


    
    @Inject
    public EntityDetailsResource(FL_DataAccess service, EntityPropertiesViewService propView) {
        this.service = service;
        this.propView = propView;
    }



    
    @Post("json")
    public StringRepresentation getContent(String jsonData) {

        String entityId = "";
		
		try {	
			JSONObject jsonObj = new JSONObject(jsonData);
		
			entityId = jsonObj.getString("entityId").trim();

            List<FL_Entity> entities = service.getEntities(DataAccessHelper.detailsSubject(entityId), FL_LevelOfDetail.FULL);
            if (entities != null && !entities.isEmpty()) {

                JSONObject result = propView.getContent(entities.get(0));
                return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);

            } else {
                s_logger.error("Unable to look up entity (for details pane) " + entityId);
                return null;
            }
        } catch (DataAccessException e) {
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
        } catch (JSONException je) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"JSON parse error.",
				je
			);
		}
    }
}
