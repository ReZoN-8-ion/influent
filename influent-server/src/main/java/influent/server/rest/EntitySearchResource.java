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
import influent.idl.FL_Cluster;
import influent.idl.FL_DataAccess;
import influent.idl.FL_Entity;
import influent.idl.FL_EntitySearch;
import influent.idl.FL_LevelOfDetail;
import influent.idl.FL_OrderBy;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyDescriptor;
import influent.idl.FL_PropertyDescriptors;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_SearchResult;
import influent.idl.FL_SearchResults;
import influent.idlhelper.PropertyDescriptorHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.data.PropertyMatchBuilder;
import influent.server.utilities.GuidValidator;
import influent.server.utilities.UISerializationHelper;
import influent.server.utilities.ValueFormatter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;

import oculus.aperture.spi.common.Properties;
import org.apache.avro.AvroRemoteException;
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

import com.google.inject.Inject;



public class EntitySearchResource extends ApertureServerResource{

	private final FL_EntitySearch _entitySearcher;
	private final FL_DataAccess _dataAccess;
	private static ApplicationConfiguration _applicationConfiguration;

	private static FL_PropertyDescriptors _searchDescriptors = null;

	private final static int DEFAULT_MAX_LIMIT = 50;
	
	private static final Logger s_logger = LoggerFactory.getLogger(EntitySearchResource.class);



	@Inject
	public EntitySearchResource(
		FL_EntitySearch entitySearcher,
		FL_DataAccess dataAccess,
		@Named("aperture.server.config") Properties config) {
		_entitySearcher = entitySearcher;
		_dataAccess = dataAccess;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
	}




	private Map<String, List<Object>> groupEntitiesBy(String groupByKey, Map<String, Double> matchScores, List<FL_Entity> entities) {
		Map<String, List<Object>> groupedEntities = new LinkedHashMap<String, List<Object>>();

		final FL_PropertyDescriptor pd = PropertyDescriptorHelper.find(groupByKey, _searchDescriptors.getProperties());

		if (pd != null || (groupByKey.equals("MATCH") && matchScores.size() != 0)) {
			for (FL_Entity entity : entities) {

				FL_Property prop = PropertyHelper.getPropertyByKey(entity.getProperties(), groupByKey);
				String groupKey;

				if (pd != null) {
					groupKey = pd.getFriendlyText()+ ": " + ValueFormatter.format(prop);
				} else {
					groupKey = "Match: " + String.format("%.2f", matchScores.get(entity.getUid()));
				}

				List<Object> group = groupedEntities.get(groupKey);
				if (group == null) {
					group = new ArrayList<Object>();
					groupedEntities.put(groupKey, group);
				}

				group.add(entity);
			}
		} else {
			List<Object> group = groupedEntities.get("");

			if (group == null) {
				groupedEntities.put("", new ArrayList<Object>(entities));
			} else {
				group.addAll(entities);
			}
		}
		
		return groupedEntities;
	}




	private JSONArray serializeEntities(List<Object> entities) {
		JSONArray ja = new JSONArray();
		
		for (Object entity : entities) {
			JSONObject jo = serializeEntity(entity);
			if (jo != null) {  // skip over any objects that failed serialization
				ja.put(jo);
			}
		}
		return ja;
	}




	private JSONObject serializeEntity(Object entity) {
		String id = null;
		
		try {
			JSONObject jo = null;
			
			if (entity instanceof FL_Cluster) {
				FL_Cluster cluster = (FL_Cluster)entity;
				id = cluster.getUid();
				jo = UISerializationHelper.toUIJson(cluster);
				
				//adding in the entities so we don't have to do a separate call to get them all
				jo.put("memberEntities", UISerializationHelper.toUIJson(_dataAccess.getEntities(cluster.getMembers(), FL_LevelOfDetail.FULL)));
			} else {
				FL_Entity e = (FL_Entity)entity;
				id = e.getUid();
				jo = UISerializationHelper.toUIJson(e);
			}
			return jo;
		} catch (Exception e) {
			s_logger.error("Error serializing object with uid: " + id + ".   Omitting from results.");
			return null;
		}
	}




	@Post("json")
	public StringRepresentation search(String jsonData) throws ResourceException {
		Map<String, Double> matchScores = new HashMap<String, Double>();
		List<FL_Entity> entities = new ArrayList<FL_Entity>();
		
		try {
			JSONProperties request = new JSONProperties(jsonData);
			
			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}

			// Determine the number of results to return.
			int resultLimit = request.getInteger("limit", DEFAULT_MAX_LIMIT);
			if (resultLimit <= 0) {
				resultLimit = DEFAULT_MAX_LIMIT;
			}

			// Determine the start index.
			final int startIndex = request.getInteger("start", 0);
			
			//Determine level of detail, default to summary
			FL_LevelOfDetail levelOfDetail;
			try {
				levelOfDetail = FL_LevelOfDetail.valueOf(request.getString("levelOfDetail", "SUMMARY"));
			} catch (Exception e) {
				levelOfDetail = FL_LevelOfDetail.SUMMARY;
			}
			
			// Get the descriptors if we don't have them yet
			if (_searchDescriptors == null) {
				_searchDescriptors = _entitySearcher.getDescriptors();
			}
			
			// get all the search terms
			final PropertyMatchBuilder bld;
			String propMatchDesc = request.getString("descriptors", null);
			if (propMatchDesc != null) {
				bld = processDescriptors(new JSONObject(propMatchDesc));
			} else {
				bld = processSearchTerms(request.getString("query", "").trim());
			}
			
			final Map<String, List<FL_PropertyMatchDescriptor>> termMap = bld.getDescriptorMap();
			List<FL_OrderBy> orderBy = bld.getOrderBy();
			
			// return groups of one as singletons?
			final boolean ungroupSingletons = request.getBoolean("ungroupSingles", false);

			if (orderBy == null) {
				orderBy = _searchDescriptors.getOrderBy();
			}
			
			final String groupByKey = orderBy != null? orderBy.get(0).getPropertyKey() : null;

			
			// Execute the search
			FL_SearchResults sResponse = _entitySearcher.search(termMap, orderBy, (long)startIndex, (long)resultLimit, levelOfDetail);

			for (FL_SearchResult sResult : sResponse.getResults()) {
				FL_Entity entity = (FL_Entity)sResult.getResult();
				matchScores.put(entity.getUid(), sResult.getMatchScore());
				entities.add(entity);
			}
			
			normalizeMatchScores(matchScores);

			// search results response object
			JSONObject result = new JSONObject();
			
			// search result entities
			JSONArray resultItems = new JSONArray();
						
			// group entities if a grouping field was provided
			if (groupByKey != null && !groupByKey.equals("null")) {
				Map<String, List<Object>> groupedEntities = groupEntitiesBy(groupByKey, matchScores, entities);
				
				// add grouped entities to result items
				for (String key : groupedEntities.keySet()) {
					final List<Object> group = groupedEntities.get(key);
			
					JSONObject groupResult = new JSONObject();
					
					// don't provide a group key if ungroupSingletons and the group size is 1
					if (!ungroupSingletons || group.size() > 1) {
						groupResult.put("groupKey", key);
					}
				
					JSONArray groupMembers = serializeEntities(group);
			
					groupResult.put("items", groupMembers);
				
					resultItems.put(groupResult);
				}
			} else {
				// create a single anonymous group for all results
				JSONObject groupResult = new JSONObject();

				// under an empty group header
				groupResult.put("groupKey", "");

				List<Object> allResults = new ArrayList<Object>(entities.size());
				allResults.addAll(entities);
				
				groupResult.put("items", serializeEntities(allResults));
				
				resultItems.put(groupResult);
			}
			
			// Get the column header from the searcher
			FL_PropertyDescriptors columnHeaders = _entitySearcher.getKeyDescriptors(sResponse, orderBy);
			
			result.put("data", resultItems);
			result.put("matchScores", matchScores);
			result.put("totalResults", sResponse.getTotal());
			result.put("sessionId", sessionId);
			result.put("headers", UISerializationHelper.toUIJson(columnHeaders));
			result.put("detailLevel", sResponse.getLevelOfDetail());

			return new StringRepresentation(result.toString(),MediaType.APPLICATION_JSON);
		}
		catch (JSONException e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Unable to create JSON object from supplied options string",
				e
			);
		} catch (AvroRemoteException e) {
			throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"Exception during AVRO processing",
					e
				);
		}
	}




	private PropertyMatchBuilder processSearchTerms(String query) {
		//Extract a map of FL_PropertyMatchDescriptors by type from the query
		s_logger.info("Processing search terms from: " + query);
		final PropertyMatchBuilder terms = new PropertyMatchBuilder(query, _searchDescriptors, false, _applicationConfiguration.hasMultipleEntityTypes());

		return terms;
	}
	
	private PropertyMatchBuilder processDescriptors(JSONObject propertyMatchDescriptorsMap) throws JSONException {
		//Extract a map of FL_PropertyMatchDescriptors by type from the propertyMatchDescriptors
		s_logger.info("Processing search terms from: " + propertyMatchDescriptorsMap);
		final PropertyMatchBuilder terms = new PropertyMatchBuilder(propertyMatchDescriptorsMap, false, _applicationConfiguration.hasMultipleEntityTypes());

		return terms;
	}
	
	public static void normalizeMatchScores (Map<String, Double> matchScores) {
		double maxscore = 0;
		
		for (String entity : matchScores.keySet()) 
			if (matchScores.get(entity) > maxscore)
				maxscore = matchScores.get(entity);
		
		if (maxscore != 0)
			for (String entity : matchScores.keySet()) 
				matchScores.put(entity, matchScores.get(entity)/maxscore);
	}
}
