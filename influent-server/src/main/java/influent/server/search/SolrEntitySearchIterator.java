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

import influent.idl.*;
import influent.idlhelper.PropertyDescriptorHelper;
import influent.server.configuration.ApplicationConfiguration;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.utilities.PropertyField;
import influent.server.utilities.InfluentId;
import oculus.aperture.spi.common.Properties;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.common.SolrDocument;

import java.util.ArrayList;
import java.util.List;

/**
 * Search result object for iterating through the results of a search.  Does paging, etc, behind the scenes.
 * @author msavigny
 *
 */

public class SolrEntitySearchIterator extends SolrBaseSearchIterator {

	public SolrEntitySearchIterator(
			DataNamespaceHandler namespaceHandler,
			SolrServer server,
			SolrQuery q,
			Properties config,
			FL_LevelOfDetail levelOfDetail,
			ApplicationConfiguration applicationConfiguration,
			PropertyField.Provider propertyFieldProvider
	) {
		_namespaceHandler = namespaceHandler;
		_server = server;
		_query = q;
		_config = config;
		_totalResults = -1;
		_levelOfDetail = levelOfDetail;
		_applicationConfiguration = applicationConfiguration;
		_fieldProvider = propertyFieldProvider;

		_curResults = new ArrayList<FL_SearchResult>(REFRESH_SIZE);
		for (int i=0;i<REFRESH_SIZE;i++) {
			_curResults.add(null);
		}
	}




	protected FL_Entity buildResultFromDocument(SolrDocument sd) {
		
		FL_Entity.Builder entityBuilder = FL_Entity.newBuilder();

		FL_PropertyDescriptors entityDescriptors = _applicationConfiguration.getEntityDescriptors();

		final String type = getTypeFromDocument(sd, entityDescriptors);

		String uid = sd.getFieldValue(PropertyDescriptorHelper.mapKey(FL_RequiredPropertyKey.ID.name(), entityDescriptors.getProperties(), type)).toString();

		// if multitype system, we parse the typed id to get the native id
		if (entityDescriptors.getTypes().size() > 1) {
			String[] splits = uid.split("\\.", 3);

			if (splits.length == 2) {
				uid = splits[1];
			}
		}

		entityBuilder.setProvenance(null);
		entityBuilder.setUncertainty(null);

		entityBuilder.setType(type);
		
		List<FL_Property> props = getPropertiesFromDocument(sd, type, entityDescriptors.getProperties());

		// Common tags
		List<FL_EntityTag> etags = new ArrayList<FL_EntityTag>();
		etags.add(FL_EntityTag.ACCOUNT);
		entityBuilder.setUid(_namespaceHandler.globalFromLocalEntityId(InfluentId.ACCOUNT, type, uid));
		entityBuilder.setTags(etags);
		entityBuilder.setProperties(props);
		
		return entityBuilder.build();
	}
}
