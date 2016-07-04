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

import influent.server.sql.SQLBuilder;
import influent.server.sql.SQLBuilder.Helpers.LazyNamedParam;
import influent.server.sql.SQLBuilderException;
import influent.server.sql.SQLFilter;
import influent.server.sql.SQLFrom;
import influent.server.sql.SQLFunction;
import influent.server.sql.SQLJoin;
import influent.server.sql.SQLSelect;
import influent.server.sql.basesql.BaseSQLFilterGroup.FilterGroupType;
import influent.server.sql.basesql.BaseSQLJoin.JoinOnData;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;

/**
 * 
 * @author cregnier
 *
 */
public class BaseSQLSelect implements SQLSelect {

	private static class ColumnData {
		String name;
		String alias;
		SQLFunction fn;
		Object[] fnParams;
		
		public ColumnData(String name, String alias, SQLFunction fn, Object[] fnParams) {
			this.name = (name != null)? name.trim() : null;
			this.alias = (alias != null)? alias.trim() : null;
			this.fn = fn;
			this.fnParams = fnParams;
		}
	}
	
	private static class OrderByData {
		String colName;
		boolean isAscending;
		
		public OrderByData(String colName, boolean isAscending) {
			this.colName = colName;
			this.isAscending = isAscending;
		}
	}

	/**
	 * This represents the intermediate results for each of the builder functions
	 * needed to build the final sql statement.
	 * 
	 * @author cregnier
	 *
	 */
	private static class BuildResult {
		//The map of unfulfilled param value names to their index in the prepared statement
		Map<String, Integer> indices;
		
		void addResult(BuildResult o) {
			if (o != null && o.indices != null && o.indices.size() > 0) {
				if (indices == null)
					indices = Maps.newHashMap();
				
				//need to add the new indices to our indices, but we need to displace the values first 
				int numOldIndices = indices.size();
				for (Entry<String, Integer> entry : o.indices.entrySet()) {
					Integer oldVal = indices.put(entry.getKey(), entry.getValue() + numOldIndices);
					if (oldVal != null) {
						throw new SQLBuilderException("The named parameter '" + entry.getKey() + "' was used multiple times");
					}
				}
			}
		}
		
		void pushParamName(String name) {
			if (indices == null)
				indices = Maps.newHashMap();
			indices.put(name, indices.size());
		}
	}
	

	
	//-----------------------------------------------------------

	final protected SQLBuilder sqlBuilder;
	
	private boolean distinctVals = false;
	private Number topCount = null;
	private List<ColumnData> columns = Lists.newArrayList();
	
	private BaseSQLFrom fromClause;
	private BaseSQLJoin joinClause;
	private List<String> groupByColumns = Lists.newArrayList();
	private List<OrderByData> orderByColumns = Lists.newArrayList();
	private SQLFilter whereFilter;
	private SQLFilter havingFilter;
	
	private BaseSQLSelect unionSelect;
	private boolean unionAll;
	
	//-----------------------------------------------------------

	public BaseSQLSelect(SQLBuilder builder) {
		this.sqlBuilder = builder;
	}
	
	@Override
	public SQLSelect distinct() {
		distinctVals = true;
		return this;
	}

	@Override
	public Boolean usesTop() {
		return true;
	}


	@Override
	public SQLSelect top(int count) {
		topCount = count;
		return this;
	}

	@Override
	public SQLSelect topPercent(double percent) {
		topCount = percent;
		return this;
	}

	@Override
	public SQLSelect column(String name) {
		columns.add(new ColumnData(name, null, null, null));
		return this;
	}

	@Override
	public SQLSelect column(String name, String alias) {
		columns.add(new ColumnData(name, alias, null, null));
		return this;
	}

	@Override
	public SQLSelect column(String name, String alias, SQLFunction fn, Object... fnParams) {
		columns.add(new ColumnData(name, alias, fn, fnParams));
		return this;
	}

	@Override
	public SQLSelect from(SQLFrom fromClause) {
		if (!(fromClause instanceof BaseSQLFrom)) {
			throw new SQLBuilderException("Unexpected from clause type: " + fromClause.getClass() + ". Should be " + BaseSQLFrom.class);
		}
		this.fromClause = (BaseSQLFrom)fromClause;
		return this;
	}

	@Override
	public SQLSelect from(String name) {
		return from(sqlBuilder.from().table(name));
	}

	@Override
	public SQLSelect from(String name, String alias) {
		return from(sqlBuilder.from().table(name).as(alias));
	}

	@Override
	public SQLSelect join(SQLJoin joinClause) {
		if (!(joinClause instanceof BaseSQLJoin)) {
			throw new SQLBuilderException("Unexpected from clause is an unexpected type: " + joinClause.getClass() + ". Should be " + BaseSQLJoin.class);
		}
		this.joinClause = (BaseSQLJoin)joinClause;
		return this;
	}
	
	@Override
	public SQLSelect where(SQLFilter filter) {
		this.whereFilter = filter;
		return this;
	}

	@Override
	public SQLSelect having(SQLFilter filter) {
		this.havingFilter = filter;
		return this;
	}

	@Override
	public SQLSelect groupBy(String name) {
		groupByColumns.add(name.trim());
		return this;
	}

	@Override
	public SQLSelect orderBy(String name) {
		orderByColumns.add(new OrderByData(name.trim(), true));
		return this;
	}

	@Override
	public SQLSelect orderBy(String name, boolean ascending) {
		orderByColumns.add(new OrderByData(name.trim(), ascending));
		return this;
	}

	@Override
	public SQLSelect union(SQLSelect select) {
		if (!(select instanceof BaseSQLSelect)) {
			throw new SQLBuilderException("Union select clause is an unexpected type: " + select.getClass() + ". Should be " + BaseSQLSelect.class);
		}
		this.unionSelect = (BaseSQLSelect)select;
		unionAll = false;
		return this;
	}
	
	@Override
	public SQLSelect unionAll(SQLSelect select) {
		if (!(select instanceof BaseSQLSelect)) {
			throw new SQLBuilderException("Union all select clause is an unexpected type: " + select.getClass() + ". Should be " + BaseSQLSelect.class);
		}
		this.unionSelect = (BaseSQLSelect)select;
		unionAll = true;
		return this;
	}
	
	@Override
	public String build() {
		return build(null);
	}

	@Override
	public String build(Map<String, Object> paramValues) {
		if (paramValues == null)
			paramValues = Collections.emptyMap();
		StringBuilder strb = new StringBuilder();

		/*
		 * As a builder function finds a named lazy evaluated param it will try to
		 * replace the param with any values from the passed in parameters. Otherwise,
		 * the named param is turned into a "?" for prepared statements, and the
		 * name and index is recorded in the {@link BuildResult} to be passed on. 
		 */
		BuildResult buildResult = buildSelectClause(this, strb, paramValues);

		//check and make sure we don't have any unfulfilled param variables
		if (buildResult != null && (buildResult.indices != null && buildResult.indices.size() > 0)) {
			throw new SQLBuilderException("Tried to build an unprepared statement but there were unfulfilled params.");
		}
		
		return strb.toString();
	}

	@Override
	public SQLPreparedResult buildPrepared() {
		return buildPrepared(null);
	}

	@Override
	public SQLPreparedResult buildPrepared(Map<String, Object> paramValues) {
		if (paramValues == null)
			paramValues = Collections.emptyMap();
		StringBuilder strb = new StringBuilder();
		
		/*
		 * As a builder function finds a named lazy evaluated param it will try to
		 * replace the param with any values from the passed in parameters. Otherwise,
		 * the named param is turned into a "?" for prepared statements, and the
		 * name and index is recorded in the {@link BuildResult} to be passed on. 
		 */
		BuildResult buildResult = buildSelectClause(this, strb, paramValues);

		SQLPreparedResult result = new SQLPreparedResult();
		result.query = strb.toString();
		result.indices = (buildResult != null && buildResult.indices != null)? buildResult.indices : Collections.<String,Integer>emptyMap();
		
		return result;
	}

	private BuildResult buildSelectClause(BaseSQLSelect selectClause, StringBuilder strb, Map<String, Object> paramValues) {
		BuildResult result = new BuildResult();
		
		strb.append("SELECT ");
		if (usesTop() &&
			topCount != null &&
			topCount.doubleValue() > 0
		) {
			boolean isPercent = (topCount instanceof Double);
			strb.append("TOP ");
			strb.append(topCount);
			strb.append((isPercent)? " PERCENT " : " ");
		}
		
		if (selectClause.distinctVals) {
			strb.append("DISTINCT ");
		}

		//add all the columns
		if (!selectClause.columns.isEmpty()) {
			boolean afterFirst = false;
			for (ColumnData col : selectClause.columns) {
				if (afterFirst) {
					strb.append(",");
				}
				buildColumn(col, strb);
				afterFirst = true;
			}
			strb.append(" ");
		}
		else {
			//no columns, so select all
			strb.append("* ");
		}
		
		result.addResult(buildFromClause(selectClause.fromClause, strb, paramValues));
		
		if (selectClause.joinClause != null) {
			result.addResult(buildJoinClause(selectClause.joinClause, strb, paramValues));
		}
		
		if (selectClause.whereFilter != null) {
			result.addResult(buildWhereClause(selectClause.whereFilter, strb, paramValues));
		}
		
		if (selectClause.groupByColumns.size() > 0) {
			buildGroupByClause(selectClause.groupByColumns, strb);
		}
		
		if (selectClause.orderByColumns.size() > 0) {
			buildOrderByClause(selectClause.orderByColumns, strb);
		}
		
		if (selectClause.havingFilter != null) {
			//TODO:
			throw new UnsupportedOperationException("Having filters have not been implemented yet");
		}

		if (!usesTop() &&
			topCount != null &&
			topCount.doubleValue() > 0) {
			boolean isPercent = (topCount instanceof Double);
			strb.append(" LIMIT ");
			strb.append(topCount);
			strb.append((isPercent)? " PERCENT " : " ");
		}

		if (selectClause.unionSelect != null) {
			strb.append((selectClause.unionAll)? " UNION ALL " : " UNION ");
			result.addResult(buildSelectClause(selectClause.unionSelect, strb, paramValues));
		}

		return result;
	}
	
	private void buildColumn(ColumnData col, StringBuilder strb) {
		if (col.fn == null) {
			if (col.name == null || col.name.isEmpty()) {
				throw new SQLBuilderException("Column name cannot be null or empty");
			}
			strb.append(col.name);
		}
		else {
			String colName = (col.name != null && !col.name.isEmpty())? col.name : "*";
			switch (col.fn) {
			case Count:
				strb.append("COUNT(");
				strb.append(colName);
				strb.append(")");
				break;
			case CountDistinct:
				strb.append("COUNT(DISTINCT ");
				strb.append(colName);
				strb.append(")");
				break;
			case Average:
				strb.append("AVG(");
				strb.append(colName);
				strb.append(")");
				break;
			case Sum:
				strb.append("SUM(");
				strb.append(colName);
				strb.append(")");
				break;
			case Max:
				strb.append("MAX(");
				strb.append(colName);
				strb.append(")");
				break;
			case Min:
				strb.append("MIN(");
				strb.append(colName);
				strb.append(")");
				break;
			case Lcase:
				strb.append("LCASE(");
				strb.append(colName);
				strb.append(")");
				break;
			case Ucase:
				strb.append("UCASE(");
				strb.append(colName);
				strb.append(")");
				break;
			case Length:
				strb.append("LEN(");
				strb.append(colName);
				strb.append(")");
				break;
			case Mid:
			{
				if (col.fnParams == null || col.fnParams.length < 1) {
					//throw error, not enough params
					throw new SQLBuilderException("column MID(" + col.name + ") does not have enough parameters"); 
				}
				String start = col.fnParams[0].toString();
				String length = (col.fnParams.length >= 2)? col.fnParams[1].toString() : null;
				
				strb.append("MID(");
				strb.append(colName);
				strb.append(",");
				strb.append(start);
				if (length != null) {
					strb.append(",");
					strb.append(length);
				}
				strb.append(")");
				break;
			}
			case Round:
			{
				if (col.fnParams == null || col.fnParams.length < 1) {
					//throw error, not enough params
					throw new SQLBuilderException("column ROUND(" + col.name + ") does not have enough parameters"); 
				}
				String numDecimals = col.fnParams[0].toString();
				
				strb.append("ROUND(");
				strb.append(colName);
				strb.append(",");
				strb.append(numDecimals);
				strb.append(")");
				break;
			}
			case Now:
				strb.append("NOW()");
				break;
			case Format:
			{
				if (col.fnParams == null || col.fnParams.length < 1) {
					//throw error, not enough params
					throw new SQLBuilderException("column FORMAT(" + col.name + ") does not have enough parameters"); 
				}
				String format = col.fnParams[0].toString();
				
				strb.append("ROUND(");
				strb.append(colName);
				strb.append(",");
				strb.append(format);
				strb.append(")");
				break;
			}
			case RowNumber:
				strb.append("ROW_NUMBER() OVER(ORDER BY ");
				strb.append(colName);
				strb.append(")");
				break;
			default:
				throw new SQLBuilderException("Unknown column function type: " + col.fn);
			}
		}
		if (col.alias != null && !col.alias.isEmpty()) {
			strb.append(" AS ");
			strb.append(col.alias);
		}
	}

	private BuildResult buildWhereClause(SQLFilter filterClause, StringBuilder strb, Map<String, Object> paramValues) {
		StringBuilder filterBuf = new StringBuilder();
		BuildResult res = buildFilterClause(filterClause, filterBuf, paramValues);
		
		//since the where filter may turn out to be empty, we check if there's text to add before appending the WHERE clause 
		if (filterBuf.length() > 0) {
			strb.append(" WHERE ");
			strb.append(filterBuf);
		}
		
		return res;
	}
	
	private BuildResult buildFilterClause(SQLFilter filterClause, StringBuilder strb, Map<String, Object> paramValues) {
		BuildResult result = null;
		if (filterClause instanceof BaseSQLFilterGroup) {
			result = buildFilterGroupClause((BaseSQLFilterGroup)filterClause, strb, paramValues);
		}
		else if (filterClause instanceof BaseSQLFilterColumn) {
			result = buildFilterColumnClause((BaseSQLFilterColumn)filterClause, strb, paramValues);
		}
		return result;
	}
	
	private BuildResult buildFilterColumnClause(BaseSQLFilterColumn columnFilter, StringBuilder strb, Map<String, Object> paramValues) {
		BuildResult result = new BuildResult();
		strb.append(columnFilter.getName());
		
		if (columnFilter.isNegated()) {
			strb.append(" NOT");
		}
		
		switch (columnFilter.getOpType()) {
		case Eq:
			strb.append(" = ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			break;
		case NotEq:
			strb.append(" != ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			break;
		case LessThan:
			strb.append(" < ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			break;
		case LessThanEq:
			strb.append(" <= ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			break;
		case GreaterThan:
			strb.append(" > ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			break;
		case GreaterThanEq:
			strb.append(" >= ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			break;
		case Like:
			strb.append(" LIKE ");
			strb.append(getValueOrTxParamValue(columnFilter.getLikeRegex(), result, paramValues));
			break;
		case Betweeen:
			strb.append(" BETWEEN ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal1(), result, paramValues));
			strb.append(" AND ");
			strb.append(getValueOrTxParamValue(columnFilter.getVal2(), result, paramValues));
			break;
		case In:
		{
			List<Object> values = columnFilter.getInValues();
			int numVals = values.size();

			strb.append(" IN (");
			strb.append(getValueOrTxParamValue(values.get(0), result, paramValues));
			for (int i = 1; i < numVals; ++i) {
				strb.append(",");
				strb.append(getValueOrTxParamValue(values.get(i), result, paramValues));
			}
			strb.append(")");
			break;
		}
		default:
			throw new SQLBuilderException("Unknown column filter op: " + columnFilter.getOpType());
		}
		
		return (result.indices != null)? result : null;	//only return the result if we actually added anything to it
	}
	
	private BuildResult buildFilterGroupClause(BaseSQLFilterGroup groupFilter, StringBuilder strb, Map<String, Object> paramValues) {
		BuildResult result = null;
		BuildResult filterResult = null;
		
		List<SQLFilter> filters = groupFilter.getFilters();
		int numFilters = filters.size();
		
		if (groupFilter.getFilterGroupType().equals(FilterGroupType.GROUP) && numFilters > 1) {
			//simple group type can't have any more than one filter since there's no way to combine them
			throw new SQLBuilderException("Simple filter group cannot have more than one filter");
		}
		
		//go through the sub-filters and build them first to see if we actually have a substring to concat
		List<StringBuilder> subfilterBuilders = Lists.newArrayList();
		for (int i = 0; i < numFilters; ++i) {
			StringBuilder subfilterBuilder = new StringBuilder();

			filterResult = buildFilterClause(filters.get(i), subfilterBuilder, paramValues);
			if (filterResult != null) {
				if (result == null)
					result = filterResult;
				else
					result.addResult(filterResult);
			}
			
			if (subfilterBuilder.length() > 0)
				subfilterBuilders.add(subfilterBuilder);
		}

		int actualFilters = subfilterBuilders.size();
		if (actualFilters > 0) {
			//we do have some sub-filters, so wrap it in the necessary brackets if needed
			if (groupFilter.isNegated()) {
				strb.append("NOT(");
			}
			else if (groupFilter.getFilterGroupType().equals(FilterGroupType.GROUP)) {
				strb.append("(");
			}
				
			//only need to put brackets around multiple items
			if (actualFilters > 1)
				strb.append("(");
			
			for (int i = 0; i < actualFilters - 1; ++i) {
				//add the sub-filter to this filter
				strb.append(subfilterBuilders.get(i));
				
				switch (groupFilter.getFilterGroupType()) {
				case AND:
					strb.append(") AND (");
					break;
				case OR:
					strb.append(") OR (");
					break;
				default:
					throw new SQLBuilderException("Unknown group filter type: " + groupFilter.getFilterGroupType());
				}
			}
			
			if (actualFilters > 0) {
				strb.append(subfilterBuilders.get(actualFilters - 1));
			}
			
			//close off the brackets around multiple items
			if (actualFilters > 1)
				strb.append(")");
			
			if (groupFilter.isNegated() || groupFilter.getFilterGroupType().equals(FilterGroupType.GROUP)) {
				//need to close the negation or group block
				strb.append(")");
			}
		}
		
		return result;
	}

	private void buildGroupByClause(List<String> columns, StringBuilder strb) {
		strb.append(" GROUP BY ");
		
		int n = columns.size();
		strb.append(columns.get(0));
		for (int i = 1; i < n; ++i) {
			String colName = columns.get(i);
			strb.append(",");
			strb.append(colName);
		}
		
	}
	
	private void buildOrderByClause(List<OrderByData> columns, StringBuilder strb) {
		strb.append(" ORDER BY ");
		
		int n = columns.size();
		strb.append(columns.get(0).colName);
		strb.append((columns.get(0).isAscending)? " ASC" : " DESC");
		for (int i = 1; i < n; ++i) {
			OrderByData d = columns.get(i);
			strb.append(",");
			strb.append(d.colName);
			strb.append((d.isAscending)? " ASC" : " DESC");
		}
	}
	
	private BuildResult buildFromSelectClause(String tableName, BaseSQLSelect selectQuery, String alias, StringBuilder strb, Map<String, Object> paramValues) {
		if (tableName != null && selectQuery != null) {
			//shouldn't get a table name and a from query, so throw error
			throw new SQLBuilderException("From query (" + tableName + ") should not contain a table name and a select query");
		}
		
		BuildResult result = null;
		
		if (selectQuery != null) {
			//add sub query
			strb.append("(");
			result = buildSelectClause(selectQuery, strb, paramValues);
			strb.append(")");
		}
		else {
			//use the simple table name for the from clause
			strb.append(tableName);
		}
		
		String fromAlias = alias;
		if (fromAlias != null && !fromAlias.isEmpty()) {
			strb.append(" AS ");
			strb.append(fromAlias);
		}
		
		return result;
	}
	
	private BuildResult buildFromClause(BaseSQLFrom fromClause, StringBuilder strb, Map<String, Object> paramValues) {
		if (fromClause == null) {
			throw new SQLBuilderException("from clause should not be null");
		}
		
		strb.append("FROM ");
		return buildFromSelectClause(fromClause.getTableName(), fromClause.getSelectQuery(), fromClause.getAlias(), strb, paramValues);
	}
	
	private BuildResult buildJoinClause(BaseSQLJoin joinClause, StringBuilder strb, Map<String, Object> paramValues) {
		switch (joinClause.getJoinType()) {
		case Inner:
			strb.append(" INNER JOIN ");
			break;
		case Left:
			strb.append(" LEFT JOIN ");
			break;
		case Right:
			strb.append(" RIGHT JOIN ");
			break;
		case Full:
			strb.append(" FULL OUTER JOIN ");
			break;
		default:
			throw new SQLBuilderException("Unknown join type: " + joinClause.getJoinType());
		}
	
		BuildResult result = buildFromSelectClause(joinClause.getTableName(), joinClause.getSelectQuery(), joinClause.getAlias(), strb, paramValues);
		
		//TODO: need to check if any of there are any named lazy parameters in the on clause 
		
		//add ON params
		List<JoinOnData> joinOns = joinClause.getJoinOns();
		if (joinOns.size() > 0) {
			strb.append(" ON ");
			
			int n = joinOns.size();
			strb.append(joinOns.get(0).onClause);
			for (int i = 1; i < n; ++i) {
				JoinOnData d = joinOns.get(i);
				strb.append(" AND ");
				strb.append(d.onClause);
			}
		}
		
		return result;
	}

	/**
	 * Gets the string value or the transformed string value of obj.
	 * Checks to see if obj is a named lazy parameter, in which case it will try to replace it will the
	 * named parameter from paramValues. If the named parameter cannot be found, it's turned into a 
	 * prepared param '?' and recorded in the {@link BuildResult}
	 * @param obj
	 *   The object to get the string value for
	 * @param result
	 *   Records the indices of any prepared params. This is an out parameter, and must not be null.
	 * @param paramValues
	 *   The map of named params to replacement objects.
	 * @return
	 *   Returns the string version of obj
	 */
	private String getValueOrTxParamValue(Object obj, BuildResult result, Map<String, Object> paramValues) {
		String str = null;
		if (obj != null) {
			if (obj instanceof LazyNamedParam) {
				String name = ((LazyNamedParam)obj).name;
				Object replacementVal = paramValues.get(name);
				if (replacementVal != null) {
					str = replacementVal.toString();
				}
				else {
					//there's no replacement for the lazy value, so turn it into a prepared param, and record it
					str = "?";
					result.pushParamName(name);
				}
			}
			else {
				//value isn't a named param so just convert it to a string to be used normally
				str = obj.toString();
			}
		}
		return str;
	}
	

}
