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

package influent.idlhelper;

import influent.idl.FL_DateInterval;
import influent.idl.FL_DateRange;
import influent.idl.FL_Duration;

import java.io.IOException;
import java.util.List;

public class DateRangeHelper extends FL_DateRange {
	
	public DateRangeHelper(long start, FL_DateInterval interval, long numBins) {
		super(start, numBins, new FL_Duration(interval, 1L));
	}
	
	public DateRangeHelper(long start, FL_DateInterval interval, long numBins, long numIntervalsPerBin) {
		super(start, numBins, new FL_Duration(interval, numIntervalsPerBin));
	}
	
	public DateRangeHelper(long start, long numBins, FL_Duration durationPerBin) {
		super(start, numBins, durationPerBin);
	}
	
	public String toJson() throws IOException {
		return SerializationHelper.toJson(this);
	}
	
	public static String toJson(FL_DateRange date) throws IOException {
		return SerializationHelper.toJson(date);
	}

	public static String toJson(List<FL_DateRange> dates) throws IOException {
		return SerializationHelper.toJson(dates, FL_DateRange.getClassSchema());
	}
	
	public static FL_DateRange fromJson(String json) throws IOException {
		return SerializationHelper.fromJson(json, FL_DateRange.getClassSchema());
	}
	
	public static List<FL_DateRange> listFromJson(String json) throws IOException {
		return SerializationHelper.listFromJson(json, FL_DateRange.getClassSchema());
	}
}
