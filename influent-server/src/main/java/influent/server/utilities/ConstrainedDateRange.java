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
import influent.idlhelper.DateRangeHelper;

import org.joda.time.DateTime;
import org.joda.time.DateTimeConstants;
import org.joda.time.DateTimeZone;

/**
 * @author djonker
 *
 */
public class ConstrainedDateRange extends DateRangeHelper {

	
	/**
	 * Constructs a date range that is constrained to begin and end on instances of the specified
	 * interval, and that is guaranteed to include the range specified.
	 * 
	 * @param start
	 * @param interval
	 * @param numBins
	 */
	public ConstrainedDateRange(DateTime start, FL_DateInterval interval, long numBins) {
		super(start.getMillis(), interval, numBins);

		DateTime constrained= start;
		
		// constrain to start of interval.
		switch (interval) {
		
		case SECONDS:
			constrained = new DateTime(start.getYear(), start.getMonthOfYear(), start.getDayOfMonth(), start.getHourOfDay(), start.getMinuteOfHour(), start.getSecondOfMinute(), DateTimeZone.UTC);
			break;
			
		case HOURS:
			constrained = new DateTime(start.getYear(), start.getMonthOfYear(), start.getDayOfMonth(), start.getHourOfDay(), 0, DateTimeZone.UTC);
			break;
			
		case DAYS:
			constrained = new DateTime(start.getYear(), start.getMonthOfYear(), start.getDayOfMonth(), 0, 0, DateTimeZone.UTC);
			break;
			
		case WEEKS:
			constrained = new DateTime(start.getYear(), start.getMonthOfYear(), start.getDayOfMonth(), 0, 0, DateTimeZone.UTC);
			
			final int days = start.getDayOfWeek() % 7;
			final long rewindMillis = days * DateTimeConstants.MILLIS_PER_DAY;

			constrained = new DateTime(constrained.getMillis() - rewindMillis, constrained.getZone());
			
			break;
			
		case MONTHS:
			constrained = new DateTime(start.getYear(), start.getMonthOfYear(), 1, 0, 0, DateTimeZone.UTC);
			break;
			
		case QUARTERS:
			constrained = new DateTime(start.getYear(), 1 + 3*((start.getMonthOfYear() - 1)/3), 1, 0, 0, DateTimeZone.UTC);
			break;
			
		case YEARS:
			constrained = new DateTime(start.getYear(), start.getMonthOfYear(), 1, 0, 0, DateTimeZone.UTC);
			break;
		}
		
		// add an extra partial interval at the end when not large enough.
		if (!start.equals(constrained)) {
			//System.out.println(start + " -> " + constrained);

			setStartDate(constrained.getMillis());
			setNumBins(numBins + 1);
		}
	}

}
