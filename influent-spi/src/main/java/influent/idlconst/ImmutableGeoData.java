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

import influent.idl.FL_GeoData;

/**
 * Internal immutable versions of country data, safe to return above.
 * 
 * @author djonker
 */
public class ImmutableGeoData extends FL_GeoData {
	public ImmutableGeoData(String text, Double lat, Double lon, String cc) {
		super(text, lat, lon, cc);
	}
	
	@Override
	public void setText(String value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Geo instance.");
	}
	@Override
	public void setLat(Double value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Geo instance.");
	}
	@Override
	public void setLon(Double value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Geo instance.");
	}
	@Override
	public void setCc(String value) {
		throw new UnsupportedOperationException("Tried to set properties of immutable FL_Geo instance.");
	}
}
