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

import java.io.IOException;

import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.FilterChain;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.HttpHeaders;

import org.apache.shiro.authc.credential.CredentialsMatcher;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.config.Ini;
import org.apache.shiro.guice.web.ShiroWebModule;
import org.apache.shiro.realm.text.IniRealm;
import org.apache.shiro.web.filter.authc.LogoutFilter;
import org.apache.shiro.web.servlet.AbstractFilter;

import com.google.inject.Key;
import com.google.inject.Provides;
import com.google.inject.name.Names;

/**
 * @author rharper
 *
 */
public class SimpleShiroAuthModule extends ShiroWebModule {

	public SimpleShiroAuthModule(ServletContext sc) {
		super(sc);
    }
	
	
	
	
	@SuppressWarnings("unchecked")
	@Override
	protected void configureShiroWeb() {
		// Use IniRealm - a simple Realm implementation that allows us to define
		// users, passwords, and roles in an INI file
		// Must bind an Ini.class implementation
		try {
			bindRealm().toConstructor(IniRealm.class.getConstructor(Ini.class));
        } catch (NoSuchMethodException e) {
            throw new RuntimeException("Missing IniRealm class implementation", e);
        }

        // Use the following three lines to instruct Shiro to expect passwords stored
        // in the INI file to be encrypted using MD5
        // Comment out to use plaintext passwords in the INI file
		bind(HashedCredentialsMatcher.class);
        bind(CredentialsMatcher.class).to(HashedCredentialsMatcher.class);
        
        // we don't need this call because it is specified in the properties file
        //bindConstant().annotatedWith(Names.named("shiro.hashAlgorithmName")).to(Md5Hash.ALGORITHM_NAME);

        addFilterChain("/**/requestTask.html", ANON); 
        addFilterChain("/**/taskmanager", ANON); 

        addFilterChain("/", Key.get(NoCacheFilter.class), AUTHC); 
        addFilterChain("/index.html", Key.get(NoCacheFilter.class), AUTHC); 

        // Configure auto logout when accessing /logout
		// Logout when the user hits this url
        bindConstant().annotatedWith(Names.named("myRedirectUrl")).to("/login.jsp"); 
        Key<MyLogoutFilter> MYLOGOUT = Key.get(MyLogoutFilter.class);	
        addFilterChain("/logout", MYLOGOUT); 

		// All URLs are protected: require Form-based login
		addFilterChain("/**", AUTHC);
	}
	
	
	
	
	@Provides
    Ini loadShiroIni() {
		// Load INI file from specified path
		return Ini.fromResourcePath("classpath:shiro.ini");
    }
	
	
	
	
	public static class NoCacheFilter extends AbstractFilter {

		@Override
		public void doFilter(
			ServletRequest request, 
			ServletResponse response,
			FilterChain chain
		) throws IOException, ServletException {
			HttpServletResponse httpResponse = (HttpServletResponse)response;
			httpResponse.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate"); // HTTP 1.1.
			httpResponse.setDateHeader(HttpHeaders.EXPIRES, 0); // Proxies.
			chain.doFilter(request, httpResponse);
		}
	}
	
	
	
	
	public static class MyLogoutFilter extends LogoutFilter {

		@Inject
		@Override
		public void setRedirectUrl(@Named("myRedirectUrl") String redirectUrl) {
			super.setRedirectUrl(redirectUrl);
		}
	}
}
