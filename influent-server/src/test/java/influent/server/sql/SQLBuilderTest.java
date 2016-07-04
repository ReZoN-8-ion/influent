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

import influent.server.sql.mssql.MSSQLBuilder;

import java.util.Collections;
import java.util.Map;

import org.junit.Assert;
import org.junit.Test;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;

/**
 * 
 * @author cregnier
 *
 */
public class SQLBuilderTest {

	@Test
	public void testSelectAllClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql = builder.select().from("myTable");
		
		Assert.assertEquals("SELECT * FROM myTable", sql.build());
	}

	@Test
	public void testSelectDistinctClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql = builder.select()
				.distinct()
				.column("col1")
				.from("myTable");
		
		Assert.assertEquals("SELECT DISTINCT col1 FROM myTable", sql.build());
	}

	@Test
	public void testSelectTopNClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		sql = builder.select()
				.top(10)
				.column("col1")
				.from("myTable");
		Assert.assertEquals("SELECT TOP 10 col1 FROM myTable", sql.build());
		
		sql = builder.select()
				.topPercent(10.5)
				.column("col1")
				.from("myTable");
		Assert.assertEquals("SELECT TOP 10.5 PERCENT col1 FROM myTable", sql.build());
	}

	@Test
	public void testSelectColumnClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		//test selecting a column
		sql = builder.select()
				.column("col1")
				.from("myTable");
		Assert.assertEquals("SELECT col1 FROM myTable", sql.build());
		
		//test selecting two columns, one with an alias
		sql = builder.select()
				.column("col1")
				.column("col2", "blah")
				.from("myTable");
		Assert.assertEquals("SELECT col1,col2 AS blah FROM myTable", sql.build());

		//test if you can create a column with no name
		try {
			sql = builder.select()
					.column(null, "blah")
					.from("myTable");
			String result = sql.build();	//should throw an error
			Assert.fail("Was able to select a column with no name: " + result);
		}
		catch (SQLBuilderException e) { }
		
		
		//test the count aggregate function
		sql = builder.select()
				.column("col1", "blah", SQLFunction.Count)
				.from("myTable");
		Assert.assertEquals("SELECT COUNT(col1) AS blah FROM myTable", sql.build());
		
		//test the some other aggregate functions and test set no column name on functions  
		sql = builder.select()
				.column("col1", "blah", SQLFunction.CountDistinct)
				.column("col2", null, SQLFunction.Lcase)
				.column(null, null, SQLFunction.Count)
				.from("myTable");
		Assert.assertEquals("SELECT COUNT(DISTINCT col1) AS blah,LCASE(col2),COUNT(*) FROM myTable", sql.build());
		
	}


	@Test
	public void testSelectFromClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		sql = builder.select()
				.column("col1")
				.from("myTable", "m");
		Assert.assertEquals("SELECT col1 FROM myTable AS m", sql.build());

		sql = builder.select()
				.column("col1")
				.from(builder.from()
						.table("myTable")
						.as("m"));
		Assert.assertEquals("SELECT col1 FROM myTable AS m", sql.build());

		try {
			sql = builder.select()
					.column("col1")
					.from(builder.from()
							.table("myTable")
							.as("m")
							.fromQuery(builder.select().from("myTable2")));
			sql.build();
			Assert.fail("Shouldn't be able to do a from statement with a table name and select query");
		}
		catch (SQLBuilderException e) {}
		
		sql = builder.select()
				.column("col1")
				.from(builder.from()
						.fromQuery(builder.select()
								.from("myTable2", "m2"))
						.as("m"));
		Assert.assertEquals("SELECT col1 FROM (SELECT * FROM myTable2 AS m2) AS m", sql.build());
	}
	
	@Test
	public void testSelectWhereClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		sql = builder.select()
				.column("col1")
				.from("myTable", "m")
				.where(builder.filter()
						.column("col1")
						.eq(5));
		Assert.assertEquals("SELECT col1 FROM myTable AS m WHERE col1 = 5", sql.build());

		sql = builder.select()
				.column("col1")
				.from("myTable")
				.where(builder.filter()
						.column("col1")
						.lessThan(5)
						.not());
		Assert.assertEquals("SELECT col1 FROM myTable WHERE col1 NOT < 5", sql.build());

		sql = builder.select()
				.column("col1")
				.from("myTable")
				.where(builder.group(
						builder.filter()
						.column("col1")
						.lessThanEq(5)
						.not()));
		Assert.assertEquals("SELECT col1 FROM myTable WHERE (col1 NOT <= 5)", sql.build());

		sql = builder.select()
				.column("col1")
				.from("myTable")
				.where(builder.not(
						builder.filter()
						.column("col1")
						.greaterThan(5)
						.not()));
		Assert.assertEquals("SELECT col1 FROM myTable WHERE NOT(col1 NOT > 5)", sql.build());

		sql = builder.select()
				.column("col1")
				.from("myTable")
				.where(builder.group(
						builder.filter()
						.column("col1")
						.greaterThanEq(5)
						)
						.not()
					);
		Assert.assertEquals("SELECT col1 FROM myTable WHERE NOT(col1 >= 5)", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.where(builder.or(
						builder.filter()
							.column("col1")
							.like("'%s'")
							.not()
						,builder.filter()
							.column("col2")
							.notEq("'text'")
						)
				);
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE (col1 NOT LIKE '%s') OR (col2 != 'text')", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.where(builder.and(
						builder.filter()
							.column("col1")
							.between(5, 10)
						,builder.filter()
							.column("col2")
							.in(Collections.<Object>singletonList("'a_name'"))
						)
						.not()
				);
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE NOT((col1 BETWEEN 5 AND 10) AND (col2 IN ('a_name')))", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.where(builder.and(
						builder.filter()
							.column("col2")
							.in(Lists.<Object>newArrayList("'name1'", "'name2'", "'name3'"))
						)
				);
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE col2 IN ('name1','name2','name3')", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.where(builder.and(
						builder.filter()
							.column("col2")
							.in(Lists.<Object>newArrayList("'name1'", "'name2'", "'name3'"))
						)
						.not()
				);
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE NOT(col2 IN ('name1','name2','name3'))", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.where(builder.group(builder.and(
						builder.filter()
							.column("col2")
							.in(Lists.<Object>newArrayList("'name1'", "'name2'", "'name3'"))
						)
				));
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE (col2 IN ('name1','name2','name3'))", sql.build());

	}
	
	@Test
	public void testSelectGroupByClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;

		sql = builder.select()
				.column("col1", "c", SQLFunction.Count)
				.from("myTable")
				.groupBy("c");
		Assert.assertEquals("SELECT COUNT(col1) AS c FROM myTable GROUP BY c", sql.build());

		sql = builder.select()
				.column("col1", "c", SQLFunction.Count)
				.column("col2", "a", SQLFunction.Average)
				.from("myTable")
				.groupBy("c")
				.groupBy("a");
		Assert.assertEquals("SELECT COUNT(col1) AS c,AVG(col2) AS a FROM myTable GROUP BY c,a", sql.build());
	}

	@Test
	public void testSelectOrderByClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.orderBy("col1");
		Assert.assertEquals("SELECT col1,col2 FROM myTable ORDER BY col1 ASC", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.orderBy("col2", true);
		Assert.assertEquals("SELECT col1,col2 FROM myTable ORDER BY col2 ASC", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.orderBy("col2", false);
		Assert.assertEquals("SELECT col1,col2 FROM myTable ORDER BY col2 DESC", sql.build());

		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.orderBy("col2", false)
				.orderBy("col1", true);
		Assert.assertEquals("SELECT col1,col2 FROM myTable ORDER BY col2 DESC,col1 ASC", sql.build());
	}

	@Test
	public void testSelectGroupByOrderByClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.groupBy("col1")
				.orderBy("col2");
		Assert.assertEquals("SELECT col1,col2 FROM myTable GROUP BY col1 ORDER BY col2 ASC", sql.build());
	}

	@Test
	public void testSelectJoinClause() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql;
		
		sql = builder.select()
				.column("col1")
				.column("col2")
				.from(builder.from()
						.table("myTable")
						.as("m"))
				.join(builder.innerJoin()
						.table("myTable2")
						.as("m2")
						.on("m.col1=m.col2"));
		Assert.assertEquals("SELECT col1,col2 FROM myTable AS m INNER JOIN myTable2 AS m2 ON m.col1=m.col2", sql.build());
	}

	@Test
	public void testSelectVarReplacement() {
		MSSQLBuilder builder = new MSSQLBuilder();
		SQLSelect sql = null;
		
		Map<String, Object> replacements = Maps.newHashMap();
		replacements.put("lazy1Value", "7");
		replacements.put("lazy2Value", 10);
		replacements.put("lazy3Value", "'blah%'");
		
		try {
			sql = builder.select()
					.column("col1")
					.column("col2")
					.from("myTable")
					.where(builder.filter()
							.column("col1").eq(builder.lazyParam("lazy1Value")));
			sql.build();
			Assert.fail("Shouldn't be able to build a SQL statement with a missing parameter");
		}
		catch (SQLBuilderException e) { }
		
		if (sql == null) {
			Assert.fail("Builder shouldn't be null at this point");
		}
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE col1 = 7", sql.build(replacements));
		
		
		sql = builder.select()
				.column("col1")
				.column("col2")
				.from("myTable")
				.where(builder.and(
						builder.filter().column("col1").eq(builder.lazyParam("lazy1Value")),
						builder.filter().column("col2").lessThan(builder.lazyParam("lazy2Value"))));
		Assert.assertEquals("SELECT col1,col2 FROM myTable WHERE (col1 = 7) AND (col2 < 10)", sql.build(replacements));

		
		sql = builder.select()
				.column("col1")
				.from("myTable")
				.where(builder.filter()
						.column("col1").like(builder.lazyParam("lazy3Value")));
		Assert.assertEquals("SELECT col1 FROM myTable WHERE col1 LIKE 'blah%'", sql.build(replacements));

	}

}
