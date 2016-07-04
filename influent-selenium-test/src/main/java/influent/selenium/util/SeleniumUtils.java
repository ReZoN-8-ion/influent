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

package influent.selenium.util;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import com.google.common.collect.Lists;

public class SeleniumUtils {
	public static final String ACCOUNTS_NAME = "Accounts";
	public static final String TRANSACTIONS_NAME = "Transactions";
	public static final String FLOW_NAME = "Flow";
	public static final String SUMMARY_NAME = "Summary";
	

    public static final String TAB_ID_PREFIX = "infWorkspaceTab";
    public static final String TAB_ACCOUNTS = TAB_ID_PREFIX + ACCOUNTS_NAME;
    public static final String TAB_TRANSACTIONS = TAB_ID_PREFIX + TRANSACTIONS_NAME;
    public static final String TAB_FLOW = TAB_ID_PREFIX + FLOW_NAME;
    public static final String TAB_SUMMARY = TAB_ID_PREFIX + SUMMARY_NAME;

	static public void loginToInfluent(WebDriver driver, String username, String password) {
		try {
			driver.findElement(By.name("username")).sendKeys(username);
			driver.findElement(By.name("password")).sendKeys(password);
			driver.findElement(By.name("submit")).click();
		} catch (NoSuchElementException e) {
			// Do nothing because there may not be a login screen
		}
	}
	
	static public void navigateToTab(WebDriver driver, String id) {
		WebElement element = driver.findElement(By.id(id));
		element.click();
	}

	/**
	 * Checks if the {@link WebElement} has the class 'className' set on it.
	 * @return
	 * 	Returns true if the element has the specified class. False otherwise.
	 */
	static public boolean hasClass(WebElement el, String className) {
		String classes = el.getAttribute("class");
		if (classes != null) {
			return Lists.newArrayList(classes.split(" ")).contains(className);
		}
		return false;
	}
	
	/**
	 * Returns the first element that is being displayed from the list of given elements
	 * @param elements
	 * the list of given elements
	 * @return
	 * the first element that is being displayed from the list of given elements
	 */
	static public WebElement getDisplayedElement(List<WebElement> elements) {
		WebElement element = null;
		for (WebElement webElement : elements) {
			if (webElement.isDisplayed()) {
				element = webElement;
				break;
			}
		}
		return element;
	}
}
