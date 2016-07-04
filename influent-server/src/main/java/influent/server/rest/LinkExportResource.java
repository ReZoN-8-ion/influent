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

import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_LevelOfDetail;
import influent.idl.FL_Link;
import influent.idl.FL_LinkSearch;
import influent.idl.FL_OrderBy;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyDescriptors;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_SearchResult;
import influent.idl.FL_SearchResults;
import influent.idlhelper.PropertyHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.data.PropertyMatchBuilder;
import influent.server.utilities.DateTimeParser;
import influent.server.utilities.GuidValidator;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.xml.bind.JAXBException;

import oculus.aperture.capture.phantom.data.ProcessedTaskInfo;
import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.ContentService.Document;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.CacheDirective;
import org.restlet.data.Status;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.common.collect.Maps;
import com.google.inject.Inject;
import com.google.inject.name.Named;


public class LinkExportResource extends ApertureServerResource {
	
	private final ContentService _service;
	private final FL_ClusteringDataAccess _clusterDataAccess;
	private final FL_LinkSearch _transactionsSearcher;
	private final int _maxCacheAge;
	private static FL_PropertyDescriptors _searchDescriptors = null;
	private static ApplicationConfiguration _applicationConfiguration;

	// The name of the CMS store we'll use for data captures
	private final static String DEFAULT_STORE = "aperture.data";
	
	@Inject
	public LinkExportResource(
			ContentService service,
			FL_LinkSearch transactionsSearcher,
			FL_ClusteringDataAccess clusterDataAccess,
			@Named("influent.charts.maxage") Integer maxCacheAge,
			@Named("aperture.server.config") Properties config) {
		_service = service;
		_maxCacheAge = maxCacheAge;
		_clusterDataAccess = clusterDataAccess;
		_transactionsSearcher = transactionsSearcher;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
	}
	
	@Post("json")
	public Representation getLedger(String jsonData) throws ResourceException {
		
		try {
			JSONProperties request = new JSONProperties(jsonData);

			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
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

			FL_SearchResults sResponse;
			if (termMap.size() > 0) {
				sResponse = _transactionsSearcher.search(termMap, orderBy, 0, 1000000, FL_LevelOfDetail.FULL);
			} else {
				// No terms. Return zero results.
				sResponse = FL_SearchResults.newBuilder().setTotal(0).setResults(new ArrayList<FL_SearchResult>()).setLevelOfDetail(FL_LevelOfDetail.FULL).build();
			}

			List<FL_SearchResult> searchResults = sResponse.getResults();

			//Get the column headers
			ArrayList<String> colHeader = null;
			if(searchResults.size() > 0) {
				colHeader = new ArrayList<String>();
				colHeader.add("Source");
				colHeader.add("Target");
				for(FL_Property prop : ((FL_Link)searchResults.get(0).getResult()).getProperties()) {
					colHeader.add(prop.getFriendlyText());
				}
			}

			StringBuilder csvBuilder = new StringBuilder();
			if(colHeader != null) {
				//Add column headers to csvBuilder
				for (int i = 0; i < colHeader.size(); i++) {
					csvBuilder.append(colHeader.get(i));
					if ( i < colHeader.size() - 1) {
						csvBuilder.append(",");
					}
				}
				csvBuilder.append("\n");
				for (int i = 0; i < searchResults.size(); i++) {
					FL_Link link = (FL_Link)searchResults.get(i).getResult();					
					csvBuilder.append(link.getSource());
					csvBuilder.append(",");
					csvBuilder.append(link.getTarget());
					csvBuilder.append(",");
					for(int col = 0; col < link.getProperties().size(); col++) {
						csvBuilder.append(formatProperty(link.getProperties().get(col)));
						if ( col < link.getProperties().size() - 1) {
							csvBuilder.append(",");
						}
					}
					csvBuilder.append("\n");
				}
			}
			
			Representation rep = getRepresentaion(csvBuilder.toString());
			
			getResponse().setCacheDirectives(
				Collections.singletonList(
					CacheDirective.maxAge(_maxCacheAge)
				)
			);

			if (rep == null) {
				throw new ResourceException(
					Status.SERVER_ERROR_INTERNAL,
					"Data table processing failed to complete for an unknown reason."
				);
			}
			
			return rep;
			
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	private Representation getRepresentaion(String data) throws ConflictException, JSONException, JAXBException {
		
		byte[] csvData = data.getBytes();		
		final String csvType = "text/csv";
		
		// Store to the content service, return a URL to the image
		Document doc = _service.createDocument();
		doc.setContentType(csvType);
		doc.setDocument(csvData);
		
		// Store and let the content service pick the id
		DocumentDescriptor descriptor = _service.storeDocument(
			doc, 
			DEFAULT_STORE, 
			null, 
			null
		);

		Map<String,Object> response = Maps.newHashMap();
		
		// process result.
		if (descriptor != ProcessedTaskInfo.NONE) {
			
			// Return a response containing a JSON block with the id/rev
			response.put("id", descriptor.getId());
			response.put("store", descriptor.getStore());
			
			// if have a revision append it.
			if (descriptor.getRevision() != null) {
				response.put("rev", descriptor.getRevision());
			}
			
		} else {
			return null;
		}

		// Return a JSON response
		return new JsonRepresentation(response);
	}
	
	
	private static String formatProperty(FL_Property prop) {
		
		PropertyHelper property = PropertyHelper.from(prop);
		
		if (property.hasTag(FL_PropertyTag.DATE)) {
			return new SimpleDateFormat("MM/dd/yyyy HH:mm:ss").format(DateTimeParser.fromFL(property.getValue()).toDate());
		}

		return String.valueOf(property.getValue());
	}
	
	private PropertyMatchBuilder processDescriptors(JSONObject propertyMatchDescriptorsMap) throws JSONException {
		final PropertyMatchBuilder terms = new PropertyMatchBuilder(propertyMatchDescriptorsMap, false, _applicationConfiguration.hasMultipleEntityTypes());

		return terms;
	}

	private PropertyMatchBuilder processSearchTerms(String query) throws AvroRemoteException {
		final PropertyMatchBuilder terms = new PropertyMatchBuilder(query, _searchDescriptors, _clusterDataAccess, true, _applicationConfiguration.hasMultipleEntityTypes());

		return terms;
	}
}
