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
package influent.entity.clustering;

import influent.entity.clustering.SchemaField.FieldType;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import scala.Tuple2;
import spark.api.java.JavaPairRDD;
import spark.api.java.JavaSparkContext;
import spark.api.java.function.Function;
import spark.api.java.function.PairFunction;

import com.oculusinfo.ml.Instance;
import com.oculusinfo.ml.distance.semantic.EditDistance;
import com.oculusinfo.ml.distance.semantic.ExactTokenMatchDistance;
import com.oculusinfo.ml.distance.spatial.HaversineDistance;
import com.oculusinfo.ml.distance.vector.EuclideanDistance;
import com.oculusinfo.ml.feature.BagOfWordsFeature;
import com.oculusinfo.ml.feature.centroid.BagOfWordsCentroid;
import com.oculusinfo.ml.feature.centroid.FastGeoSpatialCentroid;
import com.oculusinfo.ml.feature.centroid.MeanNumericVectorCentroid;
import com.oculusinfo.ml.spark.SparkDataSet;
import com.oculusinfo.ml.spark.unsupervised.KMeansClusterer;
import com.oculusinfo.ml.spark.unsupervised.SparkClusterResult;

public class ClusterEntities implements Serializable {
	private static final long serialVersionUID = 9201465724526156883L;
	private static Logger log = LoggerFactory.getLogger("influent");
	
	private Map<String, String> geoIndex;
	private String[][] clusterOrder;
	private Map<String, SchemaField> schemaMap;
	private String inputDir;
	private String outputDir;
	private int minClusterSize;
	
	private static final int K = 5; //10; 
	private static final int MAX_FIELD_ITERATIONS = 3; //5;
	private static final int MAX_KMEANS_ITERATIONS = 5; //10;
	private static final int MIN_CLUSTER_SIZE = 10; //100;
	private static final double KMEANS_STOPPING_THRESHOLD = 0.001;
	
	private enum GEOLevel {
		Continent,
		Region,
		Country
	}
	
	public ClusterEntities(Map<String, SchemaField> schemaMap, String[][] clusterOrder, String inputDir, String outputDir, int minclustersize) {
		log.error("Creating Geo Index");
		geoIndex = createGeoIndex();
		
		this.schemaMap = schemaMap;
		this.clusterOrder = clusterOrder;
		this.inputDir = inputDir;
		this.outputDir = outputDir.endsWith("/") ? outputDir : outputDir + "/";
		this.minClusterSize = minclustersize;
	}
	
	public void start() {
		doCluster();
	}
	
	private Map<String, String> createGeoIndex() {
		Map<String, String> geoIndex = new HashMap<String, String>();
		
		try {
			InputStream in = ClusterEntities.class.getResourceAsStream("/geo_code.csv");
			
			String line = null;
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			reader.readLine();  // skip the header line
			
			while((line = reader.readLine()) != null) {
				String[] row = line.split(",");
			
				// map ISO 2 digit country code to region
				geoIndex.put(row[5], row[1]);
				
				// map ISO 3 digit country code to region
				geoIndex.put(row[6], row[1]);
				
				// map region to continent
				geoIndex.put(row[1], row[0]);
					
				// Add any FIPS country codes that do not conflict with ISO
				if (geoIndex.containsKey(row[4]) == false) {
					// FIPS country code to region
					geoIndex.put(row[4], row[1]);
				}
			}
			
		} catch (IOException e) {
			System.err.println(e.getMessage());
			e.printStackTrace();
		}
		
		return geoIndex;
	}
	
	private JavaPairRDD<String, Instance> clusterByCategory(JavaPairRDD<String, Instance> instances, final String fieldName, final String clusterKey) {
		JavaPairRDD<String, Instance> results = instances.map(new PairFunction<Tuple2<String, Instance>, String, Instance>() {
			private static final long serialVersionUID = 952727691373866019L;

			@Override
			public Tuple2<String, Instance> call(Tuple2<String, Instance> item) throws Exception {
				Instance inst = item._2;
				
				String category = "Unknown";
				
				if (inst.containsFeature(fieldName, fieldName)) {
					BagOfWordsFeature f = (BagOfWordsFeature)inst.getFeature(fieldName, fieldName).iterator().next();
					category = f.getFreqTable().getAll().iterator().next().getFeature().getName();
				}
				return new Tuple2<String, Instance>(clusterKey + "-" + category.replaceAll("[^\\w]", ""), inst);
			}
		});
		return results;
	}
	
	private JavaPairRDD<String, Instance> clusterByCountryCode(JavaPairRDD<String, Instance> instances, final String fieldName, final String clusterKey, final GEOLevel lvl) {
		JavaPairRDD<String, Instance> results = instances.map(new PairFunction<Tuple2<String, Instance>, String, Instance>() {
			private static final long serialVersionUID = 952727691373866019L;

			@Override
			public Tuple2<String, Instance> call(Tuple2<String, Instance> item) throws Exception {
				Instance inst = item._2;
				String geoKey = "Unknown";
				String countrycode = null;
				if (inst.containsFeature(fieldName, fieldName)) {
					BagOfWordsFeature f = (BagOfWordsFeature)inst.getFeature(fieldName, fieldName).iterator().next();
					countrycode = f.getFreqTable().getAll().iterator().next().getFeature().getName(); //((StringFeature)inst.getFeature(fieldName, fieldName).iterator().next()).getValue();
					
					String region = geoIndex.get(countrycode);
					String continent = geoIndex.get(region);
				
					switch (lvl) {
					case Continent:
						if (continent != null) geoKey = continent;
						break;
					case Region:
						if (region != null) geoKey = region;
						break;
					default:
						if (countrycode != null) geoKey = countrycode;
						break;
					}
				}
				return new Tuple2<String, Instance>(clusterKey + "-" + geoKey, inst);
			}
		});
		return results;
	}
	
	private JavaPairRDD<String, Instance> clusterByLatLon(JavaSparkContext sc, JavaPairRDD<String, Instance> instances, String fieldName, final String clusterKey) {
		SparkDataSet ds = new SparkDataSet(sc);
		ds.load(instances);
		
		KMeansClusterer clusterer = new KMeansClusterer(K, MAX_KMEANS_ITERATIONS, KMEANS_STOPPING_THRESHOLD);
		
		clusterer.registerFeatureType(
				fieldName,
				fieldName, 
				FastGeoSpatialCentroid.class, 
				new HaversineDistance(1.0));
		SparkClusterResult result = clusterer.doCluster(ds);
		
		return result.getRDD();
	}
	
	private JavaPairRDD<String, Instance> clusterByLabel(JavaSparkContext sc, JavaPairRDD<String, Instance> instances, String fieldName, final String clusterKey) {
		SparkDataSet ds = new SparkDataSet(sc);
		ds.load(instances);
		
		KMeansClusterer clusterer = new KMeansClusterer(K, MAX_KMEANS_ITERATIONS, KMEANS_STOPPING_THRESHOLD);
		
		clusterer.registerFeatureType(
				fieldName,
				fieldName, 
				BagOfWordsCentroid.class, 
				new EditDistance(1.0)); 
		SparkClusterResult result = clusterer.doCluster(ds);
		
		return result.getRDD();
	}
	

	private JavaPairRDD<String, Instance> clusterByNumeric(JavaSparkContext sc, JavaPairRDD<String, Instance> instances, String fieldName, final String clusterKey) {
		SparkDataSet ds = new SparkDataSet(sc);
		ds.load(instances);
		
		KMeansClusterer clusterer = new KMeansClusterer(K, MAX_KMEANS_ITERATIONS, KMEANS_STOPPING_THRESHOLD);
		
		clusterer.registerFeatureType(
				fieldName,
				fieldName, 
				MeanNumericVectorCentroid.class, 
				new EuclideanDistance(1.0));
		SparkClusterResult result = clusterer.doCluster(ds);
		
		return result.getRDD();
	}
	
	private JavaPairRDD<String, Instance> clusterByFeatures(JavaSparkContext sc, JavaPairRDD<String, Instance> instances, String[] fieldNames, FieldType[] fieldTypes, final String clusterKey) {
		SparkDataSet ds = new SparkDataSet(sc);
		ds.load(instances);
		
		KMeansClusterer clusterer = new KMeansClusterer(K, MAX_KMEANS_ITERATIONS, KMEANS_STOPPING_THRESHOLD);
		
		for (int i=0; i < fieldNames.length; i++) {
			switch (fieldTypes[i]) {
			case CC:
			case CATEGORY:
				clusterer.registerFeatureType(
						fieldNames[i],
						fieldNames[i], 
						BagOfWordsCentroid.class, 
						new ExactTokenMatchDistance(1.0));
				break;
			case NUMBER:
				clusterer.registerFeatureType(
						fieldNames[i],
						fieldNames[i], 
						MeanNumericVectorCentroid.class, 
						new EuclideanDistance(1.0));
				break;
			case LABEL:
				clusterer.registerFeatureType(
						fieldNames[i],
						fieldNames[i], 
						BagOfWordsCentroid.class, 
						new EditDistance(1.0)); 
				break;
			case GEO:
				clusterer.registerFeatureType(
						fieldNames[i],
						fieldNames[i], 
						FastGeoSpatialCentroid.class, 
						new HaversineDistance(1.0));
				break;
			default:
				/* ignore */
				break;	
			}
		}
		SparkClusterResult result = clusterer.doCluster(ds);
		
		return result.getRDD();
	}
	
	private GEOLevel incrementGeoLevel(GEOLevel curGeoLvl) {
		if (curGeoLvl == GEOLevel.Continent) return GEOLevel.Region;
		else if (curGeoLvl == GEOLevel.Region) return GEOLevel.Country;
		else return null;  // can't increment further
	}
	
	private String fieldsToString(String[] fields) {
		StringBuilder str = new StringBuilder();
		for (String field : fields) {
			str.append(field + " ");
		}
		return str.toString();
	}
	
	private boolean isValidClustering(JavaPairRDD<String, Instance> clusters, long clusterCount) {
		// TODO should measure goodness of clustering
		return (clusterCount > 1);
	}
	
	public void doCluster() {
		log.error("Starting hierarchical entity clustering");
		
		String jobName = "influent clustering";  // name that is shown in job monitoring consoles when running in distributed mode
		
		long start = System.currentTimeMillis();
		
		// create a local spark context
		JavaSparkContext sc = new JavaSparkContext("local[8]", jobName);
		
		// intialize the clusters to split as the input data set
		List<String> deferredClustersToSplit = new LinkedList<String>();
		List<String> clustersToSplit = new LinkedList<String>();
		clustersToSplit.add(inputDir);
		
		int prevField = -1;
		int curField = 0;
		
		int fieldIteration = 0;
		int iteration = 0;
		int clusterCount = 1;
		
		// initialize the geo level to continent binning
		GEOLevel curGeoLvl = GEOLevel.Continent;
		
		//
		// Top down Divisive hierarchical clustering using binning and k-means clustering - each stage clusters by a distinct feature
		//
		while (true) {
			// Check if we have more fields to cluster on in the cluster order - if not we are done
			if (curField >= clusterOrder.length) break;
			
			long iterStart = System.currentTimeMillis();
			
			// retrieve the fields we are clustering on from the cluster order
			String[] fields = clusterOrder[curField];
			
			// retrieve the field types
			FieldType[] types = new FieldType[fields.length];
			for (int i=0; i < fields.length; i++) {
				types[i] = schemaMap.get(fields[i]).fieldType;
			}
			
			// if we have moved on to a new field then schedule all the deferred clusters for splitting
			if (curField != prevField) {
				clustersToSplit.addAll(deferredClustersToSplit);
				
				// update the previous field
				prevField = curField;
			}
			
			// queue of clusters scheduled for splitting during this iteration
			List<String> clusterSets = new LinkedList<String>(clustersToSplit);
			clustersToSplit.clear();  // reset this iterations clustersToSplit
								
			boolean newClusters = false;
			
			log.error("Iteration " + iteration + ": clustering on fields: " + fieldsToString(fields));
			log.error(clusterCount + " clusters scheduled for splitting");
			
			// reset iteration cluster count
			clusterCount = 0;
			
			// process each cluster 
			for (String clusterSet : clusterSets) {
				SparkDataSet ds = new SparkDataSet(sc);
				ds.load(clusterSet, new EntityInstanceParser(new ArrayList<SchemaField>(schemaMap.values())));
//				ds.getRDD().cache();
				//ds.getRDD().persist(StorageLevel.MEMORY_AND_DISK());
				
				// retrieve the keys of the clusters in this cluster set
				List<String> clusterKeys = ds.getRDD().keys().distinct().collect();

							
				// for each cluster, sub-cluster the items
				for (final String clusterKey : clusterKeys) {
					JavaPairRDD<String, Instance> items;
					// find all items associated with this clusterkey (members of this cluster)
					items = ds.getRDD().filter(new Function<Tuple2<String,Instance>, Boolean>()  {
						private static final long serialVersionUID = -6796698798235704752L;

						@Override
						public Boolean call(Tuple2<String, Instance> cluster) throws Exception {
							return cluster._1.equalsIgnoreCase(clusterKey);
						}
					});
								
					// only need to cluster items if there are more than MIN_CLUSTER_SIZE items
					long count = items.count();
					
					log.error("* Attempting to split cluster with key: " + clusterKey);
					
					if (count > minClusterSize) {			
						// store the sub-cluster output in a subdirectory named after the cluster that was split
						String clusterOutput = outputDir + "clusters-lvl" + iteration + "/" + clusterKey;
								
						// iteration results
						JavaPairRDD<String, Instance> results = null;
					
						long clusterStart = System.currentTimeMillis();
						
						if (fields.length == 1) {
							// determine the field type and cluster appropriately
							switch (types[0]) {
							case CC:
								results = clusterByCountryCode(items, fields[0], clusterKey, curGeoLvl);						
								break;
							case GEO:
								results = clusterByLatLon(sc, items, fields[0], clusterKey);
								break;
							case LABEL:
								results = clusterByLabel(sc, items, fields[0], clusterKey);
								break;
							case NUMBER:
								results = clusterByNumeric(sc, items, fields[0], clusterKey);
								break;
							case CATEGORY:
								results = clusterByCategory(items, fields[0], clusterKey);
								break;
							default:
								/* unsupported - ignore */
								break;
							}
						}
						else {
							results = clusterByFeatures(sc, items, fields, types, clusterKey);
						}
							
						
						// if the cluster was successfully split during this iteration then save result and schedule results for further split
						// otherwise, re-schedule the cluster for splitting in the next iteration 
						long subClusterCount = results.keys().distinct().count();
						
						log.error("* Sub-clustering time: " + (System.currentTimeMillis()-clusterStart) + " ms");
						
						if ( isValidClustering(results, subClusterCount) ) {
							log.error("* Cluster successfully split on field: " + fieldsToString(fields) + ": scheduling sub-clusters for splitting");
							results.saveAsTextFile(clusterOutput);
							newClusters = true;
							clustersToSplit.add(clusterOutput);
							clusterCount += subClusterCount;
						}
						else {
							log.error("* Cluster couldn't be split on field: " + fieldsToString(fields) + ": scheduling for next phase clustering");
							items.saveAsTextFile(clusterOutput);  
							deferredClustersToSplit.add(clusterOutput);  // defer to the next feature
							//clustersToSplit.add(clusterOutput);
//							clusterCount += 1;
						}
					}
					else {
						log.error("* Skipping cluster with key: " + clusterKey + ": size is <" + minClusterSize);
					}
				}
			}
			
			if (fields.length == 1) {
				// allow multiple iterations per field type (CC, Label)
				switch (types[0]) {
				case CC:
					curGeoLvl = incrementGeoLevel(curGeoLvl);
					if (curGeoLvl == null) curField++;   // we are done with binning on country code - move to next field
					fieldIteration = 0;
					break;
				case GEO:
				case NUMBER:
				case CATEGORY:
					// do not iterate for categorical, geo or number
					fieldIteration = 0;
					curField++;
					break;
				default: 
					// all other field types allow iterative clustering on the field
					fieldIteration++;
				
					if (newClusters == false || fieldIteration >= MAX_FIELD_ITERATIONS) {
						// max iteration reached - move on to next field
						fieldIteration = 0;
						curField++;
					}
					break;
				}
			}
			else {
				// all other field types allow iterative clustering on the field
				fieldIteration++;
			
				if (newClusters == false || fieldIteration >= MAX_FIELD_ITERATIONS) {
					// max iteration reached - move on to next field
					fieldIteration = 0;
					curField++;
				}
			}
			
			log.error("Iteration " + iteration + " completed in " + (System.currentTimeMillis()-iterStart) + " ms");
			
			iteration++;
		}
		System.out.println("Total Hiearchical Clustering time (ms): " + (System.currentTimeMillis() - start) );
	}
		
	private static void printUsageMsg() {
		System.out.println("Please specify an input directory of pre processed cluster input files and output path.");
		System.out.println("USAGE: EntityClusteringJob --schema=\"<comma list of featureName:<ID | GEO | LABEL | CC | NUMBER | CATEGORY>>\" --clusterorder=\"<comma list of featureNames specified in schema>\" --inputdir=\"<INPUT DIR>\" --ouputdir=\"<OUTPUT DIR>\"");
		System.out.println("OPTIONAL arguments: --minclustersize=\"INTEGER\"  determines the stopping criterion for further splitting a cluster");
		System.out.println("EXAMPLE:  EntityClusteringJob --schema=\"entityType:CATEGORY,location:GEO,name:LABEL,avgTrns:NUMBER\" --clusterorder=\"entityType,location,avgTrns,name\" --inputdir=\"instances\" --outputdir=\"clusters\"");
	}
	
	public static void main(String[] args) {

		try {
			if (args.length < 3) {
				printUsageMsg();
				return;
			}
			String inputDir = null;
			String outputDir = null;
			String[][] clusterOrder = null;
			int minclustersize = MIN_CLUSTER_SIZE;
			Map<String, SchemaField> schemaMap = null;
			
			Map<String, String> argMap = Utils.parseArguments(args);
			
			for (String key : argMap.keySet()) {
				if (key.equalsIgnoreCase("schema")) {
					schemaMap = Utils.parseSchemaMap(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("inputdir")) {
					inputDir = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("outputdir")) {
					outputDir = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("clusterorder")) {
					clusterOrder = Utils.parseClusterOrder(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("minclustersize")) {
					minclustersize = Integer.parseInt(argMap.get(key));
				}
			}

			if (inputDir == null || outputDir == null || schemaMap == null || clusterOrder == null) throw new IllegalArgumentException("Missing argument!");
			
			// TODO sanity check the clusterorder and schema match
			
			StringBuilder order = new StringBuilder();
			for (String[] key : clusterOrder) {
				if (key.length > 1) {
					order.append("(");
					for (String subkey : key) {
						order.append(subkey + ":" + schemaMap.get(subkey).fieldType + " ");
					}
					order.deleteCharAt(order.length()-1);
					order.append(") ");
				}
				else {
					order.append(key[0] + ":" + schemaMap.get(key[0]).fieldType + "  ");
				}
			}
			log.error("Clustering entity by features in order: " + order.toString());
			log.error("Input directory: " + inputDir);
			log.error("Output directory: " + outputDir);
			
			(new ClusterEntities(schemaMap, clusterOrder, inputDir, outputDir, minclustersize)).start();
			
		}
		catch (IllegalArgumentException e) {
			printUsageMsg();
			System.err.println("\nERROR: " + e.getMessage());
		}
		catch (Exception e) {
			System.err.println("\nERROR: " + e.getMessage());
			e.printStackTrace();
		}
		
	}
}
