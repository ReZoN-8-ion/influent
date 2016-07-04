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

package influent.server.clustering.utils;

import influent.idl.FL_Cluster;
import influent.idl.FL_Entity;
import influent.server.clustering.ClusterContext;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.avro.io.DatumReader;
import org.apache.avro.io.DatumWriter;
import org.apache.avro.io.Decoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.Encoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import org.apache.avro.specific.SpecificDatumWriter;

/**
 * @author djonker
 */
public class ColumnContext implements Serializable, ContextReadWrite {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	// context id
	private String _contextId;

	// raw cluster hierarchy
	private ClusterContext _rawContext;
	
	// id's of child contexts - currently used to associate file contexts with a column
	private Set<String> _childContexts;
	
	// avro maps for simplified cluster hierarchy
	private Map<String,FL_Cluster> _clusters;
	private Map<String,FL_Entity> _entities;

	private int _version = 1;

	/**
	 * Override Java serialization methods.
	 * MAKE SURE THESE STAY IN SYNC WITH FIELDS ABOVE.
	 */
	private void writeObject(java.io.ObjectOutputStream out) throws IOException {
		
		// write out the context id
		out.writeObject(_contextId);
		
		// write out raw unfiled cluster hierarchy and pojos
		out.writeObject(_rawContext);
		
		// write out the child context list
		out.writeObject(_childContexts);
		
		// write out the context version
		out.writeInt(_version);
		
		// write out avro collections, which do not support Java serialization
		final Encoder encoder = EncoderFactory.get().binaryEncoder(out, null);

		final DatumWriter<Map<String, FL_Cluster>> cwriter = new SpecificDatumWriter<Map<String, FL_Cluster>>(ClusterContext.CLUSTER_MAP_SCHEMA);
		cwriter.write(_clusters, encoder);

		final DatumWriter<Map<String, FL_Entity>> ewriter = new SpecificDatumWriter<Map<String, FL_Entity>>(ClusterContext.ENTITY_MAP_SCHEMA);
		ewriter.write(_entities, encoder);

		// flush all writes
		encoder.flush();
	}
	
	@SuppressWarnings("unchecked")
	private void readObject(java.io.ObjectInputStream in) throws IOException, ClassNotFoundException {
		// read the context id
		_contextId = (String)in.readObject();
		
		// read raw unfiled cluster hierarchy and pojos
		_rawContext = (ClusterContext) in.readObject();
		
		// read child context list
		_childContexts = (HashSet<String>) in.readObject();
		
		// read the context version
		_version = in.readInt();
		
		// avro
		final Decoder decoder = DecoderFactory.get().binaryDecoder(in, null);
		
		final DatumReader<Map<String, FL_Cluster>> creader = new SpecificDatumReader<Map<String, FL_Cluster>>(ClusterContext.CLUSTER_MAP_SCHEMA);
		_clusters = creader.read(_clusters, decoder);
		
		final DatumReader<Map<String, FL_Entity>> ereader = new SpecificDatumReader<Map<String, FL_Entity>>(ClusterContext.ENTITY_MAP_SCHEMA);
		_entities = ereader.read(_entities, decoder);
	}
	
	/**
	 * 
	 */
	public ColumnContext(String contextId) {
		_contextId = contextId;
		_childContexts = new HashSet<String>();
		_clusters = new HashMap<String, FL_Cluster>();
		_entities = new HashMap<String, FL_Entity>();
		_rawContext = new ClusterContext();
	}

	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getUId()
	 */
	@Override
	public String getUid() {
		return _contextId;
	}
	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextReadWrite#setContext(influent.server.clustering.ClusterContext)
	 */
	@Override
	public void setContext(ClusterContext context) {
		_rawContext = context;
	}
	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getContext()
	 */
	@Override
	public ClusterContext getContext() {
		return _rawContext;
	}
	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getCluster(java.lang.String)
	 */
	@Override
	public FL_Cluster getCluster(String id) {
		return _clusters.get(id);
	}

	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getClusters()
	 */
	@Override
	public List<FL_Cluster> getClusters() {
		return new ArrayList<FL_Cluster>(_clusters.values());
	}
	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getClusters(java.util.Collection)
	 */
	@Override
	public List<FL_Cluster> getClusters(Collection<String> ids) {
		List<FL_Cluster> results = new ArrayList<FL_Cluster>();
		for (String id : ids) {
			FL_Cluster c = _clusters.get(id);

			if (c != null) {
				results.add(c);
			}
		}
		return results;
	}
	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getEntity(java.lang.String)
	 */
	@Override
	public FL_Entity getEntity(String id) {
		return _rawContext.entities.get(id);
	}

		
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getEntities(java.util.Collection)
	 */
	@Override
	public List<FL_Entity> getEntities(Collection<String> ids) {
		List<FL_Entity> results = new ArrayList<FL_Entity>();
		for (String id : ids) {
			FL_Entity c = _rawContext.entities.get(id);
			
			if (c != null) {
				results.add(c);
			}
		}
		return results;
	}

	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextReadWrite#setSimplifiedContext(java.util.Collection)
	 */
	@Override
	public void setSimplifiedContext(Collection<FL_Cluster> clusters) {
		setSimplifiedContext(clusters, Collections.<FL_Entity>emptyList());
	}
	
	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextReadWrite#setSimplifiedContext(java.util.Collection, java.util.Collection)
	 */
	@Override
	public void setSimplifiedContext(Collection<FL_Cluster> clusters, Collection<FL_Entity> rootEntities) {
		// clear the old simplified context
		_clusters.clear();
		_entities.clear();
		
		for (FL_Cluster cluster : clusters) {
			_clusters.put(cluster.getUid(), cluster);	
		}
		
		for (FL_Entity entity : rootEntities) {
			_entities.put(entity.getUid(), entity);
		}
		
		_version++;		
	}

	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextRead#getChildContexts(String)
	 */
	@Override
	public List<String> getChildContexts() {
		return new ArrayList<String>(_childContexts);
	}

	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextReadWrite#addChildContext(String)
	 */
	@Override
	public void addChildContext(String contextId) {
		_childContexts.add(contextId);
	}

	/* (non-Javadoc)
	 * @see influent.entity.clustering.utils.ContextReadWrite#removeChildContext(String)
	 */
	@Override
	public void removeChildContext(String contextId) {
		_childContexts.remove(contextId);
	}

	@Override
	public boolean isEmpty() {
		return _entities.isEmpty() && _clusters.isEmpty();
	}

	@Override
	public List<Object> getRootObjects() {
		List<Object> roots = new ArrayList<Object>();
		
		// add root level entities
		roots.addAll(_entities.values());
		
		// add root clusters
		for (String id : _clusters.keySet()) {
			FL_Cluster cluster = _clusters.get(id);
			if (cluster.getParent() == null) {
				roots.add(cluster);
			}
		}
		return roots;
	}
	
	@Override
	public int getVersion() {
		return _version;
	}
}
