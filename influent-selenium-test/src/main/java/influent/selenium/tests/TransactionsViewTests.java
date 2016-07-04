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

import static org.junit.Assert.assertEquals;

import java.util.List;

import influent.selenium.util.SeleniumUtils;

import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class TransactionsViewTests extends BrowserParameterizedTest {

	public TransactionsViewTests(BROWSER browser) { super(browser); };
			
	@Test
	public void searchTest() {
		
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_TRANSACTIONS);
		
		WebElement resultsRoot = driver.findElement(By.cssSelector("#infLinkSearchResultContainer"));

		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
				
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys("from:a.loan.b146773");		
		elements = driver.findElements(By.className("infGoSearch"));
		element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: infGoSearch element");			
		}
		
		element.click();
		
		try {
			Thread.sleep(1000);
		}
		catch (Exception e) {
			
		}
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.className("simpleSearchSummary")));
		assertEquals("Showing 1 - 10 of 10 results", element.getText());
		
		element = resultsRoot.findElement((By.className("simpleSearchResultText")));		
		element = element.findElement(By.className("simpleSearchResultFieldValue"));		
		assertEquals(true, element.getText().length() > 0);
		
		
		
		elements = resultsRoot.findElements((By.className("infSearchResultStateToggle")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		assertEquals("[less]", element.getText());
		//TODO: For Walker we should test new contents after clicking 'more' link
		
		// Test selection
		List<WebElement> switchViewButtons  = resultsRoot.findElements(By.cssSelector("#infLinkSearchResultOpBar [switchesto]"));
		WebElement switchToAccountsButton = null;		
		for (WebElement e : switchViewButtons) {
			String switchTo = e.getAttribute("switchesto");
			if (switchTo.equals(SeleniumUtils.ACCOUNTS_NAME)) {
				switchToAccountsButton = e;
				break;
			}
		}
		
		if (switchToAccountsButton == null) {
			throw new AssertionError("Couldn't find: Button to switch to accounts view in infOperationsBar");
		}
		
		elements = resultsRoot.findElements((By.cssSelector(".selectSingleResult input")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		switchToAccountsButton.click();
		
		WebElement firstAccountsResult = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".selectSingleResult")));
		if (firstAccountsResult == null) {
			throw new AssertionError("Couldn't find any accounts results.   Either timed out or search returned no entities!");
		}
		
		elements = driver.findElements((By.cssSelector("#infAccountSearchResultContainer .simpleSearchResultText")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Name:DanielDescription:Daniel R. O. is 34 years old and lives in the department of La Libertad with his wife and their 3 children (ages 16, 13, and 4). Daniel’s wife works as a traveling merchant and helps with the household expenses. In turn, Daniel has a business in the central market selling fruits and vegetables. He has been ...", element.getText());
		
		elements = driver.findElements((By.cssSelector(".selectSingleResult input[type='checkbox']")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		elements = driver.findElements((By.className("searchResultSelected")));
		element = SeleniumUtils.getDisplayedElement(elements);
		if (element == null) {
			throw new AssertionError("Selected result was not highlighted");			
		}
	}
	
	@Test
	public void fromLinkTest() {
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_TRANSACTIONS);
		
		WebElement resultsRoot = driver.findElement(By.cssSelector("#infLinkSearchResultContainer"));

		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
				
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys("from:a.null.b146773");		
		elements = driver.findElements(By.className("infGoSearch"));
		element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: infGoSearch element");			
		}
		
		element.click();
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.className("simpleSearchSummary")));
		assertEquals("Showing 1 - 10 of 10 results", element.getText());
		
		elements = resultsRoot.findElements((By.className("summaryColumnFROM_ID")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		
		WebElement firstAccountsResult = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".selectSingleResult")));
		if (firstAccountsResult == null) {
			throw new AssertionError("Couldn't find any accounts results.   Either timed out or search returned no entities!");
		}
		
		elements = driver.findElements((By.cssSelector("#infAccountSearchResultContainer .simpleSearchResultText")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Name:DanielDescription:Daniel R. O. is 34 years old and lives in the department of La Libertad with his wife and their 3 children (ages 16, 13, and 4). Daniel’s wife works as a traveling merchant and helps with the household expenses. In turn, Daniel has a business in the central market selling fruits and vegetables. He has been ...", element.getText());
	}
	
	@Test
	public void toLinkTest() {
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_TRANSACTIONS);
		
		WebElement resultsRoot = driver.findElement(By.cssSelector("#infLinkSearchResultContainer"));

		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
				
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys("from:a.null.b146773");		
		elements = driver.findElements(By.className("infGoSearch"));
		element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: infGoSearch element");			
		}
		
		element.click();
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.className("simpleSearchSummary")));
		assertEquals("Showing 1 - 10 of 10 results", element.getText());
		
		elements = resultsRoot.findElements((By.className("summaryColumnTO_ID")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		
		WebElement firstAccountsResult = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".selectSingleResult")));
		if (firstAccountsResult == null) {
			throw new AssertionError("Couldn't find any accounts results.   Either timed out or search returned no entities!");
		}
		
		elements = driver.findElements((By.cssSelector("#infAccountSearchResultContainer .simpleSearchResultText")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Name:Apoyo IntegralStatus:activeDue Diligence Type:Full", element.getText());
	}
}
