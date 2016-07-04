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

package influent.server.clustering;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.apache.avro.AvroRemoteException;

import com.oculusinfo.ml.DataSet;
import com.oculusinfo.ml.Instance;
import com.oculusinfo.ml.feature.spatial.GeoSpatialFeature;
import com.oculusinfo.ml.feature.spatial.centroid.FastGeoSpatialCentroid;
import com.oculusinfo.ml.feature.spatial.distance.HaversineDistance;
import com.oculusinfo.ml.unsupervised.cluster.BaseClusterer;
import com.oculusinfo.ml.unsupervised.cluster.Cluster;
import com.oculusinfo.ml.unsupervised.cluster.ClusterResult;
import com.oculusinfo.ml.unsupervised.cluster.dpmeans.DPMeans;
import influent.idl.FL_Cluster;
import influent.idl.FL_ContinentCode;
import influent.idl.FL_Country;
import influent.idl.FL_DistributionRange;
import influent.idl.FL_Entity;
import influent.idl.FL_Frequency;
import influent.idl.FL_GeoData;
import influent.idl.FL_Geocoding;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_PropertyType;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.clustering.utils.EntityClusterFactory;

public class GeoEntityClusterer extends BaseEntityClusterer {
	private FL_Geocoding geoCoder;
	private GEO_LEVEL level;
	
	public enum GEO_LEVEL {
		Continent,
		Region,
		Country,
		LatLon
	}
	
	@Override
	public void init(Object[] args) {
		try {
			clusterFactory = (EntityClusterFactory)args[0];
			clusterField = (String)args[1];
			geoCoder = (FL_Geocoding)args[2];
			level = (GEO_LEVEL)args[3];
		 }
		 catch (Exception e) {
			 throw new IllegalArgumentException("Invalid initialization parameters.", e);
		 }
	}
	
	private String toGeoKey(FL_GeoData geo) {
		String key = "Unknown";
		
		try {
			List<FL_Country> country = null;
			switch (level) {
			case Continent:
				country = geoCoder.getCountries(Collections.singletonList(geo));
				if (country != null && !country.isEmpty() && country.get(0) != null) {
					FL_ContinentCode continent = country.get(0).getContinent();
					if (continent != null && !continent.name().isEmpty()) {
						key = continent.name();
					}
				}
				break;
			case Region:
				country = geoCoder.getCountries(Collections.singletonList(geo));
				if (country != null && !country.isEmpty() && country.get(0) != null) {
					String region = country.get(0).getRegion();
					if (region != null && !region.isEmpty()) {
						key = country.get(0).getRegion();
					}
				}
				break;
			case Country:
				String cc = geo.getCc();
				if (cc != null && !cc.isEmpty()) {
					key = cc;
				}
				break;
			default:
				break;
			}
		} catch (AvroRemoteException e) {
			log.error("Cluster geo field is not a valid FL_GeoData object! Ignoring.");
		}
		return key;
	}
	
	@Override
	protected String getBucketKey(FL_Cluster cluster, ClusterContext context) {
		String key = "Unknown";
		
		PropertyHelper prop = getFirstProperty(cluster, FL_PropertyType.GEO.name());
		if (prop != null) {
			@SuppressWarnings("unchecked")
			List<FL_Frequency> dist = (List<FL_Frequency>)prop.getValue();
			if (!dist.isEmpty()) {
				FL_Frequency freq = dist.get(0);
				FL_GeoData geo = (FL_GeoData)freq.getRange();	
				key = toGeoKey(geo);
			}
		}
		return key;
	}

	@Override
	protected String getBucketKey(FL_Entity entity) {
		String key = "UNKNOWN";
		
		PropertyHelper prop = getFirstProperty(entity, clusterField);
		if (prop != null) {
			FL_GeoData geo = (FL_GeoData)prop.getValue();
			key = toGeoKey(geo);
		}
		return key;
	}
	
	private Instance createInstance(String id, FL_GeoData geo) {
		Instance inst = new Instance(id);
		
		double lat = 0.0, lon = 0.0;
		
		// sanity check
		if (geo != null && geo.getLat() != null && geo.getLon() != null) {
			lat = geo.getLat();
			lon = geo.getLon();
		}
		
		GeoSpatialFeature feature = new GeoSpatialFeature("geo");
		feature.setValue(lat, lon);
		inst.addFeature( feature );
		
		return inst;
	}
	
	private FL_GeoData getGeoValue(PropertyHelper property) {
		FL_GeoData geo = null;
		
		// try to read the latitude and longitude of the entity
		if (property != null && property.getRange() != null) {
			if (property.getRange() instanceof FL_DistributionRange) {
				@SuppressWarnings("unchecked")
				List<FL_Frequency> dist = (List<FL_Frequency>)property.getValue();
				if (!dist.isEmpty()) {
					FL_Frequency freq = dist.get(0);
					geo = (FL_GeoData) freq.getRange();	
				}
			}
			else {
				geo = (FL_GeoData) property.getValue();
			}
			
			// if the geo property is missing valid lat/long try to use the latitude and longitude of the country
			if (geo == null || geo.getLat() == null || geo.getLon() == null || (geo.getLat() == 0 && geo.getLon() == 0)) {
				try {
					List<FL_Country> countries = geoCoder.getCountries(Collections.singletonList(geo));
					if (!countries.isEmpty()) {
						FL_Country country = countries.get(0);
						if (country != null) {
							geo = country.getCountry();
						}
					}
				} catch (AvroRemoteException e) { /* ignore */ }
			}
		}
		
		// No valid geo info could be found - dummy in a default to cluster this entity
		if (geo == null) {
			geo = new FL_GeoData("Unknown", 0.0, 0.0, "");
		}
		return geo;
	}
	
	private DataSet createDataSet(Collection<FL_Entity> entities,
								  Collection<FL_Cluster> immutableClusters) {
		DataSet ds = new DataSet();
		
		for (FL_Entity entity : entities) {			
			PropertyHelper prop = EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.GEO);
			FL_GeoData geo = getGeoValue(prop);
			
			if (geo != null) {
				Instance inst = createInstance(entity.getUid(), geo);		
				ds.add(inst);
			}
		}
		for (FL_Cluster immutableCluster : immutableClusters) {
			PropertyHelper prop = getFirstProperty(immutableCluster, FL_PropertyType.GEO.name());
			FL_GeoData geo = getGeoValue(prop);
			
			if (geo != null) {
				Instance inst = createInstance(immutableCluster.getUid(), geo);		
				ds.add(inst);
			}
		}
		return ds;
	}
	
	private BaseClusterer createGeoClusterer() {
		DPMeans clusterer = new DPMeans(3, true);
		clusterer.setThreshold(0.01);
		clusterer.registerFeatureType("geo", FastGeoSpatialCentroid.class, new HaversineDistance(1.0));
		return clusterer;
	}
	
	@SuppressWarnings("unchecked")
	private Map<String, FL_Cluster> clusterByLatLon(Collection<FL_Entity> entities,
													Collection<FL_Cluster> immutableClusters,
													Collection<FL_Cluster> clusters) {
		// Haversine clustering
		Map<String, FL_Entity> entityIndex = createEntityIndex(entities);
		Map<String, FL_Cluster> immutableClusterIndex = createClusterIndex(immutableClusters);
		Map<String, FL_Cluster> clusterIndex = createClusterIndex(clusters);
					
		DataSet ds = createDataSet(entities, immutableClusters);
					
		BaseClusterer clusterer = createGeoClusterer();
		
		List<Cluster> existingClusters = new LinkedList<Cluster>();
	
		for (FL_Cluster cluster : clusters) {
			PropertyHelper prop = getFirstProperty(cluster, FL_PropertyType.GEO.name());
			if (prop != null) {
				List<FL_Frequency> dist = (List<FL_Frequency>)prop.getValue();
				
				double lat = 0, lon = 0;
				for (FL_Frequency freq : dist) {
					FL_GeoData geo = (FL_GeoData)freq.getRange();
					lat += geo.getLat();
					lon += geo.getLon();
				}
				lat /= dist.size();
				lon /= dist.size();
				
				Cluster c = clusterer.createCluster();
				c.setId(cluster.getUid());
				GeoSpatialFeature feature = new GeoSpatialFeature("geo");
				feature.setValue(lat, lon);
				c.addFeature(feature);
				existingClusters.add(c);
			}
		}
		
		ClusterResult rs = clusterer.doIncrementalCluster(ds, existingClusters);
		
		// clean up
		clusterer.terminate();
		
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		for (Cluster c : rs) {
			List<FL_Cluster> subClusters = new LinkedList<FL_Cluster>();
			List<FL_Entity> members = new LinkedList<FL_Entity>();
			
			for (Instance inst : c.getMembers()) {
				String id = inst.getId();
				if (entityIndex.containsKey(id)) {
					members.add( entityIndex.get(inst.getId()) );
				}
				else if (immutableClusterIndex.containsKey(id)){
					subClusters.add( immutableClusterIndex.get(id) );
				}
			}
			FL_Cluster cluster = clusterIndex.get(c.getId());
			if (cluster == null) {
				cluster = clusterFactory.toCluster(members, subClusters);
			}
			else {
				ClusterHelper.addMembers(cluster, members);
				EntityClusterFactory.setEntityCluster(members, cluster);
				
				for (FL_Cluster subCluster : subClusters) {
					ClusterHelper.addSubCluster(cluster, subCluster);
					subCluster.setParent(cluster.getUid());
				}			
			}
			modifiedClusters.put(cluster.getUid(), cluster);
		}
		return modifiedClusters;
	}
	
	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities,
										  Collection<FL_Cluster> immutableClusters,
										  Collection<FL_Cluster> clusters, 
										  ClusterContext context) {		
		
		if (level != GEO_LEVEL.LatLon) {
			return super.clusterEntities(entities, immutableClusters, clusters, context);
		}
		
		// Cluster by latitude and longitude
		Map<String, FL_Cluster> modifiedClusters = clusterByLatLon(entities, immutableClusters, clusters);
		
		ClusterContext result = new ClusterContext();
		result.roots.putAll(modifiedClusters);
		result.clusters.putAll(modifiedClusters);
		
		return result;
	}
}
