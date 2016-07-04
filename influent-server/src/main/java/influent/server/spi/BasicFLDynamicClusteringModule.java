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
package influent.server.spi;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.google.inject.name.Named;
import influent.idl.FL_Clustering;
import influent.idl.FL_ClusteringDataAccess;
import influent.idl.FL_DataAccess;
import influent.idl.FL_Geocoding;
import influent.server.clustering.EntityClusterer;
import influent.server.clustering.GeneralEntityClusterer;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.dataaccess.DynamicClustering;
import influent.server.utilities.IdGenerator;
import influent.server.utilities.SQLConnectionPool;
import influent.server.utilities.InfluentId;
import oculus.aperture.spi.common.Properties;

import java.util.UUID;


/**
 *
 */
public class BasicFLDynamicClusteringModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(EntityClusterer.class).to(GeneralEntityClusterer.class);
		bind(FL_Clustering.class).to(DynamicClustering.class);
		bind(FL_ClusteringDataAccess.class).to(DynamicClustering.class);
	}
	
	@Provides @Singleton
	public IdGenerator clusterIdGenerator() {
		return new IdGenerator() {
			@Override
			public String nextId() {
				return InfluentId.fromNativeId(InfluentId.CLUSTER, "cluster", UUID.randomUUID().toString()).getInfluentId();
			}
		};
	}
	
	@Provides @Singleton
	public EntityClusterFactory clusterFactory(
			IdGenerator idGen,
			@Named("aperture.server.config") Properties config,
			FL_Geocoding geocoding
	) {
		try {		
			return new EntityClusterFactory(idGen, geocoding, config);
		} catch (Exception e) {
			addError("Failed to load Clustering Properties", e);
			return null;
		}
	}
	
	/*
	 * Provide the clustering service
	 */
	@Provides @Singleton
	public DynamicClustering clustering (
			FL_DataAccess dataAccess,
			SQLConnectionPool connectionPool,
			DataNamespaceHandler namespaceHandler,
			FL_Geocoding geocoding,
			EntityClusterer clusterer,
			EntityClusterFactory clusterFactory,
			@Named("aperture.server.config") Properties config,
			ClusterContextCache cache
	) {

		try {
			return new DynamicClustering(
				connectionPool,
				namespaceHandler,
				dataAccess, 
				geocoding, 
				clusterer, 
				clusterFactory,
				config,
				cache
			);
		} catch (Exception e) {
			addError("Failed to load Clustering", e);
			return null;
		}
	}
	
}
