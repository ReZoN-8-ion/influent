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

import influent.idl.FL_Cluster;
import influent.idl.FL_Entity;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.PropertyHelper;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.clustering.utils.ClustererProperties;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import oculus.aperture.spi.common.Properties;

import com.oculusinfo.ml.DataSet;
import com.oculusinfo.ml.Instance;
import com.oculusinfo.ml.feature.string.StringFeature;
import com.oculusinfo.ml.feature.string.centroid.StringMedianCentroid;
import com.oculusinfo.ml.feature.string.distance.EditDistance;
import com.oculusinfo.ml.unsupervised.cluster.BaseClusterer;
import com.oculusinfo.ml.unsupervised.cluster.Cluster;
import com.oculusinfo.ml.unsupervised.cluster.ClusterResult;
import com.oculusinfo.ml.unsupervised.cluster.kmeans.KMeans;
import com.oculusinfo.ml.utils.StringTools;

public class LabelEntityClusterer extends BaseEntityClusterer {
	private static Set<String> stopwords;
	private Map<String, String> keyLookup;
	private Properties pMgr;
	private Boolean clusterByAlpha;
	private int K = 6;
	private int bucketSize = 10;
	
	private Set<String> getStopWords() {
		Set<String> stopwords = new HashSet<String>();
		
		try {
			// retrieve the stopwords property
			String stopwordsProp = pMgr.getString(ClustererProperties.STOP_WORDS, "");
			
			for (String word : stopwordsProp.split(",")) {
				stopwords.add(word.toLowerCase());
			}
			
		} catch (Exception e) {
			log.error("Failed to load stop words from clusterer.properties.", e);
		}
		
		return stopwords;
	}
	
	protected List<String> tokenizeString(String label) {
		List<String> candidates = new LinkedList<String>();

		String cleaned = label; //label.replaceAll("[.,!@#$%^&*()-_=+}{;:'\"?/<>\\[\\]\\\\]", " ");

		Pattern regex = Pattern.compile("\\p{L}[\\p{L}\\p{P}]+\\p{L}");
		
		//String[] tokens = regex.split(label); //label.split(" ");
		Matcher lexer = regex.matcher(cleaned);
		
		while (lexer.find()) {
			String token = lexer.group().toLowerCase();
			if (stopwords.contains(token) == false) candidates.add(token);
		}

	    return candidates;
	}

	@Override
	public void init(Object[] args) {
		try {
			clusterFactory = (EntityClusterFactory)args[0];
			clusterField = (String)args[1];
			clusterByAlpha = (Boolean)args[2];
			pMgr = (Properties)args[3];
			
			if (clusterByAlpha) {
				bucketSize = (Integer)args[4];
				keyLookup = createAlphaKeyLookupTable();
			} else {
				K = (Integer)args[4];
			}
			stopwords = getStopWords();
		 }
		 catch (Exception e) {
			 throw new IllegalArgumentException("Invalid initialization parameters.", e);
		 }
	}
	
	private String cleanString(String label) {
		String cleanStr = label.trim();
		
		// first strip out stop words from label
		if (pMgr.getBoolean(ClustererProperties.ENABLE_STOPWORDS, false)) {
			List<String> tokens = tokenizeString(cleanStr);
			StringBuilder str = new StringBuilder();
			for (String token : tokens) {
				str.append(token);
			}
			cleanStr = str.toString();
		}
		return cleanStr;
	}
	
	private Map<String, String> createAlphaKeyLookupTable() {
		String[] alphabet = new String[]{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"};
		Map<String, String> lookupTable = new HashMap<String, String>();
		
		int start = 0;
		
		while (start < 26) {
			StringBuilder key = new StringBuilder();
			for (int i=start; i < start+bucketSize && i < 26; i++) {
				key.append(alphabet[i]);
			}
			
			for (int i=start; i < start+bucketSize && i < 26; i++) {
				lookupTable.put(alphabet[i], key.toString());
			}
			start += bucketSize;
		}
		return lookupTable;
	}
	
	private String toLabelKey(String key) {
		if (clusterByAlpha) {  // bucketing by alpha
			if (key.isEmpty()) {
				key = "_";
			} else { // if there is a key lookup it's key value (might be bucketing alpha into ranges)
				String alpha = key.substring(0, 1).toLowerCase();
				if (keyLookup.containsKey(alpha)) {
					key = keyLookup.get(alpha);
				} else {
					key = "_";
				}
			}
		}
		else {  // use fingerprint
			// first clean the string
			key = cleanString(key);
			// compute a hash fingerprint for string to use for label clustering
			key = StringTools.fingerPrint(key);
		} 
		return key;
	}
	
	@Override
	protected String getBucketKey(FL_Cluster cluster, ClusterContext context) {
		return toLabelKey( super.getBucketKey(cluster, context) );
	}

	@Override
	protected String getBucketKey(FL_Entity entity) {
		return toLabelKey( super.getBucketKey(entity) );
	}
	
	private String getStringValue(PropertyHelper property) {
		String val = "Unknown";  // default if no valid property value found
		
		// try to read the double value of the entity
		if (property != null && property.getRange() != null) {
			Object v = property.getValue();
			if (v instanceof String) {
				val = (String)v;
			}
		}
		return val;
	}
	
	private Instance createInstance(String id, String label) {
		Instance inst = new Instance(id);
				
		StringFeature feature = new StringFeature("label");
		feature.setValue( cleanString(label) );
		inst.addFeature( feature );
		
		return inst;
	}
	
	private DataSet createDataSet(Collection<FL_Cluster> entities, ClusterContext context) {
		DataSet ds = new DataSet();
		
		for (FL_Cluster entity : entities) {
			PropertyHelper prop = getFirstProperty(entity, toClusterPropertyName(clusterField));
			if (prop == null) {
				FL_Entity firstChild = getFirstChildEntity(entity, context);
				if (firstChild != null) {
					prop = getFirstProperty(firstChild, clusterField);
				}
			}
			if (prop != null) {
				String val = getStringValue(prop);
				Instance inst = createInstance(entity.getUid(), val);
				ds.add(inst);
			}
			else {
				// No valid clusterField property found default to "Unknown"
				Instance inst = createInstance(entity.getUid(), "Unknown");
				ds.add(inst);
			}
		}
		return ds;
	}
	
	private BaseClusterer createEditDistanceClusterer() {
		KMeans clusterer = new KMeans(K, 5, true); 
		clusterer.registerFeatureType("label", StringMedianCentroid.class, new EditDistance(1.0));
		return clusterer;
	}
	
	private ClusterContext clusterByEditDistance(Collection<FL_Entity> entities,
												 Collection<FL_Cluster> immutableClusters,
												 Collection<FL_Cluster> mergeClusters,
												 Collection<FL_Cluster> clusters, 
												 ClusterContext context) {
		
		Map<String, FL_Entity> entityIndex = createEntityIndex(entities);
		Map<String, FL_Cluster> mergeClusterIndex = createClusterIndex(mergeClusters);
		Map<String, FL_Cluster> immutableClusterIndex = createClusterIndex(immutableClusters);
		Map<String, FL_Cluster> clusterIndex = createClusterIndex(clusters);
		
		DataSet ds = createDataSet(mergeClusters, context);
		
		BaseClusterer clusterer = createEditDistanceClusterer();
		
		List<Cluster> existingClusters = new LinkedList<Cluster>();
		
		for (FL_Cluster cluster : clusters) {			
			String val = "Unknown";
			PropertyHelper prop = getFirstProperty(cluster, toClusterPropertyName(clusterField));
			if (prop != null) {
				val = getStringValue(prop);
			}
			Cluster c = clusterer.createCluster();
			c.setId(cluster.getUid());
			StringFeature feature = new StringFeature("label");
			feature.setValue(val);
			c.addFeature(feature);
			existingClusters.add(c);
		}
		
		ClusterResult rs = null; 
		if (existingClusters.isEmpty()) {
			rs = clusterer.doCluster(ds);
		}
		else {
			rs = clusterer.doIncrementalCluster(ds, existingClusters);
		}
		// clean up
		clusterer.terminate();
		
		Map<String, FL_Cluster> modifiedClusters = new HashMap<String, FL_Cluster>();
		
		for (Cluster c : rs) {
			List<FL_Cluster> subClusters = new LinkedList<FL_Cluster>();
			List<FL_Entity> members = new LinkedList<FL_Entity>();
			
			for (Instance inst : c.getMembers()) {
				FL_Cluster mergeCluster = mergeClusterIndex.get(inst.getId());
				
				for (String entityId : mergeCluster.getMembers()) {				
					if ( entityIndex.containsKey(entityId) ) {
						members.add( entityIndex.get(entityId) );
					}
				}
				
				for (String subClusterId : mergeCluster.getSubclusters()) {
					if ( immutableClusterIndex.containsKey(subClusterId) ){
						subClusters.add( immutableClusterIndex.get(subClusterId) );
					}
				}
			}
			
			FL_Cluster cluster = clusterIndex.get(c.getId());
			if (cluster == null) {
				cluster = clusterFactory.toCluster(members, subClusters);
				// cache the cluster property
				StringFeature feature = (StringFeature)c.getFeature("label");
				String value = feature.getValue();
				addClusterProperty(cluster, clusterField, value);
			}
			else {
				ClusterHelper.addMembers(cluster, members);
				EntityClusterFactory.setEntityCluster(members, cluster);
				
				for (FL_Cluster subCluster : subClusters) {
					ClusterHelper.addSubCluster(cluster, subCluster);
					subCluster.setParent(cluster.getUid());
				}	
				
				// cache the cluster property
				StringFeature feature = (StringFeature)c.getFeature("label");
				String value = feature.getValue();
				addClusterProperty(cluster, clusterField, value);
			}
			modifiedClusters.put(cluster.getUid(), cluster);
		}
		
		ClusterContext result = new ClusterContext();
		result.roots.putAll(modifiedClusters);
		result.clusters.putAll(modifiedClusters);
	
		return result;
	}

	@Override
	public ClusterContext clusterEntities(Collection<FL_Entity> entities,
										  Collection<FL_Cluster> immutableClusters,
										  Collection<FL_Cluster> clusters, 
										  ClusterContext context) {
		
		ClusterContext modifiedClusters = super.clusterEntities(entities, immutableClusters, clusters, context);
		
		Collection<FL_Cluster> newClusters = findNewClusters(modifiedClusters.roots, clusters);
		
		int totalClusters = newClusters.size() + clusters.size();
		
		if (totalClusters > K) {  // more than max clusters generated - merge clusters
			modifiedClusters = clusterByEditDistance(entities, immutableClusters, newClusters, clusters, context);
		}
		return modifiedClusters;
	}
}
