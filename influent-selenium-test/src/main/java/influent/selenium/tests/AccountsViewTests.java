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

public class AccountsViewTests extends BrowserParameterizedTest {

	public AccountsViewTests(BROWSER browser) { super(browser); };
			
	@Test
	public void searchLoanTest() {
		
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_ACCOUNTS);
		
		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
		
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys("joe");		
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
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".infSearchResultCounts")));
		assertEquals("Showing 12 of 412 results", element.getText());
		
		elements = driver.findElements((By.cssSelector(".simpleSearchResultText")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Name:JoeDescription:Joe, 40 years old, is still single. He has been managing a livestock business, particularly hog-raising, for almost 10 years. His net income every three months is 6,000 Philippine pesos (PHP) for every hog that he sell. He's asking for a loan of 12,000 PHP to purchase livestock feeds for his hogs. He hopes that Kiva lenders ...", element.getText());
	
		elements = driver.findElements((By.cssSelector(".infSearchResultStateToggle")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		assertEquals("[less]", element.getText());
		
		elements = driver.findElements((By.cssSelector(".simpleEntityViewTextValue")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("PHP", element.getText());
		
		elements = driver.findElements((By.className("transaction-graph")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals(220, element.getSize().getHeight());
		
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
	public void searchPartnerTest() {
		
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_ACCOUNTS);
		
		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
		
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys("visionfund");
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
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".infSearchResultCounts")));
		assertEquals("Showing 6 of 6 results", element.getText());
		
		elements = driver.findElements((By.cssSelector(".simpleSearchResultText")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Name:VisionFund Albanianame:VisionFund AlbaniaStatus:activeDue Diligence Type:Full", element.getText());
	
		elements = driver.findElements((By.cssSelector(".infSearchResultStateToggle")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		assertEquals("[less]", element.getText());
		
		elements = driver.findElements((By.cssSelector(".simpleEntityViewTextValue")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("AL", element.getText());
		
		elements = driver.findElements((By.className("transaction-graph")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals(220, element.getSize().getHeight());
	}
	
	@Test
	public void searchLenderTest() {
		
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_ACCOUNTS);
		
		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
		
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys("juan ivy");
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
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".infSearchResultCounts")));
		assertEquals("Showing 12 of 3284 results", element.getText());
		
		elements = driver.findElements((By.cssSelector(".simpleSearchResultText")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Name:Juan IvyLoan Reason:it gives me a sense of accomplishment and allow others success.Occupation:entrepreneur", element.getText());
	
		elements = driver.findElements((By.cssSelector(".infSearchResultStateToggle")));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		assertEquals("[less]", element.getText());
		
		elements = driver.findElements((By.cssSelector(".simpleEntityViewTextValue")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("Juan Ivy", element.getText());
		
		elements = driver.findElements((By.className("transaction-graph")));
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals(220, element.getSize().getHeight());
	}
}
