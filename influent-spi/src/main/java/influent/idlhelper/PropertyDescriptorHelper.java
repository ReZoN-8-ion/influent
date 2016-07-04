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
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class PropertyDescriptorHelper extends FL_PropertyDescriptor {
	
	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_PropertyDescriptor descriptor) throws IOException {
		return SerializationHelper.toJson(descriptor);
	}

	public static String toJson(List<FL_PropertyDescriptor> descriptors) throws IOException {
		return SerializationHelper.toJson(descriptors, FL_PropertyDescriptor.getClassSchema());
	}

	public static String toJson(Map<String, List<FL_PropertyDescriptor>> map) throws IOException {
		return SerializationHelper.toJson(map, FL_PropertyDescriptor.getClassSchema());
	}
	
	public static FL_PropertyDescriptor fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_PropertyDescriptor.getClassSchema());
	}
	
	public static List<FL_PropertyDescriptor> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_PropertyDescriptor.getClassSchema());
	}
	
	public static Map<String, List<FL_PropertyDescriptor>> mapFromJson(String json) throws IOException {
		return SerializationHelper.mapFromJson(json, FL_PropertyDescriptor.getClassSchema());
	}
	
	public static FL_PropertyDescriptor find(String key, List<FL_PropertyDescriptor> list) {
		if (key != null) {
			for (FL_PropertyDescriptor pd : list) {
				if (pd.getKey().equals(key)) {
					return pd;
				}
			}
		}
		return null;
	}


	public static FL_PropertyDescriptor findByMemberKey(String key, List<FL_PropertyDescriptor> list) {
		if (key != null) {
			for (FL_PropertyDescriptor pd : list) {
				for (FL_TypeMapping mapping : pd.getMemberOf()) {
					if (mapping.getMemberKey().equals(key)) {
						return pd;
					}
				}
			}
		}
		return null;
	}


	public static List<FL_PropertyDescriptor> findByTag(FL_PropertyTag tag, List<FL_PropertyDescriptor> list) {

		List<FL_PropertyDescriptor> tagList = new ArrayList<FL_PropertyDescriptor>();

		for (FL_PropertyDescriptor pd : list) {
			for (FL_PropertyTag pt : pd.getTags()) {
				if (pt == tag) {
					tagList.add(pd);
					break;
				}
			}
		}

		return tagList;
	}

	public static FL_PropertyDescriptor findFirstByTag(FL_PropertyTag tag, List<FL_PropertyDescriptor> list) {

		List<FL_PropertyDescriptor> tagList = findByTag(tag, list);

		if (tagList.size() > 0) {
			return tagList.get(0);
		} else {
			return null;
		}
	}


	public static String getFieldname(FL_PropertyDescriptor pd, String type, String defaultName) {
		if (pd != null) {
			for (FL_TypeMapping mapping : pd.getMemberOf()) {
				if (mapping.getType().equals(type)) {
					return mapping.getMemberKey();
				}
			}
		}

		return defaultName;
	}
	public static String mapKey(String key, List<FL_PropertyDescriptor> defns, String type) {
		for (FL_PropertyDescriptor pd : defns) {
			if (pd.getKey().equals(key)) {
				return getFieldname(pd, type, key);
			}
		}
		
		return null;
	}

	public static List<String> mapKeys(String key, List<FL_PropertyDescriptor> defns, Set<String> types) {
		List<String> mapped = new ArrayList<String>();

		for (FL_PropertyDescriptor pd : defns) {
			if (pd.getKey().equals(key)) {
				final List<FL_TypeMapping> mappings = pd.getMemberOf();

				for (FL_TypeMapping mapping : mappings) {
					if (types.contains(mapping.getType())) {
						mapped.add(mapping.getMemberKey());
					}
				}
			}
		}

		return mapped;
	}

	public static List<FL_OrderBy> mapOrderBy(List<FL_OrderBy> orderBy, List<FL_PropertyDescriptor> descriptors, String type) {
		return mapOrderBy(orderBy, descriptors, Collections.singleton(type));
	}


	public static List<FL_OrderBy> mapOrderBy(List<FL_OrderBy> orderBy, List<FL_PropertyDescriptor> descriptors, Set<String> types) {

		if (orderBy != null) {
			List<FL_OrderBy> mapped = new ArrayList<FL_OrderBy>(orderBy.size());
			final Set<String> fields = new HashSet<String>();

			for (FL_OrderBy ob : orderBy) {
				if (ob.getPropertyKey().equals(FL_ReservedPropertyKey.MATCH.name())) {
					mapped.add(ob);
				} else {

					List<String> keys = new ArrayList<String>();

					if (ob.getPropertyKey().equals(FL_RequiredPropertyKey.ENTITY.name()) ||
							ob.getPropertyKey().equals(FL_RequiredPropertyKey.LINKED.name())) {

						keys.addAll(mapKeys(FL_RequiredPropertyKey.FROM.name(), descriptors, types));
						keys.addAll(mapKeys(FL_RequiredPropertyKey.TO.name(), descriptors, types));

					} else {
						keys  = mapKeys(ob.getPropertyKey(), descriptors, types);
					}

					for (String key : keys) {
						if (!fields.contains(key)) {
							mapped.add(FL_OrderBy.newBuilder()
									.setPropertyKey(key)
									.setAscending(ob.getAscending())
									.build());
							fields.add(key);
						}
					}
				}
			}

			return mapped;
		}

		return null;
	}

}
