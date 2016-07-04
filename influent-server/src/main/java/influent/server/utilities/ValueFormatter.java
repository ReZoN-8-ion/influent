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

import influent.idl.FL_BoundedRange;
import influent.idl.FL_DistributionRange;
import influent.idl.FL_Frequency;
import influent.idl.FL_GeoData;
import influent.idl.FL_ListRange;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_SingletonRange;

import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

public class ValueFormatter {
	
	private static String NULLSTR = "Unspecified";
	private static int DIST_SAMPLE_SIZE = 3;
	
	private static interface Formatter {
		public String format(Object val);
	}

	private static Formatter getFormatter(FL_Property property) {
		if (property.getTags().contains(FL_PropertyTag.GEO)) {
			return new Formatter() {
				@Override
				public String format(Object val) {
					if (val instanceof FL_GeoData) {			
						return ((FL_GeoData)val).getCc();
					}
					if (val == null || val.toString().isEmpty()) {
						return NULLSTR;
					}
					return val.toString();
				}
			};
		} else if (property.getTags().contains(FL_PropertyTag.DATE)) {
			return new Formatter() {
				final DateTimeFormatter fmt = DateTimeFormat.forPattern("MMMMMMMM dd, yyyy").withZoneUTC();
				
				@Override
				public String format(Object val) {
					if (val instanceof Long) {
						return fmt.print((Long)val);
					}
					if (val == null || val.toString().isEmpty()) {
						return NULLSTR;
					}
					return val.toString();
				}
			};
		} else {
			return new Formatter() {
				@Override
				public String format(Object val) {
					if (val == null || val.toString().isEmpty()) {
						return NULLSTR;
					}
					return val.toString();
				}
			};
		}

	}
	
	public static String format(FL_Property property) {
		if (property != null) {
			Formatter fmt= getFormatter(property);
			
			Object range = property.getRange();
			
			if (range != null) {
				if (range instanceof FL_SingletonRange) {
					return fmt.format(((FL_SingletonRange)range).getValue());
				}
				
				StringBuilder sb = new StringBuilder();
				
				if (range instanceof FL_BoundedRange) {
					FL_BoundedRange bounded = (FL_BoundedRange) range;
					
					sb.append(fmt.format(bounded.getStart()));
					sb.append(" to ");
					sb.append(fmt.format(bounded.getEnd()));
					
				} else if (range instanceof FL_ListRange) {
					FL_ListRange list = (FL_ListRange) range;
					
					if (list.getValues() != null) {
						for (Object val : list.getValues()) {
							if (sb.length() != 0) {
								sb.append(", ");
							}
							sb.append(fmt.format(val));
						}
					}
					
				} else if (range instanceof FL_DistributionRange) {
					FL_DistributionRange dist = (FL_DistributionRange) range;
					
					int samplesize = 0;
					
					for (FL_Frequency freq: dist.getDistribution()) {
						if (sb.length() != 0) {
							if (samplesize == DIST_SAMPLE_SIZE) {
								sb.append("...");
								break;
							}
							sb.append(", ");
						}
						samplesize++;
						
						// TO DO: this doesn't handle distributions of bounded or list
						sb.append(fmt.format(freq.getRange()));
					}
				}
				
				return sb.toString();
			}
		}
		
		return NULLSTR;
	}
	
}
