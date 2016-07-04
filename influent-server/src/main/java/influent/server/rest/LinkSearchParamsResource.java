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

import influent.idl.*;
import influent.server.utilities.UISerializationHelper;
import oculus.aperture.common.rest.ApertureServerResource;

import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.MediaType;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.inject.Inject;

import java.util.ArrayList;
import java.util.List;

public class LinkSearchParamsResource extends ApertureServerResource {

	private final FL_LinkSearch searcher;
	
	
	//---------------------------------------------------------------
	
	
	@Inject 
	public LinkSearchParamsResource (FL_LinkSearch searcher) {
		this.searcher = searcher;	
	}

	@Post("json")
	public StringRepresentation propertyList (String jsonData) throws ResourceException{

		try {
			JSONObject jo = UISerializationHelper.toUIJson(filterSearchable(searcher.getDescriptors()));

			return new StringRepresentation(jo.toString(), MediaType.APPLICATION_JSON);
		} catch (AvroRemoteException ae) {
			throw new ResourceException(ae);
		} catch (JSONException e) {
			throw new ResourceException(e);
		}
	}




	private static FL_PropertyDescriptors filterSearchable(FL_PropertyDescriptors pds) {
		List<FL_PropertyDescriptor> filtered = new ArrayList<FL_PropertyDescriptor>();

		for (FL_PropertyDescriptor pd : pds.getProperties()) {
			if (!FL_SearchableBy.NONE.equals(pd.getSearchableBy())) {
				filtered.add(pd);
			}
		}

		return FL_PropertyDescriptors.newBuilder(pds).setProperties(filtered).build();
	}
}
