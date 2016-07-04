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

import influent.idl.FL_PatternSearch;
import influent.server.dataaccess.QuBEClient;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.name.Named;


/**
 * Module for pattern search services.
 */
public class RestPatternSearchModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(FL_PatternSearch.class).to(QuBEClient.class);
	}
	

	/*
	 * Provide the service
	 */
	@Provides 
	public QuBEClient connect (
		@Named("influent.pattern.search.remoteURL") String remoteURL,
		@Named("influent.pattern.search.useHMM") boolean useHMM
	) {
		try {
			if(remoteURL != null && remoteURL.length() > 0) {
				return new QuBEClient(remoteURL, useHMM);
			}
			else {
				return null;
			}
		} catch (Exception e) {
			return null;
		}
	}
}
