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
import influent.idl.FL_Persistence;
import influent.server.dataaccess.CachedPersistenceAccess;


/**
 * This class is used by the Kiva *server* implementation.
 * It binds the new FL_ implementation for that server.
 *
 */
public class BasicCachedPersistenceModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(FL_Persistence.class).to(CachedPersistenceAccess.class);
	}
	
	
	
	
	/*
	 * Provide the cached service
	 */
	@Provides @Singleton
	public CachedPersistenceAccess connectToCachedPersistenceAccess(
		@Named("influent.midtier.ehcache.config") String ehCacheConfig,
		@Named("influent.persistence.cache.name") String persistenceCacheName,
		@Named("influent.dynamic.clustering.cache.name") String clusteringCacheName
	) {
		return new CachedPersistenceAccess(ehCacheConfig, persistenceCacheName, clusteringCacheName);
	}
}
