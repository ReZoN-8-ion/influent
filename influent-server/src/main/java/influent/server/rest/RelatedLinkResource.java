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
import influent.idl.*;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.clustering.utils.ClusterContextCache.PermitSet;
import influent.server.clustering.utils.ContextCollapser;
import influent.server.clustering.utils.ContextReadWrite;
import influent.server.utilities.*;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

public class RelatedLinkResource extends ApertureServerResource{

	private final FL_ClusteringDataAccess clusterAccess;
	@SuppressWarnings("unused")
	private final FL_DataAccess entityAccess;
	private final ClusterContextCache contextCache;

	private static final Logger s_logger = LoggerFactory.getLogger(RelatedLinkResource.class);
	
	
	
	@Inject
	public RelatedLinkResource(FL_ClusteringDataAccess clusterAccess, FL_DataAccess entityAccess, ClusterContextCache contextCache) {
		this.clusterAccess = clusterAccess;
		this.entityAccess = entityAccess;
		this.contextCache = contextCache;
	}
	
	
	
	
	@Post
	public StringRepresentation getLinks(String jsonData) throws ResourceException {
		JSONObject result = new JSONObject();

		// This list is populated with the entities at the other end of the discovered links, and pass to the UI.
		// This is so the UI doesn't need to make a second call to get the entities at the end of the found links.
		List<Object> targets = new ArrayList<Object>();
		
		try {
			JSONProperties request = new JSONProperties(jsonData);
			
			String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}
			
			// determine the related link direction requested
			FL_DirectionFilter direction = FL_DirectionFilter.BOTH;
			final String linktype = request.getString("linktype", null);
			
			if (linktype != null) {
				if (linktype.equalsIgnoreCase ("source"))
					direction = FL_DirectionFilter.SOURCE;
				else if (linktype.equalsIgnoreCase ("destination"))
					direction = FL_DirectionFilter.DESTINATION;
			}
			
			final String contextId = request.getString("srcContextId", null);
			final String targetContextId = request.getString("tarContextId", null);
			final boolean fetchTargetEntities = request.getBoolean("fetchTargets", true);
			
			// the "entity" to fetch related links for - entity could be one of: file cluster, entity cluster or raw entity
			final String entityId = request.getString("entity", null);
			List<String> flowEntityIds = Collections.singletonList(entityId);

			final String startDateStr = request.getString("startdate", null);
			final String endDateStr = request.getString("enddate", null);

			DateTime startDate = null;
			try {
				startDate = (startDateStr != null) ? DateTimeParser.parse(startDateStr) : null;
			} catch (IllegalArgumentException iae) {
				throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"RelatedLinkResource: An illegal argument was passed into the 'startdate' parameter."
				);
			}
			
			DateTime endDate = null;
			try {
				endDate = (endDateStr != null) ? DateTimeParser.parse(endDateStr) : null;
			} catch (IllegalArgumentException iae) {
				throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"RelatedLinkResource: An illegal argument was passed into the 'enddate' parameter."
				);
			}

			
			FL_DateRange dateRange = null;
			if (startDate != null && endDate != null) {
				dateRange = DateRangeBuilder.getDateRange(startDate, endDate);
			}
			
			long ams = System.currentTimeMillis();
			
			// determine the focus filter to use - only fetch links that point to these focus ids
			final Iterable<String> focusIter = request.getStrings("targets");
			List<String> focusIds = null;
			if (focusIter != null) {
				focusIds = Lists.newArrayList(focusIter);
			} else {
				focusIds = Collections.emptyList();
			}

			// retrieve and aggregate the related links for the flow entities using the appropriate filters
			// If no focus filter is specified this will cluster the related entities and aggregate the related links accordingly 
			Map<String, List<FL_Link>> relatedLinks = clusterAccess.getFlowAggregation(flowEntityIds, focusIds, direction, dateRange, contextId, targetContextId);
			
			long bms = System.currentTimeMillis();
			
			// get the target ids aka "related entities" associated with the aggregated related links
			Set<String> targetIds = new HashSet<String>();

			for (String key : relatedLinks.keySet()) {
				for (FL_Link link : relatedLinks.get(key)) {
					if (flowEntityIds.contains(link.getSource())) {
						targetIds.add(link.getTarget());
					} else {
						targetIds.add(link.getSource());
					}
				}
			}
			
			// Id->Id redirect map this is necessary to re-point links if the context is simplified
			Map<String, String> redirect = new HashMap<String, String>();
			
			long cms = System.currentTimeMillis();
			long dms = cms;
			
			Pair<Collection<FL_Entity>, Collection<FL_Cluster>> simpleContext;
			
			final PermitSet permits = new PermitSet();
			
			Collection<FL_Cluster> clusters;
			Collection<FL_Entity> entities;
			
			try {
				final ContextReadWrite targetContextRW = contextCache.getReadWrite(targetContextId, permits);
											
				dms = System.currentTimeMillis();
			
				// collapse context entity cluster hierarchy by simplifying the tree for usability
				// returns root level entities that have no containing cluster and all the simplified clusters in the context
				simpleContext = ContextCollapser.collapse(targetContextRW, false, redirect);
				
				clusters = simpleContext.second;
				entities = simpleContext.first;
				
				// revise the context stored in the cache to use the new simplified context
				targetContextRW.setSimplifiedContext(clusters, entities);
				
			} finally {
				permits.revoke();
			}
			
			long ems = System.currentTimeMillis(); 
			
			// add all the root level entities to the targets - aggregate related links point to them
			targets.addAll(entities);
			
			// find the root clusters in the simplified context - aggregate related links point to them
			for (FL_Cluster cluster : clusters) {
				if (cluster.getParent() == null) {
					targets.add(cluster);
				}
			}
						
			// log timing of this branch was expensive
			long fms = System.currentTimeMillis();
			if ((fms-ams)>5000) {
				s_logger.warn("Slow Branch : took "+(fms-ams)+" ms");
				s_logger.warn("Get Flow : "+(bms-ams)+" ms");
				s_logger.warn("Get Target Entities : "+(cms-bms)+" ms");
				s_logger.warn("Get Context : "+(dms-cms)+" ms");
				s_logger.warn("Collapse Context : "+(ems-dms)+" ms");
			}
			
			// if we have targets and targets were requested by the client then serialize them into the response
			if (!targets.isEmpty() && fetchTargetEntities) {
				//This will be a mix of EntityClusters and FL_Entities
				JSONArray ja = new JSONArray();
				for (Object o : targets) {
					if (o instanceof FL_Entity) {
						ja.put(UISerializationHelper.toUIJson((FL_Entity)o));
					} else if (o instanceof FL_Cluster) {
						ja.put(UISerializationHelper.toUIJson((FL_Cluster)o));
					}
				}
				
				result.put("targets", ja);
			}
			
			// serialize the aggregated related links 
			// and update the source / target's if the context was simplified - they may now point to a simplified object 
			if (!relatedLinks.isEmpty()) {
				JSONObject dmap = new JSONObject();
				for (String key : relatedLinks.keySet()) {
					JSONArray larr = new JSONArray();
					for (FL_Link link : relatedLinks.get(key)) {
						
						// revise the source / target if simplification changed what they should point to
						if (redirect.containsKey(link.getSource())) {
							link.setSource(redirect.get(link.getSource()));
						}
						if (redirect.containsKey(link.getTarget())) {
							link.setTarget(redirect.get(link.getTarget()));
						}
						
						larr.put(UISerializationHelper.toUIJson(link));
					}
					dmap.put(key, larr);
				}
				result.put("data",dmap);
			}
			
			result.put("sessionId", sessionId);

			return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);

		} catch (AvroRemoteException e) {
			throw new ResourceException(Status.SERVER_ERROR_INTERNAL, e.getMessage());
		} catch (JSONException e) {
			throw new ResourceException(Status.SERVER_ERROR_INTERNAL, e.getMessage());
		}	
	}
}
