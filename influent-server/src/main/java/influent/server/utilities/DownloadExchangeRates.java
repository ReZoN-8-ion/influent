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

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

/**
 * Downloads a set of exchange rates for 
 * 
 * @author djonker
 */
public class DownloadExchangeRates {

	/**
	 * Format for specifying dates
	 */
	private static String DATE_FORMAT = "yyyy-M-d";
	
	/**
	 * Template to use for queries
	 */
	private static final String QUERY_TEMPLATE = "http://www.oanda.com/currency/historical-rates/download?"
			+"quote_currency={$currency}"
			+"&end_date={$endDate}&start_date={$startDate}" 
			+"&period=daily&display=absolute&rate=0&data_range=d30&price=bid&view=graph"
			+"&base_currency_0={$rate0}&base_currency_1={$rate1}&base_currency_2={$rate2}&base_currency_3={$rate3}&base_currency_4={$rate4}"
			+"&download=csv";
	

	/**
	 * Usage instructions
	 */
	private static String HELP = 
			 "Downloads foreign exchange rates from or to a base currency.\n\n"
			+"usage: [-h]|[-s startDate][-e endDate][-d directory][-f filename][-v][-p pauseInMs][-t] BASE_CURRENCY, CURRENCY_1 [, CURRENCY_2,...]\n"
			+"\n"
			+"-h\n"
			+"    displays this help message\n"
			+"\n"
			+"-e endDate[=yesterday]\n"
			+"    the last date to fetch data for, as YYYY-MM-DD.\n"
			+"\n"
			+"-s startDate[=endDate - 29 days]\n"
			+"    the first date to fetch data for, as YYYY-MM-DD.\n"
			+"\n"
			+"-f filename[=defaultname.csv]\n"
			+"    the name of the file to download to.\n"
			+"\n"
			+"-d directory[=.]\n"
			+"    the directory to download to, if not specified by filename.\n"
			+"\n"
			+"-t\n"
			+"    convert to the base currency, rather than from.\n"
			+"\n"
			+"-v\n"
			+"    verbose output\n"
			+"\n"
			+"-p pauseInMs[=20]\n"
			+"    the amount of time in milliseconds to pause between requests, to avoid denial of service issues.\n"
			+"\n"
			+"BASE_CURRENCY\n"
			+"    the currency to convert to all other currencies. a column will be included for this with a value of 1.\n"
			+"\n"
			+"CURRENCY_1 [, CURRENCY_2,...]\n"
			+"    the currencies being converted to. a column will be included for each currency.\n"
			+"\n\n"
			+"For example: -t USD CAD GBP -s 2013-01-01 -e 2013-06-01 -d C:/Users/me/Desktop/\n"
			;

	/**
	 * Download currency rates.
	 * 
	 * @param startDate
	 * 		The first date to fetch data for.
	 * @param endDate
	 * 		The latest date to fetch data for.
	 * @param currencies
	 * 		The list of currencies to convert, where the first currency is the base currency.
	 * @param filename
	 * 		The name of the file to download to.
	 * @param toBaseCurrency
	 * 		Convert to the base currency, or false from.
	 * @param verbose
	 * 		Verbose output.
	 * @param pauseInMs
	 * 		the amount of time in milliseconds to pause between requests, to avoid denial of service problems.
	 * 
	 * @return
	 * 		true if successful.
	 */
	public static boolean download(Calendar startDate, Calendar endDate, ArrayList<String> currencies, String filename, boolean toBaseCurrency, boolean verbose, long pauseInMs) {
		
		// Oanda date format
		final SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);
	

		// Oanda requires blocks of five
		int blocks = (int)Math.ceil(currencies.size() / 5.0);
		
		// clone this and pad it
		String rates[] = new String[5*blocks];
		
		for (int i=0; i< rates.length; i++) {
			rates[i] = (i < currencies.size())? currencies.get(i) : "";
		}

		// base currency
		String currency = currencies.get(0);
		
		
		BufferedWriter fwriter = null;
		
		// now start the file
		try {
	    	fwriter = new BufferedWriter(new FileWriter(filename));
	    	
			System.out.print("Downloading...");
			
	    	// write the header
	    	fwriter.write("Date");
	    	
			for (int i=0; i< currencies.size(); i++) {
				fwriter.write(","+ currencies.get(i));
			}
			
			// reuse this
			ArrayList<String> lines= new ArrayList<String>(30);
			
			// Oanda max date blocks are 30 days
			while (endDate.compareTo(startDate) >= 0) {
				
				// OANDA expects start and end date, inclusive
				Calendar qStartDate = (Calendar)endDate.clone();
				qStartDate.add(Calendar.DAY_OF_YEAR, -29);
				
				lines.clear();
				
				// can only request five currencies at a time.
				for (int block=0; block< blocks; block++) {

					String url = QUERY_TEMPLATE.replace("{$currency}", currency);
					
					// replace currency requests
					for (int i=0; i< 5; i++) {
						url= url.replace("{$rate" + i + "}", rates[block*5+ i]);
					}
					
					url= url.replace("{$endDate}", sdf.format(endDate.getTime()));
					url= url.replace("{$startDate}", sdf.format(qStartDate.getTime()));
					
					if (verbose) {
						System.out.println();
						System.out.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
						System.out.println("Downloading " + url + "...");
						System.out.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
					} else {
						System.out.print(".");
					}
	
					try {
						URL website = new URL(url);
	
						BufferedReader reader = new BufferedReader(new InputStreamReader(website.openStream()));
						String line= null;
						int linei= 0;
						
						while (null != (line = reader.readLine())) {
							if (line.matches("^\"[0-9][0-9][0-9][0-9]-.+")) {

								if (verbose) {
									System.out.println("+"+ line);
								}
								
								// all fields are quoted. first field in this array will come back empty
								String fields[]= line.split("\",*\"*");
								
								if (block == 0) {
									line = fields[1];
									try {
										if (sdf.parse(line).before(startDate.getTime())) {
											break;
										}
									} catch (ParseException e) {
									}
									lines.add(line);
								} else {
									if (linei == lines.size()) {
										break;
									}
									line = lines.get(linei);

									if (!line.startsWith(fields[1])) {
										throw new RuntimeException("Unexpected mismatch trying to align dates!");
									}
								}
								
								for (int j=2; j< fields.length; j++) {
									
									// no commas in values
									String field = fields[j].trim().replace(",", "");
									
									if (toBaseCurrency) {
										try {
											float f= 1f/Float.parseFloat(field);
											field = Float.toString(f);
											
										} catch (NumberFormatException e) {
											System.err.println("Failed to parse value (run in verbose mode for location details): "+ line);
											throw e;
										}
									}
									// commas bewtween values
									line+= ","+ field;
								}
										
								// append to existing lines.
								lines.set(linei++, line);
							} else if (verbose) {
								System.out.println("-"+ line);
							}
							

						}
					    
						reader.close();
						
						// make sure this doesn't look like a DOS attack
					    try {
							Thread.sleep(pauseInMs);
						} catch (InterruptedException e) {
						}
					    
					} catch (IOException e) {
						System.err.println("Failed reading "+ url+ ": "+  e.getMessage());
						return false;
					}
				}
				
				// now write it.
				for (String line : lines) {
					fwriter.write("\n"+ line);
				}
			    
				endDate = qStartDate;
				endDate.add(Calendar.DAY_OF_YEAR, -1);
			}
			
			System.out.println("DONE. Downloaded to "+ filename);
			
		} catch (FileNotFoundException e) {
			System.err.println("Failed to open dest file "+ filename+ ": " + e.getMessage());
			return false;
		} catch (IOException e) {
			System.err.println("Failed to close dest file "+ filename+ ": "+  e.getMessage());
			return false;
			
		} finally {
			try {
				if (fwriter != null) {
					fwriter.close();
				}
			} catch (IOException e) {
			}			
		}
		
		return true;
	}

	
	/**
	 * Downloads 
	 * 
	 * forms a request like this: "http://www.oanda.com/currency/historical-rates/download?quote_currency=USD&end_date=2013-6-17&start_date=2013-5-19&period=daily&display=absolute&rate=0&data_range=d30&price=bid&view=graph&base_currency_0=DZD&base_currency_1=AFN&base_currency_2=&base_currency_3=&base_currency_4=&download=csv"
	 */
	public static void main(String[] args) {
		
		// Oanda date format
		final SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);
	
		// configurable parameters
		long pauseInMs = 20;
		boolean toBaseCurrency = false;
		boolean verbose = false;
		String filename = null;
		String directory = null;
		ArrayList<String> currencies = new ArrayList<String>();

		// end date - default to yesterday
		Calendar endDate= new GregorianCalendar();
		endDate.add(Calendar.DATE, -1);
		
		// null to start - default later from end date
		Calendar startDate = null;
		
		// process arguments
		for (int i=0; i< args.length; i++) {
			String arg= args[i];
			
			if (arg.charAt(0) == '-') {
				if (arg.length() > 1) {
					switch (arg.charAt(1)) {
					case 'h':
						System.out.println(HELP);
						return;
						
					case 'v':
						verbose= true;
						continue;
					case 't':
						toBaseCurrency= true;
						continue;
					case 'p':
						if (i+1 < args.length) {
							try {
								pauseInMs = Long.parseLong(args[++i]);
							} catch (NumberFormatException e) {
								System.err.println("-p pause in milliseconds is not a number.");
								System.exit(-1);
							}
						} else {
							System.err.println("-f flag encountered but no file specified.");
							System.exit(-1);
						}
						continue;
						
					case 'f':
						if (i+1 < args.length) {
							filename = args[++i];
						} else {
							System.err.println("-f flag encountered but no file specified.");
							System.exit(-1);
						}
						continue;
					case 'd':
						if (i+1 < args.length) {
							directory = args[++i];
						} else {
							System.err.println("-d flag encountered but no directory specified.");
							System.exit(-1);
						}
						continue;
					case 's':
						if (i+1 < args.length) {
							try {
								Date d = sdf.parse(args[++i]);
								startDate = new GregorianCalendar();
								startDate.setTime(d);
							} catch (ParseException e) {
								System.err.println("-s : failed to parse start date in expected format yyyy-M-d");
								System.exit(-1);
							}
						} else {
							System.err.println("-s flag encountered but no start date specified.");
							System.exit(-1);
						}
						continue;
					case 'e':
						if (i+1 < args.length) {
							try {
								Date d = sdf.parse(args[++i]);
								endDate.setTime(d);
							} catch (ParseException e) {
								System.err.println("-e : failed to parse end date in expected format yyyy-M-d");
								System.exit(-1);
							}
						} else {
							System.err.println("-e flag encountered but no end date specified.");
							System.exit(-1);
						}
						continue;
					}
				}
			}
			
			// else currency?
			if (arg.length() == 3) {
				currencies.add(arg.toUpperCase());
				continue;
			}
			
			System.err.println("unrecognized parameter: " + arg);
			System.exit(-1);
		}
		
		// need at least two of these
		if (currencies.size() < 2) {
			System.err.println("Must specify at least two currencies: primary currency to convert to, and one currency to convert.");
			System.exit(-1);
		}

		if (startDate == null) {
			startDate = (Calendar)endDate.clone();
			startDate.add(Calendar.DAY_OF_YEAR, -29);
		}
		
		if (filename == null) {
			filename = (toBaseCurrency? "To":"From") + currencies.get(0)+ "-OANDABidRate";
			for (int i=1; i< currencies.size(); i++) {
				filename+= "-"+ currencies.get(i);
			}
			filename+= ".csv";
		}
		
		if (directory != null) {
			if (directory.charAt(directory.length()-1) != '/' &&
				directory.charAt(directory.length()-1) != '\\') {
				directory += '/';
			}
			filename = directory + filename;
		}
		
		// execute the download
		if (!download(startDate, endDate, currencies, filename, toBaseCurrency, verbose, pauseInMs)) {
			System.exit(-1);
		}
	    
	}

}
