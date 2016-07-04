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
package influent.server.configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DataTableSchema {
	private String _key;
	private Map<String, DataTableProperty> _tableProperties = new HashMap<String, DataTableProperty>();
	private Map<String, DataColumnProperty> _columnProperties = new HashMap<String, DataColumnProperty>();



	String getKey() {
		return _key;
	}




	void setKey(String key) {
		_key = key;
	}




	void addTableProperty(DataTableProperty property) {
		_tableProperties.put(property.getKey(), property);
	}




	void addTableProperties(List<DataTableProperty> properties) {
		for (DataTableProperty property : properties) {
			addTableProperty(property);
		}
	}




	void addColumnProperty(DataColumnProperty property) {
		_columnProperties.put(property.getKey(), property);
	}




	void addColumnProperties(List<DataColumnProperty> properties) {
		for (DataColumnProperty property : properties) {
			addColumnProperty(property);
		}
	}




	public DataTableProperty getTablePropertyByKey(String key) {
		return _tableProperties.get(key);
	}




	public DataColumnProperty getColumnPropertyByKey(String key) {
		return _columnProperties.get(key);
	}
}
