/**
 * Copyright (c) 2013 Oculus Info Inc.
 * http://www.oculusinfo.com/
 *
 * Released under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package influent.server.rest;

import influent.idl.FL_DataAccess;
import influent.idl.FL_DateRange;
import influent.idl.FL_Duration;
import influent.idl.FL_Link;
import influent.idl.FL_LinkTag;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_SortBy;
import influent.idlhelper.PropertyHelper;
import influent.midtier.LedgerResult;
import influent.midtier.utilities.DateRangeBuilder;
import influent.server.utilities.DateTimeParser;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import oculus.aperture.common.rest.ApertureServerResource;

import org.apache.avro.AvroRemoteException;
import org.joda.time.DateTime;
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
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;
import org.restlet.resource.ResourceException;

import com.google.inject.Inject;

/**
 * Ledger Resource is intended to work with a jQuery DataTable on the front end, as such it
 * handles the parameters sent by them, and returns data in the format it expects.
 * 
 *
 */

public class TransactionTableResource extends ApertureServerResource {
	
	private final FL_DataAccess dataAccess;
	public static final long REQUEST_CAP = 1000;
	
	@Inject
	public TransactionTableResource(FL_DataAccess dataAccess) {
		this.dataAccess = dataAccess;
	}
	
	@Get
	public StringRepresentation getLedger() throws ResourceException {
		
		try {
			Form form = getRequest().getResourceRef().getQueryAsForm();
			
			String sEcho = form.getFirstValue("sEcho");
			
			// get the root node ID from the form
			String entityId = form.getFirstValue("entityId");
			try {
				if (entityId == null) {
					JSONObject result = new JSONObject();
					JSONArray dataArray = new JSONArray();
					result.put("aaData", dataArray);
					//result.put("aoColumns", columnArray);
					result.put("sEcho",sEcho);
					result.put("iTotalDisplayRecords",0);
					result.put("iTotalRecords",0);
					
					return new StringRepresentation(result.toString(), MediaType.TEXT_PLAIN);
				}
				entityId = entityId.trim();
				
				List<String> entities = new ArrayList<String>();
				entities.add(entityId);
				
				String startDateStr = form.getFirstValue("startDate").trim();
				String endDateStr = form.getFirstValue("endDate").trim();
				DateTime startDate = DateTimeParser.parse(startDateStr);
				DateTime endDate = DateTimeParser.parse(endDateStr);
				
				Integer startRow = Integer.parseInt(form.getFirstValue("iDisplayStart").trim());
				Integer totalRows = Integer.parseInt(form.getFirstValue("iDisplayLength").trim());
				
				FL_SortBy sortBy = FL_SortBy.DATE;
				String sort = form.getFirstValue("iSortCol_0");
				//String direction = form.getFirstValue("iSortDir_0");
				// TODO : use direction based on FL_SortBy 1.6 (current 1.5)
				if (sort != null) {
					if (sort.equals("3") || sort.equals("4")) {
						sortBy = FL_SortBy.AMOUNT;
					}
				}

				String focusIds = form.getFirstValue("focusIds");
				List<String> focusIdList = null;
				if (focusIds != null && focusIds.length() > 0) {
					String[] parsedIds = focusIds.split(",");
					focusIdList = new ArrayList<String>();
					for (String id : parsedIds) {
						List<Object> response = new ArrayList<Object>();
//						EntityCluster cluster = null;//MemoryTransientClusterStore.getInstance().getMap().get(id.trim());
//						if (cluster != null) {
//							response.add(cluster);
//						} else {
							response.addAll(dataAccess.getEntities(Collections.singletonList(id.trim())));
//						}
						focusIdList.addAll(ChartResource.getLeafNodes(response));
					}
				}
				
				FL_DateRange dateRange = DateRangeBuilder.getDateRange(startDate, endDate);
				long transactionRequestMax = REQUEST_CAP;//Math.min(REQUEST_CAP, startRow+totalRows);
				Map<String, List<FL_Link>> results = dataAccess.getAllTransactions(entities, FL_LinkTag.FINANCIAL, dateRange, sortBy, focusIdList, transactionRequestMax);
				LedgerResult ledgerResult = buildForClient(results, startRow, startRow+totalRows);
				
				List<String> colNames = ledgerResult.getColumnNames();
				List<List<String>> data = ledgerResult.getTableData();
				
				JSONArray dataArray = new JSONArray();
				
				int rowNumber = startRow+1;
				for (List<String> row : data) {
					JSONArray rowArr = new JSONArray();
					rowArr.put(rowNumber);
					for (String d : row) {
						rowArr.put(d);
					}
					dataArray.put(rowArr);
					rowNumber++;
				}
				
				JSONArray columnArray = new JSONArray();
				for (String column : colNames) {
					JSONObject colObj = new JSONObject();
					colObj.put("sTitle", column);
					columnArray.put(colObj);
				}
				
				JSONObject result = new JSONObject();
				
				result.put("sEcho",sEcho);
				result.put("aoColumns", columnArray);
				result.put("iTotalDisplayRecords",ledgerResult.getTotalRows());
				result.put("iTotalRecords",ledgerResult.getTotalRows());
				result.put("aaData", dataArray);
				
				return new StringRepresentation(result.toString(), MediaType.TEXT_PLAIN);
			} catch (JSONException je) {
				return null;
			}
		
		} catch (AvroRemoteException dae) {
			throw new ResourceException(
				Status.CLIENT_ERROR_BAD_REQUEST,
				"Data access error.",
				dae
			);
		}
	}
	
	private static DecimalFormat us_df = new DecimalFormat("$#,##0.00;$-#,##0.00");
	private static DecimalFormat world_df = new DecimalFormat("#,##0.00;-#,##0.00");
	private static DecimalFormat world_if = new DecimalFormat("#,##0;-#,##0");
	private static DateTimeFormatter date_formatter = DateTimeFormat.forPattern("yyyy-MM-dd");
	private static String formatCur(Number d, boolean isUSD) { return d == null ? "" : 0.0 == d.doubleValue()? "-" : isUSD? us_df.format(d) : world_df.format(d); }
	private static String formatCount(Number d) { return d == null ? "" : 0.0 == d.doubleValue()? "-" : world_if.format(d); }

	private static String formatDur(FL_Duration d) { 
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
	
	public static LedgerResult buildForClient(Map<String, List<FL_Link>> results, int beginIndex, int endIndex) {
		assert(beginIndex <= endIndex);
		beginIndex = Math.max(0, beginIndex);
		int resultsEndIndex = 0;
		for(List<FL_Link> links : results.values()) {
			resultsEndIndex += links.size();
		}
		endIndex = Math.min(endIndex, resultsEndIndex);	
		int index = 0;								// use an index to get the required subset; prevents useless parsing and saves time

		List<List<String>> tableData = new ArrayList<List<String>>();
		
		for (List<FL_Link> links : results.values()) {
			for (FL_Link link : links) { 
				if(index >= beginIndex && index < endIndex) {

					DateTime date = null;
					String comment = null;
					String inflowing = null;
					String outflowing = null;
					
					for (FL_Property prop : link.getProperties()) {
						PropertyHelper property = PropertyHelper.from(prop);
						
						if (property.hasTag(FL_PropertyTag.INFLOWING) && property.hasValue()) {
							if (property.hasTag(FL_PropertyTag.DURATION))
								inflowing = formatDur((FL_Duration)property.getValue());
							else
								inflowing = formatCur((Number)property.getValue(), property.hasTag(FL_PropertyTag.USD));
						} else if (property.hasTag(FL_PropertyTag.OUTFLOWING) && property.hasValue()) {
							if (property.hasTag(FL_PropertyTag.DURATION))
								outflowing = formatDur((FL_Duration)property.getValue());
							else
								outflowing = formatCur((Number)property.getValue(), property.hasTag(FL_PropertyTag.USD));
						} else if (property.hasTag(FL_PropertyTag.AMOUNT) && property.hasValue()) {
							Number value = (Number)property.getValue();
							String fvalue = (property.hasTag(FL_PropertyTag.COUNT))? formatCount(value) : formatCur(value, property.hasTag(FL_PropertyTag.USD));
							if (value.doubleValue() < 0) outflowing = fvalue;
							else inflowing = fvalue;
	
						// date or comments?
						} else if (property.hasTag(FL_PropertyTag.DATE)) {
							date = new DateTime((Long)property.getValue());
						} else if (property.hasTag(FL_PropertyTag.ANNOTATION)) {
							comment = (String)property.getValue();
						}
					}
						
					List<String> newRow = new ArrayList<String>(5);
					newRow.add(date.toString(date_formatter)); // Date
					newRow.add(comment);      // Comment
					newRow.add(inflowing); 
					newRow.add(outflowing); 
					newRow.add(link.getSource()); //Source entityId
					newRow.add(link.getTarget()); //Destination entityId
					tableData.add(newRow);
				}
				
				if(index >= endIndex) {
					break;
				}
				
				index++;
			}
			
			if(index >= endIndex) {
				break;
			}
		}
		
		int cols = 5;
		
		List<String> columnNames = new ArrayList<String>();
		columnNames.add("Date");
		columnNames.add("Comment");
		columnNames.add("Inflowing");
		columnNames.add("Outflowing");
		
		return new LedgerResult(cols, endIndex - beginIndex, columnNames, tableData, resultsEndIndex);
	}
	
}
