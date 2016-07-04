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
import influent.server.utilities.InfluentId;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author djonker
 *
 */
public abstract class AbstractDataNamespaceHandler implements DataNamespaceHandler {



	/**
	 * Constructs a handler which uses standard table names.
	 */
	public AbstractDataNamespaceHandler() {}
	
	
	
	
	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#globalFromLocalEntityId(java.lang.char, java.lang.String, java.lang.String)
	 */
	@Override
	public String globalFromLocalEntityId(char entityClass, String entityType, String localEntityId) {
		return InfluentId.fromNativeId(entityClass, entityType, localEntityId).getInfluentId();
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#typedFromLocalEntityId(java.lang.String, java.lang.String)
	 */
	@Override
	public String typedFromLocalEntityId(String entityType, String localEntityId) {
		return entityType + "." + localEntityId;
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#localFromGlobalEntityId(java.lang.String)
	 */
	@Override
	public String localFromGlobalEntityId(String globalEntityId) {
		return InfluentId.fromInfluentId(globalEntityId).getNativeId();
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#typedFromGlobalEntityId(java.lang.String)
	 */
	@Override
	public String typedFromGlobalEntityId(String globalEntityId) {
		return InfluentId.fromInfluentId(globalEntityId).getTypedId();
	}





	/* (non-Javadoc)
	 * @see
	 */
	@Override
	public String globalFromTypedEntityId(char entityClass, String typedEntityId) {
		return null;
	}




	@Override
	public String localFromTypedEntityId(String typedEntityId) {
		return null;
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#namespaceFromGlobalEntityId(java.lang.String)
	 */
	@Override
	public String entityTypeFromGlobalEntityId(String globalEntityId) {
		return InfluentId.fromInfluentId(globalEntityId).getIdType();
	}




	@Override
	public String entityTypeFromTypedEntityId(String typedEntityId) {
		return null;
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#entitiesByNamespace(java.util.List)
	 */
	@Override
	public Map<String, List<String>> entitiesByType(List<String> entities) {
		Map<String, List<String>> entityTypes = new LinkedHashMap<String, List<String>>();
		
		// global to local conversion, organized by namespace.
		if (entities != null) {
			for (String id : entities) {
				final String entityType = entityTypeFromGlobalEntityId(id);
	
				// get the list of entities for this namespace.
				findOrCreateNamespace(entityType, entityTypes).add(id);
			}
		}

		return entityTypes;
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataNamespaceHandler#toSQLId(java.lang.String, java.lang.String)
	 */
	@Override
	public String toSQLId(String id, ApplicationConfiguration.SystemColumnType type) {
		String sqlId = id;
		if (type == ApplicationConfiguration.SystemColumnType.HEX) {
			sqlId = idToBinaryFromHex(id);
		}

		if (type == ApplicationConfiguration.SystemColumnType.STRING ||
			type == ApplicationConfiguration.SystemColumnType.HEX) {
			sqlId = "'" + sqlId + "'";
		}

		return sqlId;
	}
	

	
	/**
	 * Returns binary id sql from a hexadecimal string id. Called by toSQLId.
	 * 
	 * @param id
	 * @return
	 */
	protected abstract String idToBinaryFromHex(String id);




    /**
     * Returns binary-converted column sql. Called by toSQLIdColumn.
     *
     * @param columnName
     * @return
     */
    protected abstract String columnToHex(String columnName);




	/**
	 * Finds or creates a namespace in the existing map of namespaces.
	 */
	private List<String> findOrCreateNamespace(String namespace, Map<String, List<String>> namespaces) {
		List<String> ns = namespaces.get(namespace);

		if (ns == null) {
			ns = new ArrayList<String>();
			namespaces.put(namespace, ns);
		}
		
		return ns;
	}
}
