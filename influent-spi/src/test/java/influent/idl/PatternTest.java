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

import influent.idlhelper.PatternDescriptorHelper;
import influent.idlhelper.SingletonRangeHelper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.junit.Test;

public class PatternTest {
	
	@Test
	public void obfuscatedMoneyFlow() throws IOException {
		
		FL_EntityMatchDescriptor.Builder entityBuilder = FL_EntityMatchDescriptor.newBuilder()
				.setProperties(null)
				.setTags(null);
		
		FL_EntityMatchDescriptor person1 = entityBuilder
			.setUid(UUID.randomUUID().toString())
			.setRole("Person 1")
			.setConstraint(null)
			.build();
		
		FL_EntityMatchDescriptor person2 = entityBuilder
			.setUid(UUID.randomUUID().toString())
			.setRole("Person 2")
			.setConstraint(null)
			.build();
		
		FL_EntityMatchDescriptor person3 = entityBuilder
			.setUid(UUID.randomUUID().toString())
			.setRole("Person 3")
			.setConstraint(null)
			.build();
		
		FL_EntityMatchDescriptor person4 = entityBuilder
			.setUid(UUID.randomUUID().toString())
			.setRole("Person 4")
			.setConstraint(null)
			.build();
		
		FL_EntityMatchDescriptor person5 = entityBuilder
			.setUid(UUID.randomUUID().toString())
			.setRole("Person 5")
			.setConstraint(null)
			.build();
		
		List<FL_EntityMatchDescriptor> entities = new ArrayList<FL_EntityMatchDescriptor>();
		entities.add(person1);
		entities.add(person2);
		entities.add(person3);
		entities.add(person4);
		entities.add(person5);
		
		double X = 100.0;
		
		FL_PropertyMatchDescriptor amountEquals = FL_PropertyMatchDescriptor.newBuilder()
				.setKey(FL_PropertyTag.AMOUNT.name())
				.setConstraint(null)
				.setRange(SingletonRangeHelper.from(X))
				.build();				
		
		FL_PropertyMatchDescriptor amountLessThan = FL_PropertyMatchDescriptor.newBuilder()
				.setKey(FL_PropertyTag.AMOUNT.name())
				.setConstraint(null)
				.setRange(SingletonRangeHelper.from(X))
				.build();				
		
		FL_LinkMatchDescriptor.Builder linkBuilder = FL_LinkMatchDescriptor.newBuilder()
				.setLinkTypes(null)
				.setRole(null)
				.setConstraint(null);
		
		FL_LinkMatchDescriptor link12 = linkBuilder
			.setUid(UUID.randomUUID().toString())
			.setSource(person1.getUid())
			.setTarget(person2.getUid())
			.setProperties(Collections.singletonList(amountEquals))
			.setConstraint(null)
			.build();
		
		FL_LinkMatchDescriptor link13 = linkBuilder
			.setUid(UUID.randomUUID().toString())
			.setSource(person1.getUid())
			.setTarget(person3.getUid())
			.setProperties(Collections.singletonList(amountEquals))
			.setConstraint(null)
			.build();
		
		FL_LinkMatchDescriptor link14 = linkBuilder
			.setUid(UUID.randomUUID().toString())
			.setSource(person1.getUid())
			.setTarget(person4.getUid())
			.setProperties(Collections.singletonList(amountEquals))
			.setConstraint(null)
			.build();
		
		FL_LinkMatchDescriptor link25 = linkBuilder
			.setUid(UUID.randomUUID().toString())
			.setSource(person2.getUid())
			.setTarget(person5.getUid())
			.setProperties(Collections.singletonList(amountLessThan))
			.setConstraint(null)
			.build();
		
		FL_LinkMatchDescriptor link35 = linkBuilder
			.setUid(UUID.randomUUID().toString())
			.setSource(person3.getUid())
			.setTarget(person5.getUid())
			.setProperties(Collections.singletonList(amountLessThan))
			.setConstraint(null)
			.build();
		
		FL_LinkMatchDescriptor link45 = linkBuilder
			.setUid(UUID.randomUUID().toString())
			.setSource(person4.getUid())
			.setTarget(person5.getUid())
			.setProperties(Collections.singletonList(amountLessThan))
			.setConstraint(null)
			.build();

		List<FL_LinkMatchDescriptor> links = new ArrayList<FL_LinkMatchDescriptor>();
		links.add(link12);
		links.add(link13);
		links.add(link14);
		links.add(link25);
		links.add(link35);
		links.add(link45);
		
		FL_PatternDescriptor descriptor = FL_PatternDescriptor.newBuilder()
			.setUid(UUID.randomUUID().toString())
			.setName("Obfuscated Money Flow")
			.setDescription("")
			.setEntities(entities)
			.setLinks(links)
			.build();
		System.out.println(PatternDescriptorHelper.toJson(descriptor));
	}

}
