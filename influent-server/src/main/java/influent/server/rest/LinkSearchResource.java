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

import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_LevelOfDetail;
import influent.idl.FL_Link;
import influent.idl.FL_LinkSearch;
import influent.idl.FL_OrderBy;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyDescriptors;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_RequiredPropertyKey;
import influent.idl.FL_SearchResult;
import influent.idl.FL_SearchResults;
import influent.idlhelper.PropertyHelper;
import influent.idlhelper.SingletonRangeHelper;
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
import org.restlet.data.Status;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;

/**
 * 
 * @author cregnier
 *
 */
public class LinkSearchResource extends ApertureServerResource {

	private final static int DEFAULT_MAX_LIMIT = 50;

	private final FL_LinkSearch _transactionsSearcher;
	private final FL_ClusteringDataAccess _clusterDataAccess;
	private static FL_PropertyDescriptors _searchDescriptors = null;
	private static ApplicationConfiguration _applicationConfiguration;

	private static final Logger s_logger = LoggerFactory.getLogger(LinkSearchResource.class);
	


	@Inject
	public LinkSearchResource(FL_LinkSearch transactionsSearcher,
	                          FL_ClusteringDataAccess clusterDataAccess,
	                          @Named("aperture.server.config") Properties config) {
		_transactionsSearcher = transactionsSearcher;
		_clusterDataAccess = clusterDataAccess;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
	}


	@Post("json")
	public JsonRepresentation search(String jsonData) throws ResourceException {
		JSONObject results = null;
		try {
			JSONProperties request = new JSONProperties(jsonData);

			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}

			// Determine the number of results to return.
			final long maxResults = getMaxResults(request);

			// Determine the start index.
			final long startIndex = request.getInteger("start", 0);
			
			//Determine level of detail, default to summary
			FL_LevelOfDetail levelOfDetail;
			try {
				levelOfDetail = FL_LevelOfDetail.valueOf(request.getString("levelOfDetail", "SUMMARY"));
			} catch (Exception e) {
				levelOfDetail = FL_LevelOfDetail.SUMMARY;
			}
			
			// Get the descriptors if we don't have them yet
			if (_searchDescriptors == null) {
				_searchDescriptors = _transactionsSearcher.getDescriptors();
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
			
			if (orderBy == null) {
				orderBy = _searchDescriptors.getOrderBy();
			}
			
			//actually run the search using the given property terms
			FL_SearchResults sResponse = null;
			if (termMap.size() > 0) {
				sResponse = _transactionsSearcher.search(termMap, orderBy, startIndex, startIndex + maxResults, levelOfDetail);
			} else {
				// No terms. Return zero results.
				sResponse = FL_SearchResults.newBuilder().setTotal(0).setResults(new ArrayList<FL_SearchResult>()).setLevelOfDetail(levelOfDetail).build();
			}

			//take the search results and package them up in a json object to return
			results = buildTransactionResults(sResponse, orderBy, sessionId);
		}
		catch (JSONException e) {
			throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"Unable to create JSON object from supplied options string",
					e
				);
		}
		catch (AvroRemoteException e) {
			throw new ResourceException(
					Status.SERVER_ERROR_INTERNAL,
					"Exception during AVRO processing",
					e
				);
		}
		
		if (results == null) {
			results = new JSONObject();
		}
		return new JsonRepresentation(results);
	}





	private JSONObject buildTransactionResults(
		FL_SearchResults results,
		List<FL_OrderBy> orderBy,
		String sessionId
	) throws AvroRemoteException, JSONException {
		Map<String, Double> matchScores = new HashMap<String, Double>();
		List<FL_Link> links = new ArrayList<FL_Link>();
		
		// transactions search result response object
		JSONObject result = new JSONObject();

		// transactions search results
		JSONArray transactions = new JSONArray();
		
		for (FL_SearchResult sResult : results.getResults()) {
			FL_Link link = (FL_Link)sResult.getResult();
			matchScores.put(link.getUid(), sResult.getMatchScore());
			links.add(link);
		}		
		
		final String groupByKey = orderBy != null? orderBy.get(0).getPropertyKey() : null;

		// group entities if a grouping field was provided
		if (groupByKey != null && !groupByKey.equals("null")) {
			Map<String, List<FL_Link>> groupedTransactions = groupTransactionsBy(groupByKey, matchScores, links);

			// add grouped entities to result items
			for (String key : groupedTransactions.keySet()) {
				final List<FL_Link> group = groupedTransactions.get(key);

				JSONObject groupResult = new JSONObject();

				groupResult.put("groupKey", key);

				JSONArray groupMembers = serializeTransactions(group);

				groupResult.put("items", groupMembers);

				transactions.put(groupResult);
			}

		} else {

			// create a single anonymous group for all results
			JSONObject groupResult = new JSONObject();
			
			// under an empty group header
			groupResult.put("groupKey", "");
			
			JSONArray groupMembers = serializeTransactions(links);

			groupResult.put("items", groupMembers);

			transactions.put(groupResult);

		}

		FL_PropertyDescriptors columnHeaders = _transactionsSearcher.getKeyDescriptors(results, orderBy);

		result.put("data", transactions);
		result.put("totalResults", results.getTotal());
		result.put("sessionId", sessionId);
		result.put("headers", UISerializationHelper.toUIJson(columnHeaders));
		result.put("detailLevel", results.getLevelOfDetail());

		return result;
	}

	private Map<String, List<FL_Link>> groupTransactionsBy(String groupByKey, Map<String, Double> matchScores, List<FL_Link> links) {

		Map<String, List<FL_Link>> groupedTransactions = new LinkedHashMap<String, List<FL_Link>>();

		// Check if we'll be grouping by ENTITY
		boolean groupByEntityID = groupByKey.equals(FL_RequiredPropertyKey.ENTITY.name()) || groupByKey.equals(FL_RequiredPropertyKey.LINKED.name());

		for (int i = 0; i < links.size(); ++i) {
			FL_Link link = links.get(i);
			String groupKey;

			if (groupByEntityID) {
				final String source = (String)SingletonRangeHelper.value(PropertyHelper.getPropertyByKey(link.getProperties(), FL_RequiredPropertyKey.FROM.name()).getRange());
				final String target = (String)SingletonRangeHelper.value(PropertyHelper.getPropertyByKey(link.getProperties(), FL_RequiredPropertyKey.TO.name()).getRange());

				// Create the group key in the same lexographical order, regardless of direction
				if (link.getSource().compareToIgnoreCase(link.getTarget()) <= 0) {
					groupKey = String.format("Between %s and %s", source, target);
				} else {
					groupKey = String.format("Between %s and %s", target, source);
				}
			} else {
				FL_Property prop = PropertyHelper.getPropertyByKey(link.getProperties(), groupByKey);
				if (prop != null) {
					groupKey = prop.getFriendlyText()+ ": " + ValueFormatter.format(prop);
				} else {
					groupKey = "Match: " + String.format("%.2f", matchScores.get(link.getUid()));
				}
			}

			if (groupKey != null) {
				List<FL_Link> group = groupedTransactions.get(groupKey);
				if (group == null) {
					group = new ArrayList<FL_Link>();
					groupedTransactions.put(groupKey, group);
				}

				group.add(link);
			}
		}

		return groupedTransactions;
	}




	private JSONArray serializeTransactions(List<FL_Link> transactions) throws JSONException {
		JSONArray ja = new JSONArray();

		for (FL_Link transaction : transactions) {
			JSONObject jo = UISerializationHelper.toUIJson(transaction);
			if (jo != null) {  // skip over any objects that failed serialization
				ja.put(jo);
			}
		}
		return ja;
	}



	
	private int getMaxResults(JSONProperties props) {
		// Determine the number of results to return.
		int resultLimit = props.getInteger("limit", DEFAULT_MAX_LIMIT);
		if (resultLimit <= 0) {
			resultLimit = DEFAULT_MAX_LIMIT;
		}
		return resultLimit;
	}

	private PropertyMatchBuilder processDescriptors(JSONObject propertyMatchDescriptorsMap) throws JSONException {
		//Extract a map of FL_PropertyMatchDescriptors by type from the propertyMatchDescriptors
		s_logger.info("Processing search terms from: " + propertyMatchDescriptorsMap);
		final PropertyMatchBuilder terms =
				new PropertyMatchBuilder(
						propertyMatchDescriptorsMap,
						true,
						_applicationConfiguration.hasMultipleEntityTypes()
				);

		return terms;
	}

	private PropertyMatchBuilder processSearchTerms(String query) throws AvroRemoteException {
		//Extract a map of FL_PropertyMatchDescriptors by type from the query
		s_logger.info("Processing transaction search terms from: " + query);
		final PropertyMatchBuilder terms =
				new PropertyMatchBuilder(
						query,
						_searchDescriptors,
						_clusterDataAccess,
						true,
						_applicationConfiguration.hasMultipleEntityTypes()
				);

		return terms;
	}
}
