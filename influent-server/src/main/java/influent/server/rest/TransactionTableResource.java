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
import influent.idlhelper.PropertyHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.data.LedgerResult;
import influent.server.data.PropertyMatchBuilder;
import influent.server.utilities.ResultFormatter;

import java.util.ArrayList;
import java.util.Collections;
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

import com.google.common.collect.Lists;
import com.google.inject.Inject;

/**
 * Ledger Resource is intended to work with a jQuery DataTable on the front end, as such it
 * handles the parameters sent by them, and returns data in the format it expects.
 *
 *
 */

public class TransactionTableResource extends ApertureServerResource {

	private final FL_LinkSearch _transactionsSearcher;
	private final FL_ClusteringDataAccess _clusterDataAccess;
	private static ApplicationConfiguration _applicationConfiguration;

	@Inject
	public TransactionTableResource(
		FL_LinkSearch transactionsSearcher,
		FL_ClusteringDataAccess clusterDataAccess,
		@Named("aperture.server.config") Properties config) {

		_transactionsSearcher = transactionsSearcher;
		_clusterDataAccess = clusterDataAccess;
		_applicationConfiguration = ApplicationConfiguration.getInstance(config);
	}




	@Post("json")
	public StringRepresentation getLedger(String jsonData) throws ResourceException {
		try {
			JSONProperties request = new JSONProperties(jsonData);

			String sEcho = request.getString("sEcho", null);
			String startDate = request.getString("startDate", null);
			String endDate = request.getString("endDate", null);
			String entityId = request.getString("entityId", null);      // get the root node ID from the form
			String contextId = request.getString("contextId", null);
			Integer startRow = request.getInteger("startRow", null);
			Integer totalRows = request.getInteger("totalRows", null);
			List<String> focusIds = Lists.newArrayList(request.getStrings("focusIds"));
			
			final List<FL_OrderBy> orderBy = new ArrayList<FL_OrderBy>(2);
			orderBy.add(FL_OrderBy.newBuilder()
					.setPropertyKey(FL_ReservedPropertyKey.MATCH.name().toLowerCase())
					.setAscending(false)
					.build()
			);
			orderBy.add(FL_OrderBy.newBuilder()
				.setPropertyKey(FL_RequiredPropertyKey.DATE.name())
				.setAscending(false)
				.build()
			);

			if (entityId == null || entityId.trim().isEmpty()) {
				return emptyResult(sEcho);
			}
			entityId = entityId.trim();

			List<String> entityIds = _clusterDataAccess.getLeafIds(Collections.singletonList(entityId), contextId, true);

			StringBuilder sb = new StringBuilder();
			sb.append("DATE:[");
			sb.append(startDate);
			sb.append(" TO ");
			sb.append(endDate);
			sb.append("] ");

			sb.append(FL_RequiredPropertyKey.ENTITY.name() + ":\"");
			for (String id : entityIds) {
				sb.append(id);
				sb.append(",");
			}
			sb.deleteCharAt(sb.length() - 1);
			sb.append("\" ");

			if (focusIds.size() > 0) {
				sb.append(FL_RequiredPropertyKey.LINKED.name() + ":\"");
				for (String id : focusIds) {
					sb.append(id);
					sb.append(",");
				}
				sb.deleteCharAt(sb.length() - 1);
				sb.append("\" ");
			}

			sb.append("MATCH:all");
			final PropertyMatchBuilder terms = new PropertyMatchBuilder(sb.toString(), _transactionsSearcher.getDescriptors(), _clusterDataAccess, true, _applicationConfiguration.hasMultipleEntityTypes());
			Map<String, List<FL_PropertyMatchDescriptor>> termMap = terms.getDescriptorMap();


			FL_SearchResults sResponse;
			if (termMap.size() > 0) {
				sResponse = _transactionsSearcher.search(termMap, orderBy, startRow, totalRows, FL_LevelOfDetail.FULL);
			} else {
				// No terms. Return zero results.
				sResponse = FL_SearchResults.newBuilder().setTotal(0).setResults(new ArrayList<FL_SearchResult>()).setLevelOfDetail(FL_LevelOfDetail.FULL).build();
			}

			LedgerResult ledgerResult = buildForClient(sResponse, entityIds, focusIds);
	
			List<String> colNames = ledgerResult.getColumnUnits();
			List<List<String>> data = ledgerResult.getTableData();
			
			JSONArray dataArray = new JSONArray();
			
			int rowNumber = startRow+1;
			for (List<String> row : data) {
				JSONArray rowArr = new JSONArray();
				rowArr.put(rowNumber);
				for (String d : row) {
					rowArr.put(d);
				}
				dataArray.put(rowArr);
				rowNumber++;
			}
				
			JSONArray columnArray = new JSONArray();
			for (String column : colNames) {
				JSONObject colObj = new JSONObject();
				colObj.put("colLabel", column);
				columnArray.put(colObj);
			}
				
			JSONObject result = new JSONObject();
				
			result.put("sEcho",sEcho);
			result.put("columns", columnArray);
			result.put("totalRecords",ledgerResult.getTotalRows());
			result.put("tableData", dataArray);
				
			return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
			
		} catch (JSONException je) {
		throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"JSON parse error.",
				je
			);
		} catch (AvroRemoteException dae) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Data access error.",
				dae
			);
		}
	}




	static private StringRepresentation emptyResult(String sEcho) throws JSONException {
		JSONObject result = new JSONObject();
		JSONArray dataArray = new JSONArray();
		result.put("tableData", dataArray);
		//result.put("aoColumns", columnArray);
		result.put("sEcho",sEcho);
		result.put("totalDisplayRecords",0);
		result.put("totalRecords",0);

		return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
	}	
	
	
	
	public static LedgerResult buildForClient(FL_SearchResults results, List<String> entityIds, List<String> focusIds) {
		
		List<FL_SearchResult> searchResults = results.getResults();
		
		List<List<String>> tableData = new ArrayList<List<String>>();
		

		String dateLabel = null;
		String commentLabel = null;
		String flowUnits = null;
		
		if (focusIds != null && focusIds.size() > 0) {
			for (int i = 0; i < searchResults.size(); i++) {
				FL_Link link = (FL_Link)searchResults.get(i).getResult();			
				if (!focusIds.contains(link.getTarget()) && !focusIds.contains(link.getSource())) {
					searchResults.remove(i);
					i--;
				}
			}
			results.setTotal(new Long(searchResults.size()));
		}

		for (int i = 0; i < searchResults.size(); i++) {
			
			FL_Link link = (FL_Link)searchResults.get(i).getResult();
			
			String date = null;
			String comment = null;
			String inflowing = "-";
			String outflowing = "-";
			String id = null;

			// get the date column
			FL_Property date_prop = PropertyHelper.getPropertyByKey(link.getProperties(), FL_RequiredPropertyKey.DATE.name());
			PropertyHelper date_helper = PropertyHelper.from(date_prop);
			date = date_helper.getValue().toString();
			dateLabel = (dateLabel == null) ? date_helper.getFriendlyText() : dateLabel;

			// get amount
			FL_Property amount_prop = PropertyHelper.getPropertyByKey(link.getProperties(), FL_RequiredPropertyKey.AMOUNT.name());
			String stringValue;
			if (amount_prop != null) {
				PropertyHelper amount_helper = PropertyHelper.from(amount_prop);
				Number value = (Number) amount_helper.getValue();
				if (amount_helper.hasTag(FL_PropertyTag.COUNT)) {
					flowUnits = (flowUnits == null) ? FL_PropertyTag.COUNT.name().toLowerCase() : flowUnits;
					stringValue = ResultFormatter.formatCount(value);
				} else if (amount_helper.hasTag(FL_PropertyTag.USD)) {
					flowUnits = (flowUnits == null) ? FL_PropertyTag.USD.name() : flowUnits;
					stringValue = ResultFormatter.formatCur(value, true);
				} else {
					stringValue = value.toString();
				}
			} else {
				stringValue = "✓";
			}

			if (entityIds.contains(link.getSource())) {
				outflowing = stringValue;
			} else {
				inflowing = stringValue;
			}

			// get comment
			List<FL_Property> annotation_props = PropertyHelper.getPropertiesByTag(link.getProperties(), FL_PropertyTag.ANNOTATION);
			if (annotation_props.size() > 0) {
				// we get the first non-empty annotation property
				for (FL_Property prop : annotation_props) {
					PropertyHelper annotation_helper = PropertyHelper.from(prop);
					Object val = annotation_helper.getValue();

					// Check if it's empty or whitespace
					if (val != null && val.toString().trim().length() > 0) {
						comment = val.toString();
						commentLabel = commentLabel == null ? annotation_helper.getFriendlyText() : commentLabel;
						break;
					}
				}
			}

			// get ID
			List<FL_Property> id_props = PropertyHelper.getPropertiesByTag(link.getProperties(), FL_PropertyTag.ID);
			if (id_props.size() > 0) {
				// we get the first id property
				PropertyHelper id_helper = PropertyHelper.from(id_props.get(0));
				id = id_helper.getValue().toString();
			}
				
			List<String> newRow = new ArrayList<String>(7);
			newRow.add(date); // Date
			newRow.add(comment);			// Comment
			newRow.add(inflowing); 
			newRow.add(outflowing); 
			newRow.add(link.getSource());	//Source entityId
			newRow.add(link.getTarget());	//Destination entityId
			newRow.add(id);					//Transaction Id
			tableData.add(newRow);
		}

		int cols = 5;

		String inflowLabel = flowUnits == null ? "Inflowing" : String.format("In (%s)", flowUnits);
		String outflowLabel = flowUnits == null ? "Outflowing" : String.format("Out (%s)", flowUnits);
		
		List<String> columnLabels = new ArrayList<String>(4);
		columnLabels.add(dateLabel);
		columnLabels.add(commentLabel);
		columnLabels.add(inflowLabel);
		columnLabels.add(outflowLabel);
		
		return new LedgerResult(cols, searchResults.size(), columnLabels, tableData, results.getTotal());
	}
}
