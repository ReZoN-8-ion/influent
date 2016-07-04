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

import java.util.List;

import com.google.common.collect.Lists;

import influent.server.sql.SQLFilter;
import influent.server.sql.SQLFilterGroup;

/**
 * 
 * @author cregnier
 *
 */
public class BaseSQLFilterGroup implements SQLFilterGroup {

	protected enum FilterGroupType {
		AND,
		OR,
		GROUP
	}
	
	
	//--------------------------------------------------------

	
	private final FilterGroupType filterGroupType;
	private List<SQLFilter> filters = Lists.newArrayList();
	private boolean negated = false;
	
	
	//--------------------------------------------------------
	
	
	public BaseSQLFilterGroup(FilterGroupType filterGroupType) {
		this.filterGroupType = filterGroupType;
	}
	
	@Override
	public SQLFilterGroup addFilter(SQLFilter filter) {
		filters.add(filter);
		return this;
	}

	@Override
	public SQLFilterGroup not() {
		negated = true;
		return this;
	}

	
	protected FilterGroupType getFilterGroupType() {
		return filterGroupType;
	}
	
	protected List<SQLFilter> getFilters() {
		return filters;
	}
	
	protected boolean isNegated() {
		return negated;
	}
}
