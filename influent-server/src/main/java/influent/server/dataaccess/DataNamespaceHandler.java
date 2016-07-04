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
package influent.server.dataaccess;

import influent.server.configuration.ApplicationConfiguration;
import org.joda.time.DateTime;

import java.util.List;
import java.util.Map;

public interface DataNamespaceHandler {

	/**
	 * Creates a globally unique entity id given a local entity id and a namespace.
	 * The default implementation here simply returns the typed local entity id.
	 * An example override might look like this:
	 * <code>
	 * 		return namespace + "." + entityType + "." + localEntityId;
	 * </code>
	 *
	 * @param entityClass
	 * 		the type of entity : see influent.server.utilities.TypedId types
	 * 
	 * @param entityType
	 * 		the namespace the entity belongs to
	 * 
	 * @param localEntityId
	 * 		the entity id as it exists in the data store
	 * 
	 * @return
	 * 		a globally unique id used for reference in the system
	 */
	public String globalFromLocalEntityId(char entityClass, String entityType, String localEntityId);




	/**
	 * Creates a typed entity id given a local entity id and an entity type.
	 * The default implementation here simply returns the typed local entity id.
	 * An example override might look like this:
	 * <code>
	 * 		return entityType + "." + localEntityId;
	 * </code>
	 *
	 * @param entityType
	 * 		the namespace the entity belongs to
	 *
	 * @param localEntityId
	 * 		the entity id as it exists in the data store
	 *
	 * @return
	 * 		a typed id
	 */
	public String typedFromLocalEntityId(String entityType, String localEntityId);




	/**
	 * Translates an entity id from global to local namespace for querying in
	 * the Data View. The default implementation returns the local id.
	 * 
	 * An example override might look like this:
	 * <code>
	 *     final int i = globalEntityId.indexOf('.');
	 *
	 *     if (i >= 0) {
	 *         return TypedId.fromTypedId(globalEntityId.substring(i+1)).getNativeId();
	 *     }
	 *     return super.localFromGlobalEntityId(globalEntityId);
	 * </code>
	 * 
	 * @param globalEntityId
	 * 		the globally unique entity id
	 * 
	 * @return
	 * 		the entity id as it exists in the data store
	 */
	public String localFromGlobalEntityId(String globalEntityId);




	/**
	 * Translates an entity id from global to typed for querying multi-type
	 * entities in the Data View. The default implementation returns the typed id.
	 *
	 * @param globalEntityId
	 * 		the globally unique entity id
	 *
	 * @return
	 * 		a typed id
	 */
	public String typedFromGlobalEntityId(String globalEntityId);




	/**
	 * Creates a globally unique entity id given a typed entity id and an entityClass.
	 * The default implementation here simply returns the typed local entity id.
	 * An example override might look like this:
	 * <code>
	 * 		return entityClass + "." + typedEntityId;
	 * </code>
	 *
	 * @param entityClass
	 * 		the type of entity : see influent.server.utilities.TypedId types
	 *
	 * @param typedEntityId
	 * 		the typed entity id
	 *
	 * @return
	 * 		a globally unique id used for reference in the system
	 */
	public String globalFromTypedEntityId(char entityClass, String typedEntityId);




	/**
	 * Translates an entity id from typed to local namespace for querying in
	 * the Data View.
	 *
	 * @param typedEntityId
	 * 		the typed entity id
	 *
	 * @return
	 * 		the entity id as it exists in the data store
	 */
	public String localFromTypedEntityId(String typedEntityId);




	/**
	 * Extracts and returns the entity type from a global entity id, typically formed
	 * by a call to createGlobalEntityId. The default implementation here returns
	 * null.
	 * 
	 * An example override might look like this:
	 * <code>
	 *     final int i = globalEntityId.indexOf('.');
	 *
	 *     if (i >= 0) {
	 *         return globalEntityId.substring(0, i);
	 *     }
	 *     return super.namespaceFromGlobalEntityId(globalEntityId);
	 * </code>
	 * 
	 * @param globalEntityId
	 * 		the globally unique entity id
	 * 
	 * @return
	 */
	public String entityTypeFromGlobalEntityId(String globalEntityId);




	/**
	 * Extracts and returns the entity type from a typed entity id
	 *
	 * @param typedEntityId
	 * 		the typed entity id
	 *
	 * @return
	 */
	public String entityTypeFromTypedEntityId(String typedEntityId);




	/**
	 * Localizes and organizes entities by namespace
	 */
	public Map<String, List<String>> entitiesByType(List<String> entities);




	/**
	 * Creates a temp table name in a db specific manner. This method is 
	 * provided for convenience.
	 */
	public String createTempTable(String tableName, String spec);




	/**
	 * Returns a temp table name in a db specific manner. This method is 
	 * provided for convenience.
	 */
	public String tempTableName(String tableName);




	/**
	 * Sets a row limit in a db specific manner. This method is 
	 * provided for convenience.
	 * 
	 * @param selectBody
	 * 		the body of the select statement, minus the leading select keyword itself
	 * @returns
	 * 		a full row limited statement, including the select keyword.
	 */
	public String rowLimit(String selectBody, long limit);




	/**
	 * Converts an influent string id to a SQL id.
	 * 
	 * @param id 
	 * 		the id to be converted
	 * @param type
	 * 		the type that
	 * @return
	 * 		the converted id
	 */
	public String toSQLId(String id, ApplicationConfiguration.SystemColumnType type);




	/**
	 * Converts a joda DateTime to a date string appropriate for queries
	 * in the context of a particular db. Note that this IS NOT synonymous
	 * with just a simple date format (eg OracleDataNameSpaceHandler)
	 * 
	 * @param date the date to format
	 * @return the SQL-friendly string corresponding to the input date
	 */
	public String formatDate(DateTime date);
}
