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
package influent.server.dataaccess;

import influent.idl.FL_DateInterval;
import influent.idl.FL_DateRange;
import influent.idl.FL_DirectionFilter;
import influent.idl.FL_LinkEntityTypeFilter;
import influent.server.configuration.ApplicationConfiguration;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;

import java.io.Serializable;
import java.util.*;

public class DataAccessHelper {

	// --- Flow ---
	public static final String FLOW_TABLE 									= "FinFlow";
	
	public static final String FLOW_COLUMN_FROM_ENTITY_ID 					= "FinFlow_FromEntityId";
	public static final String FLOW_COLUMN_FROM_ENTITY_TYPE 				= "FinFlow_FromEntityType";
	public static final String FLOW_COLUMN_TO_ENTITY_ID 					= "FinFlow_ToEntityId";
	public static final String FLOW_COLUMN_TO_ENTITY_TYPE 					= "FinFlow_ToEntityType";
	public static final String FLOW_COLUMN_AMOUNT 							= "FinFlow_Amount";
	public static final String FLOW_COLUMN_PERIOD_DATE						= "FinFlow_PeriodDate";

	// --- Entity ---
	public static final String ENTITY_TABLE									= "FinEntity";
	
	public static final String ENTITY_COLUMN_ENTITY_ID 						= "FinEntity_EntityId";
	public static final String ENTITY_COLUMN_INBOUND_AMOUNT 				= "FinEntity_InboundAmount";
	public static final String ENTITY_COLUMN_INBOUND_DEGREE 		        = "FinEntity_InboundDegree";
	public static final String ENTITY_COLUMN_UNIQUE_INBOUND_DEGREE 			= "FinEntity_UniqueInboundDegree";
	public static final String ENTITY_COLUMN_OUTBOUND_AMOUNT 				= "FinEntity_OutboundAmount";
	public static final String ENTITY_COLUMN_OUTBOUND_DEGREE 		        = "FinEntity_OutboundDegree";
	public static final String ENTITY_COLUMN_UNIQUE_OUTBOUND_DEGREE 		= "FinEntity_UniqueOutboundDegree";
	public static final String ENTITY_COLUMN_PERIOD_DATE					= "FinEntity_PeriodDate";
	public static final String ENTITY_COLUMN_NUM_TRANSACTIONS				= "FinEntity_NumTransactions";
	public static final String ENTITY_COLUMN_EARLIEST_TRANSACTION			= "FinEntity_StartDate";
	public static final String ENTITY_COLUMN_LATEST_TRANSACTION				= "FinEntity_EndDate";
	public static final String ENTITY_COLUMN_MAX_TRANSACTION				= "FinEntity_MaxTransaction";
	public static final String ENTITY_COLUMN_AVG_TRANSACTION				= "FinEntity_AvgTransaction";

	// --- Transactions
	public static final String RAW_TRANSACTIONS_TABLE	                    = "RawTransactions";

	// --- DataSummary
	public static final String DATA_SUMMARY_TABLE		                    = "DataSummary";
	
	public static final String DATA_SUMMARY_TABLE_COLUMN_SUMMARY_ORDER		= "DataSummary_SummaryOrder";
	public static final String DATA_SUMMARY_TABLE_COLUMN_SUMMARY_KEY		= "DataSummary_SummaryKey";
	public static final String DATA_SUMMARY_TABLE_COLUMN_SUMMARY_LABEL		= "DataSummary_SummaryLabel";
	public static final String DATA_SUMMARY_TABLE_COLUMN_SUMMARY_VALUE		= "DataSummary_SummaryValue";

	// Serves no purpose other than for us to identify popup requests down the line when we are looking up entities.
	public interface DetailsSubject {}
	
	
	
	
	public static List<String> detailsSubject(String id) {
		return new DetailsSubjectList(id);
	}
	
	
	
	
	private static class DetailsSubjectList extends AbstractList<String> implements DetailsSubject, RandomAccess, Serializable {
		
		static final long serialVersionUID = 3093736618740652951L;
		private final String _id;

		DetailsSubjectList(String id) {
			_id = id;
		}

		public int size() {
			return 1;
		}

		public boolean contains(Object obj) {
			return _id.equals(obj);
		}

		public String get(int index) {
			if (index != 0) throw new IndexOutOfBoundsException("Index: "+index+", Size: 1");
			
			return _id;
		}
	}
	
	
	
	
	/**
	 * Formats a date, exclusive of time, as a UTC date string.
	 */
	public static String format(Long date) {
		if (date == null) {
			return null;
		}
		
		return format(new DateTime((long)date, DateTimeZone.UTC));
	}
	
	
	
	
	private static void pad00(
		int n, 
		StringBuilder s
	) {
		
		if (n < 10) {
			s.append('0');
		}
		s.append(n);
	}
	
	
	
	
	public static String format(DateTime dateTime) {
		
		if (dateTime == null) {
			return null;
		}
		
		StringBuilder s = new StringBuilder(10);
		
		s.append(dateTime.getYear());
		s.append('-');
		
		pad00(dateTime.getMonthOfYear(), s);
		s.append('-');
		
		pad00(dateTime.getDayOfMonth(), s);
		s.append(' ');

		pad00(dateTime.getHourOfDay(), s);
		s.append(':');
		
		pad00(dateTime.getMinuteOfHour(), s);
		s.append(':');
		
		pad00(dateTime.getSecondOfMinute(), s);
		s.append('.');
		
		int ms = dateTime.getMillisOfSecond();

		if (ms < 100) {
			s.append('0');
		}
		pad00(ms, s);
		
		return s.toString();
	}
	
	
	
	
	public static DateTime getStartDate(FL_DateRange date) {
		
		if (date == null || date.getStartDate() == null) {
			return null;
		}
		
		return new DateTime((long)date.getStartDate(), DateTimeZone.UTC);
	}
	
	
	
	
	public static DateTime getExclusiveEndDate(FL_DateRange date) {
		
		if (date == null) {
			return null;
		}

		DateTime d = new DateTime((long)date.getStartDate(), DateTimeZone.UTC);

		switch (date.getDurationPerBin().getInterval()) {
		case SECONDS:
			return d.plusSeconds(date.getNumBins().intValue());
		case HOURS:
			return d.plusHours(date.getNumBins().intValue());
		case DAYS:
			return d.plusDays(date.getNumBins().intValue());
		case WEEKS:
			return d.plusWeeks(date.getNumBins().intValue());
		case MONTHS:
			return d.plusMonths(date.getNumBins().intValue());
		case QUARTERS:
			return d.plusMonths(date.getNumBins().intValue() * 3);
		case YEARS:
			return d.plusYears(date.getNumBins().intValue());
		}
		
		return d;
	}
	
	
	
	
	/**
	 * Gets the inclusive end date for SQL between. 
	 */
	public static DateTime getEndDate(FL_DateRange date) {
		
		if (date == null) {
			return null;
		}

		// max millisecond precision in SQL datetime is .997
		return getExclusiveEndDate(date).minusMillis(3);
	}
	
	
	
	
	public static List<Date> getDateIntervals(FL_DateRange date) {
		
		Calendar c = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		c.setTimeInMillis(date.getStartDate());
		
		List<Date> dates = new ArrayList<Date>(date.getNumBins().intValue());
		for (int i = 0; i < date.getNumBins().intValue(); i++) {
			dates.add(c.getTime());
			switch (date.getDurationPerBin().getInterval()) {
				case SECONDS:
					c.add(Calendar.SECOND, 1);
					break;
				case HOURS:
					c.add(Calendar.HOUR_OF_DAY, 1);
					break;
				case DAYS:
					c.add(Calendar.DATE, 1);
					break;
				case WEEKS:
					c.add(Calendar.DATE, 7);
					break;
				case MONTHS:
					c.add(Calendar.MONTH, 1);
					break;
				case QUARTERS:
					c.add(Calendar.MONTH, 3);
					break;
				case YEARS:
					c.add(Calendar.YEAR, 1);
					break;
			}
		}
		
		return dates;
	}
	
	
	
	
	public static boolean isDateInRange(long date, FL_DateRange range) {
		return range.getStartDate() <= date && date <= getEndDate(range).getMillis();
	}
	
	
	
	
	public static String standardTableName(String tableSeriesName, FL_DateInterval interval) {
		if (interval != null) {
			return tableSeriesName + getIntervalLevel(interval);
		}
		
		return tableSeriesName;
	}

	
	
	
	public static String getIntervalLevel(FL_DateInterval interval) {
		switch (interval) {
		case SECONDS:
			return "By The Second";
		case HOURS:
			return "Hourly";
		case DAYS:
			return "Daily";
		case WEEKS:
			return "Weekly";
		case MONTHS:
			return "Monthly";
		case QUARTERS:
			return "Quarterly";
		case YEARS:
			return "Yearly";
		}
		return "Yearly";
	}

	
	
	
	public static String createInClause(Collection<String> inItems) {
		return createInClause(inItems, null, null);
	}
	
	
	
	
	public static String createInClause(
		Collection<String> inItemIds, 
		DataNamespaceHandler nameSpaceHandler,
		ApplicationConfiguration.SystemColumnType idType
	) {
		
		StringBuilder resultString = new StringBuilder();
		resultString.append("(");
		
		for (String item : inItemIds) {
			if(nameSpaceHandler == null) {
				resultString.append("'" + item + "',");
			} else {
				resultString.append(nameSpaceHandler.toSQLId(item, idType) + ",");
			}
		}
		if (!inItemIds.isEmpty()) {
			resultString.deleteCharAt(resultString.lastIndexOf(","));
		}

		resultString.append(")");
		return resultString.toString();
	}
	
	
	
	
	public static String linkEntityTypeClause(
		FL_DirectionFilter direction, 
		FL_LinkEntityTypeFilter entityType
	) {
		
		if (entityType == FL_LinkEntityTypeFilter.ANY) return " 1=1 ";
		
		StringBuilder clause = new StringBuilder();
		String type = "A";
		if (entityType == FL_LinkEntityTypeFilter.ACCOUNT_OWNER) {
			type = "O";
		} else if (entityType == FL_LinkEntityTypeFilter.CLUSTER_SUMMARY) {
			type = "S";
		}
		
		// reverse direction - we are filtering on other entity
		switch (direction) {
		case DESTINATION:
			clause.append(" FromEntityType = '" + type + "' ");
			break;
		case SOURCE:
			clause.append(" ToEntityType = '" + type + "' ");
			break;
		case BOTH:
			clause.append(" ToEntityType = '" + type + "' AND FromEntityType = '" + type + "' ");
			break;
		}
		
		return clause.toString();
	}
}
