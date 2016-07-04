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

import org.junit.Test;
import org.openqa.selenium.By;

public class FilterBarTests extends BrowserParameterizedTest {

    public FilterBarTests(BROWSER browser) {
        super(browser);
    }

    @Test
    public void filterbarTest() {

        // Check to see if the filterbar exists in the required views

        SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_ACCOUNTS);
        driver.findElement(By.className("influent-filterbar"));

        SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_TRANSACTIONS);
        driver.findElement(By.className("influent-filterbar"));

        SeleniumUtils.navigateToTab(driver, SeleniumUtils.TAB_FLOW);
        driver.findElement(By.className("influent-filterbar"));
    }
}
