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
package influent.server.dataaccess;

import influent.idl.FL_Persistence;
import influent.idl.FL_PersistenceState;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Ehcache;
import net.sf.ehcache.Element;
import org.apache.avro.AvroRemoteException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 */
public class CachedPersistenceAccess implements FL_Persistence {

	private static Logger s_logger = LoggerFactory.getLogger(CachedPersistenceAccess.class);
	
	private final Ehcache persistenceCache;
	
	
	public CachedPersistenceAccess(
		String ehCacheConfig,
		String persistenceCacheName,
		String dynamicClusteringCacheName
	) {
		CacheManager cacheManager = (ehCacheConfig != null) ? CacheManager.create(ehCacheConfig) : null;
		if (cacheManager == null) {
			s_logger.warn("ehcache property not set, persistence data won't be cached");
		}
		
		this.persistenceCache = cacheManager.getEhcache(persistenceCacheName);
	}
	
	
	
	
	@Override
	public FL_PersistenceState persistData(String sessionId, String data) {
		
		if (persistenceCache == null) {
			return FL_PersistenceState.NONE;
		}
		
		FL_PersistenceState state = (!persistenceCache.isKeyInCache(sessionId)) ? FL_PersistenceState.NEW : FL_PersistenceState.MODIFIED;
		
		Element element = new Element(sessionId, data);
		persistenceCache.put(element);
		
		return state;
	}
	
	
	
	
	@Override
	public String getData(String sessionId) throws AvroRemoteException {
		
		String data = null;
		
		if (persistenceCache == null) {
			return data;
		}
		
		Element element = persistenceCache.get(sessionId);
		if (element != null) {
			data = element.getObjectValue().toString();
		}
		
		return data;
	}


}
