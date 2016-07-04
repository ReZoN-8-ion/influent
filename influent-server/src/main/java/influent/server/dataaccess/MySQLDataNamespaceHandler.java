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

import org.joda.time.DateTime;


/**
 * @author djonker
 *
 */
public class MySQLDataNamespaceHandler extends AbstractDataNamespaceHandler {

	
	/**
	 * Constructs a handler which uses standard table names.
	 */
	public MySQLDataNamespaceHandler() {
		super();
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#createTempTable(java.lang.String, java.lang.String)
	 */
	@Override
	public String createTempTable(String tableName, String spec) {
		return "CREATE TEMPORARY TABLE "+ tempTableName(tableName) + " " + spec + "; ";
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#tempTableName(java.lang.String)
	 */
	@Override
	public String tempTableName(String tableName) {
		return tableName;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#rowLimit(java.lang.String, long)
	 */
	@Override
	public String rowLimit(String selectBody, long limit) {
		if (limit > 0) {
			return "select " + selectBody + " limit " + limit;
		}
		
		return "select " + selectBody;
	}



	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#formatDate(org.joda.time.DateTime)
	 */
	@Override
	public String formatDate(DateTime date) {
		return DataAccessHelper.format(date);
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.AbstractDataNamespaceHandler#idToBinaryFromHex(java.lang.String)
	 */
	@Override
	protected String idToBinaryFromHex(String id) {
		return "UNHEX('" + id + "')";
	}



	/* (non-Javadoc)
	 * @see influent.server.dataaccess.AbstractDataNamespaceHandler#columnToHex(java.lang.String)
	 */
	@Override
	protected String columnToHex(String columnName) {
		return "HEX('" + columnName + "') as " + columnName;
	}
}
