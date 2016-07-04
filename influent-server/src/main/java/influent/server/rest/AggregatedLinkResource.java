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

import com.google.common.collect.Lists;
import com.google.inject.Inject;
import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_DateRange;
import influent.idl.FL_DirectionFilter;
import influent.idl.FL_Link;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.utilities.DateRangeBuilder;
import influent.server.utilities.DateTimeParser;
import influent.server.utilities.GuidValidator;
import influent.server.utilities.UISerializationHelper;
import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import org.apache.avro.AvroRemoteException;
import org.joda.time.DateTime;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

public class AggregatedLinkResource extends ApertureServerResource{

	private final FL_ClusteringDataAccess clusterAccess;
	
	
	
	@Inject
	public AggregatedLinkResource(FL_ClusteringDataAccess clusterAccess, ClusterContextCache contextCache) {
		this.clusterAccess = clusterAccess;
	}
	
	
	
	
	@Post("json")
	public StringRepresentation getLinks(String jsonData) throws ResourceException {
		JSONObject result = new JSONObject();
		Map<String, List<FL_Link>> links = new HashMap<String, List<FL_Link>>();
		
		FL_DirectionFilter direction = FL_DirectionFilter.DESTINATION;
		FL_DateRange dateRange = null;
		
		try {
			JSONProperties request = new JSONProperties(jsonData);

			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}
			
			/*
			 * Valid arguments are:
			 *   - source
			 *   - destination
			 *   - both
			 */
			final String linkType = request.getString("linktype", null);
			
			if (linkType != null) {
				
				if (linkType.equalsIgnoreCase ("source"))
					direction = FL_DirectionFilter.SOURCE;
				else if (linkType.equalsIgnoreCase ("destination"))
					direction = FL_DirectionFilter.DESTINATION;
				else 
					direction = FL_DirectionFilter.BOTH;
			}

			List<String> srcEntities = Lists.newArrayList(request.getStrings("sourceIds"));
			List<String> dstEntities = Lists.newArrayList(request.getStrings("targetIds"));
				
			String startDateStr = request.getString("startdate", null);
			String endDateStr = request.getString("enddate", null);

			DateTime startDate = null;
			try {
				startDate = (startDateStr != null) ? DateTimeParser.parse(startDateStr) : null;
			} catch (IllegalArgumentException iae) {
				throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"AggregatedLinkResource: An illegal argument was passed into the 'startdate' parameter."
				);
			}
			
			DateTime endDate = null;
			try {
				endDate = (endDateStr != null) ? DateTimeParser.parse(endDateStr) : null;
			} catch (IllegalArgumentException iae) {
				throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"AggregatedLinkResource: An illegal argument was passed into the 'enddate' parameter."
				);
			}
			
			if (startDate != null && endDate != null) {
				dateRange = DateRangeBuilder.getDateRange(startDate, endDate);
			}
			
			String srcContextId = request.getString("contextId", null);
			String dstContextId = request.getString("targetContextId", null);
						
			links = clusterAccess.getFlowAggregation(srcEntities, dstEntities, direction, dateRange, srcContextId, dstContextId);

			if (links != null && !links.isEmpty()) {
				JSONObject dmap = new JSONObject();
				for (Entry<String, List<FL_Link>> entry : links.entrySet()) {
					JSONArray larr = new JSONArray();
					for (FL_Link link : entry.getValue()) {
						larr.put(UISerializationHelper.toUIJson(link));
					}
					dmap.put(entry.getKey(), larr);
				}
				
				result.put("data",dmap);
			}

			result.put("sessionId", sessionId);

			return new StringRepresentation(result.toString(),MediaType.APPLICATION_JSON);
			
		} catch (JSONException e) {
			throw new ResourceException(Status.SERVER_ERROR_INTERNAL, e.getMessage());
		} catch (AvroRemoteException e) {
			throw new ResourceException(Status.SERVER_ERROR_INTERNAL, e.getMessage());
		}
	}
}
