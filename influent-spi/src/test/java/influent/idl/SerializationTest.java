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

package influent.idl;

import influent.idl.FL_Entity;
import influent.idl.FL_EntityTag;
import influent.idl.FL_Property;
import influent.idlhelper.EntityHelper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

import org.junit.Test;


public class SerializationTest {
	
	@Test
	public void serializeEntity() throws IOException {
		FL_Entity entity = FL_Entity.newBuilder()
			.setUid("ABCid")
			.setTags(Collections.singletonList(FL_EntityTag.ACCOUNT))
			.setProperties(new ArrayList<FL_Property>())
			.setProvenance(null)
			.setUncertainty(null)
			.setType(null)
			.build();

		// serialization: entity
		String json = EntityHelper.toJson(entity);
		
		EntityHelper.fromJson(json);
	}
	
	@Test
	public void serializeEntityList() throws IOException {
		FL_Entity entity = FL_Entity.newBuilder()
			.setUid("ABCid")
			.setTags(Collections.singletonList(FL_EntityTag.ACCOUNT))
			.setProperties(new ArrayList<FL_Property>())
			.setProvenance(null)
			.setUncertainty(null)
			.setType(null)
			.build();

		// serialization: entity list
		String json = EntityHelper.toJson(Arrays.asList(new FL_Entity[] {entity,entity}));
		
		EntityHelper.listFromJson(json);
	}
	
	@Test
	public void serializeEntityMap() throws IOException {
		FL_Entity entity = FL_Entity.newBuilder()
			.setUid("ABCid")
			.setTags(Collections.singletonList(FL_EntityTag.ACCOUNT))
			.setProperties(new ArrayList<FL_Property>())
			.setProvenance(null)
			.setUncertainty(null)
			.setType(null)
			.build();

		// serialization: entity map
		HashMap<String, List<FL_Entity>> map = new HashMap<String,List<FL_Entity>>();
		map.put("test", Arrays.asList(new FL_Entity[] {entity,entity}));
		String json = EntityHelper.toJson(map);
		
		EntityHelper.mapFromJson(json);
	}
}
