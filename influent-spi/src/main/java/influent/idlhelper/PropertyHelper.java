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
import influent.idl.FL_DistributionRange;
import influent.idl.FL_GeoData;
import influent.idl.FL_ListRange;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyDescriptor;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_PropertyType;
import influent.idl.FL_Provenance;
import influent.idl.FL_SingletonRange;
import influent.idl.FL_Uncertainty;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

public class PropertyHelper extends FL_Property {

	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		FL_PropertyType type,
		FL_Provenance provenance,
		FL_Uncertainty uncertainty,
		List<FL_PropertyTag> tags,
		Boolean isHidden
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(provenance);
		setUncertainty(uncertainty);
		setTags(tags);
		setIsHidden(isHidden);
		setRange(SingletonRangeHelper.from(value, type));
	}

	public PropertyHelper(
		String key,
		Object value,
		List<FL_PropertyTag> tags
	) {
		setKey(key);
		setFriendlyText(key.replaceAll("([a-z])([A-Z0-9])", "$1 $2").replace('_', ' '));
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setRange(SingletonRangeHelper.fromUnknown(value));
	}

	public PropertyHelper(
		String key,
		Object value,
		List<FL_PropertyTag> tags,
		Boolean isHidden
	) {
		setKey(key);
		setFriendlyText(key.replaceAll("([a-z])([A-Z0-9])","$1 $2").replace('_',' '));
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setIsHidden(isHidden);
		setRange(SingletonRangeHelper.fromUnknown(value));
	}
	
	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		List<FL_PropertyTag> tags
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setRange(SingletonRangeHelper.fromUnknown(value));
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		List<FL_PropertyTag> tags,
	    boolean isHidden
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setIsHidden(isHidden);
		setRange(SingletonRangeHelper.fromUnknown(value));
	}

	public PropertyHelper(
		String key,
		Object value,
		FL_PropertyTag tag
	) {
		this(key, value, Collections.singletonList(tag));
	}

	public PropertyHelper(
		String key,
		Object value,
		FL_PropertyTag tag,
	    Boolean isHidden
	) {
		this(key, value, Collections.singletonList(tag), isHidden);
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		FL_PropertyType type,
		FL_PropertyTag tag
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(new ArrayList<FL_PropertyTag>(2));
		setRange(SingletonRangeHelper.from(value, type));
		getTags().add(tag);
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		FL_PropertyType type,
		FL_PropertyTag tag,
	    Boolean isHidden
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(new ArrayList<FL_PropertyTag>(2));
		setRange(SingletonRangeHelper.from(value, type));
		getTags().add(tag);
		setIsHidden(isHidden);
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		FL_PropertyType type,
		List<FL_PropertyTag> tags
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setRange(SingletonRangeHelper.from(value, type));
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object value,
		FL_PropertyType type,
		List<FL_PropertyTag> tags,
		Boolean isHidden
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setIsHidden(isHidden);
		setRange(SingletonRangeHelper.from(value, type));
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object startValue,
		Object endValue,
		FL_PropertyType type,
		List<FL_PropertyTag> tags
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setRange(FL_BoundedRange.newBuilder().setStart(startValue).setEnd(endValue).setType(type));
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		Object startValue,
		Object endValue,
		FL_PropertyType type,
		List<FL_PropertyTag> tags,
	    Boolean isHidden
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(null);
		setUncertainty(null);
		setTags(tags);
		setIsHidden(isHidden);
		setRange(FL_BoundedRange.newBuilder().setStart(startValue).setEnd(endValue).setType(type));
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		FL_Provenance provenance,
		FL_Uncertainty uncertainty,
		List<FL_PropertyTag> tags,
		Object range
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(provenance);
		setUncertainty(uncertainty);
		setTags(tags);
		setRange(range);
	}

	public PropertyHelper(
		String key,
		String friendlyText,
		FL_Provenance provenance,
		FL_Uncertainty uncertainty,
		List<FL_PropertyTag> tags,
		Boolean isHidden,
		Object range
	) {
		setKey(key);
		setFriendlyText(friendlyText);
		setProvenance(provenance);
		setUncertainty(uncertainty);
		setTags(tags);
		setIsHidden(isHidden);
		setRange(range);
	}
	
	public static PropertyHelper from(FL_Property property) {
		if (property == null) return null;
		if (property instanceof PropertyHelper) return (PropertyHelper) property;
		
		return new PropertyHelper(
			property.getKey(),
			property.getFriendlyText(),
			property.getProvenance(),
			property.getUncertainty(),
			property.getTags(),
			property.getIsHidden(),
			property.getRange()
		);

	}

	public PropertyHelper(FL_PropertyTag tag, String value) {
		this(tag.name(), tag.name(), value, Collections.singletonList(tag));
	}

	public PropertyHelper(FL_PropertyTag tag, double value) {
		this(tag.name(), tag.name(), value, Collections.singletonList(tag));
	}
	
	public PropertyHelper(FL_PropertyTag tag, long value) {
		this(tag.name(), tag.name(), value, Collections.singletonList(tag));
	}

	public PropertyHelper(FL_PropertyTag tag, Date value) {
		this(tag.name(), tag.name(), value, Collections.singletonList(tag));
	}

	
	public PropertyHelper(String key, String friendlyText, String value, List<FL_PropertyTag> tags) {
		this(key, friendlyText, value, FL_PropertyType.STRING, tags);
	}

	public PropertyHelper(String key, String friendlyText, String value, List<FL_PropertyTag> tags, Boolean isHidden) {
		this(key, friendlyText, value, FL_PropertyType.STRING, tags, isHidden);
	}
	
	public PropertyHelper(String key, String friendlyText, double value, List<FL_PropertyTag> tags, Boolean isHidden) {
		this(key, friendlyText, value, FL_PropertyType.DOUBLE, tags, isHidden);
	}
	
	public PropertyHelper(String key, String friendlyText, Date date, List<FL_PropertyTag> tags, Boolean isHidden) {
		this(key, friendlyText, date!=null  ? date.getTime() : 0, FL_PropertyType.DATE, tags, isHidden);
	}
	
	public PropertyHelper(String key, String friendlyText, long value, List<FL_PropertyTag> tags, Boolean isHidden) {
		this(key, friendlyText, value, FL_PropertyType.LONG, tags, isHidden);
	}
	
	public PropertyHelper(String key, String friendlyText, int value, List<FL_PropertyTag> tags, Boolean isHidden) {
		this(key, friendlyText, value, FL_PropertyType.INTEGER, tags, isHidden);
	}
	
	public PropertyHelper(String key, String friendlyText, FL_GeoData value, List<FL_PropertyTag> tags, Boolean isHidden) {
		this(key, friendlyText, value, FL_PropertyType.GEO, tags, isHidden);
	}

	public static Object getValueByUnmappedKey(String key, List<FL_Property> props, List<FL_PropertyDescriptor> defns, String type) {
		key = PropertyDescriptorHelper.mapKey(key, defns, type);

		return getValue(getPropertyByKey(props, key));
	}

	public static FL_Property getPropertyByKey(List<FL_Property> props, String key) {
		if (props != null && key != null) {
			for (FL_Property prop : props) {
				if (prop.getKey().equalsIgnoreCase(key)) {
					return prop;
				}
			}
		}
		return null;
	}
	
	public static List<FL_Property> getPropertiesByTag(List<FL_Property> props, FL_PropertyTag tag) {
		List<FL_Property> filteredProps = new ArrayList<FL_Property>();
		if (props == null) {
			return filteredProps;
		}
		for (FL_Property prop : props) {
			if (prop.getTags().contains(tag)) {
				filteredProps.add(prop);
			}
		}
		return filteredProps;
	}

	public FL_PropertyType getType() {
		Object range = getRange();
		if (range instanceof FL_SingletonRange)
			return ((FL_SingletonRange)range).getType();
		else if (range instanceof FL_ListRange)
			return ((FL_ListRange)range).getType();
		else if (range instanceof FL_BoundedRange)
			return ((FL_BoundedRange)range).getType();
		else if (range instanceof FL_DistributionRange) 
			return ((FL_DistributionRange)range).getType();
		return null;
	}

	public Object getValue() {
		return getValue(this);
	}
	
	public static Object getValue(FL_Property prop) {
		if (prop != null) {
			Object range = prop.getRange();
			if (range == null) return null;
			
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
			else if (range instanceof FL_DistributionRange) {
				FL_DistributionRange dist = (FL_DistributionRange)range;
				return dist.getDistribution();
			}
		}
		
		return null;
	}

	public List<Object> getValues() {
		Object range = getRange();
		
		if (range != null) {
			if (range instanceof FL_SingletonRange) {
				return Collections.singletonList(((FL_SingletonRange)range).getValue());
			}
			else if (range instanceof FL_ListRange) {
				return ((FL_ListRange)range).getValues();
			}
			else if (range instanceof FL_BoundedRange) {
				FL_BoundedRange bounded = (FL_BoundedRange)range;
				return Arrays.asList(bounded.getStart(), bounded.getEnd());
			}
			else if (range instanceof FL_DistributionRange) {
				FL_DistributionRange dist = (FL_DistributionRange)range;
				List<Object> values = new ArrayList<Object>(dist.getDistribution().size());
				values.addAll(dist.getDistribution());
				return values;
			}
		}
		
		return Collections.emptyList();
	}

	public boolean hasTag(FL_PropertyTag tag) {
		return getTags().contains(tag);
	}

	public boolean hasValue() {
		return getValue() != null;
	}
}
