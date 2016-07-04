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

package influent.selenium.tests;

import influent.selenium.util.SeleniumUtils;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.Arrays;
import java.util.Collection;
import java.util.concurrent.TimeUnit;

import org.junit.After;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.junit.runners.Parameterized.Parameters;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;

@RunWith(Parameterized.class)
public class BrowserParameterizedTest {

    enum BROWSER {
        FIREFOX,
        CHROME,
        IE
    }

    @SuppressWarnings("rawtypes")
    @Parameters
    public static Collection params() {
        return Arrays.asList(new Object[][]{
            {BROWSER.FIREFOX},
            {BROWSER.CHROME}
        });
    }

    public static String getSystemStartURL() throws RuntimeException {
    	String webhost = System.getProperty("webhost", "http://localhost:8080");
    	String webapp = System.getProperty("webapp", "/kiva");
    	
    	String startURL = null;
    	URI uri;
    	try {
    		uri = new URI(webhost);
    		if (uri.getHost() == null) throw new Exception("Invalid webhost. Host or scheme is missing: '" + webhost + "'");
    		
    		if (uri.getPath().length() == 0) {
    			if (!webapp.startsWith("/"))
    				webapp = "/" + webapp;
    			uri = uri.resolve(webapp);
    		}
    		startURL = uri.toASCIIString();
    	}
    	catch (Exception e) {
    		throw new RuntimeException("There was a problem setting up the webhost - app: '" + webhost + "' - '" + webapp + "'", e);
    	}
    	return startURL;
    }
    
    protected WebDriver driver = null;
    protected String startURL = null;
    
    public BrowserParameterizedTest(BROWSER broswer, String url) {
    	startURL = url;
    	initalize(broswer);
    }

    public BrowserParameterizedTest(BROWSER browser) {
    	startURL = getSystemStartURL();
    	initalize(browser);
    }

    private void initializeRemote(BROWSER browser, URI host) throws MalformedURLException {
    	switch (browser) {
        case FIREFOX:
       		this.driver = new RemoteWebDriver(host.toURL(), DesiredCapabilities.firefox());
            break;
        case CHROME:
            // need to set a property for the chrome webdriver
            System.setProperty("webdriver.chrome.driver", System.getProperty("user.dir") + "\\chromedriver.exe");
       		this.driver = new RemoteWebDriver(host.toURL(), DesiredCapabilities.chrome());
            break;
        case IE:
            // need to set a property for the internet explorer webdriver
            System.setProperty("webdriver.ie.driver", System.getProperty("user.dir") + "\\IEDriverServer.exe");
       		this.driver = new RemoteWebDriver(host.toURL(), DesiredCapabilities.internetExplorer());
            break;
        default:
            this.driver = null;
            break;
    	}
    }
    
    private void initializeLocal(BROWSER browser) {
    	switch (browser) {
        case FIREFOX:
    		this.driver = new FirefoxDriver();
            break;
        case CHROME:
            // need to set a property for the chrome webdriver
            System.setProperty("webdriver.chrome.driver", System.getProperty("user.dir") + "\\chromedriver.exe");
        	this.driver = new ChromeDriver();
            break;
        case IE:
            // need to set a property for the internet explorer webdriver
            System.setProperty("webdriver.ie.driver", System.getProperty("user.dir") + "\\IEDriverServer.exe");
       		this.driver = new InternetExplorerDriver();
            break;
        default:
            this.driver = null;
            break;
    	}
    }
    
    private void initalize(BROWSER browser) {
    	URI driverHost = null;
    	try {
    		URI uri = new URI(startURL);
    		//assumes the driver host is at the same location as the webhost 
    		driverHost = new URI("http://" + uri.getHost() + ":4444/wd/hub");
    		initializeRemote(browser, driverHost);
    	}
    	catch (Exception e) {
    		initializeLocal(browser);
    	}

    }
    
    @Before
    public void setUp() throws Exception {

        // Set implicit wait time
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);

        // set page loading wait time
        driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);

        // Connect to influent
        driver.get(startURL);

        // pass through the login stage
        SeleniumUtils.loginToInfluent(driver, "admin", "admin");
    }

    @After
    public void tearDown() throws Exception {
        if (driver != null) {
            driver.quit();
        }
    }
}
