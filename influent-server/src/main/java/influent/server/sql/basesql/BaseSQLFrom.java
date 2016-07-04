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
package influent.server.sql.basesql;

import influent.server.sql.SQLBuilderException;
import influent.server.sql.SQLFrom;
import influent.server.sql.SQLSelect;

/**
 * 
 * @author cregnier
 *
 */
public class BaseSQLFrom implements SQLFrom {

	private String tableName;
	private String alias;
	private BaseSQLSelect fromQuery;
	
	
	//--------------------------------------------------------
	

	@Override
	public SQLFrom table(String name) {
		this.tableName = name;
		return this;
	}

	@Override
	public SQLFrom as(String alias) {
		this.alias = alias;
		return this;
	}

	@Override
	public SQLFrom fromQuery(SQLSelect fromQuery) {
		if (!(fromQuery instanceof BaseSQLSelect)) {
			throw new SQLBuilderException("Unexpected SQLSelect class: " + fromQuery.getClass() + ". Should be " + BaseSQLSelect.class);
		}
		this.fromQuery = (BaseSQLSelect)fromQuery;
		return this;
	}
	
	protected String getTableName() {
		return tableName;
	}
	
	protected String getAlias() {
		return alias;
	}
	
	protected BaseSQLSelect getSelectQuery() {
		return fromQuery;
	}
	
}
