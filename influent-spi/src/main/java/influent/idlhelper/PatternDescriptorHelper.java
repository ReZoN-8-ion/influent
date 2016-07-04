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

import influent.idl.FL_PatternDescriptor;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class PatternDescriptorHelper extends FL_PatternDescriptor {
	
	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_PatternDescriptor descriptor) throws IOException {
		return SerializationHelper.toJson(descriptor);
	}

	public static String toJson(List<FL_PatternDescriptor> descriptors) throws IOException {
		return SerializationHelper.toJson(descriptors, FL_PatternDescriptor.getClassSchema());
	}

	public static String toJson(Map<String, List<FL_PatternDescriptor>> map) throws IOException {
		return SerializationHelper.toJson(map, FL_PatternDescriptor.getClassSchema());
	}
	
	public static FL_PatternDescriptor fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_PatternDescriptor.getClassSchema());
	}
	
	public static List<FL_PatternDescriptor> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_PatternDescriptor.getClassSchema());
	}
	
	public static Map<String, List<FL_PatternDescriptor>> mapFromJson(String json) throws IOException {
		return SerializationHelper.mapFromJson(json, FL_PatternDescriptor.getClassSchema());
	}
}
