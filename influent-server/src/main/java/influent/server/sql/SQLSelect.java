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

import influent.server.sql.SQLBuilder.Helpers.LazyNamedParam;

import java.util.Map;

/**
 * Represents a SQL SELECT statement and allows specifying all the typical
 * operations you can do in a SELECT statement.<br>
 * <br>
 * Calling one of the build functions at the end will produce a string (and
 * map of named placeholder parameters) that can be used to create an actual
 * SQL statement.
 *  
 * @author cregnier
 *
 */
public interface SQLSelect {

	/**
	 * The return results for {@link SQLSelect#buildPrepared()} that needs to
	 * return a string and a mapping of named placeholder parameters to their
	 * given indices within the produced SQL statement.
	 * 
	 * @author cregnier
	 *
	 */
	public static class SQLPreparedResult {
		public String query;
		public Map<String, Integer> indices;
	}
	
	/**
	 * Adds the 'DISTINCT' keyword to the statement to return distinct results.
	 * @return
	 */
	SQLSelect distinct();

	/**
	 * States whether the select statement should use TOP or LIMIT clauses
	 * @return
	 */
	Boolean usesTop();

	/**
	 * Selects the top 'n' results.
	 * @param count
	 *   The max number of results to return.
	 * @return
	 */
	SQLSelect top(int count);
	
	/**
	 * Selects the top '%' results.
	 * @param percent
	 *   The max % of results to return.
	 * @return
	 */
	SQLSelect topPercent(double percent);
	
	/**
	 * Adds a column to the select statement
	 * @param name
	 *   The name of the column to request.
	 * @return
	 */
	SQLSelect column(String name);

	/**
	 * Adds an aliased column to the select statement. 
	 * @param name
	 *   The name of the column to request.
	 * @param alias
	 *   The name of the alias to refer to the column as.
	 * @return
	 */
	SQLSelect column(String name, String alias);
	
	/**
	 * Adds an aliased column with a function to the select statement. 
	 * @param name
	 *   The name of the column to request (null if not required)
	 * @param alias
	 *   The name of the alias to refer to the results of the column
	 * @param fn
	 *   The type of aggregate function to use on the column
	 * @param fnParams
	 *   Any possible parameters that may be needed by the function.
	 * @return
	 */
	SQLSelect column(String name, String alias, SQLFunction fn, Object... fnParams);
	
	/**
	 * Sets the FROM clause to select results from. This allows using complicated
	 * subqueries.
	 * @param fromClause
	 *   The table name, or subquery to use.
	 * @return
	 */
	SQLSelect from(SQLFrom fromClause);

	/**
	 * Sets the FROM clause to use a specific table. This is a shorthand for {@link #from(SQLFrom)}
	 * @param name
	 *   The name of the table to request results from.
	 * @return
	 */
	SQLSelect from(String name);

	/**
	 * Sets the FROM clause to use a specific table with an alias. This is a shorthand for {@link #from(SQLFrom)}
	 * @param name
	 *   The name of the table to request results from.
	 * @param alias
	 *   The alias to refer to the table as.
	 * @return
	 */
	SQLSelect from(String name, String alias);
	
	/**
	 * Sets the JOIN clause to join another table, and to specify which columns to join on.
	 * @param joinClause
	 *   The separate table or subquery to join on.
	 * @return
	 */
	SQLSelect join(SQLJoin joinClause);
	
	/**
	 * Sets the WHERE filter to use on the results.
	 * @param filter
	 *   A {@link SQLFilterColumn} for a single column filter, or a
	 *   {@link SQLFilterGroup} for a more complicated set of filters.
	 * @return
	 */
	SQLSelect where(SQLFilter filter);

	/**
	 * Sets the HAVING filter for aggregate columns.
	 * @param filter
	 *   A {@link SQLFilterColumn} for a single column filter, or a
	 *   {@link SQLFilterGroup} for a more complicated set of filters.
	 * @return
	 */
	SQLSelect having(SQLFilter filter);

	/**
	 * Adds a column to the 'GROUP BY' clause.<br>
	 * The order of the added columns will match the order in the final SQL statement.
	 * @param name
	 *   The name of the column to group by.
	 * @return
	 */
	SQLSelect groupBy(String name);
	
	/**
	 * Adds a column to the 'ORDER BY' clause with ascending order.<br>
	 * The order of the added columns will match the order in the final SQL statement.
	 * @param name
	 *   The name of the column to group by.
	 * @return
	 */
	SQLSelect orderBy(String name);

	/**
	 * Adds a column to the 'ORDER BY' clause.<br>
	 * The order of the added columns will match the order in the final SQL statement.
	 * @param name
	 *   The name of the column to group by.
	 * @param ascending
	 *   Flag for whether the column should be ascending or descending. 
	 * @return
	 */
	SQLSelect orderBy(String name, boolean ascending);
	
	/**
	 * Unions another select statement after this statement using UNION. The columns
	 * should match between the two select statements.
	 * @param select
	 *   Another select statement whose results should be unioned with the results of
	 *   this select statement.
	 * @return
	 */
	SQLSelect union(SQLSelect select);

	/**
	 * Unions another select statement after this statement using UNION ALL. The
	 * columns should match between the two select statements.
	 * @param select
	 *   Another select statement whose results should be unioned with the results of
	 *   this select statement.
	 * @return
	 */
	SQLSelect unionAll(SQLSelect select);
	
	
	/**
	 * Builds the SELECT statement into a final string.
	 * @return
	 * @throws SQLBuilderException
	 *   Throws a {@link SQLBuilderException} if there are any placeholder {@link LazyNamedParam}
	 *   values used within the statement.
	 */
	String build();

	/**
	 * Builds the SELECT statement into a final string and does some variable replacement.
	 * @param paramValues
	 *   A mapping of named placeholders ({@link LazyNamedParam}) to their actual values.
	 * @return
	 * @throws SQLBuilderException
	 *   Throws a {@link SQLBuilderException} if there are any placeholder {@link LazyNamedParam}
	 *   values used within the statement that have not already been replaced.
	 */
	String build(Map<String, Object> paramValues);

	/**
	 * Builds a SELECT statement into a final string and replaces any placeholder variables
	 * with '?' that can be set later in a prepared statement.
	 * @return
	 *   To know what index a named placeholder represented, the {@link SQLPreparedResult}
	 *   contains a map of the names variables to their index lookup position.
	 */
	SQLPreparedResult buildPrepared();

	/**
	 * Builds a SELECT statement into a final string and replaces any placeholder variables
	 * with '?' that can be set later in a prepared statement. This also allows some
	 * intermediate values to be replaced instead immediately.
	 * @param paramValues
	 *   A mapping of named placeholders ({@link LazyNamedParam}) to their actual values.
	 * @return
	 *   To know what index a named placeholder represented, the {@link SQLPreparedResult}
	 *   contains a map of the names variables to their index lookup position.
	 */
	SQLPreparedResult buildPrepared(Map<String, Object> paramValues);
}
