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

import influent.server.sql.SQLFilterColumn;

/**
 * 
 * @author cregnier
 *
 */
public class BaseSQLFilterColumn implements SQLFilterColumn {

	protected enum OpType {
		Eq,
		NotEq,
		LessThan,
		LessThanEq,
		GreaterThan,
		GreaterThanEq,
		Like,
		In,
		Betweeen
	}
	
	//------------------------------------------------------

	
	private String name;
	private boolean negated = false;
	private OpType opType;
	private Object val1;
	private Object val2;
	private Object regex;
	private List<Object> inVals;
	
	
	//------------------------------------------------------
	
	
	@Override
	public SQLFilterColumn column(String name) {
		this.name = name;
		return this;
	}

	@Override
	public SQLFilterColumn eq(Object val) {
		opType = OpType.Eq;
		val1 = val;
		return this;
	}

	@Override
	public SQLFilterColumn notEq(Object val) {
		opType = OpType.NotEq;
		val1 = val;
		return this;
	}

	@Override
	public SQLFilterColumn lessThan(Object val) {
		opType = OpType.LessThan;
		val1 = val;
		return this;
	}

	@Override
	public SQLFilterColumn lessThanEq(Object val) {
		opType = OpType.LessThanEq;
		val1 = val;
		return this;
	}

	@Override
	public SQLFilterColumn greaterThan(Object val) {
		opType = OpType.GreaterThan;
		val1 = val;
		return this;
	}

	@Override
	public SQLFilterColumn greaterThanEq(Object val) {
		opType = OpType.GreaterThanEq;
		val1 = val;
		return this;
	}

	@Override
	public SQLFilterColumn like(Object regex) {
		opType = OpType.Like;
		this.regex = regex;
		return this;
	}

	@Override
	public SQLFilterColumn not() {
		negated = true;
		return this;
	}

	@Override
	public SQLFilterColumn in(List<Object> vals) {
		opType = OpType.In;
		this.inVals = vals;
		return this;
	}

	@Override
	public SQLFilterColumn between(Object val1, Object val2) {
		opType = OpType.Betweeen;
		this.val1 = val1;
		this.val2 = val2;
		return this;
	}

	
	protected String getName() {
		return name;
	}
	
	protected boolean isNegated() {
		return negated;
	}
	
	protected OpType getOpType() {
		return opType;
	}
	
	protected Object getVal1() {
		return val1;
	}
	
	protected Object getVal2() {
		return val2;
	}
	
	protected Object getLikeRegex() {
		return regex;
	}
	
	protected List<Object> getInValues() {
		return inVals;
	}
}
