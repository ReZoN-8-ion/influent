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
import influent.server.sql.SQLFilter;
import influent.server.sql.SQLFilterColumn;
import influent.server.sql.SQLFilterGroup;
import influent.server.sql.SQLFrom;
import influent.server.sql.SQLJoin;
import influent.server.sql.SQLBuilder.Helpers.LazyNamedParam;
import influent.server.sql.basesql.BaseSQLJoin.SQLJoinType;
import influent.server.sql.SQLSelect;

/**
 * 
 * @author cregnier
 *
 */
public abstract class BaseSQLBuilder implements SQLBuilder {

	@Override
	public SQLSelect select() {
		return new BaseSQLSelect(this);
	}

	@Override
	public SQLFrom from() {
		return new BaseSQLFrom();
	}

	@Override
	public SQLJoin innerJoin() {
		return new BaseSQLJoin(SQLJoinType.Inner);
	}

	@Override
	public SQLJoin leftJoin() {
		return new BaseSQLJoin(SQLJoinType.Left);
	}
	
	@Override
	public SQLJoin rightJoin() {
		return new BaseSQLJoin(SQLJoinType.Right);
	}
	
	@Override
	public SQLJoin fullJoin() {
		return new BaseSQLJoin(SQLJoinType.Full);
	}
	
	@Override
	public SQLFilterColumn filter() {
		return new BaseSQLFilterColumn();
	}

	@Override
	public SQLFilterGroup and(SQLFilter... filters) {
		SQLFilterGroup group = new BaseSQLFilterGroup(BaseSQLFilterGroup.FilterGroupType.AND);
		for (SQLFilter filter : filters) {
			if (filter != null)
				group.addFilter(filter);
		}
		return group;
	}

	@Override
	public SQLFilterGroup or(SQLFilter... filters) {
		SQLFilterGroup group = new BaseSQLFilterGroup(BaseSQLFilterGroup.FilterGroupType.OR);
		for (SQLFilter filter : filters) {
			if (filter != null)
				group.addFilter(filter);
		}
		return group;
	}

	@Override
	public SQLFilterGroup group(SQLFilter filter) {
		return (new BaseSQLFilterGroup(BaseSQLFilterGroup.FilterGroupType.GROUP)).addFilter(filter);
	}

	@Override
	public SQLFilterGroup not(SQLFilter filter) {
		return (new BaseSQLFilterGroup(BaseSQLFilterGroup.FilterGroupType.GROUP)).not().addFilter(filter);
	}

	@Override
	public LazyNamedParam lazyParam(String paramName) {
		return new LazyNamedParam(paramName);
	}	
}
