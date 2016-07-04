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

import influent.idl.*;
import influent.idlhelper.EntityHelper;
import influent.idlhelper.LinkHelper;
import influent.idlhelper.PropertyHelper;
import influent.idlhelper.SingletonRangeHelper;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.search.DataViewLinkSearch;
import influent.server.sql.SQLBuilder;
import influent.server.utilities.SQLConnectionPool;
import org.apache.avro.AvroRemoteException;

import java.util.Collections;
import java.util.List;

import oculus.aperture.spi.common.Properties;
public class KivaTransactionsSearch extends DataViewLinkSearch implements FL_LinkSearch {

	private final FL_DataAccess service;

	//----------------------------------------------------------------------
	
	
	public KivaTransactionsSearch(
		Properties config,
		SQLConnectionPool connectionPool,
		DataNamespaceHandler namespaceHandler,
		SQLBuilder sqlBuilder,
		FL_ClusteringDataAccess clusterDataAccess,
		FL_DataAccess service
	) {
		super(config, connectionPool, namespaceHandler, sqlBuilder, clusterDataAccess);
		this.service = service;
	}




	@Override
	protected FL_Link createLink(String uid, String from, String to, String type, List<FL_Property> props) {

		FL_Property fromProp = null;
		FL_Property toProp = null;

		for (FL_Property prop : props) {
			if (prop.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.FROM.name())) {
				fromProp = prop;
			} else if (prop.getKey().equalsIgnoreCase(FL_RequiredPropertyKey.TO.name())) {
				toProp = prop;
			}
		}

		if (fromProp != null) {
			try {
				List<FL_Entity> entityResults = service.getEntities(Collections.singletonList(from), FL_LevelOfDetail.SUMMARY);
				if (entityResults != null && entityResults.size() > 0) {
					for (FL_Entity entity : entityResults) {
						if (entity.getUid().equalsIgnoreCase(from)) {
							fromProp.setRange(
								SingletonRangeHelper.from(
									EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.NAME).getValue().toString() + " (" + PropertyHelper.getValue(fromProp) + ")"
								)
							);
						}
					}
				}
			} catch (AvroRemoteException are) {
				// do nothing
			}
		}

		if (toProp != null) {
			try {
				List<FL_Entity> entityResults = service.getEntities(Collections.singletonList(to), FL_LevelOfDetail.SUMMARY);
				if (entityResults != null && entityResults.size() > 0) {
					for (FL_Entity entity : entityResults) {
						if (entity.getUid().equalsIgnoreCase(to)) {
							toProp.setRange(
								SingletonRangeHelper.from(
									EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.NAME).getValue().toString() + " (" + PropertyHelper.getValue(toProp) + ")"
								)
							);
						}
					}
				}
			} catch (AvroRemoteException are) {
				// do nothing
			}
		}

		return new LinkHelper(uid, from, to, type, props, null);
	}
}
