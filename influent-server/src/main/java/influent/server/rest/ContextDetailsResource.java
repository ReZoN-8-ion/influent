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
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.clustering.utils.ClusterContextCache.PermitSet;
import influent.server.clustering.utils.ContextRead;
import influent.server.utilities.UISerializationHelper;

import java.util.List;

import oculus.aperture.common.rest.ApertureServerResource;

import org.json.JSONArray;
import org.json.JSONObject;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;
import org.restlet.resource.ResourceException;

import com.google.inject.Inject;

public class ContextDetailsResource extends ApertureServerResource {

	//final Logger logger = LoggerFactory.getLogger(getClass());

	private final ClusterContextCache contextCache;

	@Inject
	public ContextDetailsResource(
            ClusterContextCache contextCache
    ) {
		this.contextCache = contextCache;
	}
	
	@Get
	public StringRepresentation getContextDetails() {
        Form form = getRequest().getResourceRef().getQueryAsForm();

        String contextId = form.getFirstValue("contextId").trim();

        PermitSet permits = new PermitSet();

        try {
            ContextRead contextRO = contextCache.getReadOnly(contextId, permits);

            if (contextRO == null) {
                throw new Exception("Could not get context for " + contextId);
            }

            List<String> childContexts = contextRO.getChildContexts();
            List<FL_Cluster> clusters = contextRO.getClusters();
            JSONArray clusterJSON = new JSONArray();
            for (FL_Cluster c : clusters) {
                clusterJSON.put(UISerializationHelper.toUIJson(c));
            }
            JSONObject result = new JSONObject();
            result.put("contextId", contextId);
            result.put("children", childContexts);
            result.put("clusters", clusterJSON);
            return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);

        } catch (Exception e) {
            throw new ResourceException(
                    Status.CLIENT_ERROR_BAD_REQUEST,
                    "Unable to create JSON object from supplied options string",
                    e
            );
        } finally {
            permits.revoke();
        }
	}
}
