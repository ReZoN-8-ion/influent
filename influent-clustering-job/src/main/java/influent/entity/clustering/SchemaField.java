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

package influent.entity.clustering;

import java.io.Serializable;

public class SchemaField implements Serializable {
	private static final long serialVersionUID = -4354199207447271790L;
	
	public final String fieldName;
	public final FieldType fieldType;

	public enum FieldType {
		CATEGORY,
		CC,
		GEO,
		ID,
		LABEL,
		NUMBER,
	}
	
	public SchemaField(String fieldName, FieldType type) {
		this.fieldName = fieldName;
		this.fieldType = type;
	}
}

