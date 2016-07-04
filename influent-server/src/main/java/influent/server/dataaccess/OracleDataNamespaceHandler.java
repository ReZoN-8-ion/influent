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
public class OracleDataNamespaceHandler extends AbstractDataNamespaceHandler {

	
	/**
	 * Constructs a handler which uses standard table names.
	 */
	public OracleDataNamespaceHandler() {
		super();
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#rowLimit(java.lang.String, long)
	 */
	@Override
	public String rowLimit(String selectBody, long limit) {
		if (limit > 0) {
			return "select * from (select " + selectBody + ") where ROWNUM <= " + limit;
		}
		return "select " + selectBody;
	}
	
	
	
	
	/**
	 * Only used for pre-clustering, which we are not using.
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#createTempTable(java.lang.String, java.lang.String)
	 */
	@Override
	public String createTempTable(String tableName, String spec) {
		throw new UnsupportedOperationException();
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#tempTableName(java.lang.String)
	 */
	@Override
	public String tempTableName(String tableName) {
		return tableName;
	}



	/* (non-Javadoc)
	 * @see influent.server.dataaccess.DataViewNamespaceHandler#formatDate(org.joda.time.DateTime)
	 */
	@Override
	public String formatDate(DateTime date) {
		return "to_date('" + DataAccessHelper.format(date) + "', 'YYYY-MM-DD HH24:MI:SS.FF3')";
	}




	/* (non-Javadoc)
	 * @see influent.server.dataaccess.AbstractDataNamespaceHandler#idToBinaryFromHex(java.lang.String)
	 */
	@Override
	protected String idToBinaryFromHex(String id) {
		return "HEXTORAW('" + id + "')";
	}




	@Override
	protected String columnToHex(String columnName) {
        return "RAWTOHEX('" + columnName + "') as " + columnName;
    }
}
