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

package influent.server.auth;

import org.apache.shiro.guice.web.GuiceShiroFilter;
import org.apache.shiro.guice.web.ShiroWebModule;

import com.google.inject.servlet.ServletModule;

/**
 * The Shiro Authentication/Authorization module adds a Shiro filter to process
 * all incoming requests.  This module does not do any configuration and relies
 * on the addition of a ShiroWebModule module to bind realms, access rules, and
 * authentication settings.  An example authentication module exists in the
 * aperture-server example project.
 *
 * @see ShiroWebModule
 * @author rharper
 *
 */
public class ShiroAuthModule extends ServletModule {

	@Override
	protected void configureServlets() {
		// Ensure Shiro gets a chance to act on all requests
		filter("/*").through(GuiceShiroFilter.class);
	}


}
