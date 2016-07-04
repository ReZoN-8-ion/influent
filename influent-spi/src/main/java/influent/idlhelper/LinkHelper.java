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

import influent.idl.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class LinkHelper extends FL_Link {
	
	public LinkHelper(String uid, String source, String target, String type, List<FL_Property> props, List<String> linkTypes) {
		setUid(uid);
		setLinkTypes(linkTypes);
		setDirected(true);
		setProvenance(null);
		setUncertainty(null);
		setSource(source);
		setTarget(target);
		setType(type);
		setProperties(new ArrayList<FL_Property>(props));
	}

	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_Link link) throws IOException {
		return SerializationHelper.toJson(link);
	}
	
	public static String toJson(List<FL_Link> links) throws IOException {
		return SerializationHelper.toJson(links, FL_Link.getClassSchema());
	}
	
	public static String toJson(Map<String, List<FL_Link>> map) throws IOException {
		return SerializationHelper.toJson(map, FL_Link.getClassSchema());
	}

	public static FL_Entity fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_Entity.getClassSchema());
	}
	
	public static List<FL_Link> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_Link.getClassSchema());
	}
	
	public static Map<String,List<FL_Link>> mapFromJson(String json) throws IOException {
		return SerializationHelper.mapFromJson(json, FL_Link.getClassSchema());
	}
	
	public static PropertyHelper getFirstProperty(FL_Link link, String key) {
		for (FL_Property property : link.getProperties()) {
			if (key.equals(property.getKey())) return PropertyHelper.from(property);
		}
		return null;
	}
	
	public static PropertyHelper getFirstPropertyByTag(FL_Link link, FL_PropertyTag tag) {
		for (FL_Property property : link.getProperties()) {
			if (property.getTags().contains(tag)) return PropertyHelper.from(property);
		}
		return null;
	}
	
	public static List<PropertyHelper> getProperties(FL_Link link, String key) {
		List<PropertyHelper> matches = new ArrayList<PropertyHelper>();
		for (FL_Property property : link.getProperties()) {
			if (property.getKey()==key) matches.add(PropertyHelper.from(property));
		}
		return matches;
		
	}
	
	public static Object getValueByUnmappedKey(FL_Link link, String key, List<FL_PropertyDescriptor> defns) {
		return PropertyHelper.getValue(getPropertyByUnmappedKey(link, key, defns));
	}
	
	public static FL_Property getPropertyByUnmappedKey(FL_Link link, String key, List<FL_PropertyDescriptor> defns) {
		key = PropertyDescriptorHelper.mapKey(key, defns, link.getType());

		return PropertyHelper.getPropertyByKey(link.getProperties(), key);
	}
}
