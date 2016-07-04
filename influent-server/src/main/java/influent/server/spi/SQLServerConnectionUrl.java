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

import com.google.inject.Inject;
import com.google.inject.name.Named;

/**
 * We provide two methods of configuring connection details
 * and both are currently valid options. This is one of them.
 * 
 * @author djonker
 */
public class SQLServerConnectionUrl implements SQLConnectionUrl {
	
	private String  serverName;
	private Integer portNumber;
	private String  databaseName;


	public SQLServerConnectionUrl() {
	}
	public SQLServerConnectionUrl(String serverName, Integer portNumber, String databaseName) {
		this.serverName = serverName;
		this.portNumber = portNumber;
		this.databaseName = databaseName;
	}
	
	/**
	 * Optional guice injections.
	 */
	@Inject(optional=true)
	public void setServerName(@Named("influent.midtier.server.name") String serverName) {
		this.serverName = serverName;
	}
	@Inject(optional=true)
	public void setPort(@Named("influent.midtier.server.port") Integer portNumber) {
		this.portNumber = portNumber;
	}
	@Inject(optional=true)
	public void setDatabaseName(@Named("influent.midtier.database.name") String databaseName) {
		this.databaseName = databaseName;
	}
	
	
	/* (non-Javadoc)
	 * @see influent.server.spi.SQLConnectionUrl#getUrl()
	 */
	@Override
	public String getUrl() {
		if (!isValid()) {
			throw new IllegalArgumentException(
				"Invalid MSSQL url: serverName=" + serverName +
				" portNumber=" + portNumber +
				" databaseName=" + databaseName
			);
		}
		
		return formUrl(serverName, portNumber, databaseName);
	}

	/* (non-Javadoc)
	 * @see influent.server.spi.SQLConnectionUrl#getDriver()
	 */
	@Override
	public String getDriver() {
		return "net.sourceforge.jtds.jdbc.Driver";
	}
	
	/* (non-Javadoc)
	 * @see influent.server.spi.SQLConnectionUrl#isValid()
	 */
	@Override
	public boolean isValid() {
		return serverName != null && portNumber != null && databaseName != null;
	}
	
	/**
	 * Forms a SQLServer connection url from the parameters given.
	 */
	public static String formUrl(String serverName, Integer portNumber, String databaseName) {
		return "jdbc:jtds:sqlserver://" + 
				serverName + 
				":" + 
				portNumber + 
				";databaseName=" + 
				databaseName + 
				";selectMethod=cursor;";
	}
	
	/* (non-Javadoc)
	 * @see java.lang.Object#toString()
	 */
	@Override
	public String toString() {
		return formUrl(serverName, portNumber, databaseName);
	}
	
	
}
