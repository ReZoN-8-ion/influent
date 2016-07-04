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
package influent.server.search;

import influent.idl.FL_EntitySearch;
import influent.idl.FL_LevelOfDetail;
import influent.idl.FL_OrderBy;
import influent.idl.FL_PropertyMatchDescriptor;
import influent.idl.FL_ReservedPropertyKey;
import influent.idl.FL_SearchResult;
import influent.idl.FL_SearchResults;
import influent.idlhelper.PropertyDescriptorHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.dataaccess.SearchSolrHelper;
import influent.server.sql.SQLBuilder;
import influent.server.utilities.PropertyField;
import influent.server.utilities.SQLConnectionPool;
import oculus.aperture.spi.common.Properties;

import org.apache.avro.AvroRemoteException;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrQuery.ORDER;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.impl.HttpSolrServer;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class SolrEntitySearch extends DataViewEntitySearch implements FL_EntitySearch {

	private SolrServer _solr;
	private Properties _config;



	public SolrEntitySearch(
		Properties config,
		SQLConnectionPool connectionPool,
		DataNamespaceHandler namespaceHandler,
		SQLBuilder sqlBuilder
	) {
		super(config, connectionPool, namespaceHandler, sqlBuilder);

		String url = config.getString("influent.midtier.solr.entities.url", null);
		if (url == null) {
			url = config.getString("influent.midtier.solr.url", "http://localhost:8983");
		}

		_solr = new HttpSolrServer(url);
		_config = config;
	}



	@Override
	public FL_SearchResults search(
		Map<String, List<FL_PropertyMatchDescriptor>> termMap,
		List<FL_OrderBy> orderBy,
		long start,
		long max,
		FL_LevelOfDetail lod
	) throws AvroRemoteException {

		ArrayList<FL_SearchResult> results = new ArrayList<FL_SearchResult>();
		SolrEntitySearchIterator ssr;

		// Form the query
		String searchStr = SearchSolrHelper.toSolrQuery(termMap, getDescriptors(), getPropertyFieldProvider());

		// issue the query
		SolrQuery query = new SolrQuery();
		query.setQuery(searchStr);
		query.setFields("*","score");

		// form a union of sort by fields for all types
		orderBy = PropertyDescriptorHelper.mapOrderBy(orderBy, getDescriptors().getProperties(), termMap.keySet());

		if (orderBy != null) {
			for (FL_OrderBy ob : orderBy) {
				String key= (ob.getPropertyKey().equals(FL_ReservedPropertyKey.MATCH.name()))? "score": ob.getPropertyKey();
				
				query.addSortField(key, ob.getAscending()? ORDER.asc : ORDER.desc);
			}
		}

		ssr = buildSolrEntitySearchIterator(
			getNamespaceHandler(),
			_solr,
			query,
			_config,
			lod,
			_applicationConfiguration,
            getPropertyFieldProvider()
        );

		if (start >= 0) {
			ssr.setStartIndex((int)start);
		}
		if (max > 0) {
			ssr.setMaxResults((int)max);
		}

		// Add results from the matching documents
		while (ssr.hasNext()) {
			FL_SearchResult fsr = ssr.next();
			results.add(fsr);
		}

		return FL_SearchResults.newBuilder()
			.setTotal(ssr.getTotalResults())
			.setResults(results)
			.setLevelOfDetail(lod)
			.build();
	}




	protected SolrEntitySearchIterator buildSolrEntitySearchIterator(
		DataNamespaceHandler namespaceHandler,
		SolrServer solr,
		SolrQuery query,
		Properties config,
		FL_LevelOfDetail levelOfDetail,
		ApplicationConfiguration applicationConfiguration,
		PropertyField.Provider propertyFieldProvider
	) {
		return new SolrEntitySearchIterator(namespaceHandler, solr, query, config, levelOfDetail, applicationConfiguration, propertyFieldProvider);
	}
}
