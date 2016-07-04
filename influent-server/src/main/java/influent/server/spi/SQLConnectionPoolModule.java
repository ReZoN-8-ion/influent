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

import influent.server.utilities.BoneCPConnectionPool;
import influent.server.utilities.SQLConnectionPool;

import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Enumeration;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.google.inject.name.Named;
import com.google.inject.name.Names;


/**
 */
public class SQLConnectionPoolModule extends AbstractModule implements ServletContextListener {
	
	private static final Logger s_logger = LoggerFactory.getLogger(SQLConnectionPoolModule.class);
	private BoneCPConnectionPool pool;
	
	@Override
	protected void configure() {
		bind(SQLConnectionUrl.class).annotatedWith(Names.named("influent.midtier.dbconnection.url"))
			.to(GenericSQLConnectionUrl.class);
		
		bind(SQLConnectionUrl.class).annotatedWith(Names.named("influent.midtier.dbconnection.mssql"))
		.to(SQLServerConnectionUrl.class);
	}
	
	/*
	 * Provide the database service
	 */
	@Provides @Singleton
	public SQLConnectionPool connect (
		@Named("influent.midtier.dbconnection.url") SQLConnectionUrl genericUrl,
		@Named("influent.midtier.dbconnection.mssql") SQLConnectionUrl mssqlUrl,
		@Named("influent.midtier.user.name") String username,
		@Named("influent.midtier.user.password") String password,
		@Named("influent.midtier.ehcache.config") String ehCacheConfig
	) {
		if (pool == null) {
			final SQLConnectionUrl url = genericUrl.isValid()? genericUrl : mssqlUrl;
			
			if (!url.isValid()) {
				throw new IllegalArgumentException("SQLConnectionPool missing a connection configuration!");
			}
			
			pool = new BoneCPConnectionPool(url, username, password, null);
		}
		
		return pool;
	}

	@Override
	public void contextInitialized(ServletContextEvent sce) {
	}

	@Override
	public void contextDestroyed(ServletContextEvent sce) {
		if (pool != null) {
			try {
				pool.shutdownConnectionPool();
			} catch (SQLException e) {
				s_logger.error("Failed to shutdown connection pool", e);
			}
		}

		// This manually deregisters JDBC driver, which prevents Tomcat 7 from complaining about memory leaks wrto this class
		Enumeration<Driver> drivers = DriverManager.getDrivers();
		while (drivers.hasMoreElements()) {
			Driver driver = drivers.nextElement();
			try {
				DriverManager.deregisterDriver(driver);
			} catch (SQLException e) {
				s_logger.error("Error deregistering driver %s", driver, e);
			}
		}
	}
}
