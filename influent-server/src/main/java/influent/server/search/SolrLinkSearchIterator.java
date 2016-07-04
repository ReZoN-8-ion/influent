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
import org.apache.solr.common.SolrDocumentList;

import java.util.ArrayList;
import java.util.List;


/**
 * Search result object for iterating through the results of a search.  Does paging, etc, behind the scenes.
 * @author msavigny
 *
 */
public class SolrLinkSearchIterator extends SolrBaseSearchIterator {

	public SolrLinkSearchIterator(
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


	private String getTarget(SolrDocument sd) {
		FL_PropertyDescriptors linkDescriptors = _applicationConfiguration.getLinkDescriptors();
		FL_PropertyDescriptors entityDescriptors = _applicationConfiguration.getEntityDescriptors();

		final String type = getTypeFromDocument(sd, linkDescriptors);

		Object oTarget = sd.getFieldValue(PropertyDescriptorHelper.mapKey(FL_RequiredPropertyKey.TO.name(), linkDescriptors.getProperties(), type));
		String sTarget = oTarget instanceof String ? (String)oTarget : oTarget instanceof Integer ? Integer.toString((Integer)oTarget) : null;
		
		Boolean isMultitype = (entityDescriptors.getTypes().size() > 1);
		
		String targetUID = "";
		for (String individualTarget : sTarget.split("\\s*,\\s*")) {
			String individualTargetUID = null;
			if (individualTarget != null) {
				char toClass = InfluentId.ACCOUNT;
				String toType;
				if (isMultitype) {
					InfluentId infId = InfluentId.fromTypedId(toClass, individualTarget);
					toType = infId.getIdType();
					individualTarget = infId.getNativeId();
				} else {
					toType = entityDescriptors.getTypes().get(0).getKey();
				}
				individualTargetUID = _namespaceHandler.globalFromLocalEntityId(toClass, toType, individualTarget);
			}
			if (individualTargetUID != null) {
				targetUID += individualTargetUID + ",";
			}
		}
		targetUID = targetUID.substring(0, targetUID.length() - 1);
		
		return targetUID;
	}

	protected FL_Link buildResultFromDocument(SolrDocument sd) {

		FL_Link.Builder linkBuilder = FL_Link.newBuilder();

		FL_PropertyDescriptors linkDescriptors = _applicationConfiguration.getLinkDescriptors();
		FL_PropertyDescriptors entityDescriptors = _applicationConfiguration.getEntityDescriptors();

		final String type = getTypeFromDocument(sd, linkDescriptors);

		Boolean isMultitype = (entityDescriptors.getTypes().size() > 1);

		String uid = sd.getFieldValue(PropertyDescriptorHelper.mapKey(FL_RequiredPropertyKey.ID.name(), linkDescriptors.getProperties(), type)).toString();

		Object oSource = sd.getFieldValue(PropertyDescriptorHelper.mapKey(FL_RequiredPropertyKey.FROM.name(), linkDescriptors.getProperties(), type));
		String sSource = oSource instanceof String ? (String)oSource : oSource instanceof Integer ? Integer.toString((Integer)oSource) : null;

		linkBuilder.setProvenance(null);
		linkBuilder.setUncertainty(null);
		linkBuilder.setType(type);

		List<FL_Property> props = getPropertiesFromDocument(sd, type, linkDescriptors.getProperties());

		linkBuilder.setProperties(props);

		linkBuilder.setLinkTypes(null);

		linkBuilder.setUid(_namespaceHandler.globalFromLocalEntityId(InfluentId.LINK, type, uid));

		String sourceUID = null;
		if (sSource != null) {
			InfluentId infId;
			if (isMultitype) {
				infId = InfluentId.fromTypedId(InfluentId.ACCOUNT, sSource);
			} else {
				infId = InfluentId.fromNativeId(InfluentId.ACCOUNT, entityDescriptors.getTypes().get(0).getKey(), sSource);
			}
			sourceUID =  infId.toString();
		}

		linkBuilder.setSource(sourceUID);
		linkBuilder.setTarget(getTarget(sd));

		return linkBuilder.build();
	}



	// Build an FL_Link result from a list of SolrDocuments returned from a group command in a query
	protected FL_Link buildResultFromGroupedDocuments(SolrDocumentList dl) {

		// Build the initial result from the first document
		FL_Link link = buildResultFromDocument(dl.get(0));

		// Get the nodetype
		String targetField = PropertyDescriptorHelper.mapKey(
			FL_RequiredPropertyKey.TO.name(),
			_applicationConfiguration.getLinkDescriptors().getProperties(),
			link.getType()
		);

		// Add the remaining document properties to the entity
		// Currently only the TO field is aggregated from grouping of one-to-many links
		for (int i = 1; i < dl.size(); i++) {
			SolrDocument sd = dl.get(i);
			String target = (String)sd.getFieldValue(targetField);

			FL_Property property = null;
			List<FL_Property> properties = link.getProperties();
			for (FL_Property prop : link.getProperties()) {
				if (prop.getKey().equals(FL_RequiredPropertyKey.TO.name())) {
					property = prop;
				}
			}

			if (property != null) {
				Object range = property.getRange();

				if (range instanceof FL_ListRange) {
					List<Object> values = ((FL_ListRange) range).getValues();
					values.add(target);
				} else if (range instanceof FL_SingletonRange) {
					List<Object> values = new ArrayList<Object>();
					values.add(((FL_SingletonRange) range).getValue());
					values.add(target);
					property.setRange(FL_ListRange.newBuilder().setType(FL_PropertyType.STRING).setValues(values).build());
				}

				link.setProperties(properties);
			}

			link.setTarget(link.getTarget() + "," + getTarget(sd));
		}

		return link;
	}
}
