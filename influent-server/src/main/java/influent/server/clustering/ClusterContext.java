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

import java.io.IOException;
import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.avro.Schema;
import org.apache.avro.io.DatumReader;
import org.apache.avro.io.DatumWriter;
import org.apache.avro.io.Decoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.Encoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import org.apache.avro.specific.SpecificDatumWriter;

public class ClusterContext implements Serializable {
	
	private static final long serialVersionUID = 1L;
	
	public static final Schema CLUSTER_MAP_SCHEMA = Schema.createMap(FL_Cluster.getClassSchema());
	public static final Schema ENTITY_MAP_SCHEMA = Schema.createMap(FL_Entity.getClassSchema());
	
	public Map<String, FL_Cluster> roots = new HashMap<String, FL_Cluster>();
	public Map<String, FL_Cluster> clusters = new HashMap<String, FL_Cluster>();
	public Map<String, FL_Entity> entities = new HashMap<String, FL_Entity>();
	
	
	public void addClusters(Collection<FL_Cluster> clusters) {
		for (FL_Cluster cluster : clusters) {
			this.clusters.put(cluster.getUid(), cluster);
		}
	}
	
	public void addEntities(Collection<FL_Entity> entities) {
		for (FL_Entity entity : entities) {
			this.entities.put(entity.getUid(), entity);
		}
	}
	
	/**
	 * Remove all contents of cluster context
	 */
	public void clear() {
		roots.clear();
		clusters.clear();
		entities.clear();
	}
	
	/**
	 * Override Java serialization methods
	 */
	private void writeObject(java.io.ObjectOutputStream out) throws IOException {
		final Encoder encoder = EncoderFactory.get().binaryEncoder(out, null);

		final DatumWriter<Map<String, FL_Cluster>> cwriter = new SpecificDatumWriter<Map<String, FL_Cluster>>(CLUSTER_MAP_SCHEMA);
		cwriter.write(roots, encoder);
		cwriter.write(clusters, encoder);

		final DatumWriter<Map<String, FL_Entity>> ewriter = new SpecificDatumWriter<Map<String, FL_Entity>>(ENTITY_MAP_SCHEMA);
		ewriter.write(entities, encoder);
		encoder.flush();
	}
	
	
	
	
	private void readObject(java.io.ObjectInputStream in) throws IOException, ClassNotFoundException {
		final Decoder decoder = DecoderFactory.get().binaryDecoder(in, null);


		final DatumReader<Map<String, FL_Cluster>> creader = new SpecificDatumReader<Map<String, FL_Cluster>>(CLUSTER_MAP_SCHEMA);
		roots = creader.read(roots, decoder);
		clusters = creader.read(clusters, decoder);
		
		final DatumReader<Map<String, FL_Entity>> ereader = new SpecificDatumReader<Map<String, FL_Entity>>(ENTITY_MAP_SCHEMA);
		entities = ereader.read(entities, decoder);
	}
} 
