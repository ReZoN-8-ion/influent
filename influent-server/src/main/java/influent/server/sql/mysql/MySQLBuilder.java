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

package influent.server.sql.mysql;

import influent.server.sql.SQLSelect;
import influent.server.sql.basesql.BaseSQLBuilder;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class MySQLBuilder extends BaseSQLBuilder {

    public final static String TYPE_KEY = "mysql";

	@Override
	public String escape(String name) {
		return '`' + name + '`';
	}
	
	@Override
	public String unescape(String name) {
		return (name.charAt(0) == '`' && name.charAt(name.length() - 1) == '`')? name.substring(1, name.length() - 1) : name;
	}

	@Override
	public Date getDate(Object date) {
		try {
			return new SimpleDateFormat("yyyy-MM-dd").parse((String) date);
		} catch(Exception e) {
			System.out.println(e);
			return null;
		}
	}

	@Override
	public SQLSelect select() {
		return new MySQLSelect(this);
	}
}
