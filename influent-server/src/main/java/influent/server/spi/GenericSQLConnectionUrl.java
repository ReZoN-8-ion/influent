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
public class GenericSQLConnectionUrl implements SQLConnectionUrl {

	private String url = null;
	private String driver = null;
	
	/**
	 * 
	 */
	@Inject(optional=true)
	public void setUrl(@Named("influent.midtier.database.url") String url) {
		this.url = url;
	}
	
	/* (non-Javadoc)
	 * @see influent.server.spi.SQLConnectionUrl#getUrl()
	 */
	@Override
	public String getUrl() {
		return url;
	}

	
	/**
	 * 
	 */
	@Inject(optional=true)
	public void setDriver(@Named("influent.midtier.database.driver") String driver) {
		this.driver = driver;
	}
	
	
	/* (non-Javadoc)
	 * @see influent.server.spi.SQLConnectionUrl#getDriver()
	 */
	@Override
	public String getDriver() {
		return driver;
	}

	/* (non-Javadoc)
	 * @see influent.server.spi.SQLConnectionUrl#isValid()
	 */
	@Override
	public boolean isValid() {
		return url != null && driver != null;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#toString()
	 */
	@Override
	public String toString() {
		return getUrl();
	}
}
