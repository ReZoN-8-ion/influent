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
package influent.server;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.google.inject.multibindings.MapBinder;
import com.google.inject.name.Named;
import influent.server.clustering.utils.ClusterContextCache;
import influent.server.rest.*;
import influent.server.spi.ExportDataService;
import influent.server.spi.ImportDataService;
import influent.server.spi.impl.graphml.GraphMLExportDataService;
import influent.server.spi.impl.graphml.GraphMLImportDataService;
import oculus.aperture.common.rest.ResourceDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RestConfigModule extends AbstractModule {

	private static final Logger s_logger = LoggerFactory.getLogger(RestConfigModule.class);

	// not sure if this is the best place for this
	@Provides @Singleton ClusterContextCache getClusterContextCache(
			@Named("influent.midtier.ehcache.config") String ehCacheConfig,
			@Named("influent.dynamic.clustering.cache.name") String cacheName
			) {
		return new ClusterContextCache(ehCacheConfig, cacheName);
	}
	
	@Override
	protected void configure() {

		String encoding = System.getProperty("file.encoding");
		if (!encoding.equalsIgnoreCase("utf-8")) {
			s_logger.warn("*** Default encoding is "+encoding+".  Should be UTF-8.  JSON decoding of messages may fail or produce undefined results with UTF-encoded characters (non-english languages, characters with accents, etc.) ***");
		}
		
		// Bind the export mechanism implementation
		bind(ExportDataService.class).to(GraphMLExportDataService.class);
		bind(ImportDataService.class).to(GraphMLImportDataService.class);
		
		MapBinder<String, ResourceDefinition> resourceBinder =
			MapBinder.newMapBinder(binder(), String.class, ResourceDefinition.class);

		// REMOVE
		resourceBinder.addBinding("/datasummary").toInstance(new ResourceDefinition(DataSummaryResource.class));
		resourceBinder.addBinding("/transactions").toInstance(new ResourceDefinition(TransactionTableResource.class));
		resourceBinder.addBinding("/search").toInstance(new ResourceDefinition(EntitySearchResource.class));
		resourceBinder.addBinding("/exportentities").toInstance(new ResourceDefinition(EntityExportResource.class));
		resourceBinder.addBinding("/searchparams").toInstance(new ResourceDefinition(EntitySearchParamsResource.class));
		resourceBinder.addBinding("/patternsearch").toInstance(new ResourceDefinition(PatternSearchResource.class));
		resourceBinder.addBinding("/relatedlinks").toInstance(new ResourceDefinition(RelatedLinkResource.class));
		resourceBinder.addBinding("/aggregatedlinks").toInstance(new ResourceDefinition(AggregatedLinkResource.class));
		resourceBinder.addBinding("/chart").toInstance(new ResourceDefinition(ChartResource.class));
		resourceBinder.addBinding("/bigchart").toInstance(new ResourceDefinition(BigChartResource.class));
		resourceBinder.addBinding("/entities").toInstance(new ResourceDefinition(EntityLookupResource.class));
		resourceBinder.addBinding("/savestate").toInstance(new ResourceDefinition(SaveStateResource.class));
		resourceBinder.addBinding("/restorestate").toInstance(new ResourceDefinition(RestoreStateResource.class));
		resourceBinder.addBinding("/containedentities").toInstance(new ResourceDefinition(LeafEntityLookupResource.class));
		resourceBinder.addBinding("/modifycontext").toInstance(new ResourceDefinition(ModifyContextResource.class));
		resourceBinder.addBinding("/export").toInstance(new ResourceDefinition(ExportGraphResource.class));
		resourceBinder.addBinding("/import").toInstance(new ResourceDefinition(ImportGraphResource.class));
		resourceBinder.addBinding("/entitydetails").toInstance(new ResourceDefinition(EntityDetailsResource.class));
		resourceBinder.addBinding("/cachestats").toInstance(new ResourceDefinition(CacheStatsResource.class));
		resourceBinder.addBinding("/contextdetails").toInstance(new ResourceDefinition(ContextDetailsResource.class));
		resourceBinder.addBinding("/searchlinks").toInstance(new ResourceDefinition(LinkSearchResource.class));
		resourceBinder.addBinding("/searchlinksparams").toInstance(new ResourceDefinition(LinkSearchParamsResource.class));
		resourceBinder.addBinding("/transactiondetails").toInstance(new ResourceDefinition(LinkDetailsResource.class));
		resourceBinder.addBinding("/exportlinks").toInstance(new ResourceDefinition(LinkExportResource.class));
	}
}
