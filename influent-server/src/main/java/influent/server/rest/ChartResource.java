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
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.data.ChartData;
import influent.server.data.ChartImage;
import influent.server.data.ImageRepresentation;
import influent.server.utilities.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.common.Properties;

import org.apache.avro.AvroRemoteException;
import org.joda.time.DateTime;
import org.joda.time.MutableDateTime;
import org.json.JSONException;
import org.restlet.data.CacheDirective;
import org.restlet.data.Form;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.resource.Get;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.google.inject.Inject;
import com.google.inject.name.Named;

public class ChartResource extends ApertureServerResource {
	
	final Logger logger = LoggerFactory.getLogger(getClass());

	private final int maxCacheAge;
	private final ChartBuilder chartBuilder;
	private final ClusterContextCache contextCache;
	
	
	
	@Inject
	public ChartResource(
		@Named("influent.charts.maxage") Integer maxCacheAge,
		FL_LinkSearch transactionsSearcher,
		FL_ClusteringDataAccess clusterAccess,
		@Named("influent.midtier.ehcache.config") String ehCacheConfig,
		ClusterContextCache contextCache
	) {
		this.maxCacheAge = maxCacheAge;
		this.contextCache = contextCache;
		chartBuilder = new ChartBuilder(transactionsSearcher, clusterAccess, ehCacheConfig);
	}
	
	
	
	
	@Get
	public Representation getChartImage() {
		try {
			Form form = getRequest().getResourceRef().getQueryAsForm();

			String hash = form.getFirstValue("hash").trim();
			ChartHash hashed = new ChartHash(hash);

			String sessionId = hashed.getSessionId();
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}
			
			String entityContextId = hashed.getContextId();
			String focusContextId = hashed.getFocusContextId();
			
			FL_DateRange dateRange = DateRangeBuilder.getDateRange(hashed.getStartDate(), hashed.getEndDate());
			ChartData data = chartBuilder.computeChart(
				dateRange, 
				hashed.getIds(), 
				hashed.getFocusIds(),
				entityContextId, 
				focusContextId, 
				sessionId, 
				hashed.getNumBuckets(),
				hashed
			);
			ChartImage image = new ChartImage(hashed.getWidth(), hashed.getHeight(), hashed.getFocusMaxDebitCredit(), data);
			image.draw();
					
			getResponse().setCacheDirectives(
				ImmutableList.of(
					CacheDirective.maxAge(maxCacheAge)
				)
			);
			return new ImageRepresentation(image);
		} catch (AvroRemoteException e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Data access error.",
				e
			);
		}
	}
	
	
	
	
	@Post("json")
	public Map<String, ChartData> getChartData(String jsonData) {

		try {
			JSONProperties request = new JSONProperties(jsonData);
			
			final String focusContextId = request.getString("focuscontextid", null);

			final String sessionId = request.getString("sessionId", null);
			if (!GuidValidator.validateGuidString(sessionId)) {
				throw new ResourceException(Status.CLIENT_ERROR_EXPECTATION_FAILED, "sessionId is not a valid UUID");
			}

			DateTime startDate = null;
			try {
				startDate = DateTimeParser.parse(request.getString("startDate", null));
			} catch (IllegalArgumentException iae) {
				throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"ChartResource: An illegal argument was passed into the 'startDate' parameter."
				);
			}
			
			DateTime endDate = null;
			try {
				endDate = DateTimeParser.parse(request.getString("endDate", null));
			} catch (IllegalArgumentException iae) {
				throw new ResourceException(
					Status.CLIENT_ERROR_BAD_REQUEST,
					"ChartResource: An illegal argument was passed into the 'endDate' parameter."
				);
			}
			
			List<String> focusIds = new LinkedList<String>();
			Iterable<String> focusIter = request.getStrings("focusId");
			
			for (String entityId : focusIter) {
				List<String> entities = new ArrayList<String>();
				
				InfluentId id = InfluentId.fromInfluentId(entityId);
				
				// Point account owners and summaries to their owner account
				if (id.getIdClass() == InfluentId.ACCOUNT_OWNER ||
					id.getIdClass() == InfluentId.CLUSTER_SUMMARY) {
					
					entities.add(InfluentId.fromNativeId(InfluentId.ACCOUNT, id.getIdType(), id.getNativeId()).toString());
					
				} else if (id.getIdClass() == InfluentId.CLUSTER) {
					
					String nId = id.getNativeId();  
					if (nId.startsWith("|")) {  // group cluster
						for (String sId : nId.split("\\|")) {
							if (!sId.isEmpty()) {
								entities.add(sId);
							}
						}
					} else {
						entities.add(entityId);
					}
				} else {
					entities.add(entityId);
				}
				
				for (String fid : entities){
					if (!focusIds.contains(fid)){
						focusIds.add(fid);
					}
				}
			}
				
			final Double focusMaxDebitCredit = request.getDouble("focusMaxDebitCredit", null);
			final Integer width = request.getInteger("width", 140);
			final Integer height = request.getInteger("height", 60);
					
			List<Properties> entityArray = Lists.newArrayList(request.getPropertiesSets("entities"));

			Map<String, ChartData> infoList = new HashMap<String, ChartData>(entityArray.size());
					
			final Integer numBuckets = request.getInteger("numBuckets", 15);
			
			/// TODO : make this date range sanity check better
			if (startDate.getYear()<1900 || startDate.getYear()>9999) {
				MutableDateTime msdt = new MutableDateTime(startDate);
				msdt.setYear(2007);
				startDate = msdt.toDateTime();
				logger.warn("Invalid start date passed from UI, setting to default");
			}
			if (endDate.getYear()<1900 || endDate.getYear()>9999) {
				MutableDateTime medt = new MutableDateTime(endDate);
				medt.setYear(2013);
				endDate = medt.toDateTime();
				logger.warn("Invalid end date passed from UI, setting to default");
			}
			FL_DateRange dateRange = DateRangeBuilder.getDateRange(startDate, endDate);
			
			// compute an individual chart for each entity received
			for (Properties entityRequest : entityArray) {
				final String entityId = entityRequest.getString("dataId", null);
				final String entityContextId = entityRequest.getString("contextId", null);
				
				List<String> entityIds = new ArrayList<String>();
				
				InfluentId id = InfluentId.fromInfluentId(entityId);

				if (id.getIdClass() == InfluentId.CLUSTER) {
					String nId = id.getNativeId();  
					if (nId.startsWith("|")) {
						for (String sId : nId.split("\\|")) {
							if (!sId.isEmpty()) {
								entityIds.add(sId);
							}
						}
					} else {
						entityIds.add(entityId);
					}
				} else {
					entityIds.add(entityId);
				}
				ChartHash hash = new ChartHash(
					entityIds,
					startDate,
					endDate,
					focusIds,
					focusMaxDebitCredit,
					numBuckets,
					width,
					height,
					entityContextId,
					focusContextId,
					sessionId,
					contextCache
				);
				
				ChartData chartData = chartBuilder.computeChart(
					dateRange,
					entityIds,
					focusIds,
					entityContextId,
					focusContextId,
					sessionId,
					numBuckets,
					hash
				);

				infoList.put(
						entityId, //memberIds.get(0), 
						chartData
				);
			}			
			
			return infoList;

		} catch (AvroRemoteException e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Data access error.",
				e
			);
		} catch (JSONException je) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"JSON parse error.",
				je
			);
		}
	}
	
	//TODO : de-hack this once the new clustering is in place.
	public static List<String> getLeafNodes (List<? extends Object> entities) {
		List<String> IDs = new ArrayList<String> ();
		for (Object i : entities) {
			if (i instanceof FL_Entity) {
				IDs.add(((FL_Entity)i).getUid());
			} else if (i instanceof FL_Cluster) {
				FL_Cluster ec = (FL_Cluster)i;
				
				//Get the stored clusters.
				List<Object> recurseList = new ArrayList<Object>();
				for (String id : ec.getMembers()) {
					/*EntityCluster subcluster = MemoryTransientClusterStore.getInstance().getMap().get(id);
					if (subcluster != null) {
						recurseList.add(subcluster);
					} else*/ {
						IDs.add(id);		//Not a cluster, assume a raw entity
					}
				}
				IDs.addAll(getLeafNodes(recurseList));
			}				
		}
		return IDs;
	}
}
