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
import influent.idl.FL_EntityTag;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyDescriptor;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_Provenance;
import influent.idl.FL_Uncertainty;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class EntityHelper extends FL_Entity {

	public EntityHelper(String id, String type, List<FL_EntityTag> tagList, FL_Provenance provenance, FL_Uncertainty uncertainty, List<FL_Property> properties) {
		super(id, type, new ArrayList<FL_EntityTag>(tagList), provenance, uncertainty, new ArrayList<FL_Property>(properties));
	}

	public EntityHelper(String id, String type, List<FL_EntityTag> tagList, List<FL_Property> properties) {
		this(
			id,
			type,
			tagList,
			null,
			null,
			merge(
				properties,
				Arrays.asList(
					new FL_Property[] {
						new PropertyHelper(FL_PropertyTag.TYPE, type)
					}
				)
			)
		);
	}

	public EntityHelper(String id, String label, String type, List<FL_EntityTag> tagList, List<FL_Property> properties) {
		this(id, type, tagList, null, null, merge(properties, Arrays.asList(new FL_Property[] {
				new PropertyHelper(FL_PropertyTag.LABEL, label),
				new PropertyHelper(FL_PropertyTag.TYPE, type)
		})));
	}

	private static List<FL_Property> merge(List<FL_Property> list1, List<FL_Property> list2) {
		List<FL_Property> merged = new ArrayList<FL_Property>(list1);
		merged.addAll(list2);
		return merged;
	}

	public EntityHelper(String id, String label, String type, FL_EntityTag tag, List<FL_Property> properties) {
		this(id, label, type, Collections.singletonList(tag), new ArrayList<FL_Property>(properties));
	}

	public PropertyHelper getFirstProperty(String key) {
		for (FL_Property property : getProperties()) {
			if (property.getKey().equals(key)) return PropertyHelper.from(property);
		}
		return null;
	}

	public String getId() {
		return (String)getUid();
	}

	public String getLabel() {
		PropertyHelper label = getFirstProperty(FL_PropertyTag.LABEL.name());
		return (String) (label != null ? label.getValue() : null); 
	}

	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_Entity entity) throws IOException {
		return SerializationHelper.toJson(entity);
	}
	
	public static String toJson(List<FL_Entity> entities) throws IOException {
		return SerializationHelper.toJson(entities, FL_Entity.getClassSchema());
	}
	
	public static String toJson(Map<String, List<FL_Entity>> entities) throws IOException {
		return SerializationHelper.toJson(entities, FL_Entity.getClassSchema());
	}
	
	public static FL_Entity fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_Entity.getClassSchema());
	}
	
	public static List<FL_Entity> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_Entity.getClassSchema());
	}
	
	public static Map<String,List<FL_Entity>> mapFromJson(String json) throws IOException {
		return SerializationHelper.mapFromJson(json, FL_Entity.getClassSchema());
	}
	
	public static PropertyHelper getFirstProperty(FL_Entity entity, String key) {
		for (FL_Property property : entity.getProperties()) {
			if (property.getKey().equals(key)) return PropertyHelper.from(property);
		}
		return null;
	}
	
	public static PropertyHelper getFirstPropertyByTag(FL_Entity entity, FL_PropertyTag tag) {
		for (FL_Property property : entity.getProperties()) {
			if (property.getTags().contains(tag)) return PropertyHelper.from(property);
		}
		return null;
	}

	public static Object getValueByUnmappedKey(FL_Entity link, String key, List<FL_PropertyDescriptor> defns) {
		return PropertyHelper.getValue(getPropertyByUnmappedKey(link, key, defns));
	}
	
	public static FL_Property getPropertyByUnmappedKey(FL_Entity entity, String key, List<FL_PropertyDescriptor> defns) {
		key = PropertyDescriptorHelper.mapKey(key, defns, entity.getType());

		return PropertyHelper.getPropertyByKey(entity.getProperties(), key);
	}

}
