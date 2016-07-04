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
package influent.server.utilities;

import org.joda.time.DateTime;
import org.joda.time.DateTimeConstants;
import org.joda.time.DateTimeUtils;
import org.joda.time.DateTimeZone;
import org.joda.time.Period;
import org.joda.time.PeriodType;
import org.joda.time.chrono.ISOChronology;
import org.joda.time.field.FieldUtils;
import org.joda.time.format.ISODateTimeFormat;

/**
 * DateTime handler for influent dates.
 * 
 * @author djonker
 */
public class DateTimeParser {
	
	/**
	 * @see http://joda-time.sourceforge.net/apidocs/org/joda/time/DateTime.html#parse(java.lang.String)
	 */
	public static DateTime parse(String str) {
		if (str == null || str.isEmpty())
			return null;
		
		// if we can, just pick out the date because we need to ignore any time zone information.
		if (str.length() >= 10) {
			try {
				int yyyy = Integer.parseInt(str.substring(0, 4));
				int mm   = Integer.parseInt(str.substring(5, 7));
				int dd   = Integer.parseInt(str.substring(8, 10));

				// extra sanity check
				switch (str.charAt(4)) {
				case '-':
				case '/':
					return new DateTime(yyyy, mm, dd, 0,0,0, DateTimeZone.UTC);
				}
				
			} catch (Exception e) {
			}
		}
		
		final DateTime d = ISODateTimeFormat.dateTimeParser().withOffsetParsed().parseDateTime(str);
		
		return new DateTime(d.getYear(), d.getMonthOfYear(), d.getDayOfMonth(), 0,0,0, DateTimeZone.UTC);
	}

	public static DateTime fromFL(Object value) {
		if (value instanceof Long) {
			return new DateTime(((Long)value).longValue(), DateTimeZone.UTC);
		}
		
		return null;
	}
	
	/**
	 * @see http://joda-time.sourceforge.net/apidocs/org/joda/time/Period.html#normalizedStandard()
	 */
	public static Period normalize(Period period) {
		long millis = period.getMillis();
		millis+= period.getSeconds() * DateTimeConstants.MILLIS_PER_SECOND;
		millis+= period.getMinutes() * DateTimeConstants.MILLIS_PER_MINUTE;
		millis+= period.getHours() * DateTimeConstants.MILLIS_PER_HOUR;
		millis+= period.getDays() * DateTimeConstants.MILLIS_PER_DAY;
		millis+= period.getWeeks() * DateTimeConstants.MILLIS_PER_WEEK;

		Period result = new Period(millis, DateTimeUtils.getPeriodType(PeriodType.standard()), ISOChronology.getInstanceUTC());
		int years = period.getYears();
		int months = period.getMonths();
		
		if (years != 0 || months != 0) {
			years = FieldUtils.safeAdd(years, months / 12);
			months = months % 12;
			if (years != 0) {
				result = result.withYears(years);
			}
			if (months != 0) {
				result = result.withMonths(months);
			}
		}
		
		return result;
	}
}
