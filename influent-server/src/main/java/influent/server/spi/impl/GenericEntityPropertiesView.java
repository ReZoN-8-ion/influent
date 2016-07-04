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
package influent.server.spi.impl;

import influent.idl.*;
import influent.server.dataaccess.DataAccessException;
import influent.server.spi.EntityPropertiesViewService;

import influent.server.utilities.UISerializationHelper;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.Status;
import org.restlet.resource.ResourceException;


public class GenericEntityPropertiesView implements EntityPropertiesViewService {
	
	//private final DateTimeFormatter date_formatter = DateTimeFormat.forPattern("dd MMM yyyy");

	@Override
	public JSONObject getContent(FL_Entity entity) throws DataAccessException {
        // TODO: Make a copy of the entity and override it with friendly values?
        try {

            return UISerializationHelper.toUIJson(entity);

        } catch (JSONException e) {
            throw new ResourceException(
                    Status.CLIENT_ERROR_BAD_REQUEST,
                    "Unable to create JSON object from supplied options string",
                    e
            );
        }
	}

	/*
	protected String getFriendlyValue(FL_Property property) {	// can be overridden if a particular implementation desires a specific format for certain prop types
		String toReturn = new String();
		PropertyHelper propertyHelper = PropertyHelper.from(property);
		Object propObj = propertyHelper.getValue();
		
		switch(propertyHelper.getType()) {
			case DATE:
				toReturn = propObj.toString();
				if (toReturn != null && !toReturn.isEmpty()) {
					DateTime dateTime = new DateTime(Long.parseLong(toReturn));
					toReturn = dateTime.toString(date_formatter);
				}
				else {
					toReturn = "Date Format Error";
				}
			break;
			case GEO:
				StringBuilder geoBuilder = new StringBuilder();
				FL_GeoData geoData = (FL_GeoData) propObj;
				
				if (geoData.getLat() != null) {
					geoBuilder.append(geoData.getLat());
					geoBuilder.append(", ");
					geoBuilder.append(geoData.getLon());
				}
				
				if (geoData.getText() != null && !geoData.getText().equals(geoData.getCc())) {
					geoBuilder.append(" ");
					geoBuilder.append(geoData.getText());
				}
				
				if (geoData.getCc() != null) {
					if (geoBuilder.length() > 0) {
						geoBuilder.append(" (");
						geoBuilder.append(geoData.getCc());
						geoBuilder.append(')');
					} else {
						geoBuilder.append(geoData.getCc());
					}
				}
				
				toReturn = geoBuilder.toString();
			break;
			default:
				toReturn = propObj.toString();
			break;
		}
		
		return toReturn;
	}
	*/
}
