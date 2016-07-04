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
import influent.idl.FL_EntitySearch;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.search.DataViewEntitySearch;
import influent.server.sql.SQLBuilder;
import influent.server.utilities.SQLConnectionPool;
import oculus.aperture.spi.common.Properties;


public class BasicFLEntitySearchModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(FL_EntitySearch.class).to(DataViewEntitySearch.class);
	}




	/*
	 * Provide the database service
	 */
	@Provides @Singleton
	public DataViewEntitySearch connect (
			@Named("aperture.server.config") Properties config,
			SQLConnectionPool connectionPool,
			DataNamespaceHandler namespaceHandler,
			SQLBuilder sqlBuilder
	) {
		try {
			return new DataViewEntitySearch(config, connectionPool, namespaceHandler, sqlBuilder);
		} catch (Exception e) {
			addError("Failed to create Entity Search", e);
			return null;
		}
	}
}
