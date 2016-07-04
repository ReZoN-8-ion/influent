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

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Ehcache;
import net.sf.ehcache.Statistics;
import oculus.aperture.common.rest.ApertureServerResource;

import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.CacheDirective;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.inject.Inject;
import com.google.inject.name.Named;

public class CacheStatsResource extends ApertureServerResource{	
	
	private static CacheManager cacheManager;
	
	@Inject
	public CacheStatsResource(
		@Named("influent.midtier.ehcache.config") String ehCacheConfig
	) {
		cacheManager = CacheManager.create(ehCacheConfig);
	}
	
	
	
	
	@Post("json")
	public StringRepresentation getCacheStats(String jsonData) throws ResourceException {
		try {
				
			JSONObject result = new JSONObject();
			
			for (String cacheName : cacheManager.getCacheNames()) {
				Ehcache cache = cacheManager.getEhcache(cacheName);
				long inMemorySize = cache.calculateInMemorySize();
				long onDiskSize = cache.calculateOnDiskSize();
				Statistics stats = cache.getStatistics();
				
				Map<String, Object> cacheStats = new HashMap<String, Object>();
				cacheStats.put("inMemorySize", inMemorySize);
				cacheStats.put("onDiskSize", onDiskSize);
				cacheStats.put("inMemoryObjectCount", stats.getMemoryStoreObjectCount());
				cacheStats.put("onDiskObjectCount", stats.getDiskStoreObjectCount());
				cacheStats.put("cacheHits", stats.getCacheHits());
				cacheStats.put("cacheMisses", stats.getCacheMisses());
				cacheStats.put("inMemoryHits", stats.getInMemoryHits());
				cacheStats.put("inMemoryMissses", stats.getInMemoryMisses());
				cacheStats.put("onDiskHits", stats.getOnDiskHits());
				cacheStats.put("onDiskMissses", stats.getOnDiskMisses());
				
				result.put(cacheName, cacheStats);
			}
			
			getResponse().setCacheDirectives(
				Collections.singletonList(
					CacheDirective.noCache()
				)
			);

			return new StringRepresentation(result.toString(), MediaType.APPLICATION_JSON);
			
		} catch (JSONException e) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Unable to create JSON object from caches statistics data",
				e
			);
		} 
	}	
}
