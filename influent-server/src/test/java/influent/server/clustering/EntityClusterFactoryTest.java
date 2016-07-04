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
import java.util.Collections;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

import org.junit.Assert;
import org.junit.Test;
import org.junit.Before;

public class EntityClusterFactoryTest {

	EntityClusterFactory clusterFactory;
	
	FL_Entity entityA;
	FL_Entity entityB;
	FL_Entity entityC;
	FL_Entity entityD;
	FL_Cluster clusterSummaryA;
	
	@Before
	public void setup() {	
		Properties pMgr = new Properties() {
			Map<String, String> values = new Hashtable<String, String>(); 
			
			public void init() {
				values.put("entity.clusterer.clusterproperties", "TYPE:type-dist,GEO:location-dist,AvTransAmnt:avTran-dist");
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
			public Boolean getBoolean(String key, Boolean defaultValue) { throw new UnsupportedOperationException(); }

			@Override
			public Iterable<Boolean> getBooleans(String key) { throw new UnsupportedOperationException(); }

			@Override
			public Integer getInteger(String key, Integer defaultValue) { throw new UnsupportedOperationException(); }

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
			@Override
			public String nextId() {
				return InfluentId.fromNativeId(InfluentId.CLUSTER, "cluster", UUID.randomUUID().toString()).getInfluentId();
			}
		};
		
		clusterFactory = new EntityClusterFactory(idGen, geocoding, pMgr);

		entityA = createEntity("entityA", FL_EntityTag.ACCOUNT, "Toronto", "CAN", 43.653226, -79.38318429999998, 100.0, 2, 3);
		entityB = createEntity("entityB", FL_EntityTag.ANONYMOUS, "Vancouver", "CAN", 49.2500, -123.1000, 200.0, 5, 7);
		entityC = createEntity("entityC", FL_EntityTag.ACCOUNT, "NYC", "USA", 40.7143528, -74.0059731, 300.0, 11, 13);
		entityD = createEntity("entityD", FL_EntityTag.ACCOUNT, "LA", "USA", 34.0522342, -118.2436849, 400.0, 17, 19);
		
		Hashtable<String, Double> locationDist = new Hashtable<String, Double>();
		locationDist.put("CAN", 200.0);
		locationDist.put("USA", 500.0);
		Hashtable<String, Double> typeDist = new Hashtable<String, Double>();
		typeDist.put("ACCOUNT", 400.0);
		typeDist.put("ANONYMOUS", 300.0);
		Hashtable<Double, Double> avTranDist = new Hashtable<Double, Double>();
		avTranDist.put(1000.0, 1.0);
		clusterSummaryA = createClusterSummary("clusterSummaryA", locationDist, typeDist, avTranDist, 700, 3000, 7000);
	}
	
	private FL_Entity createEntity(String name, 
									FL_EntityTag tag, 
									String location, 
									String cc, 
									double lat, 
									double lon, 
									double avTransAmnt, 
									int indegree, 
									int outdegree) {
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
				"AvTransAmnt", 
				"AvTransAmnt", 
				avTransAmnt, 
				Arrays.asList(
					FL_PropertyTag.STAT
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
	
	private FL_Cluster createClusterSummary(String name, 
											Hashtable<String, Double> locationDist, 
											Hashtable<String, Double> typeDist,
											Hashtable<Double, Double> avTranDist,
											int count, 
											int indegree, 
											int outdegree) {
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
		
		// create avTran dist prop
		freqs = new ArrayList<FL_Frequency>();
		
		for (Double avTran : avTranDist.keySet()) {
			double freq = avTranDist.get(avTran);
			freqs.add(FL_Frequency.newBuilder().setRange(avTran).setFrequency(freq).build());
		}
		
		range = FL_DistributionRange.newBuilder().setDistribution(freqs).setRangeType(FL_RangeType.DISTRIBUTION).setType(FL_PropertyType.DOUBLE ).setIsProbability(false).build();
		props.add( FL_Property.newBuilder()
					.setKey("avTran-dist")
					.setFriendlyText("avTran-dist")
					.setRange(range)
					.setProvenance(null)
					.setUncertainty(null)
					.setTags(Arrays.asList(FL_PropertyTag.STAT))
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
	
	private void assertDistributionEquals(FL_Property property, Hashtable<Object, Double> expected) {
		PropertyHelper helper = PropertyHelper.from(property);
		
		@SuppressWarnings("unchecked")
		List<FL_Frequency> freqs = (List<FL_Frequency>)helper.getValue();
		
		for (FL_Frequency freq : freqs) {
			Object key = null;
			if (freq.getRange() instanceof FL_GeoData) {
				key = ((FL_GeoData)freq.getRange()).getCc();
			}
			else {
				key = freq.getRange();
			}
			double count = freq.getFrequency();
			
			Assert.assertTrue(expected.containsKey(key));
			Assert.assertEquals(expected.get(key), count, 0.0001);
		}
	}
	
	private void assertPropertyEquals(FL_Property property, int expected) {
		PropertyHelper helper = PropertyHelper.from(property);
		
		Integer value = (Integer)helper.getValue();
		
		Assert.assertEquals(expected, (int)value);
	}
	
	private void assertPropertyEquals(FL_Property property, String expected) {
		PropertyHelper helper = PropertyHelper.from(property);
		
		String value = (String)helper.getValue();
		
		Assert.assertEquals(expected, value);
	}
	
	@Test
	public void testCreateMutableCluster() {
		FL_Cluster cluster = clusterFactory.toCluster( Arrays.asList(entityA, entityB, entityC) );
		
		Assert.assertEquals(cluster.getMembers().size(), 3);
		Assert.assertEquals(cluster.getSubclusters().size(), 0);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 2.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 2.0);
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(200.0, 3.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 3);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 18);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 23);
	}
	
	@Test
	public void testCreateMutableClusterWithSubCluster() {
		FL_Cluster subcluster = clusterFactory.toCluster( Arrays.asList(entityC, entityD) );
		FL_Cluster cluster = clusterFactory.toCluster( Arrays.asList(entityA, entityB), Arrays.asList(subcluster) );
		
		Assert.assertEquals(cluster.getMembers().size(), 2);
		Assert.assertEquals(cluster.getSubclusters().size(), 1);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 3.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 2.0);
		dist.put("USA", 2.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put((650.0/3.0), 4.0); 
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 4);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 35);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 42);
	}
	
	@Test
	public void testCreateMutableClusterWithSubClusterSummary() {
		FL_Cluster cluster = clusterFactory.toCluster( Arrays.asList(entityA, entityB), Arrays.asList(clusterSummaryA) );
		
		Assert.assertEquals(cluster.getMembers().size(), 2);
		Assert.assertEquals(cluster.getSubclusters().size(), 1);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 401.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 301.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 202.0);
		dist.put("USA", 500.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put((1300.0/3.0), 702.0); 
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 702);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 3007);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 7010);
	}
	
	@Test
	public void testCreateOwnerCluster() {
		FL_Cluster owner = clusterFactory.toAccountOwnerSummary(entityA, Arrays.asList(entityB, entityC), new ArrayList<FL_Cluster>(0));
		
		Assert.assertEquals(owner.getMembers().size(), 2);
		Assert.assertEquals(owner.getSubclusters().size(), 0);
		Assert.assertEquals(owner.getTags(), Arrays.asList(FL_EntityTag.CLUSTER, FL_EntityTag.ACCOUNT_OWNER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(owner,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(250.0, 2.0); 
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, owner.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(owner, "count");
		assertPropertyEquals(prop, 2);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 16);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 20);
	}
	
	@Test
	public void testCreateOwnerClusterWithSubCluster() {
		FL_Cluster subcluster = clusterFactory.toCluster(Arrays.asList(entityD), new ArrayList<FL_Cluster>(0));
		FL_Cluster owner = clusterFactory.toAccountOwnerSummary(entityA, Arrays.asList(entityB, entityC), Arrays.asList(subcluster));
		
		Assert.assertEquals(owner.getMembers().size(), 2);
		Assert.assertEquals(owner.getSubclusters().size(), 1);
		Assert.assertEquals(owner.getTags(), Arrays.asList(FL_EntityTag.CLUSTER, FL_EntityTag.ACCOUNT_OWNER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 2.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		dist.put("USA", 2.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(owner,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(300.0, 3.0); 
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, owner.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(owner, "count");
		assertPropertyEquals(prop, 3);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 33);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 39);
	}
	
	@Test
	public void testUpdateMutableCluster() {
		FL_Cluster cluster = clusterFactory.toCluster( Arrays.asList(entityA, entityB) );
		
		Map<String, FL_Entity> relatedEntities = new Hashtable<String, FL_Entity>();
		relatedEntities.put(entityA.getUid(), entityA);
		relatedEntities.put(entityB.getUid(), entityB);
		relatedEntities.put(entityC.getUid(), entityC);
		Map<String, FL_Cluster> relatedClusters = new Hashtable<String, FL_Cluster>();
		
		// remove a member
		ClusterHelper.removeMember(cluster, entityA);
		
		clusterFactory.updateClusterProperties(cluster, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(cluster.getMembers().size(), 1);
		Assert.assertEquals(cluster.getSubclusters().size(), 0);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(200.0, 1.0);  
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 1);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 5);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 7);
		
		// add a member
		ClusterHelper.addMember(cluster, entityC);
		
		clusterFactory.updateClusterProperties(cluster, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(cluster.getMembers().size(), 2);
		Assert.assertEquals(cluster.getSubclusters().size(), 0);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(250.0, 2.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 2);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 16);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 20);
	}
	
	@Test
	public void testUpdateMutableClusterWithSubCluster() {
		FL_Cluster subcluster = clusterFactory.toCluster( Arrays.asList(entityC, entityD) );
		FL_Cluster cluster = clusterFactory.toCluster( Arrays.asList(entityA, entityB), Arrays.asList(subcluster) );
		
		Map<String, FL_Entity> relatedEntities = new Hashtable<String, FL_Entity>();
		relatedEntities.put(entityA.getUid(), entityA);
		relatedEntities.put(entityB.getUid(), entityB);
		relatedEntities.put(entityC.getUid(), entityC);
		relatedEntities.put(entityD.getUid(), entityD);
		Map<String, FL_Cluster> relatedClusters = new Hashtable<String, FL_Cluster>();
		relatedClusters.put(subcluster.getUid(), subcluster);
		
		// remove subcluster
		ClusterHelper.removeSubCluster(cluster, subcluster);
		
		clusterFactory.updateClusterProperties(cluster, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(cluster.getMembers().size(), 2);
		Assert.assertEquals(cluster.getSubclusters().size(), 0);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 2.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(150.0, 2.0);  
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 2);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 7);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 10);
		
		// add subcluster
		ClusterHelper.addSubCluster(cluster, subcluster);
		
		clusterFactory.updateClusterProperties(cluster, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(cluster.getMembers().size(), 2);
		Assert.assertEquals(cluster.getSubclusters().size(), 1);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 3.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 2.0);
		dist.put("USA", 2.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put((650.0/3.0), 4.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 4);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 35);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 42);
		
		
		// remove subcluster member
		ClusterHelper.removeMember(subcluster, entityC);
		
		clusterFactory.updateClusterProperties(cluster, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(cluster.getMembers().size(), 2);
		Assert.assertEquals(cluster.getSubclusters().size(), 1);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 2.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 2.0);
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put((700.0/3.0), 3.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 3);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 24);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 29);
		
		Assert.assertEquals(subcluster.getMembers().size(), 1);
		Assert.assertEquals(subcluster.getSubclusters().size(), 0);
		Assert.assertEquals(subcluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		prop = ClusterHelper.getFirstPropertyByTag(subcluster,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(subcluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, subcluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(subcluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityC");
		
		prop = ClusterHelper.getFirstProperty(subcluster, "count");
		assertPropertyEquals(prop, 1);
		
		prop = ClusterHelper.getFirstPropertyByTag(subcluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 17);
		
		prop = ClusterHelper.getFirstPropertyByTag(subcluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 19);
	}
	
	@Test
	public void testUpdateMutableClusterWithSubClusterSummary() {
		FL_Cluster cluster = clusterFactory.toCluster( Arrays.asList(entityA, entityB), Arrays.asList(clusterSummaryA) );
		
		Map<String, FL_Entity> relatedEntities = new Hashtable<String, FL_Entity>();
		relatedEntities.put(entityA.getUid(), entityA);
		relatedEntities.put(entityB.getUid(), entityB);
		relatedEntities.put(entityC.getUid(), entityC);
		relatedEntities.put(entityD.getUid(), entityD);
		Map<String, FL_Cluster> relatedClusters = new Hashtable<String, FL_Cluster>();
		relatedClusters.put(clusterSummaryA.getUid(), clusterSummaryA);
		
		// remove entity
		ClusterHelper.removeMember(cluster, entityA);
		
		clusterFactory.updateClusterProperties(cluster, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(cluster.getMembers().size(), 1);
		Assert.assertEquals(cluster.getSubclusters().size(), 1);
		Assert.assertEquals(cluster.getTags(), Arrays.asList(FL_EntityTag.CLUSTER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 400.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 301.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(cluster,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 201.0);
		dist.put("USA", 500.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(cluster,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(600.0, 701.0);  
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, cluster.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(cluster, "count");
		assertPropertyEquals(prop, 701);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 3005);
		
		prop = ClusterHelper.getFirstPropertyByTag(cluster, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 7007);
		
		
		Assert.assertEquals(clusterSummaryA.getMembers().size(), 0);
		Assert.assertEquals(clusterSummaryA.getSubclusters().size(), 0);
		Assert.assertEquals(clusterSummaryA.getTags(), Arrays.asList(FL_EntityTag.CLUSTER_SUMMARY));
		
		prop = ClusterHelper.getFirstPropertyByTag(clusterSummaryA,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 400.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 300.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(clusterSummaryA,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 200.0);
		dist.put("USA", 500.0);
		assertDistributionEquals(prop, dist);
				
		prop = ClusterHelper.getFirstPropertyByTag(clusterSummaryA, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "clusterSummaryA");
		
		prop = ClusterHelper.getFirstProperty(clusterSummaryA, "count");
		assertPropertyEquals(prop, 700);
		
		prop = ClusterHelper.getFirstPropertyByTag(clusterSummaryA, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 3000);
		
		prop = ClusterHelper.getFirstPropertyByTag(clusterSummaryA, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 7000);
	}
	
	@Test
	public void testUpdateOwnerCluster() {
		FL_Cluster owner = clusterFactory.toAccountOwnerSummary(entityA, Arrays.asList(entityB, entityC), new ArrayList<FL_Cluster>(0));
		
		Map<String, FL_Entity> relatedEntities = new Hashtable<String, FL_Entity>();
		relatedEntities.put(entityA.getUid(), entityA);
		relatedEntities.put(entityB.getUid(), entityB);
		relatedEntities.put(entityC.getUid(), entityC);
		Map<String, FL_Cluster> relatedClusters = new Hashtable<String, FL_Cluster>();
		
		// remove member
		ClusterHelper.removeMember(owner, entityB);
		
		clusterFactory.updateClusterProperties(owner, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(owner.getMembers().size(), 1);
		Assert.assertEquals(owner.getSubclusters().size(), 0);
		Assert.assertEquals(owner.getTags(), Arrays.asList(FL_EntityTag.CLUSTER, FL_EntityTag.ACCOUNT_OWNER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(owner,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(300.0, 1.0);  
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, owner.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(owner, "count");
		assertPropertyEquals(prop, 1);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 11);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 13);
		
		
		// add member
		ClusterHelper.addMember(owner, entityB);
		
		clusterFactory.updateClusterProperties(owner, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(owner.getMembers().size(), 2);
		Assert.assertEquals(owner.getSubclusters().size(), 0);
		Assert.assertEquals(owner.getTags(), Arrays.asList(FL_EntityTag.CLUSTER, FL_EntityTag.ACCOUNT_OWNER));
		
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(owner,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(250.0, 2.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, owner.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(owner, "count");
		assertPropertyEquals(prop, 2);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 16);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 20);
	}
	
	@Test
	public void testUpdateOwnerClusterWithSubClusters() {
		FL_Cluster subcluster = clusterFactory.toCluster( Arrays.asList(entityD) );
		FL_Cluster owner = clusterFactory.toAccountOwnerSummary(entityA, Arrays.asList(entityB, entityC), Arrays.asList(subcluster));
		
		Map<String, FL_Entity> relatedEntities = new Hashtable<String, FL_Entity>();
		relatedEntities.put(entityA.getUid(), entityA);
		relatedEntities.put(entityB.getUid(), entityB);
		relatedEntities.put(entityC.getUid(), entityC);
		relatedEntities.put(entityD.getUid(), entityD);
		Map<String, FL_Cluster> relatedClusters = new Hashtable<String, FL_Cluster>();
		relatedClusters.put(subcluster.getUid(), subcluster);
		
		// remove subcluster
		ClusterHelper.removeSubCluster(owner, subcluster);
		
		clusterFactory.updateClusterProperties(owner, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(owner.getMembers().size(), 2);
		Assert.assertEquals(owner.getSubclusters().size(), 0);
		Assert.assertEquals(owner.getTags(), Arrays.asList(FL_EntityTag.CLUSTER, FL_EntityTag.ACCOUNT_OWNER));
		
		FL_Property prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.TYPE);
		Hashtable<Object, Double> dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		dist.put(FL_EntityTag.ACCOUNT.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		dist.put("USA", 1.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(owner,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(250.0, 2.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, owner.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(owner, "count");
		assertPropertyEquals(prop, 2);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 16);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 20);
		
		
		// add subcluster
		ClusterHelper.addSubCluster(owner, subcluster);
		
		clusterFactory.updateClusterProperties(owner, relatedEntities, relatedClusters, true);
		
		Assert.assertEquals(owner.getMembers().size(), 2);
		Assert.assertEquals(owner.getSubclusters().size(), 1);
		Assert.assertEquals(owner.getTags(), Arrays.asList(FL_EntityTag.CLUSTER, FL_EntityTag.ACCOUNT_OWNER));
		
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.TYPE);
		dist = new Hashtable<Object, Double>();
		dist.put(FL_EntityTag.ACCOUNT.name(), 2.0);
		dist.put(FL_EntityTag.ANONYMOUS.name(), 1.0);
		assertDistributionEquals(prop, dist);
	
		prop = ClusterHelper.getFirstPropertyByTag(owner,FL_PropertyTag.GEO);
		dist = new Hashtable<Object, Double>();
		dist.put("CAN", 1.0);
		dist.put("USA", 2.0);
		assertDistributionEquals(prop, dist);
		
		prop = ClusterHelper.getFirstProperty(owner,"avTran-dist");
		dist = new Hashtable<Object, Double>();
		dist.put(300.0, 3.0);
		assertDistributionEquals(prop, dist);
		
		Assert.assertEquals(1.0, owner.getUncertainty().getConfidence(), 0.0001);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.LABEL);
		assertPropertyEquals(prop, "entityA");
		
		prop = ClusterHelper.getFirstProperty(owner, "count");
		assertPropertyEquals(prop, 3);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.INFLOWING);
		assertPropertyEquals(prop, 33);
		
		prop = ClusterHelper.getFirstPropertyByTag(owner, FL_PropertyTag.OUTFLOWING);
		assertPropertyEquals(prop, 39);
	}
}
