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

package influent.idlconst;

import influent.idl.FL_ContinentCode;
import influent.idl.FL_Country;
import influent.idl.FL_GeoData;

public class ImmutableCountry extends FL_Country {
	public ImmutableCountry(FL_GeoData country, String region, FL_ContinentCode continent) {
		super(country, region, continent);
	}
	@Override
	public void setCountry(FL_GeoData value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Country instance.");
	}
	@Override
	public void setRegion(String value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Country instance.");
	}
	@Override
	public void setContinent(FL_ContinentCode value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Country instance.");
	}
}
