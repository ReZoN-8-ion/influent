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

import influent.idl.*;
import influent.idlhelper.SerializationHelper;
import oculus.aperture.spi.common.Properties;
import org.apache.avro.specific.SpecificRecord;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;


/**
 * Takes FL_* objects and converts them into JSON expected by the front-end 
 * 
 *
 */

public class UISerializationHelper {

	/**
	 * Deserializes list of order by instructions from UI.
	 * 
	 * @param list
	 * 		the list from the UI, typically a wrapper over a json object.
	 * @param defaultOrderBy
	 * 		the default ordering or null if the order by list should be null when unspecified.
	 * @return
	 * 		the list of order by instructions or null if unspecified and no default.
	 */
	public static List<FL_OrderBy> fromUI(Iterable<Properties> list, FL_OrderBy defaultOrderBy) {
		final List<FL_OrderBy> orderBy = new ArrayList<FL_OrderBy>();

		if (list != null) {
			for (Properties orderByObj : list) {
				String orderKey = orderByObj.getString("propertyKey", null);
	
				if (orderKey != null && !orderKey.isEmpty()) {
					boolean orderAsc = orderByObj.getBoolean("ascending", false);
	
					orderBy.add(FL_OrderBy.newBuilder()
						.setPropertyKey(orderKey)
						.setAscending(orderAsc)
						.build());
				}
			}
		}
		
		if (orderBy.isEmpty()) {
			if (defaultOrderBy != null) {
				orderBy.add(defaultOrderBy);
			} else {
				return null;
			}
		}

		return orderBy;
	}
	
	/**
	 * Helper function to convert a map of objects into a proper {@link JSONObject}.
	 * This helps to make sure the mapped objects are properly turned into JSONObjects as well. 
	 * @param map
	 * @return
	 * @throws JSONException
	 */
	public static JSONObject toUIJson(Map<?, ?> map) throws JSONException {
		JSONObject ret = new JSONObject();
		for (Entry<?, ?> entry : map.entrySet()) {
			Object o = entry.getValue();
			String key = entry.getKey().toString();
			if (o instanceof Map) {
				ret.put(key, toUIJson((Map<?, ?>)o));
			}
			else if (o instanceof List) {
				ret.put(key, toUIJson((List<?>)o));
			}
			else if (o instanceof FL_Cluster) {
				ret.put(key, toUIJson((FL_Cluster)o));
			}
			else if (o instanceof FL_Entity) {
				ret.put(key, toUIJson((FL_Entity)o));
			}
			else if (o instanceof FL_Link) {
				ret.put(key, toUIJson((FL_Link)o));
			}
			else if (o instanceof FL_Property) {
				JSONObject obj = toUIJson((FL_Property) o);
				if (obj != null) {
					ret.put(key, obj);
				}
			}
			else if (o instanceof FL_PropertyDescriptor) {
				ret.put(key, toUIJson((FL_PropertyDescriptor)o));
			}
			else if (o instanceof SpecificRecord) {
				try {
					ret.put(key, new JSONObject(SerializationHelper.toJson(o, ((SpecificRecord) o).getSchema())));
				}
				catch (IOException e) {
					throw new JSONException(e);
				}
			}
			else {
				ret.put(key, o);
			}
		}
		return ret;
	}
	
	/**
	 * Helper function to convert a list of objects into a proper {@link JSONObject}.
	 * This helps to make sure the list contents are properly turned into JSONObjects as well. 
	 * @param list
	 * @return
	 * @throws JSONException
	 */
	public static JSONArray toUIJson(List<?> list) throws JSONException {
		JSONArray ret = new JSONArray();
		for (Object o : list) {
			if (o instanceof Map) {
				ret.put(toUIJson((Map<?,?>)o));
			}
			else if (o instanceof List) {
				ret.put(toUIJson((List<?>)o));
			}
			else if (o instanceof FL_Cluster) {
				ret.put(toUIJson((FL_Cluster)o));
			}
			else if (o instanceof FL_Entity) {
				ret.put(toUIJson((FL_Entity)o));
			}
			else if (o instanceof FL_Link) {
				ret.put(toUIJson((FL_Link)o));
			}
			else if (o instanceof FL_Property) {
				JSONObject obj = toUIJson((FL_Property) o);
				if (obj != null) {
					ret.put(obj);
				}
			}
			else if (o instanceof FL_PropertyDescriptor) {
				ret.put(toUIJson((FL_PropertyDescriptor)o));
			}
			else if (o instanceof SpecificRecord) {
				try {
					ret.put(new JSONObject(SerializationHelper.toJson(o, ((SpecificRecord) o).getSchema())));
				}
				catch (IOException e) {
					throw new JSONException(e);
				}
			}
			else {
				ret.put(o);
			}
		}
		
		return ret;
	}
	
	public static JSONObject toUIJson(FL_Cluster cluster) throws JSONException {
		JSONObject fle = new JSONObject();
		
		fle.put("uid", cluster.getUid());
		
		String entityType = "entity_cluster";
		if (cluster.getTags().contains(FL_EntityTag.CLUSTER_SUMMARY)) {
			entityType = "cluster_summary";
		} else if (cluster.getTags().contains(FL_EntityTag.ACCOUNT_OWNER)) {
			entityType = "account_owner";
		}
		
		fle.put("isRoot", cluster.getParent() == null);
		fle.put("entitytype", entityType);
		fle.put("entitytags", cluster.getTags());
		fle.put("members", cluster.getMembers());
		fle.put("subclusters", cluster.getSubclusters());
		
		if (cluster.getUncertainty() != null) {
			fle.put("uncertainty", new JSONObject(cluster.getUncertainty().toString()));
		}
		
		if (cluster.getTags().contains(FL_EntityTag.PROMPT_FOR_DETAILS)) {
			fle.put("promptForDetails", true);
		}
		
		JSONObject props = new JSONObject();
		fle.put("properties", props);

		for (FL_Property prop : cluster.getProperties()) {
			try {
				JSONObject obj = toUIJson(prop);
				if (obj != null) {
					props.put(prop.getKey(), obj);
				}
			} catch (JSONException e) {		
			}
		}

		return fle;
	}
	
	public static JSONObject toUIJson(FL_Entity entity) throws JSONException {
		JSONObject fle = new JSONObject();

		fle.put("uid", entity.getUid());

		fle.put("type", entity.getType());

		fle.put("entitytype", "entity");
		fle.put("entitytags", entity.getTags());
		
		if (entity.getUncertainty() != null) {
			fle.put("uncertainty", new JSONObject(entity.getUncertainty().toString()));
		}
		
		if (entity.getTags().contains(FL_EntityTag.PROMPT_FOR_DETAILS)) {
			fle.put("promptForDetails", true);
		}
		
		JSONObject props = new JSONObject();
		fle.put("properties", props);
		
		for (int i = 0; i < entity.getProperties().size(); i++) {
			FL_Property prop = entity.getProperties().get(i);
			try {
				JSONObject obj = toUIJson(prop, i);
				if (obj != null) {
					props.put(prop.getKey(), obj);
				}
			} catch (JSONException e) {				
			}
		}
		
		return fle;
	}
	
	public static JSONObject toUIJson(FL_Property prop, int displayIndex) throws JSONException {
		JSONObject obj = toUIJson(prop);
		obj.put("displayOrder", displayIndex);
		return obj;
	}
	
	public static JSONObject toUIJson(FL_Property prop) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("friendlyText", prop.getFriendlyText());
		
		if (prop instanceof SpecificRecord) {
			if (prop.getRange() instanceof FL_SingletonRange) {
				Object value =((FL_SingletonRange)prop.getRange()).getValue();
				String valueType =((FL_SingletonRange)prop.getRange()).getType().name();
				
				if (value instanceof SpecificRecord) {
					value = new JSONObject(value.toString());
				}
				
				json.put("value", value);
				json.put("valueType", valueType);
				
			} else {
				json.put("range", new JSONObject(prop.getRange().toString()));
			}
		}

		json.put("key", prop.getKey());
		json.put("displayOrder", 0);
		json.put("uncertainty", prop.getUncertainty());
		json.put("isHidden", prop.getIsHidden());
		json.put("tags", prop.getTags());
		
		return json;
	}

	public static JSONObject toUIJson(FL_PropertyDescriptors flpds) throws JSONException {
		JSONObject jo = new JSONObject();

		List<FL_PropertyDescriptor> properties = flpds.getProperties();
		List<FL_TypeDescriptor> types = flpds.getTypes();
		List<FL_OrderBy> orderBy = flpds.getOrderBy();
		
		JSONArray propertyJSON = new JSONArray();
		if (properties != null) {
			for (FL_PropertyDescriptor pd : properties) {
				propertyJSON.put(toUIJson(pd));
			}
		}
		
		JSONArray typeJSON = new JSONArray();
		if (types != null) {
			for (FL_TypeDescriptor td : types) {
				typeJSON.put(toUIJson(td));
			}
		}
		
		JSONArray orderByJSON = new JSONArray();
		if (orderBy != null) {
			for (FL_OrderBy ob : orderBy) {
				orderByJSON.put(new JSONObject(ob.toString()));
			}
		}
		
		jo.put("properties", propertyJSON);
		jo.put("types", typeJSON);
		jo.put("orderBy", orderByJSON);
		jo.put("searchHint", flpds.getSearchHint());
		
		return jo;
	}
	
	public static JSONObject toUIJson(FL_PropertyDescriptor flpd) throws JSONException {
		// TODO: update client to accept these as is.
		final boolean defaultTerm = 
				!FL_SearchableBy.NONE.equals(flpd.getSearchableBy()) && 
				FL_LevelOfDetail.SUMMARY.ordinal() >= flpd.getLevelOfDetail().ordinal();
		final String searchableBy = flpd.getSearchableBy() != null ? flpd.getSearchableBy().name() : FL_SearchableBy.DESCRIPTOR.name();
		
		JSONObject jo = new JSONObject();
		jo.put("key", flpd.getKey());
		jo.put("friendlyText", flpd.getFriendlyText());
		jo.put("constraint",  flpd.getConstraint());
		jo.put("range", flpd.getRange());
		jo.put("defaultTerm", defaultTerm);
		jo.put("searchableBy", searchableBy);
		jo.put("propertyType",flpd.getPropertyType());
		jo.put("tags", flpd.getTags());
		jo.put("sortable", flpd.getSortable());

		JSONObject typeMappings = new JSONObject();
		jo.put("typeMappings", typeMappings);

		for (FL_TypeMapping desc : flpd.getMemberOf()) {
			try {
				typeMappings.put(desc.getType(), desc.getMemberKey());
			} catch (JSONException e) {
			}
		}

		JSONArray tags = new JSONArray();
		jo.put("tags", tags);

		for (FL_PropertyTag tag : flpd.getTags()) {
			tags.put(tag.name());
		}

		return jo;
	}

	public static JSONObject toUIJson(FL_TypeDescriptor td) throws JSONException {
		JSONObject jo = new JSONObject();
		jo.put("key", td.getKey());
		jo.put("friendlyText", td.getFriendlyText());
		jo.put("group", td.getGroup());
		jo.put("exclusive", td.getExclusive());
		return jo;
	}

	public static JSONObject toUIJson(FL_Link link) throws JSONException {
		JSONObject fll = new JSONObject();

		fll.put("uid", link.getUid());

		fll.put("source", link.getSource());
		if (link.getTarget().contains(",")) {
			fll.put("target", link.getTarget().split(","));
		} else {
			fll.put("target", link.getTarget());
		}

		fll.put("type", link.getType());

		JSONObject props = new JSONObject();
		JSONObject jprop = null;
		int i = 0;
		for (FL_Property prop : link.getProperties()) {
			try {
				jprop = toUIJson(prop);

				if (jprop == null) {
					continue;
				}

				jprop.put("displayOrder", i++);
				props.put(prop.getKey(), jprop);
			} catch (JSONException e) {				
			}
		}
		fll.put("properties", props);
		return fll;
	}
	
	public static List<String> buildListFromJson(JSONObject jsonObject, String listName) throws JSONException {
		JSONArray jsonArray = jsonObject.getJSONArray(listName);
		List<String> toReturn = new ArrayList<String>();
		for (int i = 0; i < jsonArray.length(); i++) {
			toReturn.add(jsonArray.getString(i));
		}
		return toReturn;
	}
}
