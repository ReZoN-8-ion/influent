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
import influent.server.sql.SQLBuilder;
import influent.server.sql.basesql.BaseSQLBuilder;
import influent.server.sql.hsql.HSQLBuilder;
import influent.server.sql.mssql.MSSQLBuilder;
import influent.server.sql.mysql.MySQLBuilder;
import influent.server.sql.oracle.OracleBuilder;
import influent.server.utilities.PropertyFallbackReporter;
import oculus.aperture.spi.common.Properties;

/**
 * 
 * @author djonker
 *
 */
public class StandardSQLBuilderModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(SQLBuilder.class).to(BaseSQLBuilder.class);
	}

	/*
	 * Provide the database service
	 */
    @Provides@Singleton
    BaseSQLBuilder builder(
        @Named("aperture.server.config") Properties config
    ) {
        final String type = PropertyFallbackReporter.getString(
            config, "influent.midtier.database.type", MSSQLBuilder.TYPE_KEY);

        if (type.equalsIgnoreCase(MSSQLBuilder.TYPE_KEY)) {
            return new MSSQLBuilder();
        } else if (type.equalsIgnoreCase(MySQLBuilder.TYPE_KEY)) {
            return new MySQLBuilder();
        } else if (type.equalsIgnoreCase(OracleBuilder.TYPE_KEY)) {
            return new OracleBuilder();
        } else if (type.equalsIgnoreCase(HSQLBuilder.TYPE_KEY)) {
            return new HSQLBuilder();
        } else {
            return new MySQLBuilder();
        }
    }
}
