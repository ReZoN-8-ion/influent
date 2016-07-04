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

import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import influent.selenium.util.SeleniumUtils;

public class ColdStartTransactionsTest extends ColdStartTestBase{
	public ColdStartTransactionsTest(BROWSER browser) {
		super(browser, SeleniumUtils.ACCOUNTS_NAME.toLowerCase(), "daniel", "accountsSearchResult");
	}
	
	@Test
	public void coldStartTestBasicTerm() {
		WebElement element = (new WebDriverWait(driver, 120)).until(ExpectedConditions.presenceOfElementLocated(By.className(this.classToFind)));
		if (element == null) {
			throw new AssertionError("Could not find any " + this.classToFind + " elements.   The server either did not return any search results for the url or the search failed.");
		}
	}
}
