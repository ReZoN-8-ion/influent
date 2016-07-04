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

import java.util.Collection;

import scala.Tuple2;

import com.oculusinfo.ml.Instance;
import com.oculusinfo.ml.feature.BagOfWordsFeature;
import com.oculusinfo.ml.feature.GeoSpatialFeature;
import com.oculusinfo.ml.feature.NumericVectorFeature;
import com.oculusinfo.ml.spark.SparkInstanceParser;
import com.oculusinfo.ml.spark.SparkInstanceParserHelper;

public class EntityInstanceParser extends SparkInstanceParser {
	private static final long serialVersionUID = 7832910126397517914L;
	
	private Collection<SchemaField> schema;
	
	public EntityInstanceParser(Collection<SchemaField> schema) {
		this.schema = schema;
	}

	@Override
	public Tuple2<String, Instance> call(String line) throws Exception {
		String str = line;
		String key = null;
		if (line.startsWith("(")) {
			key = str.substring(1, str.indexOf(","));
			str = str.substring(str.indexOf(",")+1);
		}
		if (line.endsWith(")")) {
			str = str.substring(0, str.length()-1);
		}
	
		SparkInstanceParserHelper parser = new SparkInstanceParserHelper(str);
		
		// each entity MUST have an id
		String id = parser.fieldToString("id");
		if (key == null) {
			key = id;
		}
		Instance inst = new Instance(id);
		
		for (SchemaField field : schema) {
			switch (field.fieldType) {
			case CC:
			case CATEGORY:
				BagOfWordsFeature cat = parser.fieldToBagOfWordsFeature(field.fieldName);
				if (cat != null) {
					inst.addFeature(cat);
				}
				break;
			case GEO:
				GeoSpatialFeature location = parser.fieldToGeoSpatialFeature(field.fieldName);
				if (location != null) {
					inst.addFeature(location);
				}
				break;
			case LABEL:
				BagOfWordsFeature label = parser.fieldToBagOfWordsFeature(field.fieldName);
				if (label != null) {
					inst.addFeature(label);
				}
				break;
			case NUMBER:
				NumericVectorFeature num = parser.fieldToNumericVectorFeature(field.fieldName);
				if (num != null) {
					inst.addFeature(num);
				}
				break;
			default:
				/* unsupported - ignore */
				break;
			}
		}
		return new Tuple2<String, Instance>(key, inst);
	}
}
