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

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Date;

/**
 * The main interface for creating SQL statements using a chained command pattern.<br>
 * <br>
 * There are three goals for this interface:<br>
 * 1. to remove the typically ugly code needed to build a stringified version of a SQL statement<br>
 * 2. to simplify creating prepared and non-prepared statements, so duplicate logic isn't required<br>
 * 3. to abstract away SQL commands to be implemented differently per database engine<br>
 * 
 * @author cregnier
 *
 */
public interface SQLBuilder {

	public static class Helpers {
		/**
		 * Fills in a {@link PreparedStatement}'s missing params.<br>
		 * This maps each of the param values to its associated index in the prepared statement.
		 * Each key in the paramValues map should also be in the paramIndices map. 
		 *  
		 * @param stmt
		 *   The {@link PreparedStatement} that has missing values
		 * @param paramValues
		 *   A key/value mapping of the named missing param to the value that should be used.
		 * @param paramIndices
		 *   A mapping of the named missing param to its integer index in the prepared statement.
		 *   This is returned as part of {@link SQLSelect#buildPrepared()}
		 * @throws SQLException
		 */
		public void fillPrepared(PreparedStatement stmt, Map<String, Object> paramValues, Map<String, Integer> paramIndices) throws SQLException {
			for (Entry<String, Object> entry : paramValues.entrySet()) {
				Integer index = paramIndices.get(entry.getKey());
				if (index != null) {
					stmt.setObject(index, entry.getValue());
				}
			}
		}
		
		public static class LazyNamedParam {
			public String name;
			
			public LazyNamedParam(String name) {
				this.name = name;
			}
		}
	}


	/**
	 * Creates the builder for a SELECT statement that can then be used to
	 * build the final SQL string.
	 * @return
	 */
	SQLSelect select();
	
	//TODO: add in other types of create/drop/update tables, etc. 
	
	/**
	 * Creates the builder for a FROM clause. This is needed to create
	 * queries that select data from complicated FROM queries like sub-selects. 
	 * 
	 * @return
	 */
	SQLFrom from();
	
	/**
	 * Creates the builder for a JOIN clause that links two tables. This
	 * creates an inner join specifically.
	 * @return
	 */
	SQLJoin innerJoin();
	
	/**
	 * Creates the builder for a JOIN clause that links two tables. This
	 * creates a left join specifically.
	 * @return
	 */
	SQLJoin leftJoin();
	
	/**
	 * Creates the builder for a JOIN clause that links two tables. This
	 * creates a right join specifically.
	 * @return
	 */
	SQLJoin rightJoin();
	
	/**
	 * Creates the builder for a JOIN clause that links two tables. This
	 * creates a full join specifically.
	 * @return
	 */
	SQLJoin fullJoin();
	
	/**
	 * Creates the builder for a WHERE filter clause on a specific column.
	 * This will only create the filter for a single column, so if multiple
	 * filters are required, be sure to wrap this in a filter group.
	 * @return
	 */
	SQLFilterColumn filter();
	
	/**
	 * Creates the builder for a WHERE filter clause on a group of filters.
	 * This creates an AND clause specifically, building a SQL statement where
	 * all filter params are joined by AND.
	 * @param filters
	 *   The list of filter clauses that should be AND'ed together. Passing in
	 *   a single filter works as desired. 
	 * @return
	 */
	SQLFilterGroup and(SQLFilter... filters);
	
	/**
	 * Creates the builder for a WHERE filter clause on a group of filters.
	 * This creates an OR clause specifically, building a SQL statement where
	 * all filter params are joined by OR.
	 * @param filters
	 *   The list of filter clauses that should be OR'd together. Passing in
	 *   a single filter works as desired. 
	 * @return
	 */
	SQLFilterGroup or(SQLFilter... filters);

	/**
	 * Creates the builder for a WHERE filter that will negate a sub-filter.
	 * This is simplification for creating a group and then calling
	 * {@link SQLFilterGroup#not()}.
	 * @param filter
	 *   The single WHERE filter that should be negated
	 * @return
	 */
	SQLFilterGroup not(SQLFilter filter);

	/**
	 * Creates the builder for a WHERE filter that wraps a sub-filter. This is
	 * like wrapping a statement in brackets.
	 * @param filter
	 *   The single WHERE filter that should be wrapped
	 * @return
	 */
	SQLFilterGroup group(SQLFilter filter);

	/**
	 * Creates a named lazy parameter that can be passed into filter clauses to
	 * indicate a placeholder variable that will be replaced later with a
	 * specific value or a '?' for prepared statements.<br>
	 * <br>
	 * Variable replacement can occur at one of two times. Either when
	 * {@link SQLSelect#build(Map)} or {@link SQLSelect#buildPrepared(Map)} is
	 * called to replace placeholders with actual values during string creation,
	 * or after {@link SQLSelect#buildPrepared()} or {@link SQLSelect#buildPrepared(Map)}
	 * is called and proper values need to be entered into the {@link PreparedStatement}. 
	 * @param paramName
	 *   The name of the variable placeholder to create. This must be unique within a
	 *   statement, and no two lazy parameters should share the same name.
	 * @return
	 */
	LazyNamedParam lazyParam(String paramName);

	/**
	 * Escapes a string
	 * @param name
	 * @return
	 */
	String escape(String name);
	
	/**
	 * Unescapes a string
	 * @param name
	 * @return
	 */
	String unescape(String name);
	
	/**
	 * Returns Date object from given param
	 * @param date Object that can be cast to a String
	 * @return Date representaion of the param
	 */
	Date getDate(Object date);
}
