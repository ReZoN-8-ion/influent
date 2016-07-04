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

import influent.idl.FL_Duration;

import java.text.DecimalFormat;

import org.joda.time.Days;
import org.joda.time.Hours;
import org.joda.time.Months;
import org.joda.time.Period;
import org.joda.time.ReadablePeriod;
import org.joda.time.Seconds;
import org.joda.time.Weeks;
import org.joda.time.Years;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.PeriodFormatter;
import org.joda.time.format.PeriodFormatterBuilder;

public class ResultFormatter {
	
	public static DecimalFormat us_df = new DecimalFormat("$#,##0.00;$-#,##0.00");
	public static DecimalFormat world_df = new DecimalFormat("#,##0.00;-#,##0.00");
	public static DecimalFormat world_if = new DecimalFormat("#,##0;-#,##0");
	public static DateTimeFormatter date_formatter = DateTimeFormat.forPattern("yyyy-MM-dd");
	public static String formatCur(Number d, boolean isUSD) { return d == null ? "-" : isUSD? us_df.format(d) : world_df.format(d); }
	public static String formatCount(Number d) { return d == null ? "-" : world_if.format(d); }

	public static String formatDur(FL_Duration d) { 
		if (d == null) return "";
		
		int t = d.getNumIntervals().intValue();
		if (t == 0) return "-";
		
		ReadablePeriod period = null;
		switch (d.getInterval()) {
		case SECONDS:
			period = Seconds.seconds(t);
			break;
		case HOURS:
			period = Hours.hours(t);
			break;
		case DAYS:
			period = Days.days(t);
			break;
		case WEEKS:
			period = Weeks.weeks(t);
			break;
		case MONTHS:
			period = Months.months(t);
			break;
		case QUARTERS:
			period = Months.months(t*3);
			break;
		case YEARS:
			period = Years.years(t);
			break;
		}
		
		PeriodFormatter formatter = new PeriodFormatterBuilder()
	        .printZeroAlways()
	        .minimumPrintedDigits(2)
	        .appendHours()
	        .appendSeparator(":")
	        .printZeroAlways()
	        .minimumPrintedDigits(2)
	        .appendMinutes()
	        .appendSeparator(":")
	        .printZeroAlways()
	        .minimumPrintedDigits(2)
	        .appendSeconds()
	        .toFormatter();
		final String ftime = formatter.print(DateTimeParser.normalize(new Period(period)));

		return ftime;
	}

}
