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

package influent.idlhelper;

import influent.idl.FL_Entity;
import influent.idl.FL_Link;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_SearchResult;
import influent.idl.FL_SearchResults;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

public class SearchResultsHelper extends FL_SearchResults {
	
	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_SearchResults descriptor) throws IOException {
		return SerializationHelper.toJson(descriptor);
	}

	public static String toJson(List<FL_SearchResults> descriptors) throws IOException {
		return SerializationHelper.toJson(descriptors, FL_SearchResults.getClassSchema());
	}

	public static String toJson(Map<String, List<FL_SearchResults>> map) throws IOException {
		return SerializationHelper.toJson(map, FL_SearchResults.getClassSchema());
	}
	
	public static FL_SearchResults fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_SearchResults.getClassSchema());
	}
	
	public static List<FL_SearchResults> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_SearchResults.getClassSchema());
	}
	
	public static Map<String, List<FL_SearchResults>> mapFromJson(String json) throws IOException {
		return SerializationHelper.mapFromJson(json, FL_SearchResults.getClassSchema());
	}
	
	public static List<String> getKeysForTag(FL_SearchResults searchResults, FL_PropertyTag tag) {
		HashSet<String> keys = new HashSet<String>();
		
		for (FL_SearchResult searchResult : searchResults.getResults()) {
			List<FL_Property> propList = null;
			Object objWithProperties = searchResult.getResult();

			if (objWithProperties instanceof FL_Entity) {
				propList = ((FL_Entity)objWithProperties).getProperties();
			} else if (objWithProperties instanceof FL_Link) {
				propList = ((FL_Link)objWithProperties).getProperties();
			}

			if (propList != null) {
				for (FL_Property prop : propList) {
					for (FL_PropertyTag t : prop.getTags()) {
						if (tag.equals(t)) {
							keys.add(prop.getKey());
						}
					}
				}
			}
		}
		
		return new ArrayList<String>(keys);
	}

}
