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

import influent.idl.FL_PropertyDescriptor;

import java.util.List;

/**
 * Defines source fields for a non-primitive property like FL_GeoData
 */
public class PropertyField {
	private final String name;
	private final boolean searchable;
	private final String key;

	private FL_PropertyDescriptor property;

	/**
	 * Initialize the fixed properties
	 */
	public PropertyField(String name, String key, boolean isSearchable) {
		this.name = name;
		this.key = key;
		this.searchable = isSearchable;
	}

	public void setProperty(FL_PropertyDescriptor property) {
		this.property = property;
	}

	/**
	 * @return the field name
	 */
	public String getName() {
		return name;
	}

	/**
	 * @return true if should be searched when this higher level property is searched.
	 */
	public boolean isSearchable() {
		return searchable;
	}

	/**
	 * @return the property key which the field maps to.
	 */
	public String getKey() {
		return key;
	}

	/**
	 * @return the property which the field is populated from, if key is found.
	 */
	public FL_PropertyDescriptor getProperty() {
		return property;
	}

	/**
	 * Interface which returns property fields
	 */
	public static interface Provider {

		/**
		 * Returns true if a property has field mappings
		 * @param key
		 *  property key.
		 * @return
		 *  boolean
		 */
		public boolean isCompositeProperty(String key);

		/**
		 * Returns a list of field mappings for a property key
		 * @param key
		 *  property key.
		 * @return
		 *  List of field definitions
		 */
		public List<PropertyField> getFields(String key);

		/**
		 * Returns a field definition for a property field name.
		 * @param key
		 *  property key
		 * @param name
		 *  name of field
		 * @return
		 *  A field definition
		 */
		public PropertyField getField(String key, String name);
	}


}
