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

import influent.idl.FL_BoundedRange;
import influent.idl.FL_Constraint;
import influent.idl.FL_ListRange;
import influent.idl.FL_PropertyDescriptor;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_PropertyType;
import influent.idl.FL_SingletonRange;
import influent.idl.FL_TypeMapping;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class PropertyMatchDescriptorHelper extends FL_PropertyMatchDescriptor {

	public static PropertyMatchDescriptorHelper from(FL_PropertyMatchDescriptor descriptor) {
		if (descriptor instanceof PropertyMatchDescriptorHelper) return (PropertyMatchDescriptorHelper)descriptor;
		
		PropertyMatchDescriptorHelper helper = new PropertyMatchDescriptorHelper();
		helper.setKey(descriptor.getKey());
		helper.setConstraint(descriptor.getConstraint());
		helper.setVariable(descriptor.getVariable());
		helper.setInclude(descriptor.getInclude());
		helper.setRange(descriptor.getRange());
		return helper;
	}
	
	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_PropertyMatchDescriptor descriptor) throws IOException {
		return SerializationHelper.toJson(descriptor);
	}
	
	public static String toJson(List<FL_PropertyMatchDescriptor> descriptors) throws IOException {
		return SerializationHelper.toJson(descriptors, FL_PropertyMatchDescriptor.getClassSchema());
	}

	public static String toJson(Map<String, List<FL_PropertyMatchDescriptor>> map) throws IOException {
		return SerializationHelper.toJson(map, FL_PropertyMatchDescriptor.getClassSchema());
	}
	
	public static FL_PropertyMatchDescriptor fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_PropertyMatchDescriptor.getClassSchema());
	}
	
	public static List<FL_PropertyMatchDescriptor> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_PropertyMatchDescriptor.getClassSchema());
	}
	
	public static Map<String, List<FL_PropertyMatchDescriptor>> mapFromJson(String json) throws IOException {
		return SerializationHelper.mapFromJson(json, FL_PropertyMatchDescriptor.getClassSchema());
	}

	/**
	 * Returns an FL_*Range Object representing a set of basic string terms
	 * 
	 * @param terms
	 * 		the terms to represent
	 * @return
	 * 		an FL_*Range Object - either a singleton or list
	 */
	public static Object rangeFromBasicTerms(String terms) {
		
		// if quoted, return as one term
		if (terms.charAt(0) == '"') {
			int end = terms.length() 
					- (terms.charAt(terms.length()-1) == '"'? 1: 0);
			
			return FL_SingletonRange.newBuilder()
				.setType(FL_PropertyType.STRING)
				.setValue(terms.substring(1, end))
				.build();
		}
		
		final String tokens[] = terms.split("\\s+");

		// else break by whitespace
		switch (tokens.length) {
		case 0:
			return null;
			
		case 1:
			return FL_SingletonRange.newBuilder()
				.setType(FL_PropertyType.STRING)
				.setValue(tokens[0])
				.build();
			
		default:
			return FL_ListRange.newBuilder()
				.setType(FL_PropertyType.STRING)
				.setValues(Arrays.asList(Arrays.copyOf(tokens, tokens.length, Object[].class)))
				.build();
		}
	}
	
	/**
	 * Returns true if the match descriptor is exclusive, accounting for both the include
	 * property and the NOT constraint. 
	 * 
	 * Match descriptors have a NOT constraint which is redundant with the include boolean
	 * for searches other than pattern searches. Here we interpret "NOT exclude" as "NOT/exclude", since
	 * otherwise the criteria would have no effect at all.
	 * 
	 * @param descriptor
	 * 		The match specification
	 * 
	 * @return
	 * 		true if an exclusion
	 */
	public static boolean isExclusion(FL_PropertyMatchDescriptor descriptor) {
		return FL_Constraint.NOT.equals(descriptor) || !descriptor.getInclude();
	}
	
	public FL_PropertyType getType() {
		Object range = getRange();
		if (range instanceof FL_SingletonRange)
			return ((FL_SingletonRange)range).getType();
		else if (range instanceof FL_ListRange)
			return ((FL_ListRange)range).getType();
		else if (range instanceof FL_BoundedRange)
			return ((FL_BoundedRange)range).getType();
		return null;
	}

	public Object getValue() {
		Object range = getRange();
		if (range instanceof FL_SingletonRange) {
			return ((FL_SingletonRange)range).getValue();
		}
		else if (range instanceof FL_ListRange) {
			return ((FL_ListRange)range).getValues().iterator().next();
		}
		else if (range instanceof FL_BoundedRange) {
			FL_BoundedRange bounded = (FL_BoundedRange)range;
			return bounded.getStart() != null ? bounded.getStart() : bounded.getEnd();
		}
		return null;
	}

	public static String getFieldname(FL_PropertyMatchDescriptor pmd, String type) {
		for (FL_TypeMapping mapping : pmd.getTypeMappings()) {
			if (mapping.getType().equals(type)) {
				return mapping.getMemberKey();
			}
		}

		return null;
	}
	
	public static String getFieldname(FL_PropertyDescriptor pmd, String type, String defaultName) {
		if (pmd != null) {
			for (FL_TypeMapping mapping : pmd.getMemberOf()) {
				if (mapping.getType().equals(type)) {
					return mapping.getMemberKey();
				}
			}
		}

		return defaultName;
	}
}
