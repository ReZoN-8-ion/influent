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
package influent.server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author djonker
 *
 */
public class Version {
	
	/**
	 * The Influent version number.
	 */
	public static final String VERSION;
	

	
	private static final Logger s_logger = LoggerFactory.getLogger(Version.class);


	/**
	 * Read from file (which is part of the project build)
	 */
	static {
		BufferedReader r = new BufferedReader(new InputStreamReader(
			Version.class.getResourceAsStream("influent.version")));
		
		String v = "unknown";

		try {
			v = r.readLine().trim();
		} catch (IOException e) {
			s_logger.error("Problem reading version number", e);
		}
		
		VERSION = v;
	}
	
}
