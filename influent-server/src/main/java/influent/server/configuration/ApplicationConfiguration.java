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

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.*;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import oculus.aperture.spi.common.Properties;

import influent.idl.*;
import influent.server.utilities.PropertyField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;


//------------------------------------------------------------------------------------------------------------------

/**
 *
 * Reads data schemas from an xml file and provides them in object form.
 *
 */

public class ApplicationConfiguration implements PropertyField.Provider {

	private static ApplicationConfiguration _instance;

	private static final Logger s_logger = LoggerFactory.getLogger(ApplicationConfiguration.class);
	private static final String ENTITY_ROOT = "entities";
	private static final String LINK_ROOT = "links";
	private static final String DEFAULT_PROPERTY_DESCRIPTOR_FILE = "property-config.xml";
	private static final String DEFAULT_SYSTEM_CONFIGURATION_FILE = "database-config.xml";

	private static Properties _config;

	private static FL_PropertyDescriptors _entityDescriptors;
	private static FL_PropertyDescriptors _linkDescriptors;
	private static Map<String, List<PropertyField>> _propertyCompositions;

	private static DatabaseConfig _databaseConfig;

	//------------------------------------------------------------------------------------------------------------------

	/**
	 * A list of the property keys that are required by the configuration system.
	 */
	static public enum SystemPropertyKey {
		FIN_ENTITY,                     // For nodes: the name of the fin entity table
		FIN_ENTITY_PROPERTIES,
		FIN_ENTITY_BUCKETS,
		FIN_ENTITY_DAILY,               // For nodes: the name of the fin entity daily table
		FIN_ENTITY_WEEKLY,              // For nodes: the name of the fin entity weekly table
		FIN_ENTITY_MONTHLY,             // For nodes: the name of the fin entity monthly table
		FIN_ENTITY_QUARTERLY,           // For nodes: the name of the fin entity quarterly table
		FIN_ENTITY_YEARLY,              // For nodes: the name of the fin entity yearly table
		ENTITY_ID,                      // For nodes: the name of the entity id column in the fin entity tables
		INBOUND_AMOUNT,                 // For nodes: the name of the inbound amount column in the fin entity tables
		INBOUND_DEGREE,                 // For nodes: the name of the inbound degree column in the fin entity tables
		UNIQUE_INBOUND_DEGREE,
		OUTBOUND_AMOUNT,                // For nodes: the name of the outbound amount column in the fin entity tables
		OUTBOUND_DEGREE,                // For nodes: the name of the outbound degree column in the fin entity tables
		UNIQUE_OUTBOUND_DEGREE,
		BALANCE,                        // For nodes: the name of the balance column in the fin entity tables
		NUM_TRANSACTIONS,
		START_DATE,
		END_DATE,
		MAX_TRANSACTION,
		AVG_TRANSACTION,
		FIN_FLOW,                       // For links: the name of the fin flow table
		FIN_FLOW_BUCKETS,
		FIN_FLOW_DAILY,                 // For links: the name of the fin flow daily table
		FIN_FLOW_WEEKLY,                // For links: the name of the fin flow weekly table
		FIN_FLOW_MONTHLY,               // For links: the name of the fin flow monthly table
		FIN_FLOW_QUARTERLY,             // For links: the name of the fin flow quarterly table
		FIN_FLOW_YEARLY,                // For links: the name of the fin flow yearly table
		FIN_LINK,						// For links: the name of the raw transactions table
		FROM_ENTITY_ID,                 // For links: the name of the from entity id column in the fin flow tables
		FROM_ENTITY_TYPE,               // For links: the name of the from entity type column in the fin flow tables
		TO_ENTITY_ID,                   // For links: the name of the to entity id column in the fin flow tables
		TO_ENTITY_TYPE,                 // For links: the name of the to entity type column in the fin flow tables
		FIRST_TRANSACTION,
		LAST_TRANSACTION,
		AMOUNT,                         // For links: the name of the amount column in the fin flow tables
		PERIOD_DATE,                    // For nodes and links: the name of the period date column in the fin tables
		DATA_SUMMARY,
		SUMMARY_ORDER,
		SUMMARY_KEY,
		SUMMARY_LABEL,
		SUMMARY_VALUE,
		CLUSTER_SUMMARY,
		CLUSTER_SUMMARY_ENTITY_ID,
		CLUSTER_SUMMARY_SUMMARY_ID,
		CLUSTER_SUMMARY_PROPERTY,
		CLUSTER_SUMMARY_TAG,
		CLUSTER_SUMMARY_TYPE,
		CLUSTER_SUMMARY_VALUE,
		CLUSTER_SUMMARY_STAT,
		CLUSTER_SUMMARY_MEMBERS,
		CLIENT_STATE
	}

	//------------------------------------------------------------------------------------------------------------------

	/**
	 * A list of the column types that are required by the configuration system.
	 */
	static public enum SystemColumnType {
		STRING,
		DOUBLE,
		FLOAT,
		INTEGER,
		DATE,
		BOOLEAN,
		HEX // binary/raw referred to locally in hex without the 0x prefix, like '7D'
	}

	//------------------------------------------------------------------------------------------------------------------

	private ApplicationConfiguration() {}

	public static ApplicationConfiguration getInstance(Properties config) {
		if (_instance == null) {
			_instance = new ApplicationConfiguration();
			_config = config;
			_init();
		}

		return _instance;
	}
	//------------------------------------------------------------------------------------------------------------------

	@Override
	public boolean isCompositeProperty(String key) {
		return _propertyCompositions.containsKey(key);
	}

	//------------------------------------------------------------------------------------------------------------------

	@Override
	public List<PropertyField> getFields(String key) {
		return _propertyCompositions.get(key);
	}

	//------------------------------------------------------------------------------------------------------------------

	@Override
	public PropertyField getField(String key, String name) {
		List<PropertyField> list = getFields(key);

		if (list != null) {
			for (PropertyField pf : list) {
				if (pf.getName().equals(name)) {
					return pf;
				}
			}
		}
		return null;
	}

	//------------------------------------------------------------------------------------------------------------------

	public FL_PropertyDescriptors getEntityDescriptors() {
		return _entityDescriptors;
	}

	public FL_PropertyDescriptors getLinkDescriptors() {
		return _linkDescriptors;
	}

	public DatabaseConfig getDatabaseConfig() {
		return _databaseConfig;
	}

	public boolean hasMultipleEntityTypes() { return _entityDescriptors.getTypes().size() > 1; }
	public boolean hasMultipleLinkTypes() { return _linkDescriptors.getTypes().size() > 1; }

		//------------------------------------------------------------------------------------------------------------------

	private static void _init() {

		_entityDescriptors = FL_PropertyDescriptors.newBuilder().build();
		_linkDescriptors = FL_PropertyDescriptors.newBuilder().build();
		_propertyCompositions = new HashMap<String, List<PropertyField>>();
		_databaseConfig = new DatabaseConfig();

		try {
			_populateDescriptors(ENTITY_ROOT, _entityDescriptors);
			_populateDescriptors(LINK_ROOT, _linkDescriptors);
			_populateApplicationSchema();
			
		} catch (Exception e) {
			s_logger.error("Error parsing definition file", e);
		}
	}

	//------------------------------------------------------------------------------------------------------------------
	private static Element _getDocumentRoot(String filename) {
		Element docElement = null;

		try {
			// Open xml file for parsing
			File fXmlFile;
			fXmlFile = new File(filename);
			if (!fXmlFile.exists()) {
				URL fileURL = ApplicationConfiguration.class.getResource("/" + filename);
				if (fileURL == null) {
					throw new IOException("could not find file " + "./conf/" + filename + " or " + "/" + filename);
				}
				fXmlFile = new File(fileURL.getFile());
			}

			DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
			DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
			Document doc = dBuilder.parse(fXmlFile);

			docElement = doc.getDocumentElement();
			docElement.normalize();
		} catch (Exception e) {
			s_logger.error("Error parsing definition file " + filename, e);
		}

		return docElement;
	}


	private static void _populateDescriptors(String rootTagName, FL_PropertyDescriptors descriptors) {

		Element docRoot = _getDocumentRoot(_config.getString("influent.midtier.property.configfile", DEFAULT_PROPERTY_DESCRIPTOR_FILE));
		Element root = _getFirstElementFromTagName(docRoot, rootTagName);
		String rootName = root.getTagName();

		// -- Types ------------------------------------------------------------------------------------------------
		List<FL_TypeDescriptor> typeList = new ArrayList<FL_TypeDescriptor>();
		for (Element t : _getElementsFromTagName(root, "type")) {

			String groupId = t.getAttribute("group");
			String groupName = "";
			boolean isExclusive = false;

			// Look up the group attribute
			for (Element group : _getElementsFromTagName(root, "group")) {

				if (group.getAttribute("key").equals(groupId)) {
					groupName = group.getAttribute("friendlyText");
					if (groupName == null || groupName.isEmpty())
						groupName = groupId;
					isExclusive = group.getAttribute("exclusive").equals("true");
					break;
				}
			}

			FL_TypeDescriptor typeDesc = FL_TypeDescriptor.newBuilder()
				.setKey(t.getAttribute("key"))
				.setFriendlyText(t.getAttribute("friendlyText"))
				.setGroup(groupName)
				.setExclusive(isExclusive)
				.setNamespace(t.getAttribute("namespace"))
				.build();

			typeList.add(typeDesc);
		}

		List<FL_PropertyDescriptor> propertyList = new ArrayList<FL_PropertyDescriptor>();
		for (Element p : _getElementsFromTagName(root, "property")) {

			String dataType = p.getAttribute("dataType");

			FL_PropertyType ptype = FL_PropertyType.STRING;
			if (dataType != null) {
				try {
					ptype = FL_PropertyType.valueOf(dataType.toUpperCase());
				} catch (Exception e) {
					s_logger.error("unrecognized data type: "+ dataType +", defaulting to string.");
				}
			}

			String lodStr = p.getAttribute("levelOfDetail");

			FL_LevelOfDetail lod = FL_LevelOfDetail.FULL;
			if (lodStr != null) {
				if (lodStr.equalsIgnoreCase("KEY")) {
					lod = FL_LevelOfDetail.KEY;
				} else if (lodStr.equalsIgnoreCase("SUMMARY")) {
					lod = FL_LevelOfDetail.SUMMARY;
				} else if  (lodStr.equalsIgnoreCase("HIDDEN")) {
					lod = FL_LevelOfDetail.HIDDEN;
				}
			}

			String indexedStr = p.getAttribute("searchableBy");

			FL_SearchableBy indexed = FL_SearchableBy.DESCRIPTOR;
			if (indexedStr != null) {
				if (indexedStr.equalsIgnoreCase("freeText")) {
					indexed = FL_SearchableBy.FREE_TEXT;
				} else if (indexedStr.equalsIgnoreCase("none")) {
					indexed = FL_SearchableBy.NONE;
				}
			}

			String key = p.getAttribute("key");
			String friendly = p.getAttribute("friendlyText");
			if (friendly == null || friendly.isEmpty()) {
				friendly = key;
			}

			String sortable = p.getAttribute("sortable");
			if (sortable == null || sortable.isEmpty()) {
				sortable = "true";
			}

			String multiValue = p.getAttribute("multiValue");
			if (multiValue == null || multiValue.isEmpty()) {
				multiValue = "false";
			}

			List<FL_PropertyTag> tags = new ArrayList<FL_PropertyTag>();
			for (Element tagsElement : _getElementsFromTagName(p, "tags")) {
				for (Element tagElement : _getElementsFromTagName(tagsElement, "tag")) {
					String tagName = tagElement.getTextContent();
					FL_PropertyTag tag = FL_PropertyTag.valueOf(tagName);
					if (tag != null) {
						tags.add(tag);
					}
				}
			}
			FL_PropertyTag mirrorTag = null;

			// mirror these for mostly legacy purposes
			if (key.equals(FL_RequiredPropertyKey.NAME.name())) {
				mirrorTag = FL_PropertyTag.NAME;

			} else if (key.equals(FL_RequiredPropertyKey.AMOUNT.name())) {
				mirrorTag = FL_PropertyTag.AMOUNT;

			} else if (key.equals(FL_RequiredPropertyKey.ID.name())) {
				mirrorTag = FL_PropertyTag.ID;

			} else if (key.equals(FL_RequiredPropertyKey.FROM.name())
					|| key.equals(FL_RequiredPropertyKey.TO.name())) {
				mirrorTag = FL_PropertyTag.ENTITY;

			} else if (ptype.equals(FL_PropertyType.DATE)) {
				mirrorTag = FL_PropertyTag.DATE;

			}

			if (mirrorTag != null && !tags.contains(mirrorTag)) {
				tags.add(mirrorTag);
			}

			List<FL_TypeMapping> typeMappings = new ArrayList<FL_TypeMapping>();
			FL_PropertyDescriptor propDesc = FL_PropertyDescriptor.newBuilder()
					.setKey(key)
					.setFriendlyText(friendly)
					.setSearchableBy(indexed)
					.setPropertyType(ptype)
					.setLevelOfDetail(lod)
					.setRange(FL_RangeType.SINGLETON)
					.setConstraint(FL_Constraint.FUZZY_PARTIAL_OPTIONAL)
					.setMemberOf(typeMappings)
					.setTags(tags)
					.setSortable(Boolean.valueOf(sortable))
					.setMultiValue(Boolean.valueOf(multiValue))
				.build();

			// handle any non-primitives
			if (ptype.equals(FL_PropertyType.GEO)) {
				tags.add(FL_PropertyTag.GEO);

				List<Element> fieldElements = _getElementsFromTagName(p, "field");
				if (fieldElements.size() != 0) {
					List<PropertyField> fields = new ArrayList<PropertyField>();

					for (Element a : fieldElements) {
						fields.add(
								new PropertyField(
								a.getAttribute("name"),
								a.getAttribute("key"),
								Boolean.valueOf(a.getAttribute("searchable"))
								)
						);
					}
					_propertyCompositions.put(key, fields);

				} else {
					s_logger.error("non-primitive data type: "+ ptype +" has no source fields defined.");
				}
			}

			// Parse the applicable types
			List<Element> memberOfElements = _getElementsFromTagName(p, "memberOf");
			if (memberOfElements.size() != 0) {
				for (Element a : memberOfElements) {

					FL_TypeMapping typeMapping = FL_TypeMapping.newBuilder()
							.setType(a.getAttribute("typeKey"))
							.setMemberKey(a.getAttribute("memberKey"))
							.build();

					typeMappings.add(typeMapping);
				}

				// if none specified interpret as applying to all, with the same key unless otherwise specified
			} else {
				String memberKey = p.getAttribute("memberKey");
				if (memberKey.isEmpty()) {
					memberKey = key;
				}

				for (FL_TypeDescriptor type : typeList) {
					FL_TypeMapping typeMapping = FL_TypeMapping.newBuilder()
							.setType(type.getKey())
							.setMemberKey(memberKey)
							.build();

					typeMappings.add(typeMapping);
				}
			}

			propertyList.add(propDesc);

			if (rootName.equalsIgnoreCase(ENTITY_ROOT) && propDesc.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.ID.name())) {
				propertyList.add(FL_PropertyDescriptor.newBuilder()
						.setKey(FL_RequiredPropertyKey.ENTITY.name())
						.setFriendlyText("Influent Account")
						.setSearchableBy(FL_SearchableBy.DESCRIPTOR)
						.setPropertyType(propDesc.getPropertyType())
						.setLevelOfDetail(FL_LevelOfDetail.HIDDEN)
						.setRange(FL_RangeType.SINGLETON)
						.setConstraint(FL_Constraint.FUZZY_PARTIAL_OPTIONAL)
						.setMemberOf(propDesc.getMemberOf())
						.setTags(new ArrayList<FL_PropertyTag>())
						.setSortable(propDesc.getSortable())
						.build()
				);
			} else if (rootName.equalsIgnoreCase(LINK_ROOT) && propDesc.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.FROM.name())) {
				List<FL_TypeMapping> emptyTypeMapping = new ArrayList<FL_TypeMapping>();
				for (FL_TypeDescriptor type : typeList) {
					FL_TypeMapping typeMapping = FL_TypeMapping.newBuilder()
						.setType(type.getKey())
						.setMemberKey("")
						.build();

					emptyTypeMapping.add(typeMapping);
				}
				propertyList.add(FL_PropertyDescriptor.newBuilder()
						.setKey(FL_RequiredPropertyKey.ENTITY.name())
						.setFriendlyText("Influent Account")
						.setSearchableBy(FL_SearchableBy.DESCRIPTOR)
						.setPropertyType(propDesc.getPropertyType())
						.setLevelOfDetail(FL_LevelOfDetail.HIDDEN)
						.setRange(FL_RangeType.SINGLETON)
						.setConstraint(FL_Constraint.FUZZY_PARTIAL_OPTIONAL)
						.setMemberOf(emptyTypeMapping)
						.setTags(new ArrayList<FL_PropertyTag>())
						.setSortable(false)
						.build()
				);
			} else if (rootName.equalsIgnoreCase(LINK_ROOT) && propDesc.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.TO.name())) {
				List<FL_TypeMapping> emptyTypeMapping = new ArrayList<FL_TypeMapping>();
				for (FL_TypeDescriptor type : typeList) {
					FL_TypeMapping typeMapping = FL_TypeMapping.newBuilder()
						.setType(type.getKey())
						.setMemberKey("")
						.build();

					emptyTypeMapping.add(typeMapping);
				}
				propertyList.add(FL_PropertyDescriptor.newBuilder()
						.setKey(FL_RequiredPropertyKey.LINKED.name())
						.setFriendlyText("Linked Influent Account")
						.setSearchableBy(FL_SearchableBy.DESCRIPTOR)
						.setPropertyType(propDesc.getPropertyType())
						.setLevelOfDetail(FL_LevelOfDetail.HIDDEN)
						.setRange(FL_RangeType.SINGLETON)
						.setConstraint(FL_Constraint.FUZZY_PARTIAL_OPTIONAL)
						.setMemberOf(emptyTypeMapping)
						.setTags(new ArrayList<FL_PropertyTag>())
						.setSortable(false)
						.build()
				);
			}
		}

		List<FL_OrderBy> sortList = null;
		for (Element o : _getElementsFromTagName(root, "defaultOrderBy")) {
			String key = o.getAttribute("propertyKey");
			String ascending = o.getAttribute("ascending");

			if (key != null) {
				if (sortList == null) {
					sortList = new ArrayList<FL_OrderBy>();
				}

				sortList.add(
					FL_OrderBy.newBuilder()
						.setPropertyKey(key)
						.setAscending("true".equalsIgnoreCase(ascending))
						.build());
			}
		}

		descriptors.setTypes(typeList);
		descriptors.setProperties(propertyList);
		descriptors.setOrderBy(sortList);

		Element searchHintNode = _getFirstElementFromTagName(root, "searchHint");
		if (searchHintNode != null) {
			descriptors.setSearchHint(searchHintNode.getTextContent());
		}
		Element groupByNode = _getFirstElementFromTagName(root, "groupByField");
		if (groupByNode != null) {
			descriptors.setGroupField(groupByNode.getAttribute("fieldName"));
		}

		for (Map.Entry<String,List<PropertyField>> entry : _propertyCompositions.entrySet()) {
			for (PropertyField field : entry.getValue()) {
				for (FL_PropertyDescriptor pd : propertyList) {
					if (pd.getKey().equals(field.getKey())) {
						field.setProperty(pd);
						break;
					}
				}
			}
		}
	}

	//------------------------------------------------------------------------------------------------------------------

	private static Element _getFirstElementFromTagName(Element root, String tag) {
		NodeList nodes = root.getElementsByTagName(tag);
		for (int i = 0; i < nodes.getLength(); i++){
			if (nodes.item(i).getNodeType() == Node.ELEMENT_NODE) {
				return (Element)nodes.item(i);
			}
		}

		return null;
	}

	//------------------------------------------------------------------------------------------------------------------

	private static List<Element> _getElementsFromTagName(Element root, String tag) {
		List<Element> elements = new ArrayList<Element>();
		NodeList nodes = root.getElementsByTagName(tag);
		if (nodes != null && nodes.getLength() > 0) {
			for (int i = 0; i < nodes.getLength(); i++) {
				if (nodes.item(i).getNodeType() == Node.ELEMENT_NODE) {
					elements.add((Element) nodes.item(i));
				}
			}
		}
		return elements;
	}

	//------------------------------------------------------------------------------------------------------------------

	private static List<Element> _getChildElementsFromTagName(Element root, String tag) {
		List<Element> childElements = new ArrayList<Element>();
		Element taggedElement = _getFirstElementFromTagName(root, tag);
		if (taggedElement != null) {
			NodeList childNodes = taggedElement.getChildNodes();
			for (int i = 0; i < childNodes.getLength(); i++) {
				if (childNodes.item(i).getNodeType() == Node.ELEMENT_NODE) {
					childElements.add((Element) childNodes.item(i));
				}
			}
		}
		return childElements;
	}


	//------------------------------------------------------------------------------------------------------------------

	private static void _addColumnProperties(Element root, DataTableSchema schema) {
		for (Element element : _getChildElementsFromTagName(root, "columns")) {
			DataColumnProperty prop = new DataColumnProperty();
			prop.setKey(element.getAttribute("key"));

			List<Element> memberOfElements = _getElementsFromTagName(element, "memberOf");
			if (memberOfElements.size() != 0) {
				for (Element a : memberOfElements) {
					prop.setMemberKey(a.getAttribute("typeKey"), a.getAttribute("memberKey"));
					prop.setMemberType(a.getAttribute("typeKey"), a.getAttribute("memberType"));
				}
			} else {
				String memberKey = element.getAttribute("memberKey");
				if (memberKey.isEmpty()) {
					memberKey = schema.getKey();
				}
				prop.setMemberKey(memberKey);

				String memberType = element.getAttribute("memberType");
				if (memberType.isEmpty()) {
					prop.setMemberType(SystemColumnType.STRING);
				} else {
					prop.setMemberType(memberType);
				}
			}

			schema.addColumnProperty(prop);
		}
	}

	//------------------------------------------------------------------------------------------------------------------

	private static void _addTableProperties(Element root, DataTableSchema schema) {
		for (Element element : _getChildElementsFromTagName(root, "tables")) {
			DataTableProperty prop = new DataTableProperty();
			prop.setKey(element.getAttribute("key"));

			List<Element> memberOfElements = _getElementsFromTagName(element, "memberOf");
			if (memberOfElements.size() != 0) {
				for (Element a : memberOfElements) {
					prop.setMemberKey(a.getAttribute("typeKey"), a.getAttribute("memberKey"));
				}
			} else {
				String memberKey = element.getAttribute("memberKey");
				if (memberKey.isEmpty()) {
					memberKey = schema.getKey();
				}
				prop.setMemberKey(memberKey);
			}
			schema.addTableProperty(prop);
		}
	}

	//------------------------------------------------------------------------------------------------------------------

	private static void _populateApplicationSchema() {
		Element docRoot = _getDocumentRoot(_config.getString("influent.midtier.database.configfile", DEFAULT_SYSTEM_CONFIGURATION_FILE));

		for (Element schemaElement : _getElementsFromTagName(docRoot, "dataTableSchema")) {

			DataTableSchema schema = new DataTableSchema();
			String key = schemaElement.getAttribute("key");
			schema.setKey(key);

			_addColumnProperties(schemaElement, schema);
			_addTableProperties(schemaElement, schema);
			_databaseConfig.addDataTableSchema(schema);
		}
	}

	//------------------------------------------------------------------------------------------------------------------

	public String getTable(String schemaKey, String tableKey) {
		return getTable(null, schemaKey, tableKey);
	}




	public String getTable(String type, String schemaKey, String tableKey) {

		DataTableSchema schema = _databaseConfig.getDataTableSchemaByKey(schemaKey);
		if (schema == null) {
			return null;
		}

		DataTableProperty prop = schema.getTablePropertyByKey(tableKey);
		if (prop == null) {
			return null;
		}

		return prop.getMemberKey(type);
	}

	//------------------------------------------------------------------------------------------------------------------

	public String getColumn(String schemaKey, String columnKey) {
		return getColumn(null, schemaKey, columnKey);
	}




	public String getColumn(String type, String schemaKey, String columnKey) {

		DataTableSchema schema = _databaseConfig.getDataTableSchemaByKey(schemaKey);
		if (schema == null) {
			return null;
		}

		DataColumnProperty prop = schema.getColumnPropertyByKey(columnKey);
		if (prop == null) {
			return null;
		}

		return prop.getMemberKey(type);
	}

	//------------------------------------------------------------------------------------------------------------------

	public SystemColumnType getColumnType(String schemaKey, String columnKey) {
		return getColumnType(null, schemaKey, columnKey);
	}




	public SystemColumnType getColumnType(String type, String schemaKey, String columnKey) {

		DataTableSchema schema = _databaseConfig.getDataTableSchemaByKey(schemaKey);
		if (schema == null) {
			return null;
		}

		DataColumnProperty prop = schema.getColumnPropertyByKey(columnKey);
		if (prop == null) {
			return null;
		}

		return prop.getMemberType(type);
	}

	//------------------------------------------------------------------------------------------------------------------

	public String getIntervalTable(String schemaKey, FL_DateInterval interval) {
		return getIntervalTable(null, schemaKey, interval);
	}




	public String getIntervalTable(String type, String schemaKey, FL_DateInterval interval) {

		String tableName = null;
		switch (interval) {
			case DAYS : {
				if (schemaKey.equals(SystemPropertyKey.FIN_ENTITY_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_ENTITY_DAILY.name();
				} else if (schemaKey.equals(SystemPropertyKey.FIN_FLOW_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_FLOW_DAILY.name();
				}
				break;
			}
			case WEEKS : {
				if (schemaKey.equals(SystemPropertyKey.FIN_ENTITY_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_ENTITY_WEEKLY.name();
				} else if (schemaKey.equals(SystemPropertyKey.FIN_FLOW_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_FLOW_WEEKLY.name();
				}
				break;
			}
			case MONTHS : {
				if (schemaKey.equals(SystemPropertyKey.FIN_ENTITY_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_ENTITY_MONTHLY.name();
				} else if (schemaKey.equals(SystemPropertyKey.FIN_FLOW_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_FLOW_MONTHLY.name();
				}
				break;
			}
			case QUARTERS : {
				if (schemaKey.equals(SystemPropertyKey.FIN_ENTITY_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_ENTITY_QUARTERLY.name();
				} else if (schemaKey.equals(SystemPropertyKey.FIN_FLOW_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_FLOW_QUARTERLY.name();
				}
				break;
			}
			case YEARS : {
				if (schemaKey.equals(SystemPropertyKey.FIN_ENTITY_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_ENTITY_YEARLY.name();
				} else if (schemaKey.equals(SystemPropertyKey.FIN_FLOW_BUCKETS.name())) {
					tableName = SystemPropertyKey.FIN_FLOW_YEARLY.name();
				}
				break;
			}
			default:
				break;
		}

		if (tableName == null) {
			return null;
		}

		return getTable(type, schemaKey, tableName);
	}
}
