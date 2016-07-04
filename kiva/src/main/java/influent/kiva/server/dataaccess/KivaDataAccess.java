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

package influent.kiva.server.dataaccess;

import com.google.inject.Inject;

import influent.idl.*;
import influent.idlhelper.EntityHelper;
import influent.midtier.kiva.data.KivaTypes;
import influent.server.dataaccess.DataAccessHelper;
import influent.server.dataaccess.DataNamespaceHandler;
import influent.server.dataaccess.DataViewDataAccess;
import influent.server.sql.SQLBuilder;
import influent.server.utilities.SQLConnectionPool;
import influent.server.utilities.InfluentId;

import org.apache.avro.AvroRemoteException;
import org.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import oculus.aperture.spi.common.Properties;

import java.sql.*;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Hopefully a better implementation of the Kiva Data Access
 * @author msavigny
 *
 */

public class KivaDataAccess extends DataViewDataAccess implements FL_DataAccess {

	public static final String s_kivaTypeKey = "kiva_type";
	private static Logger s_logger = LoggerFactory.getLogger(KivaDataAccess.class);

	// --- Brokers ---
	public static final String PARTNER_BROKERS 		= "PartnerBrokers";



	@Inject	
	public KivaDataAccess(
		Properties config,
		SQLConnectionPool connectionPool,
		FL_EntitySearch search,
		DataNamespaceHandler namespaceHandler,
		SQLBuilder sqlBuilder
	) throws ClassNotFoundException, SQLException, JSONException {
		super(config, connectionPool, search, namespaceHandler, sqlBuilder);
	}




	@Override
	public Map<String, List<FL_Entity>> getAccounts(
			List<String> entities
		) throws AvroRemoteException {

		final List<String> ns_entities = InfluentId.nativeFromInfluentIds(entities);
		Map<String, List<FL_Entity>> map = new HashMap<String, List<FL_Entity>>();

		if (ns_entities.isEmpty()) return map;
		Connection connection = null;
		try {
			connection = _connectionPool.getConnection();
			Statement stmt = connection.createStatement();

			String partnerBrokersTable = _applicationConfiguration.getTable("PartnerBrokers", "PartnerBrokers");
			String brokerColumn = _applicationConfiguration.getColumn("PartnerBrokers", "BrokerEntityId");
			String partnerColumn = _applicationConfiguration.getColumn("PartnerBrokers", "PartnerEntityId");

			// lookup partner accounts for partner entities
			String sql = "SELECT " +
					brokerColumn + ", " +
					partnerColumn + " " +
					"FROM " + partnerBrokersTable + " " +
					"WHERE " + partnerColumn + " IN " + DataAccessHelper.createInClause(ns_entities);

			List<String> accounts = new LinkedList<String>();

			if (stmt.execute(sql)) {
				ResultSet rs = stmt.getResultSet();
				while (rs.next()) {
					String id = rs.getString(brokerColumn);
					String accountId = InfluentId.ACCOUNT + ".partner." + id;
					accounts.add(accountId);
				}
			}

			for (FL_Entity entity : getEntities(accounts, FL_LevelOfDetail.SUMMARY) ) {
				String ownerId = InfluentId.ACCOUNT_OWNER + "." + (String)EntityHelper.getFirstPropertyByTag(entity, FL_PropertyTag.ACCOUNT_OWNER).getValue();

				if (!map.containsKey(ownerId)) {
					map.put(ownerId, new LinkedList<FL_Entity>());
				}
				map.get(ownerId).add(entity);
			}

			stmt.close();
			connection.close();
		}
		catch (Exception e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
		return map;
	}
}
