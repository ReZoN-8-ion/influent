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

package influent.server.utilities;

import oculus.aperture.spi.common.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.management.RuntimeErrorException;

/**
 * Created by djonker on 2/23/2015.
 */
public class PropertyFallbackReporter {
    private static final Logger s_logger = LoggerFactory.getLogger(PropertyFallbackReporter.class);

    public static String getString(Properties p, String name, String defValue) {
        String v = p.getString(name, null);

        if (v == null) {
            s_logger.warn("No configuration found for property "+ name+ ". Using default value "+ defValue);
            return defValue;
        }

        return v;
    }

    public static String getRequiredString(Properties p, String name) {
        String v = p.getString(name, null);

        if (v == null) {
            throw new IllegalStateException("No configuration found for required property "+ name);
        }

        return v;
    }

}
