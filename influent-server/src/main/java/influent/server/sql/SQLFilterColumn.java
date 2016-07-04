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

import java.util.List;

/**
 * A SQL WHERE filter that represents a single column.

 * @author cregnier
 *
 */
public interface SQLFilterColumn extends SQLFilter {

	/**
	 * Sets the name of the column that should be used in the filter
	 * @param name
	 *   A column from the selected table
	 * @return
	 */
	SQLFilterColumn column(String name);
	
	/**
	 * Specifies a value to do an '=' test on the selected column.
	 * @param val
	 *   The value to compare to. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn eq(Object val);

	/**
	 * Specifies a value to do a '!=' test on the selected column.
	 * @param val
	 *   The value to compare to. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn notEq(Object val);
	
	/**
	 * Specifies a value to do a '<' test on the selected column.
	 * @param val
	 *   The value to compare to. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn lessThan(Object val);
	
	/**
	 * Specifies a value to do a '<=' test on the selected column.
	 * @param val
	 *   The value to compare to. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn lessThanEq(Object val);
	
	/**
	 * Specifies a value to do a '>' test on the selected column.
	 * @param val
	 *   The value to compare to. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn greaterThan(Object val);
	
	/**
	 * Specifies a value to do a '>=' test on the selected column.
	 * @param val
	 *   The value to compare to. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn greaterThanEq(Object val);
	
	/**
	 * Sets the filter to use a 'LIKE' filter with the passed in string value or regex. 
	 * @param regex
	 *   The value to use in the SQL statement. A {@link LazyNamedParam} can also be used
	 *   here, and will allow the value to be replaced later.
	 * @return
	 */
	SQLFilterColumn like(Object regex);
	
	/**
	 * Negates the filter and adds a NOT in front of things.
	 * @return
	 */
	SQLFilterColumn not();
	
	/**
	 * Sets the filter to use an 'IN' filter with the passed set of values. 
	 * @param val
	 *   A list of values that will be stringified to be used as parameters to the 'IN' clause.
	 *   {@link LazyNamedParam}s can also be used here, and will allow values to be replaced later.
	 * @return
	 */
	SQLFilterColumn in(List<Object> vals);
	
	/**
	 * Sets the filter to use a 'BETWEEN' filter. 
	 * @param val1
	 *   The lower bounds value for the column.
	 *   {@link LazyNamedParam}s can also be used here, and will allow values to be replaced later.
	 * @param val2
	 *   The upper bounds value for the column.
	 *   {@link LazyNamedParam}s can also be used here, and will allow values to be replaced later.
	 * @return
	 */
	SQLFilterColumn between(Object val1, Object val2);
}
