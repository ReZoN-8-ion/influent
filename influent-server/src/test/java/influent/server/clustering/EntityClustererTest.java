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

package influent.server.clustering;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Hashtable;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import influent.idl.FL_Cluster;
import influent.idl.FL_DistributionRange;
import influent.idl.FL_Entity;
import influent.idl.FL_EntityTag;
import influent.idl.FL_Frequency;
import influent.idl.FL_GeoData;
import influent.idl.FL_Geocoding;
import influent.idl.FL_Property;
import influent.idl.FL_PropertyTag;
import influent.idl.FL_PropertyType;
import influent.idl.FL_RangeType;
import influent.idlhelper.ClusterHelper;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.PropertyHelper;
import influent.idlhelper.SingletonRangeHelper;
import influent.server.clustering.utils.EntityClusterFactory;
import influent.server.spi.impl.BasicCountryLevelGeocoding;
import influent.server.utilities.IdGenerator;
import influent.server.utilities.InfluentId;
import oculus.aperture.spi.common.Properties;

import org.apache.commons.lang.StringUtils;
import org.junit.Assert;
import org.junit.Test;

public class EntityClustererTest {

	EntityClusterFactory clusterFactory;

	private GeneralEntityClusterer createClusterer(final String clusterProperties, final int maxClusterSize) {	
		Properties pMgr = new Properties() {
			Map<String, String> values = new Hashtable<String, String>(); 
			
			public void init() {
				values.put("entity.clusterer.enablestopwords", "true");
				values.put("entity.clusterer.maxclustersize", Integer.toString(maxClusterSize));
				values.put("entity.clusterer.stopwords", "a,able,about,above,across,after,again,against,all,almost,alone,along,already,also,although,always,am,among,an,and,another,any,anybody,anyone,anything,anywhere,are,area,areas,around,as,ask,asked,asking,asks,at,away,b,back,backed,backing,backs,be,became,because,become,becomes,been,before,began,behind,being,beings,best,better,between,big,both,but,by,c,came,can,cannot,case,cases,certain,certainly,clear,clearly,come,could,d,dear,did,differ,different,differently,do,does,done,down,downed,downing,downs,during,e,each,early,either,else,end,ended,ending,ends,enough,even,evenly,ever,every,everybody,everyone,everything,everywhere,f,face,faces,fact,facts,far,felt,few,find,finds,for,four,from,full,fully,further,furthered,furthering,furthers,g,gave,general,generally,get,gets,give,given,gives,go,going,good,goods,got,great,greater,greatest,group,grouped,grouping,groups,h,had,has,have,having,he,her,here,hers,herself,high,higher,highest,him,himself,his,how,however,i,if,important,in,interest,interested,interesting,interests,into,is,it,its,itself,j,just,k,keep,keeps,kind,knew,know,known,knows,l,large,largely,last,later,latest,least,less,let,lets,like,likely,long,longer,longest,m,made,make,making,man,many,may,me,member,members,men,might,more,most,mostly,mr,mrs,much,must,my,myself,n,necessary,need,needed,needing,needs,neither,never,new,newer,newest,next,no,nobody,non,noone,nor,not,nothing,now,nowhere,number,numbers,o,of,off,often,old,older,oldest,on,once,one,only,open,opened,opening,opens,or,order,ordered,ordering,orders,other,others,our,out,over,own,p,part,parted,parting,parts,per,perhaps,place,places,point,pointed,pointing,points,possible,present,presented,presenting,presents,problem,problems,put,puts,q,quite,r,rather,really,right,room,rooms,s,said,same,saw,say,says,second,seconds,see,seem,seemed,seeming,seems,sees,several,shall,she,should,show,showed,showing,shows,side,sides,since,small,smaller,smallest,so,some,somebody,someone,something,somewhere,state,states,still,such,sure,t,take,taken,than,that,the,their,them,then,there,therefore,these,they,thing,things,think,thinks,this,those,though,thought,thoughts,three,through,thus,tis,to,today,together,too,took,toward,turn,turned,turning,turns,twas,two,u,under,until,up,upon,us,use,used,uses,v,very,w,want,wanted,wanting,wants,was,way,ways,we,well,wells,went,were,what,when,where,whether,which,while,who,whole,whom,whose,why,will,with,within,without,work,worked,working,works,would,x,y,year,years,yet,you,young,younger,youngest,your,yours,z");
				values.put("entity.clusterer.clusterfields", clusterProperties);
				values.put("entity.clusterer.clusterproperties", "TYPE:type-dist,GEO:Location");
			}
			
			@Override
			public Object getObject(String key) {
				init();
				return values.get(key);
			}

			@Override
			public Iterable<Object> getObjects(String key) { throw new UnsupportedOperationException(); }

			@Override
			public String getString(String key, String defaultValue) {
				init();
				if (values.containsKey(key)) return values.get(key);
				else return defaultValue;
			}

			@Override
			public Iterable<String> getStrings(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Boolean getBoolean(String key, Boolean defaultValue) {
				return true;  // enablestopwords
			}

			@Override
			public Iterable<Boolean> getBooleans(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Integer getInteger(String key, Integer defaultValue) {
				return 2; // max cluster size
			}

			@Override
			public Iterable<Integer> getIntegers(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Long getLong(String key, Long defaultValue) { throw new UnsupportedOperationException(); }

			@Override
			public Iterable<Long> getLongs(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Float getFloat(String key, Float defaultValue) { throw new UnsupportedOperationException(); }

			@Override
			public Iterable<Float> getFloats(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Double getDouble(String key, Double defaultValue) { throw new UnsupportedOperationException(); }

			@Override
			public Iterable<Double> getDoubles(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Properties getPropertiesSet(String key, Properties defaultValue) { throw new UnsupportedOperationException(); }

			@Override
			public Iterable<Properties> getPropertiesSets(String key) { throw new UnsupportedOperationException(); }
		}; 
		
		FL_Geocoding geocoding = new BasicCountryLevelGeocoding();
		IdGenerator idGen = new IdGenerator() {
			Integer id = 0;
			@Override
			public String nextId() {
				return InfluentId.fromNativeId(InfluentId.CLUSTER, "cluster", (++id).toString()).getInfluentId();
			}
		};	
		
		clusterFactory = new EntityClusterFactory(idGen, geocoding, pMgr);
		
		GeneralEntityClusterer clusterer = new GeneralEntityClusterer();
		clusterer.init(new Object[]{clusterFactory, geocoding, pMgr});

		return clusterer;
	}
	
	private FL_Entity createEntity(String name, FL_EntityTag tag, String location, String cc, double lat, double lon, int indegree, int outdegree) {
		List<FL_Property> props = new ArrayList<FL_Property>();
		props.add(
			new PropertyHelper(
				"inflowing", 
				"inflowing", 
				indegree, 
				Arrays.asList(
					FL_PropertyTag.INFLOWING, 
					FL_PropertyTag.AMOUNT, 
					FL_PropertyTag.USD
				)
			)
		);
		props.add(
			new PropertyHelper(
				"outflowing", 
				"outflowing", 
				outdegree, 
				Arrays.asList(
					FL_PropertyTag.OUTFLOWING, 
					FL_PropertyTag.AMOUNT, 
					FL_PropertyTag.USD
				)
			)
		);
		FL_GeoData geoData = FL_GeoData.newBuilder().setText(location).setLat(lat).setLon(lon).setCc(cc).build();
		props.add(
			FL_Property.newBuilder()
				.setKey("geo")
				.setFriendlyText("")
				.setTags(Collections.singletonList(FL_PropertyTag.GEO))
				.setRange(SingletonRangeHelper.from(geoData))
				.setProvenance(null)
				.setUncertainty(null)
				.build()
		);
		return new EntityHelper( name, 
								name,
								tag.name(),
								tag,
								props );
	}
	
	@SuppressWarnings("unused")
	private FL_Cluster createClusterSummary(String name, Hashtable<String, Double> locationDist, Hashtable<String, Double> typeDist, int count, int indegree, int outdegree) {
		List<FL_Property> props = new ArrayList<FL_Property>();
		props.add(
			new PropertyHelper(
				"inflowing", 
				"inflowing", 
				indegree, 
				Arrays.asList(
					FL_PropertyTag.INFLOWING, 
					FL_PropertyTag.AMOUNT, 
					FL_PropertyTag.USD
				)
			)
		);
		props.add(
			new PropertyHelper(
				"outflowing", 
				"outflowing", 
				outdegree, 
				Arrays.asList(
					FL_PropertyTag.OUTFLOWING, 
					FL_PropertyTag.AMOUNT, 
					FL_PropertyTag.USD
				)
			)
		);
		props.add( 
			new PropertyHelper(
				"count",
				"count",
				count,
				FL_PropertyType.INTEGER,
				FL_PropertyTag.STAT)
		);
		
		// create location dist prop
		List<FL_Frequency> freqs = new ArrayList<FL_Frequency>();
		
		for (String cc : locationDist.keySet()) {
			FL_GeoData geo = FL_GeoData.newBuilder().setText(null).setLat(null).setLon(null).setCc(cc).build();
			
			double freq = locationDist.get(cc);
			freqs.add(FL_Frequency.newBuilder().setRange(geo).setFrequency(freq).build());
		}
		
		FL_DistributionRange range = FL_DistributionRange.newBuilder().setDistribution(freqs).setRangeType(FL_RangeType.DISTRIBUTION).setType(FL_PropertyType.GEO ).setIsProbability(false).build();
		props.add( FL_Property.newBuilder()
					.setKey("location-dist")
					.setFriendlyText("location-dist")
					.setRange(range)
					.setProvenance(null)
					.setUncertainty(null)
					.setTags(Arrays.asList(FL_PropertyTag.GEO))
					.build() );
		
		// create type dist prop
		freqs = new ArrayList<FL_Frequency>();
		
		for (String type : typeDist.keySet()) {
			double freq = typeDist.get(type);
			freqs.add(FL_Frequency.newBuilder().setRange(type).setFrequency(freq).build());
		}
		
		range = FL_DistributionRange.newBuilder().setDistribution(freqs).setRangeType(FL_RangeType.DISTRIBUTION).setType(FL_PropertyType.STRING ).setIsProbability(false).build();
		props.add( FL_Property.newBuilder()
					.setKey("type-dist")
					.setFriendlyText("type-dist")
					.setRange(range)
					.setProvenance(null)
					.setUncertainty(null)
					.setTags(Arrays.asList(FL_PropertyTag.TYPE))
					.build() );
		
		
		return new ClusterHelper( InfluentId.fromNativeId(InfluentId.CLUSTER_SUMMARY, "cluster", name).getInfluentId(),
								name,
								Arrays.asList(FL_EntityTag.CLUSTER_SUMMARY),
								props,
								new ArrayList<String>(0),
								new ArrayList<String>(0),
								null,
								null,
								-1 );
	}
	
	
	private String clusterToString(FL_Cluster cluster) {		
		return "{"+cluster.getUid()+":["+StringUtils.join(cluster.getMembers(),",")+"]["+StringUtils.join(cluster.getSubclusters(), ",")+"]}";
	}
	
	private void assertClusterEquals(String clusterId, String value, ClusterContext context) {
		FL_Cluster cluster = context.clusters.get(clusterId);
		if (cluster == null) Assert.fail("Invalid cluster id");
		Assert.assertEquals(clusterToString(cluster), value);
	}
	
	@Test
	public void testClusterByType() {
		GeneralEntityClusterer clusterer = createClusterer("TYPE:categorical", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("entityA", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("entityB", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("entityC", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[entityA,entityC][]}", context);
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[entityB][]}", context);
	}
	
	@Test
	public void testClusterByTypeMax() {
		GeneralEntityClusterer clusterer = createClusterer("TYPE:categorical", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("entityA", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("entityB", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("entityC", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
		entities.add( createEntity("entityD", FL_EntityTag.ACCOUNT, "LA", "USA", 34.0522342, -118.2436849, 17, 19) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[][c.cluster.4,c.cluster.3]}", context);
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[entityB][]}", context);
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[entityA,entityC][]}", context);
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[entityD][]}", context);
	}
	
	
	@Test
	public void testClusterByMaxMultiLevel() {
		GeneralEntityClusterer clusterer = createClusterer("TYPE:categorical", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("entityA", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("entityB", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("entityC", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("entityD", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
		entities.add( createEntity("entityE", FL_EntityTag.ACCOUNT, "LA", "USA", 34.0522342, -118.2436849, 17, 19) );
		entities.add( createEntity("entityF", FL_EntityTag.ACCOUNT, "LA", "USA", 34.0522342, -118.2436849, 17, 19) );
		entities.add( createEntity("entityG", FL_EntityTag.ACCOUNT, "LA", "USA", 34.0522342, -118.2436849, 17, 19) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[][c.cluster.4,c.cluster.3]}", context);
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[entityB,entityC][]}", context);
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.6,c.cluster.5]}", context);
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[entityE,entityF][]}", context);
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[entityA,entityD][]}", context);
		assertClusterEquals("c.cluster.6", "{c.cluster.6:[entityG][]}", context);
	}
	
	@Test
	public void testClusterByLabel() {
		GeneralEntityClusterer clusterer = createClusterer("LABEL:label", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Adamn", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("Alf", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Zulu][]}", context);  // cluster by alpha "N-Z"
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[Adamn,Alf][]}", context);  // cluster by alpha "A-M"
	}
	
	@Test
	public void testClusterByLabelFingerprint() {
		GeneralEntityClusterer clusterer = createClusterer("LABEL:label", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amandå", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Amanda", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Alf", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Zulu][]}", context);  // cluster by alpha "N-Z"
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.4,c.cluster.3]}", context);  // cluster by alpha "A-M"
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[Bob][]}", context);  // cluster by alpha "B"
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[][c.cluster.5]}", context);  // cluster by alpha "A"
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.6]}", context);  // cluster by fuzzy matching   <-- Strange
		assertClusterEquals("c.cluster.6", "{c.cluster.6:[][c.cluster.8,c.cluster.7]}", context);  // cluster by fingerprint
		
		FL_Cluster leaf1 = context.clusters.get("c.cluster.7");
		
		if (leaf1.getMembers().size() == 1) {
			assertClusterEquals("c.cluster.7", "{c.cluster.7:[Alf][]}", context);  // cluster by fingerprint
			assertClusterEquals("c.cluster.8", "{c.cluster.8:[Amandå,Amanda][]}", context);  // cluster by fingerprint
		} else {
			assertClusterEquals("c.cluster.8", "{c.cluster.8:[Alf][]}", context);  // cluster by fingerprint
			assertClusterEquals("c.cluster.7", "{c.cluster.7:[Amandå,Amanda][]}", context);  // cluster by fingerprint
		}		
	}
	
	@Test
	public void testClusterByLabelMax() {
		GeneralEntityClusterer clusterer = createClusterer("LABEL:label", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Adan", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("Alf", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Amanda", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Zulu][]}", context);  // cluster by alpha "N-Z"
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.3]}", context);  // cluster by alpha "A-M"
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.4]}", context);  // cluster by alpha "A"
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[][c.cluster.8,c.cluster.9]}", context);  // cluster by alpha "A"
		FL_Cluster leaf1 = context.clusters.get("c.cluster.8");
		FL_Cluster leaf2 = context.clusters.get("c.cluster.9");
		// Make sure one leaf cluster contains two members and the other one
		Assert.assertTrue((leaf1.getMembers().size() == 1 && leaf2.getMembers().size() == 2) ||
						  (leaf2.getMembers().size() == 1 && leaf1.getMembers().size() == 2));
	}
	
	@Test
	public void testClusterByLabelIncremental() {
		GeneralEntityClusterer clusterer = createClusterer("LABEL:label", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amandå", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Alf", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 11, 13) );
	
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Zulu][]}", context);  // cluster by alpha "N-Z"
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.4,c.cluster.3]}", context);  // cluster by alpha "A-M"
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[Bob][]}", context);  // cluster by alpha "B"
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[Amandå,Alf][]}", context);  // cluster by alpha "A"
		
		// cluster a new entity
		entities = Collections.singletonList(createEntity("Amanda", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7));
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Zulu][]}", context);  // cluster by alpha "N-Z"
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.4,c.cluster.3]}", context);  // cluster by alpha "A-M"
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[Bob][]}", context);  // cluster by alpha "B"
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[][c.cluster.5]}", context);  // cluster by alpha "A"
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.7,c.cluster.6]}", context);  // cluster by fuzzy matching
		
		FL_Cluster leaf1 = context.clusters.get("c.cluster.6");
		
		if (leaf1.getMembers().size() == 1) {
			assertClusterEquals("c.cluster.6", "{c.cluster.6:[Alf][]}", context);  // cluster by fingerprint
			assertClusterEquals("c.cluster.7", "{c.cluster.7:[Amandå,Amanda][]}", context);  // cluster by fingerprint
		} else {
			assertClusterEquals("c.cluster.7", "{c.cluster.7:[Alf][]}", context);  // cluster by fingerprint
			assertClusterEquals("c.cluster.6", "{c.cluster.6:[Amandå,Amanda][]}", context);  // cluster by fingerprint
		}
		
	}
	
	@Test
	public void testClusterByNumberSingleCluster() {
		GeneralEntityClusterer clusterer = createClusterer("INFLOWING:numeric:100", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 550, 3) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 500, 13) );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Amanda,Zulu][]}", context);
	}
	
	@Test
	public void testClusterByNumberMultipleClusters() {
		GeneralEntityClusterer clusterer = createClusterer("INFLOWING:numeric:6", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2000, 3) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 500, 13) );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Amanda][]}", context);
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[Zulu][]}", context);
	}
	
	@Test
	public void testClusterByNumberIncremental() {
		GeneralEntityClusterer clusterer = createClusterer("TYPE:categorical,INFLOWING:numeric:6", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2000, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 500, 13) );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[][c.cluster.6,c.cluster.5]}", context);
		
		FL_Cluster leaf1 = context.clusters.get("c.cluster.5");
		
		if (leaf1.getMembers().size() == 1) {
			assertClusterEquals("c.cluster.5", "{c.cluster.5:[Amanda][]}", context);
			assertClusterEquals("c.cluster.6", "{c.cluster.6:[Zulu,Bob][]}", context);
		} else {
			assertClusterEquals("c.cluster.5", "{c.cluster.5:[Zulu,Bob][]}", context);
			assertClusterEquals("c.cluster.6", "{c.cluster.6:[Amanda][]}", context);
		}
	
		// cluster a new entity
		entities = Collections.singletonList(createEntity("Alf", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2500, -123.1000, 8, 7));
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[][c.cluster.6,c.cluster.5]}", context);
		
		if (leaf1.getMembers().size() == 1) {
			assertClusterEquals("c.cluster.5", "{c.cluster.5:[Amanda][]}", context);
			assertClusterEquals("c.cluster.6", "{c.cluster.6:[][c.cluster.8,c.cluster.9]}", context);
			assertClusterEquals("c.cluster.8", "{c.cluster.8:[Zulu][]}", context);
			assertClusterEquals("c.cluster.9", "{c.cluster.9:[Bob,Alf][]}", context);
		} else {
			assertClusterEquals("c.cluster.6", "{c.cluster.6:[Amanda][]}", context);
			assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.8,c.cluster.9]}", context);
			assertClusterEquals("c.cluster.8", "{c.cluster.8:[Zulu][]}", context);
			assertClusterEquals("c.cluster.9", "{c.cluster.9:[Bob,Alf][]}", context);
		}
	}
	
	@Test
	public void testClusterByNumberMax() {
		GeneralEntityClusterer clusterer = createClusterer("TYPE:categorical,INFLOWING:numeric:6", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2000, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2500, -123.1000, 5, 7) );
		entities.add( createEntity("Alf", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2500, -123.1000, 8, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 6, 13) );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[][c.cluster.3,c.cluster.2]}", context);
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[Amanda][]}", context);
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.4]}", context);
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[][c.cluster.5]}", context);
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.7,c.cluster.6]}", context);
		assertClusterEquals("c.cluster.6", "{c.cluster.6:[Bob,Alf][]}", context);
		assertClusterEquals("c.cluster.7", "{c.cluster.7:[Zulu][]}", context);
	}
	
	@Test
	public void testClusterByGeoMultiLevel() {
		GeneralEntityClusterer clusterer = createClusterer("GEO:geo", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2000, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2827, -123.1207, 5, 7) );
		entities.add( createEntity("Steve", FL_EntityTag.ACCOUNT, "Victoria", "CAN", 48.4222, -123.3657, 5, 7) );
		entities.add( createEntity("Dan", FL_EntityTag.ACCOUNT, "Montreal", "CAN", 45.5017, -73.5673, 5, 7) );
		entities.add( createEntity("Alf", FL_EntityTag.ACCOUNT, "London", "GBR", 51.5072, -0.1275, 8, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 6, 13) );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Alf][]}", context);					// Europe
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.3]}", context);			// North America
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.4,c.cluster.5]}", context);	// USA and CAN
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[Zulu][]}", context);				// USA
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.8,c.cluster.7,c.cluster.6]}", context);	// CAN
		assertClusterEquals("c.cluster.6", "{c.cluster.6:[Amanda][]}", context);				// Toronto
		assertClusterEquals("c.cluster.7", "{c.cluster.7:[Bob,Steve][]}", context);			// Vancouver and Victoria
		assertClusterEquals("c.cluster.8", "{c.cluster.8:[Dan][]}", context);					// Montreal
	}
	
	@Test
	public void testClusterByGeoIncremental() {
		GeneralEntityClusterer clusterer = createClusterer("GEO:geo", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2000, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2827, -123.1207, 5, 7) );
		entities.add( createEntity("Alf", FL_EntityTag.ACCOUNT, "London", "GBR", 51.5072, -0.1275, 8, 7) );
		entities.add( createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 6, 13) );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Alf][]}", context);					// Europe
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.3]}", context);			// North America
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.4,c.cluster.5]}", context);	// USA and CAN
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[Zulu][]}", context);				// USA
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[Amanda,Bob][]}", context);			// CAN
		
		// cluster new entities
		entities.clear();
		entities.add( createEntity("Steve", FL_EntityTag.ACCOUNT, "Victoria", "CAN", 48.4222, -123.3657, 5, 7) );
		entities.add( createEntity("Dan", FL_EntityTag.ACCOUNT, "Montreal", "CAN", 45.5017, -73.5673, 5, 7) );
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		for (FL_Cluster c : context.clusters.values()) {
			System.out.println(this.clusterToString(c));
		}
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Alf][]}", context);					// Europe
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[][c.cluster.3]}", context);			// North America
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.4,c.cluster.5]}", context);	// USA and CAN
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[Zulu][]}", context);				// USA
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.8,c.cluster.7,c.cluster.6]}", context);	// CAN
		assertClusterEquals("c.cluster.6", "{c.cluster.6:[Amanda][]}", context);				// Toronto
		assertClusterEquals("c.cluster.7", "{c.cluster.7:[Bob,Steve][]}", context);			// Vancouver and Victoria
		assertClusterEquals("c.cluster.8", "{c.cluster.8:[Dan][]}", context);					// Montreal
	}
	
	@Test
	public void testClusterByGeoMissingProp() {
		GeneralEntityClusterer clusterer = createClusterer("GEO:geo", 2);
		
		Collection<FL_Entity> entities = new LinkedList<FL_Entity>();
		entities.add( createEntity("Amanda", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 2000, 3) );
		entities.add( createEntity("Bob", FL_EntityTag.ACCOUNT, "Vancouver", "CAN", 49.2827, -123.1207, 5, 7) );
		entities.add( createEntity("Steve", FL_EntityTag.ACCOUNT, "Victoria", "CAN", 48.4222, -123.3657, 5, 7) );
		entities.add( createEntity("Dan", FL_EntityTag.ACCOUNT, "Montreal", "CAN", 45.5017, -73.5673, 5, 7) );
		entities.add( createEntity("Alf", FL_EntityTag.ACCOUNT, "London", "GBR", 51.5072, -0.1275, 8, 7) );
		
		FL_Entity missingGeoEntity = createEntity("Zulu", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 6, 13);
		missingGeoEntity.getProperties().remove(2);
		entities.add( missingGeoEntity );
		
		ClusterContext context = new ClusterContext();
		context.addEntities(entities);
		context = clusterer.clusterEntities(entities, context);
		
		assertClusterEquals("c.cluster.1", "{c.cluster.1:[Zulu][]}", context);				// Unknown
		assertClusterEquals("c.cluster.2", "{c.cluster.2:[Alf][]}", context);					// Europe
		assertClusterEquals("c.cluster.3", "{c.cluster.3:[][c.cluster.4]}", context);			// North America
		assertClusterEquals("c.cluster.4", "{c.cluster.4:[][c.cluster.5]}", context);			// CAN
		assertClusterEquals("c.cluster.5", "{c.cluster.5:[][c.cluster.8,c.cluster.7,c.cluster.6]}", context);	// CAN
		assertClusterEquals("c.cluster.6", "{c.cluster.6:[Amanda][]}", context);				// Toronto
		assertClusterEquals("c.cluster.7", "{c.cluster.7:[Bob,Steve][]}", context);			// Vancouver and Victoria
		assertClusterEquals("c.cluster.8", "{c.cluster.8:[Dan][]}", context);					// Montreal
	}
	
}
