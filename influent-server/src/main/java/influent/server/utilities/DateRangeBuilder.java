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

import influent.idl.FL_DateInterval;
import influent.idl.FL_DateRange;

import org.joda.time.DateTime;
import org.joda.time.Days;
import org.joda.time.Hours;
import org.joda.time.Months;
import org.joda.time.Seconds;
import org.joda.time.Weeks;
import org.joda.time.Years;

public class DateRangeBuilder {
	
	public static FL_DateRange getDateRange(DateTime startDate, DateTime endDate) {
		
		if (startDate == null || endDate == null) {
			return null;
		}
		
		// TODO: add support for numIntervalsPerBin, but on the client resource side in charts only.
		Days days = Days.daysBetween(startDate, endDate);
		if (days.getDays() == 14) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 14L); }
//		if (days.getDays() == 30) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 15L, 2); }
//		if (days.getDays() == 60) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 15L, 4); }
		Weeks weeks = Weeks.weeksBetween(startDate, endDate);
		if (weeks.getWeeks() == 16) { return new ConstrainedDateRange(startDate, FL_DateInterval.WEEKS, 16L); }
//		if (weeks.getWeeks() == 32) { return new ConstrainedDateRange(startDate, FL_DateInterval.WEEKS, 16L, 2); }
		Months months = Months.monthsBetween(startDate, endDate);
		if (months.getMonths() == 12) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 12L); }
		if (months.getMonths() == 16) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 16L); }
//		if (months.getMonths() == 24) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 16L, 2); }
		if (months.getMonths() == 32) { return new ConstrainedDateRange(startDate, FL_DateInterval.QUARTERS, 12L); }
		Years years = Years.yearsBetween(startDate, endDate);
		if (years.getYears() == 4) { return new ConstrainedDateRange(startDate, FL_DateInterval.QUARTERS, 16L); }
//		if (years.getYears() == 8) { return new ConstrainedDateRange(startDate, FL_DateInterval.QUARTERS, 16L, 2); }
		if (years.getYears() == 16) { return new ConstrainedDateRange(startDate, FL_DateInterval.YEARS, 16L); }
		
		throw new RuntimeException("Unsupported chart date range: "+ startDate + " to "+ endDate);
	}
	
	
	
	
	public static FL_DateRange getBigChartDateRange(DateTime startDate, DateTime endDate) {
		if (startDate == null || endDate == null) {
			return null;
		}
		
		
		Days days = Days.daysBetween(startDate, endDate);
		if (days.getDays() <= 14) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 14L); }
		if (days.getDays() <= 30) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 30L); }
		if (days.getDays() <= 60) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 60L); }
		Weeks weeks = Weeks.weeksBetween(startDate, endDate);
		if (weeks.getWeeks() <= 16) { return new ConstrainedDateRange(startDate, FL_DateInterval.DAYS, 112L); }
		if (weeks.getWeeks() <= 32) { return new ConstrainedDateRange(startDate, FL_DateInterval.WEEKS, 32L); }
		Months months = Months.monthsBetween(startDate, endDate);
		if (months.getMonths() <= 12) { return new ConstrainedDateRange(startDate, FL_DateInterval.WEEKS, 52); }
		if (months.getMonths() <= 16) { return new ConstrainedDateRange(startDate, FL_DateInterval.WEEKS, 70L); }
		if (months.getMonths() <= 24) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 24L); }
		if (months.getMonths() <= 32) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 32L); }
		Years years = Years.yearsBetween(startDate, endDate);
		if (years.getYears() <= 4) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 48L); }
		if (years.getYears() <= 5) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 60L); }
		if (years.getYears() <= 6) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 72L); }
		if (years.getYears() <= 7) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 84L); }
		if (years.getYears() <= 8) { return new ConstrainedDateRange(startDate, FL_DateInterval.MONTHS, 96L); }
		if (years.getYears() <= 16) { return new ConstrainedDateRange(startDate, FL_DateInterval.QUARTERS, 64L); }

		throw new RuntimeException("Unsupported chart date range: "+ startDate + " to "+ endDate);
	}
	
	
	
	
	public static int determineInterval(DateTime date, DateTime startDate, FL_DateInterval interval, int numIntervalsPerBin) {
		switch (interval) {
		case SECONDS:
			Seconds seconds = Seconds.secondsBetween(startDate, date);
			return seconds.getSeconds()/numIntervalsPerBin;
		case HOURS:
			Hours hours = Hours.hoursBetween(startDate, date);
			return hours.getHours()/numIntervalsPerBin;
		case DAYS:
			Days days = Days.daysBetween(startDate, date);
			return days.getDays()/numIntervalsPerBin;
		case WEEKS:
			Weeks weeks = Weeks.weeksBetween(startDate, date);
			return weeks.getWeeks()/numIntervalsPerBin;
		case MONTHS:
			Months months = Months.monthsBetween(startDate, date);
			return months.getMonths()/numIntervalsPerBin;
		case QUARTERS:
			months = Months.monthsBetween(startDate, date);
			return months.getMonths()/3/numIntervalsPerBin;
		case YEARS:
			Years years = Years.yearsBetween(startDate, date);
			return years.getYears()/numIntervalsPerBin;
		}
		return 0;
	}
}
