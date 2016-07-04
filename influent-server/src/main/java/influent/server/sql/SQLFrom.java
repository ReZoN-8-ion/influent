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
package influent.server.sql;

/**
 * Represents a SQL FROM clause. This can be used to create complicated
 * sub-selects that can still be chained together.
 * 
 * @author cregnier
 *
 */
public interface SQLFrom {

	/**
	 * Sets the name of table to select results from.<br>
	 * This cannot be set if {@link #fromQuery(SQLSelect)} has also been set.
	 * @param name
	 *   The name of an existing table in the database
	 * @return
	 */
	SQLFrom table(String name);
	
	/**
	 * Adds an alias for the table.
	 * @param alias
	 *   The name of the alias that will be used in the SQL statement.
	 * @return
	 */
	SQLFrom as(String alias);
	
	/**
	 * Sets a subquery that should be used to select results from.<br>
	 * This cannot be set if {@link #table(String)} has also been set.
	 * @param fromQuery
	 *   A subquery to select results from.
	 * @return
	 */
	SQLFrom fromQuery(SQLSelect fromQuery);

}
