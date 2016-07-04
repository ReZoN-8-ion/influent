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
import influent.selenium.util.SeleniumUtils;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * 
 * @author cregnier
 *
 */
public class TransactionsSearchResultsTest extends BrowserParameterizedTest {

	public TransactionsSearchResultsTest(BROWSER browser) { super(browser); };
	
	private WebElement resultsRoot;

	private static final int MAX_NUM_RESULTS_PER_PAGE = 13;
	
	/**
	 * Runs a query and checks that all of the results are as expected
	 * @param query
	 * @param expectedNumResults
	 * @param expectedResults
	 *   An array of expected search results. Each search result should be in the form:<br>
	 *   { int index, String date, String to, String from }
	 */
	private void validateSearchResults(String query, int expectedNumResults, Object expectedResults[][]) {
		List<WebElement> elements = driver.findElements(By.cssSelector("#influent-filterbar-search-input"));

		//sort the expected results so we don't do extra work jumping between pages
		Arrays.sort(expectedResults, new Comparator<Object[]>() {
			@Override
			public int compare(Object[] o1, Object[] o2) {
				return ((Integer)o1[0]).compareTo((Integer)o2[0]);
			}
			
		});

		WebElement element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: influent-filterbar-search-input element");			
		}
		
		element.clear();	//clear the text from the input box first
		element.sendKeys(query);	//pass in the query
		
		elements = driver.findElements(By.cssSelector(".btn-default"));
		element = SeleniumUtils.getDisplayedElement(elements);
		
		if (element == null) {
			throw new AssertionError("Couldn't find: btn-default element");			
		}
		
		element.click();
		
		element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".simpleSearchSummary")));
		assertEquals("Showing 1 - " + Math.min(expectedNumResults, MAX_NUM_RESULTS_PER_PAGE) + " of " + expectedNumResults + " results", element.getText());

		for (Object[] expectedResult : expectedResults) {
			//get the search result index this expected result refers to
			int resultNum = (Integer)expectedResult[0];
			
			//find the search result element
			WebElement searchResult = getSearchResult(resultNum);
			Assert.assertNotNull("Couldn't find search result " + resultNum + " for query: '" + query + "'", searchResult);

			//check that the results are as expected
			assertSearchResult((String)expectedResult[1], (String)expectedResult[2], (String)expectedResult[3], searchResult);
		}
	}
	
	/**
	 * asserts the expected results for a single search result are correct
	 * @param eDate
	 * @param eTo
	 * @param eFrom
	 * @param searchResult
	 */
	private void assertSearchResult(String eDate, String eTo, String eFrom, WebElement searchResult) {
		WebElement e;
		
		//checks the Date field
		e = searchResult.findElement(By.cssSelector(".simpleSearchResultIconRow div span"));
		assertEquals("Search result 'Date' field is not as expected.", eDate, e.getText());
		
		//check the To field
		e = searchResult.findElement(By.cssSelector(".simpleSearchResultText .simpleSearchResultFieldValue span:nth-child(1)"));
		assertEquals("Search result 'To' field is not as expected.", "To: " + eTo, e.getText());
		
		//check the From field
		e = searchResult.findElement(By.cssSelector(".simpleSearchResultText .simpleSearchResultFieldValue span:nth-child(3)"));
		assertEquals("Search result 'From' field is not as expected.", "From: " + eFrom, e.getText());
	}

	private int gotoSearchResultsPageFor(int index) {
		WebElement selectedPageButton = resultsRoot.findElement(By.cssSelector(".searchPageElementHighlighted"));
		Assert.assertNotNull("Can't find the currently selected page button.", selectedPageButton);
		int curPageNum = Integer.parseInt(selectedPageButton.getText()) - 1;
		
		boolean isOnPage = index >= curPageNum * MAX_NUM_RESULTS_PER_PAGE && index < (curPageNum + 1) * MAX_NUM_RESULTS_PER_PAGE;
		if (isOnPage) {
			return curPageNum * MAX_NUM_RESULTS_PER_PAGE;
		}

		int pageNum = (index / MAX_NUM_RESULTS_PER_PAGE);
			
		WebElement pageButton = resultsRoot.findElement(By.cssSelector("span[searchpage='" + pageNum + "']"));
		pageButton.click();
		
		return pageNum * MAX_NUM_RESULTS_PER_PAGE;
	}
	
	private WebElement getSearchResult(int index) {
		WebElement element = null;
		int startIndex = gotoSearchResultsPageFor(index);

		if (startIndex >= 0) {
			int resultOffset = index - startIndex;
			element = resultsRoot.findElement((By.cssSelector(".simpleSearchResult:nth-child(" + (resultOffset + 1) + ")")));
		}
		
		return element;
	}
	
	@Test
	public void testSimpleSearchResults() {
		driver.navigate().to(startURL + "#/transactions");
		resultsRoot = driver.findElement(By.cssSelector("#infLinkSearchResultContainer"));
		
		Object expectedResults[][] = {
				{0, "2010-08-12", "a.null.p81-146773", "a.null.b146773"},
				{1, "2010-07-12", "a.null.p81-146773", "a.null.b146773"},
				{2, "2010-06-12", "a.null.p81-146773", "a.null.b146773"},
				{3, "2010-05-12", "a.null.p81-146773", "a.null.b146773"},
				{4, "2010-04-12", "a.null.p81-146773", "a.null.b146773"},
				{5, "2010-03-12", "a.null.p81-146773", "a.null.b146773"},
				{6, "2010-02-12", "a.null.p81-146773", "a.null.b146773"},
				{7, "2010-01-12", "a.null.p81-146773", "a.null.b146773"},
				{8, "2009-12-12", "a.null.p81-146773", "a.null.b146773"},
				{9, "2009-11-12", "a.null.p81-146773", "a.null.b146773"},
				{10, "2009-10-12", "a.null.b146773", "a.null.p81-146773"}
		};
		
		//query for one of the daniels
		validateSearchResults("INFLUENT_ID:a.null.b146773", 11, expectedResults);
	}
	
	@Test
	public void testMultiAccountQuery() {
		driver.navigate().to(startURL + "#/transactions");
		resultsRoot = driver.findElement(By.cssSelector("#infLinkSearchResultContainer"));
		
		//some random expected results from the query. This also picks some of the fence post indices to test out different pages
		Object expectedResults[][] = {
				{0, "2010-08-12", "a.null.p81-146772", "a.null.b146772"},
				{1, "2010-08-12", "a.null.p81-146773", "a.null.b146773"},
				{13, "2010-02-12", "a.null.p81-146773", "a.null.b146773"},
				{21, "2009-10-12", "a.null.b146773", "a.null.p81-146773"}
		};
		
		//query for one of the daniels
		validateSearchResults("INFLUENT_ID:a.null.b146773 INFLUENT_ID:a.null.b146772", 22, expectedResults);
		
	}
	
}
