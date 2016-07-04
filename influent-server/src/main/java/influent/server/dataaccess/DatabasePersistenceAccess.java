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
package influent.server.dataaccess;

import influent.idl.FL_Persistence;
import influent.idl.FL_PersistenceState;
import influent.server.utilities.SQLConnectionPool;
import org.apache.avro.AvroRemoteException;
import org.joda.time.DateTime;
import org.json.JSONException;
import org.json.JSONObject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;


/**
 *
 */
public class DatabasePersistenceAccess implements FL_Persistence {
	
	private final SQLConnectionPool _connectionPool;
	private final String _dataTableNames;
	private final DataNamespaceHandler _namespaceHandler;
	
	
	
	public DatabasePersistenceAccess(
		SQLConnectionPool connectionPool, 
		String dataTableNames,
		DataNamespaceHandler namespaceHandler
	) {
		_connectionPool = connectionPool;
		_dataTableNames = dataTableNames;
		_namespaceHandler = namespaceHandler;
	}
	
	
	
	
	private DataNamespaceHandler getNamespaceHandler() {
		return _namespaceHandler;
	}
	
	
	
	
	private String getClientStateTableName() {
		String clientStateTableName = "clientState";
		try {
			JSONObject tableNameMap = new JSONObject(_dataTableNames);
			if (!tableNameMap.isNull(clientStateTableName)) {
				clientStateTableName = tableNameMap.getString(clientStateTableName);
			}
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return clientStateTableName;
	}
	
	
	
	
	@Override
	public FL_PersistenceState persistData(String sessionId, String data) throws AvroRemoteException {
		
		FL_PersistenceState state = null;
		Connection connection = null;
		try {
			String clientStateTableName = getClientStateTableName();
			
			connection = _connectionPool.getConnection();
		
			PreparedStatement stmt = connection.prepareStatement(
				"SELECT sessionId FROM " + 
				clientStateTableName + " " +
				"WHERE sessionId = ?"
			);
			stmt.setString(1, sessionId);
			
			boolean exists = false;
			
			ResultSet rs = stmt.executeQuery();
			while (rs.next()) {
				exists = true;
			}
			rs.close();
			
			stmt.close();

			data = data.replaceAll("'", "''");
			DateTime now = new DateTime();
			if (exists) {
				state = FL_PersistenceState.MODIFIED;
				
				// Create UPDATE prepared statement
				PreparedStatement pstmt = connection.prepareStatement(
					"UPDATE " + clientStateTableName + " " +
					"SET data = ?, modified = ? " +
					"WHERE sessionId = ?"
				);
				pstmt.setString(1, data);
				pstmt.setString(2, getNamespaceHandler().formatDate(now));
				pstmt.setString(3, sessionId);
				
				// Execute prepared statement and evaluate results
				pstmt.executeUpdate();
				
				// Close prepared statement
				pstmt.close();
			} else {
				state = FL_PersistenceState.NEW;
				// Create INSERT prepared statement
				PreparedStatement pstmt = connection.prepareStatement(
					"INSERT INTO " + clientStateTableName + " (sessionId, created, modified, data)" +
					"VALUES (?, ?, ?, ?) "
				);
				pstmt.setString(2, sessionId);
				pstmt.setString(3, getNamespaceHandler().formatDate(now));
				pstmt.setString(4, getNamespaceHandler().formatDate(now));
				pstmt.setString(5, data);
				
				// Execute prepared statement and evaluate results
				pstmt.executeUpdate();
				
				// Close prepared statement
				pstmt.close();		
			}

			connection.close();
		} catch (ClassNotFoundException e) {
			state = FL_PersistenceState.ERROR;
			throw new AvroRemoteException(e);
		} catch (SQLException e) {
			state = FL_PersistenceState.ERROR;
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
		
		return state;
	}
	
	
	
	
	@Override
	public String getData(String sessionId) throws AvroRemoteException {
		
		String data = null;
		Connection connection = null;
		try {
			connection = _connectionPool.getConnection();
		
			String clientStateTableName = getClientStateTableName();
			
			PreparedStatement stmt = connection.prepareStatement(
				"SELECT data FROM " + 
				clientStateTableName + " " +
				"WHERE sessionId = ?"
			);
			stmt.setString(1, sessionId);
				
			ResultSet rs = stmt.executeQuery();
			while (rs.next()) {
				data = rs.getString("data");
			}
			
			rs.close();
			stmt.close();
			
			if (data != null) {
				Integer contextCount = 0;
				String tempSessionId = sessionId.replace("-", "_");
				
				stmt = connection.prepareStatement(
					"SELECT count(*) AS dataviewCount " + 
					"FROM tempdb.sys.tables " +
					"WHERE name LIKE ?"
				);
				stmt.setString(1, "##dynamic_cluster_dataview_" + tempSessionId + "%");
				
				rs = stmt.executeQuery();
				while (rs.next()) {
					contextCount = Integer.parseInt(rs.getString("dataviewCount"));
				}
				
				rs.close();
				stmt.close();

				if (contextCount == 0) {
					data = null;
				}
			}
			
			stmt.close();
			connection.close();
		} catch (ClassNotFoundException e) {
			throw new AvroRemoteException(e);
		} catch (SQLException e) {
			throw new AvroRemoteException(e);
		} finally {
			try {
				connection.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
		
		return data;
	}
}
