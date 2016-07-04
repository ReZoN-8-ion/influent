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

import com.google.inject.name.Named;
import influent.idl.*;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.data.PropertyMatchBuilder;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.utilities.UISerializationHelper;

import java.util.List;

import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;

import oculus.aperture.spi.common.Properties;
import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.Status;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;

public class LinkDetailsResource extends ApertureServerResource {

    private static final Logger s_logger = LoggerFactory.getLogger(LinkDetailsResource.class);

    private final FL_LinkSearch _transactionsSearcher;
    private final DataNamespaceHandler _namespaceHandler;
	private static FL_PropertyDescriptors _searchDescriptors = null;
	private static ApplicationConfiguration _applicationConfiguration;

	@Inject
	public LinkDetailsResource(FL_LinkSearch transactionsSearcher,
	                           DataNamespaceHandler namespaceHandler,
	                           @Named("aperture.server.config") Properties config) {
		_transactionsSearcher = transactionsSearcher;
		_namespaceHandler = namespaceHandler;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
	}

    @Post("json")
    public JsonRepresentation getTransactionDetails(String jsonData) {

    	String transactionId = "";
		
		try {	
			JSONProperties request = new JSONProperties(jsonData);

			// Get the descriptors if we don't have them yet
			if (_searchDescriptors == null) {
				_searchDescriptors = _transactionsSearcher.getDescriptors();
			}

			transactionId = request.getString("transactionId", "").trim();

			StringBuilder query = new StringBuilder();
			query.append(FL_RequiredPropertyKey.ID.name() + ":\"");
			query.append(_namespaceHandler.localFromGlobalEntityId(transactionId) + "\" ");
			query.append(FL_ReservedPropertyKey.TYPE.name() + ":\"");
			query.append(_namespaceHandler.entityTypeFromGlobalEntityId(transactionId) + "\"");

			final PropertyMatchBuilder terms = new PropertyMatchBuilder(query.toString(), _searchDescriptors, false, _applicationConfiguration.hasMultipleEntityTypes());

			FL_SearchResults sResponse = _transactionsSearcher.search(
				terms.getDescriptorMap(),
				_searchDescriptors.getOrderBy(),
				0,
				1,
				FL_LevelOfDetail.FULL
			);
			
			List<FL_SearchResult> searchResults = sResponse.getResults();
	    	if (searchResults.size() > 0) {
	    		FL_Link link = (FL_Link) searchResults.get(0).getResult();

	    		JSONObject jo = UISerializationHelper.toUIJson(link);

	    		return new JsonRepresentation(jo);
	    	} else {
	    		return null;
	    	}
        }  
		catch (AvroRemoteException e) {
			s_logger.info(String.format("AvroRemoteException occurred Getting transaction details for transaction id: %s; %s", transactionId, e.getMessage()));
            throw new ResourceException(
                    Status.CLIENT_ERROR_BAD_REQUEST,
                    "Unable to create JSON object from supplied options string",
                    e
            );
        } catch (JSONException je) {
        	s_logger.info(String.format("JSONException occurred Getting transaction details for transaction id: %s; %s", transactionId, je.getMessage()));
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"JSON parse error.",
				je
			);
		}
    }
}
