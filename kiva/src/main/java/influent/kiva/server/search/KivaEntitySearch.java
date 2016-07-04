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

package influent.kiva.server.search;

import java.util.List;
import java.util.Map;

import com.google.inject.Inject;

import influent.idl.FL_LevelOfDetail;
import influent.idl.FL_OrderBy;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_RequiredPropertyKey;
import influent.idl.FL_SearchResults;
import influent.idl.FL_SingletonRange;
import influent.midtier.kiva.data.KivaTypes;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.search.SolrEntitySearch;
import influent.server.search.SolrEntitySearchIterator;
import influent.server.sql.SQLBuilder;
import influent.server.utilities.PropertyField;
import influent.server.utilities.SQLConnectionPool;
import oculus.aperture.spi.common.Properties;

import org.apache.avro.AvroRemoteException;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;

public class KivaEntitySearch extends SolrEntitySearch {

	//private static final Logger s_logger = LoggerFactory.getLogger(KivaEntitySearch.class);

	//----------------------------------------------------------------------

	@Inject
	public KivaEntitySearch(
		Properties config,
		SQLConnectionPool connectionPool,
		DataNamespaceHandler namespaceHandler,
		SQLBuilder sqlBuilder
	) {
		super(config, connectionPool, namespaceHandler, sqlBuilder);
	}



	@Override
	protected SolrEntitySearchIterator buildSolrEntitySearchIterator(
		DataNamespaceHandler namespaceHandler,
		SolrServer server,
		SolrQuery query,
		Properties config,
		FL_LevelOfDetail levelOfDetail,
		ApplicationConfiguration applicationConfiguration,
		PropertyField.Provider propertyFieldProvider
	) {
		return new KivaEntitySearchIterator(namespaceHandler, server, query, config, levelOfDetail, applicationConfiguration, propertyFieldProvider);
	}
	
	public FL_SearchResults search(
			Map<String, List<FL_PropertyMatchDescriptor>> termMap,
			List<FL_OrderBy> orderBy,
			long start,
			long max,
			FL_LevelOfDetail lod
		) throws AvroRemoteException {
		
		//Special case for partners. Only partner ids are stored in solr. So if user searches for a partner 
		//broker id (eg partner.p.189-123) we will strip off the broker portion (eg -123)
		if (termMap.containsKey(KivaTypes.TYPE_PARTNER) && termMap.get(KivaTypes.TYPE_PARTNER) != null) {
			List<FL_PropertyMatchDescriptor> partnerTerms = termMap.get(KivaTypes.TYPE_PARTNER);
			
			for (FL_PropertyMatchDescriptor term : partnerTerms) {
				if (term.getKey().equals(FL_RequiredPropertyKey.ENTITY.name())) {
					final Object r = term.getRange();
					Object value = null;
					if (r instanceof FL_SingletonRange) {
						
						value = ((FL_SingletonRange)r).getValue();
						String sValue = (String)value;
						if (sValue.indexOf("-") >= 0) {
							sValue = sValue.substring(0, sValue.indexOf("-"));
						}
						((FL_SingletonRange)r).setValue(sValue);
					}
				}
			}
		}
		
		return super.search(termMap, orderBy, start, max, lod);
	}
}
