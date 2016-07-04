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
import java.util.Map;

public class DataTableProperty {
	String _key;
	Map<String, String> _memberKeyMap = new HashMap<String, String>();



	String getKey() {
		return _key;
	}




	void setKey(String key) {
		_key = key;
	}




	void setMemberKey(String memberKey) {
		setMemberKey(null, memberKey);
	}




	void setMemberKey(String type, String memberKey) {
		_memberKeyMap.put(type, memberKey);
	}




	String getMemberKey() {
		return getMemberKey(null);
	}




	String getMemberKey(String type) {

		if (_memberKeyMap.keySet().size() == 1 && _memberKeyMap.containsKey(null)) {
			return _memberKeyMap.get(null);
		}

		return _memberKeyMap.get(type);
	}
}
