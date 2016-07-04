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
import org.openqa.selenium.WebElement;
import java.util.List;
import static org.junit.Assert.assertTrue;

public class HeaderTests extends BrowserParameterizedTest {

    public HeaderTests(BROWSER browser) {
        super(browser);
    }

    @Test
    public void headerTest() {

        // Check to see if the header brand is there
        driver.findElement(By.id("influent-header-brand"));

        // Open all dropdowns
        List<WebElement> menus = driver.findElements(By.cssSelector("#infHeader .dropdown"));

        for (WebElement menu : menus) {
            menu.click();

            assertTrue(SeleniumUtils.hasClass(menu,"open"));
        }
    }
}
