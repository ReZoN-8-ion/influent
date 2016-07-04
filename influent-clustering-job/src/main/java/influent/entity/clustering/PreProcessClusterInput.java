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
package influent.entity.clustering;

import influent.entity.clustering.SchemaField.FieldType;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.skife.csv.CSVReader;
import org.skife.csv.SimpleReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.oculusinfo.ml.Instance;
import com.oculusinfo.ml.feature.BagOfWordsFeature;
import com.oculusinfo.ml.feature.GeoSpatialFeature;
import com.oculusinfo.ml.feature.NumericVectorFeature;
import scala.Tuple2;
import spark.api.java.JavaPairRDD;
import spark.api.java.JavaRDD;
import spark.api.java.JavaSparkContext;
import spark.api.java.function.Function;
import spark.api.java.function.Function2;
import spark.api.java.function.PairFunction;

public class PreProcessClusterInput {
	private static Logger log = LoggerFactory.getLogger("influent");
	private static String stopwordsList = "a,able,about,above,across,after,again,against,all,almost,alone,along,already,also,although,always,am,among,an,and,another,any,anybody,anyone,anything,anywhere,are,area,areas,around,as,ask,asked,asking,asks,at,away,b,back,backed,backing,backs,be,became,because,become,becomes,been,before,began,behind,being,beings,best,better,between,big,both,but,by,c,came,can,cannot,case,cases,certain,certainly,clear,clearly,come,could,d,dear,did,differ,different,differently,do,does,done,down,downed,downing,downs,during,e,each,early,either,else,end,ended,ending,ends,enough,even,evenly,ever,every,everybody,everyone,everything,everywhere,f,face,faces,fact,facts,far,felt,few,find,finds,for,four,from,full,fully,further,furthered,furthering,furthers,g,gave,general,generally,get,gets,give,given,gives,go,going,good,goods,got,great,greater,greatest,group,grouped,grouping,groups,h,had,has,have,having,he,her,here,hers,herself,high,higher,highest,him,himself,his,how,however,i,if,important,in,interest,interested,interesting,interests,into,is,it,its,itself,j,just,k,keep,keeps,kind,knew,know,known,knows,l,large,largely,last,later,latest,least,less,let,lets,like,likely,long,longer,longest,m,made,make,making,man,many,me,member,members,men,might,more,most,mostly,mr,mrs,much,must,my,myself,n,necessary,need,needed,needing,needs,neither,never,new,newer,newest,next,no,nobody,non,noone,nor,not,nothing,now,nowhere,number,numbers,o,of,off,often,old,older,oldest,on,once,one,only,open,opened,opening,opens,or,order,ordered,ordering,orders,other,others,our,out,over,own,p,part,parted,parting,parts,per,perhaps,place,places,point,pointed,pointing,points,possible,present,presented,presenting,presents,problem,problems,put,puts,q,quite,r,rather,really,right,room,rooms,s,said,same,saw,say,says,second,seconds,see,seem,seemed,seeming,seems,sees,several,shall,she,should,show,showed,showing,shows,side,sides,since,small,smaller,smallest,so,some,somebody,someone,something,somewhere,state,states,still,such,sure,t,take,taken,than,that,the,their,them,then,there,therefore,these,they,thing,things,think,thinks,this,those,though,thought,thoughts,three,through,thus,tis,to,today,together,too,took,toward,turn,turned,turning,turns,twas,two,u,under,until,up,upon,us,use,used,uses,v,very,w,want,wanted,wanting,wants,was,way,ways,we,well,wells,went,were,what,when,where,whether,which,while,who,whole,whom,whose,why,will,with,within,without,work,worked,working,works,would,x,y,year,years,yet,you,young,younger,youngest,your,yours,z";
	private static Set<String> stopwords = initStopWords();
	
	private static Set<String> initStopWords() {
		Set<String> stopwords = new HashSet<String>();
		
		for (String word : stopwordsList.split(",")) {
			stopwords.add(word.toLowerCase());
		}
		return stopwords;
	}
	
	private static List<String> tokenizeString(String label) {
		List<String> candidates = new LinkedList<String>();

		String cleaned = label.toLowerCase().replaceAll("[\\.,!@#$%^&*()-_=+}{;:'\"?/<>\\[\\]\\\\]", " ");

		Pattern regex = Pattern.compile("\\p{L}[\\p{L}]*\\p{L}");
		Matcher lexer = regex.matcher(cleaned);
		
		while (lexer.find()) {
			String token = lexer.group().toLowerCase();
			if (stopwords.contains(token) == false) candidates.add(token);
		}

	    return candidates;
	}
	
	public static void preprocess(final SchemaField[] schema, String inputDir, String outputDir) {
		// create a local spark context
		JavaSparkContext sc = new JavaSparkContext("local", "influent clustering");
		
		JavaRDD<String> lines = sc.textFile(inputDir);
		
		log.error("Converting CSV into instance files");
		
		// map CSV to instances
		JavaPairRDD<String, Instance> instances = lines.map(new PairFunction<String,String,Instance>() {
			private static final long serialVersionUID = -5331107697232275404L;

			@Override
			public Tuple2<String, Instance> call(String line) throws Exception {
				CSVReader reader = new SimpleReader();
				String[] items = (String[])reader.parse(line).get(0);
			
				Instance inst = new Instance();
				
				for (int i=0; i < schema.length && i < items.length; i++) {					
					String value = items[i];
					
					if (value.isEmpty()) continue;
					
					switch (schema[i].fieldType) {
					case ID:
						inst.setId(value);
						break;
					case CATEGORY:
					case CC:
						BagOfWordsFeature str = new BagOfWordsFeature(schema[i].fieldName, schema[i].fieldName);
						str.incrementValue(value);
						inst.addFeature( str );
						break;
					case GEO:
						GeoSpatialFeature location = new GeoSpatialFeature(schema[i].fieldName, schema[i].fieldName);
						String[] latlon = value.split(";");
						location.setValue(Double.parseDouble(latlon[0]), Double.parseDouble(latlon[1]));
						inst.addFeature(location);
						break;
					case LABEL:
						BagOfWordsFeature label = new BagOfWordsFeature(schema[i].fieldName, schema[i].fieldName);
						List<String> tokens = tokenizeString(value);
						
						for (String token : tokens) {
							label.incrementValue(token);
						}
						inst.addFeature(label);
						break;
					case NUMBER:
						NumericVectorFeature num = new NumericVectorFeature(schema[i].fieldName, schema[i].fieldName);
						num.setValue(new double[] { Double.parseDouble(value) });
						inst.addFeature(num);
						break;
					default:
						/* unsupported - ignore */
						break;
					}
				}
				return new Tuple2<String,Instance>("ROOT",inst);
			}
		});
		
		log.error("Normalizing features");
		
		// normalize NUMBER features
		for (final SchemaField field : schema) {
			if (field.fieldType == FieldType.NUMBER) {
				
				// retrieve the number of instances with feature
				final double count = instances.filter(
						new Function<Tuple2<String,Instance>,Boolean>() {
							private static final long serialVersionUID = -5848998709841171462L;

							@Override
							public Boolean call(Tuple2<String, Instance> t) throws Exception {
								return (t._2.containsFeature(field.fieldName, field.fieldName));
							}	
						}).count();
				
				// compute sum of feature
				Double sum = instances.aggregate(0.0, 
					new Function2<Double, Tuple2<String, Instance>, Double>() {
						private static final long serialVersionUID = 9204423540536661628L;

						@Override
						public Double call(Double t1, Tuple2<String, Instance> t2) throws Exception {
							Double sum = t1;
							if (t2._2.containsFeature(field.fieldName, field.fieldName)) {
								NumericVectorFeature feature = (NumericVectorFeature)t2._2.getFeature(field.fieldName, field.fieldName).iterator().next();
								sum += feature.getValue()[0];
							}
							return sum;
						}
					}, 
					new Function2<Double, Double, Double>() {
						private static final long serialVersionUID = 2911867358184259623L;

						@Override
						public Double call(Double t1, Double t2) throws Exception {
							return t1 + t2;
						}
				});
				
				// compute the mean 
				final Double mean = sum / count;
				
				// compute the standard deviation
				final Double stdev = Math.sqrt(instances.aggregate(0.0, 
						new Function2<Double, Tuple2<String, Instance>, Double>() {
							private static final long serialVersionUID = 9204423540536661628L;

							@Override
							public Double call(Double t1, Tuple2<String, Instance> t2) throws Exception {
								Double stdev = t1;
								if (t2._2.containsFeature(field.fieldName, field.fieldName)) {
									NumericVectorFeature feature = (NumericVectorFeature)t2._2.getFeature(field.fieldName, field.fieldName).iterator().next();
									stdev += (feature.getValue()[0] - mean)*(feature.getValue()[0] - mean);
								}
								return stdev;
							}
						}, 
						new Function2<Double, Double, Double>() {
							private static final long serialVersionUID = 2911867358184259623L;

							@Override
							public Double call(Double t1, Double t2) throws Exception {
								return t1 + t2;
							}
					}) / (count - 1));
				
				// standardize each instance
				instances = instances.map(new PairFunction<Tuple2<String,Instance>, String, Instance>() {
					private static final long serialVersionUID = -7950135909235642830L;

					@Override
					public Tuple2<String,Instance> call(Tuple2<String, Instance> t2) throws Exception {
						if (t2._2.containsFeature(field.fieldName, field.fieldName)) {
							NumericVectorFeature feature = (NumericVectorFeature)t2._2.getFeature(field.fieldName, field.fieldName).iterator().next();
							feature.setValue(new double[] { (feature.getValue()[0] - mean) / stdev });
						}
						return new Tuple2<String,Instance>(t2._1, t2._2);
					}
				});
			}
		}
		
		log.error("Writing instance files");
		
		// output the normalized instances
		instances.saveAsTextFile(outputDir);
		
		log.error("Done");
	}
	
	private static void printUsageMsg() {
		System.out.println("Please specify an input directory of CSV files to pre process and output path.");
		System.out.println("USAGE: PreProcessClusterInput --schema=\"<comma list of featureName:<ID | GEO | LABEL | CC | NUMBER | CATEGORY>>\" --inputdir=\"<INPUT DIR>\" --ouputdir=\"<OUTPUT DIR>\"");
		System.out.println("EXAMPLE:  PreProcessClusterInput --schema=\"entityType:CATEGORY,location:GEO,name:LABEL,avgTrns:NUMBER\" --inputdir=\"rawinput\" --outputdir=\"instances\"");
	}
	
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		if (args.length < 3) {
			printUsageMsg();
			return;
		}
		try {
			String inputDir = null;
			String outputDir = null;
			SchemaField[] schema = null;
		
			Map<String, String> argMap = Utils.parseArguments(args);
		
			for (String key : argMap.keySet()) {
				if (key.equalsIgnoreCase("schema")) {
					schema = Utils.parseSchema(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("inputdir")) {
					inputDir = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("outputdir")) {
					outputDir = argMap.get(key);
				}
			}

			if (inputDir == null || outputDir == null || schema == null) throw new IllegalArgumentException("Missing argument!");
		
			preprocess(schema, inputDir, outputDir);
		}
		catch (IllegalArgumentException e) {
			printUsageMsg();
			System.err.println("\nERROR: " + e.getMessage());
		}
		catch (Exception e) {
			System.err.println("\nERROR: " + e.getMessage());
			e.printStackTrace();
		}
	}

}
