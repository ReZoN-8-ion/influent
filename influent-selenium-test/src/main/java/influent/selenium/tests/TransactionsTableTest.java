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

public class TransactionsTableTest extends BrowserParameterizedTest {
	
	public TransactionsTableTest(BROWSER browser) { super(browser); };
	
	private void getFlowViewResults(String query, int numCards, boolean expand) {
		
		SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_ACCOUNTS);
		
		List<WebElement> elements = driver.findElements(By.id("influent-view-toolbar-search-input"));
		
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-view-toolbar-search-input element");			
		}
				
		element.sendKeys(query);		
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
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".infOperationsBar")));
		List<WebElement> switchViewButtons  = element.findElements(By.cssSelector("[switchesto]"));
		WebElement switchToFlowButton = null;
		for (WebElement e : switchViewButtons) {
			String switchTo = e.getAttribute("switchesto");
			if (switchTo.equals(SeleniumUtils.FLOW_NAME)) {
				switchToFlowButton = e;
			} 
		}
		if (switchToFlowButton == null) {
			throw new AssertionError("Couldn't find: Button to switch to flow view in infOperationsBar");
		}
		
		List<WebElement> dataIdElements = driver.findElements(By.cssSelector(".selectSingleResult input"));
		int elementsToSelect = numCards;
		int elementsSelected = 0;
		for (WebElement e : dataIdElements) {
			e.click();
			elementsSelected++;
			if (elementsToSelect == elementsSelected) {
				break;
			}
		}
		
		switchToFlowButton.click();
		
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		//elements = driver.findElements(By.id("influent-flow-rename-file-close"));
		elements = driver.findElements(By.id("influent-flow-rename-file-close"));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		if (expand) {
			elements = driver.findElements(By.className("clipContainer"));
			element = SeleniumUtils.getDisplayedElement(elements);
			
			element.click();
			
			try {
				Thread.sleep(2000);
			} catch (Exception e) {}
		}
	}
			
	@Test
	public void tableNoResultsTest() {
		getFlowViewResults("joe", 1, false);
		
		//Test a card that has no transactions
		List<WebElement> elements = driver.findElements(By.className("baseballcardContainer"));
		WebElement element = SeleniumUtils.getDisplayedElement(elements);
				
		if (element == null) {
			throw new AssertionError("Couldn't find: baseballcardContainer element");			
		}
		
		element.click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.id("transactions-table-pagination-label")));
		
		assertEquals("0 results", element.getText());
		
		//check page buttons disabled
		element = driver.findElement(By.id("transactions-previous-page"));
		assertEquals("btn btn-default disabled", element.getAttribute("class"));
		
		element = driver.findElement(By.id("transactions-next-page"));
		assertEquals("btn btn-default disabled", element.getAttribute("class"));		
	}
	
	@Test
	public void tableMultiResultsOnePageTest() {
		getFlowViewResults("name:\"joe\" countryCode:\"PE\" datatype:loan matchtype:\"any\"", 2, true);
		
		//Test a card that has no transactions
		List<WebElement> elements = driver.findElements(By.className("baseballcardContainer"));
		
		WebElement card1 = null;
		WebElement card2 = null;
		for (WebElement webElement : elements) {
			if (webElement.isDisplayed()) {
				if (card1 == null) {
					card1 = webElement;
				} else if (card2 == null) {
					card2 = webElement;
					break;
				}
			}
		}
		
		if (card1 == null || card2 == null) {
			throw new AssertionError("Couldn't find: baseballcardContainer element");			
		}
		
		card2.click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		WebElement element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.id("transactions-table-pagination-label")));
				
		assertEquals("Showing 1 - 6 of 6", element.getText());
		
		//check page buttons disabled
		element = driver.findElement(By.id("transactions-previous-page"));
		assertEquals("btn btn-default disabled", element.getAttribute("class"));
		
		element = driver.findElement(By.id("transactions-next-page"));
		assertEquals("btn btn-default disabled", element.getAttribute("class"));
		
		//check rows
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));
		
		assertEquals(6, elements.size());
		
		element = SeleniumUtils.getDisplayedElement(elements);
		assertEquals("1 2012-11-30 status: paid; repayed: 181.65 (in PEN) - $68.12", element.getText());
		
		//Test highlighting		
		element = card2.findElement(By.cssSelector("[title='highlight flow']"));
		element.click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));
		
		for (WebElement webElement : elements) {
			assertEquals(true, webElement.getAttribute("class").contains("transactionsHighlight"));
		}

		//Test Export
		element = driver.findElement(By.id("exportTransactions"));
		element.click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.id("dialog-confirm")));
		assertEquals("Export successful!", element.getText());
		
		elements = driver.findElements((By.className("ui-button")));
		for (WebElement elem : elements) {
			elem.findElement(By.className("ui-button-text"));
			if (elem != null && elem.getText().equals("Ok")) {
				elem.click();
			}
		}
		
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		//Test table row hyperlinks
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));
		element = SeleniumUtils.getDisplayedElement(elements);
		element.click();
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.className("simpleSearchSummary")));
		assertEquals("Showing 1 - 5 of 5 results", element.getText());	
	}
	
	@Test
	public void tableMultiResultsMultiPageTest() {
		
		///////////////////////////////////////////////////////////////
		//Set Up: Select a card that has 100+ transactions where we can
		//highlight some of those rows.
		///////////////////////////////////////////////////////////////
		getFlowViewResults("name:\"joe\" countryCode:\"PE\" datatype:loan matchtype:\"any\"", 1, false);
		
		List<WebElement> elements = driver.findElements(By.className("baseballcardContainer"));
		
		WebElement card1 = null;
		for (WebElement webElement : elements) {
			if (webElement.isDisplayed()) {
				if (card1 == null) {
					card1 = webElement;
					break;
				} 				
			}
		}
		
		if (card1 == null) {
			throw new AssertionError("Couldn't find: baseballcardContainer element");			
		}
		
		//Click card so add to file buttons appear
		card1. click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		WebElement element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("[title='branch right to outflowing destinations']")));
		
		element.click();		
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		
		elements = driver.findElements(By.className("baseballcardContainer"));
		
		//WebElement card1 = null;
		WebElement lender = null;
		int x = 0;
		for (WebElement webElement : elements) {
			if (webElement.getLocation().getX() > x) {
				x = webElement.getLocation().getX();
				lender = webElement;
			}
		}
		
		lender.click();		
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		
		///////////////////////////////////////////////////////////////
		//We should now have a transactions table with 100 transactions
		///////////////////////////////////////////////////////////////
		
		//Check results summary label
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.id("transactions-table-pagination-label")));		
		assertEquals("Showing 1 - 100 of 111", element.getText());
		
		//check previous buttons disabled
		element = driver.findElement(By.id("transactions-previous-page"));
		assertEquals("btn btn-default disabled", element.getAttribute("class"));
		
		//check previous buttons enabled
		element = driver.findElement(By.id("transactions-next-page"));
		assertEquals("btn btn-default", element.getAttribute("class"));
		
		//check rows
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));		
		assertEquals(100, elements.size());
		
		//test next button
		element = driver.findElement(By.id("transactions-next-page"));
		element.click();
		
		//Wait a few seconds for new table to load. We can't use ExpectedConditions.presenceOfElementLocated since they are already present
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}

		//Check results summary label
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.id("transactions-table-pagination-label")));		
		assertEquals("Showing 101 - 111 of 111", element.getText());
		
		//check previous buttons enabled
		element = driver.findElement(By.id("transactions-previous-page"));
		assertEquals("btn btn-default", element.getAttribute("class"));
		
		//check previous buttons disabled
		element = driver.findElement(By.id("transactions-next-page"));
		assertEquals("btn btn-default disabled", element.getAttribute("class"));
		
		//check rows
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));		
		assertEquals(11, elements.size());
		
		///////////////////////////////////////////////////////////////
		//Test highlighting
		///////////////////////////////////////////////////////////////
		
		//Setup
		//find card again
		element = driver.findElement(By.className("file"));
		card1 = element.findElement(By.className("baseballcardContainer"));
		
		//Click card again so branch right button appears
		card1.click();
		
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		element = card1.findElement(By.cssSelector("[title='highlight flow']"));
		element.click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		//Find lender again
		elements = driver.findElements(By.className("baseballcardContainer"));
		
		//WebElement card1 = null;
		lender = null;
		x = 0;
		for (WebElement webElement : elements) {
			if (webElement.getLocation().getX() > x) {
				x = webElement.getLocation().getX();
				lender = webElement;
			}
		}
		
		lender.click();
		//Wait a few seconds for new table to load. We can't use ExpectedConditions.presenceOfElementLocated since they are already present
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		//We should now have transactions from card2 highlighted in lender's transactions table
		
		//Check we have the correct number of highlighted rows
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));
		int highlightCount = 0;
		for (WebElement webElement : elements) {
			if (webElement.getAttribute("class") != null && webElement.getAttribute("class").length() >= 21 && 
					webElement.getAttribute("class").substring(0, 21).equals("transactionsHighlight")) {
				highlightCount ++;
			}			
		}
		
		assertEquals(5, highlightCount);
		
		//Check the first highlighted row is correct
		element = element.findElement(By.className("transactionsHighlight-0"));
		assertEquals("31 2012-11-30 status: paid; repayed: 181.65 (in PEN) $68.12 -", element.getText());
		
		//Test highlighting on next page
		element = driver.findElement(By.id("transactions-next-page"));
		element.click();
		
		//Wait a few seconds for new table to load. We can't use ExpectedConditions.presenceOfElementLocated since they are already present
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		//Check we have the correct number of highlighted rows
		element = driver.findElement(By.id("transactions-table-body"));
		elements = element.findElements(By.tagName("tr"));
		highlightCount = 0;
		for (WebElement webElement : elements) {
			if (webElement.getAttribute("class") != null && webElement.getAttribute("class").length() >= 21 && 
					webElement.getAttribute("class").substring(0, 21).equals("transactionsHighlight")) {
				highlightCount ++;
			}			
		}
		
		assertEquals(1, highlightCount);
		
		//Check the first highlighted row is correct
		element = element.findElement(By.className("transactionsHighlight-1"));
		assertEquals("104 2012-05-29 status: paid; loan: 1k (in PEN) - $375.00", element.getText());
	}
	
	@Test
	public void transactionsViewButtonTest() {
		getFlowViewResults("name:\"joe\" countryCode:\"PE\" datatype:loan matchtype:\"any\"", 1, false);
		
		//Test a card that has no transactions
		List<WebElement> elements = driver.findElements(By.className("baseballcardContainer"));
		
		WebElement card1 = null;
		for (WebElement webElement : elements) {
			if (webElement.isDisplayed()) {
				if (card1 == null) {
					card1 = webElement;
				}
			}
		}
		
		if (card1 == null) {
			throw new AssertionError("Couldn't find: baseballcardContainer element");			
		}
		
		card1.click();
		
		//Wait a few seconds for page to load. This is needed despite waiting for presence of element
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		WebElement element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.id("transactions-table-pagination-label")));
				
		element = driver.findElement(By.id("transactions-button"));
		
		element.click();
		
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.className("simpleSearchSummary")));
		assertEquals("Showing 1 - 6 of 6 results", element.getText());
		
		try {
			Thread.sleep(2000);
		} catch (Exception e) {}
		
		elements = driver.findElements(By.className("simpleSearchResultText"));
		element = SeleniumUtils.getDisplayedElement(elements);		
		element = element.findElement(By.className("simpleSearchResultFieldValue"));		
		assertEquals("To: a.partner.p71-438363 • From: a.loan.b438363", element.getText());
	}

}
