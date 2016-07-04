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

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.skife.csv.SimpleWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.oculusinfo.ml.spark.SparkInstanceParserHelper;

public class PopulateClusterDataViews {
	private static Logger log = LoggerFactory.getLogger("influent");
	
	private String clusterDataViewTableName = "global_cluster_dataview";
	private Connection connection;
	private String inputDir;
	private int rowcount = 0;
	private boolean postProcessClusters = false;
	private boolean sanityCheck = false;
	private boolean exportToDB = false;
	private boolean exportToCSV = false;
	private boolean createTables = false;
	private Map<String, Set<String>> clusterMembers = new HashMap<String, Set<String>>();
	
	private class ClusterRow {
		public String parentId;
		public String clusterId;
		public int level;
		public String entityId;
		
		public ClusterRow(String parentId, String clusterId, int level, String entityId) {
			this.parentId = parentId;
			this.clusterId = clusterId;
			this.level = level;
			this.entityId = entityId;
		}
		
		private String toSQL(String value) {
			return value.replaceAll("'", "''");
		}
		
		public String toSQL() {
			return "('" + clusterId + "','" + parentId + "'," + level + ",'" + toSQL(entityId) + "')";
		}
		
		public Object[] toObject() {
			return new Object[] { clusterId, parentId, level, entityId };
		}
	}
	
	public PopulateClusterDataViews(String inputDir, 
									String dbconstr, 
									String dbuser, 
									String dbpassword, 
									String dataviewtable, 
									boolean createTables,
									boolean postProcessClusters,
									boolean sanityCheck,
									boolean exportToDB,
									boolean exportToCSV) throws ClassNotFoundException, SQLException {
		log.error("Creating DB Connection");
		connection = createDBConnection(dbconstr, dbuser, dbpassword);
		
		this.createTables = createTables;
		this.clusterDataViewTableName = dataviewtable;
		this.postProcessClusters = postProcessClusters;
		this.exportToDB = exportToDB;
		this.exportToCSV = exportToCSV;
		this.sanityCheck = sanityCheck;
		this.inputDir = inputDir;
	}
	
	public void start() throws SQLException, ClassNotFoundException, IOException {
		if (exportToCSV) {
			createCSVOutputFile();
		}
		
		if (createTables) {
			createDataViewTable();
		}
		
		if (exportToDB || exportToCSV) {
			persistClusters();
		}
		
		if (createTables) { // we do this as a second step to speed up bulk insert
			createDataViewIndices();
		}
		
		if (postProcessClusters) {
			postProcessClusters();
		}
		
		if (sanityCheck){
			sanityCheckDataView();
		}
	}
	
	private void createCSVOutputFile() {
		try {
			FileWriter writer = new FileWriter(new File("output.csv"));
			writer.write("clusterId,parentId,level,entityId\n");
			writer.flush();
			writer.close();
		} catch (IOException e) {
			System.err.println("Unable to create output csv file");
		}
	}
	
	private Connection createDBConnection(String connStr, String username, String password) throws ClassNotFoundException, SQLException {	
		if (connection == null) {
			Class.forName("net.sourceforge.jtds.jdbc.Driver"); 
			connection = DriverManager.getConnection(connStr, username, password);
		}
		return connection;
	}
	
	private void createDataViewTable() {
		try {
			Statement stmt = connection.createStatement();
			String sql = "CREATE TABLE " + clusterDataViewTableName + " (id bigint PRIMARY KEY IDENTITY, clusterid nvarchar(100), rootid nvarchar(100), parentid nvarchar(100), hierarchylevel int NOT NULL DEFAULT 0, isleaf nvarchar(1) NOT NULL DEFAULT 'N', entityid nvarchar(100) NOT NULL );";
			stmt.execute(sql);
			stmt.close();
		}
		catch (Exception e) {
			System.err.println("Unable to create cluster dataview table: " + clusterDataViewTableName + " - ensure you DROP this table prior to running PopulateClusterDataViews.");
			System.exit(0);
		}
	}
	
	private void createDataViewIndices() {
		try {
			Statement stmt = connection.createStatement();
			String sql = "CREATE INDEX ix_gcluster_dataview_rowid ON " + clusterDataViewTableName + " (id);";
			stmt.execute(sql);
			sql = "CREATE INDEX ix_gcluster_dataview_id ON " + clusterDataViewTableName + " (clusterid);";
			stmt.execute(sql);
			sql = "CREATE INDEX ix_gcluster_dataview_eid ON " + clusterDataViewTableName + " (entityid);";
			stmt.execute(sql);
			sql = "CREATE INDEX ix_gcluster_dataview_pid ON " + clusterDataViewTableName + " (parentid);";
			stmt.execute(sql);
			sql = "CREATE INDEX ix_gcluster_dataview_id_eid ON " + clusterDataViewTableName + " (clusterid, entityid);";
			stmt.execute(sql);
			sql = "CREATE INDEX ix_gcluster_dataview_rid_lvl ON " + clusterDataViewTableName + " (entityid, hierarchylevel);";
			stmt.execute(sql);
			stmt.close();
		}
		catch (Exception e) {
			System.err.println("Unable to create cluster dataview indices.  Ensure you DROP indices prior to running PopulateClusterDataViews.");
			System.exit(0);
		}
	}
	
	private void writeClusterMembersToCSV(List<ClusterRow> values) throws IOException {
		SimpleWriter writer = new SimpleWriter( new FileWriter("output.csv", true) );
		writer.setAutoFlush(true);
		
		for (ClusterRow value : values) {
			writer.append(value.toObject());
		}
	}
	
	private void writeClusterMembersToDB(List<ClusterRow> values) throws SQLException, ClassNotFoundException {
		int i = 1;
		
		Statement stmt = connection.createStatement();
		
		String insertClause = "INSERT INTO " + clusterDataViewTableName + " (clusterid, parentid, hierarchylevel, entityid) values ";
		StringBuilder valueClause = new StringBuilder();
		
		for (ClusterRow value : values) {
			valueClause.append(value.toSQL() + ",");
			
			if (i % 1000 == 0) {
				rowcount += 1000;
				log.error("Writing rows " + (rowcount-1000) + " to " + rowcount);
				valueClause.replace(
						valueClause.lastIndexOf(","),
						valueClause.length(),
						";"
				);
				stmt.execute(insertClause + valueClause.toString());
				valueClause = new StringBuilder();
			}
			i++;
		}
		if (valueClause.length() > 0) {
			rowcount += valueClause.length();
			log.error("Writing rows " + (rowcount-valueClause.length()) + " to " + rowcount);
			valueClause.replace(
					valueClause.lastIndexOf(","),
					valueClause.length(),
					";"
			);
			stmt.execute(insertClause + valueClause.toString());
		}
		stmt.close();
	}
	
	private void updateLeafFlag() throws SQLException, ClassNotFoundException {	
		Statement stmt = connection.createStatement();
		
		// Initially set isLeaf to yes for all clusters
		String sql = "UPDATE " + clusterDataViewTableName + " SET isleaf = 'Y' ";
		stmt.execute(sql);
		
		// For all clusters that have children set isLeaf to no
		String update = "UPDATE " + clusterDataViewTableName + " SET isleaf = 'N' WHERE EXISTS ( SELECT * FROM " + clusterDataViewTableName + " a WHERE a.parentid = " + clusterDataViewTableName + ".clusterid )";
		stmt = connection.createStatement();
		stmt.executeUpdate(update);
		
		stmt.close();
	}
	
	private void updateRootIds() throws SQLException, ClassNotFoundException {
		// find the max hieararchy levels
		String sql = "SELECT MAX(hierarchylevel) as maxdepth FROM " + clusterDataViewTableName;
		Statement stmt = connection.createStatement();
		ResultSet rs = stmt.executeQuery(sql);
		rs.next();
	
		int maxlevel = rs.getInt("maxdepth");
		
		// set rootid and parentid = NULL for root (level 0 is the root)
		String update = "UPDATE " + clusterDataViewTableName + " SET rootid = NULL, parentid = NULL WHERE hierarchylevel = 0";
		stmt = connection.createStatement();
		stmt.executeUpdate(update);
		
		// set level 1 clusters root to the same as their parent (level 0 is the root)
		update = "UPDATE " + clusterDataViewTableName + " SET rootid = parentid WHERE hierarchylevel = 1";
		stmt = connection.createStatement();
		stmt.executeUpdate(update);
		
		// iteratively set the root id on each level > 1 in ascending order
		for (int lvl=2; lvl <= maxlevel; lvl++) {
			update = " UPDATE " + clusterDataViewTableName;
			update += "   SET " + clusterDataViewTableName + ".rootid = ( CASE WHEN d2.rootid IS NULL THEN d2.clusterid ELSE d2.rootid END )";
			update += "  FROM " + clusterDataViewTableName;
			update += "  JOIN " + clusterDataViewTableName + " d2 ";
			update += "    ON " + clusterDataViewTableName + ".parentid = d2.clusterid ";
			update += " WHERE " + clusterDataViewTableName + ".hierarchylevel = " + lvl;
			stmt = connection.createStatement();
			stmt.executeUpdate(update);
		}
		rs.close();
		stmt.close();
	}
	
	private void updateLevelNumber() throws SQLException, ClassNotFoundException  {
		// find the max hieararchy levels
		String sql = "SELECT MAX(hierarchylevel) as maxdepth FROM " + clusterDataViewTableName;
		Statement stmt = connection.createStatement();
		ResultSet rs = stmt.executeQuery(sql);
		rs.next();
			
		int maxlevel = rs.getInt("maxdepth");
		
		// iteratively set the hierarchy level on each level > 0 in ascending order
		for (int lvl=0; lvl <= maxlevel; lvl++) {
			StringBuilder update = new StringBuilder();
			update.append(" UPDATE " + clusterDataViewTableName);
			update.append("   SET " + clusterDataViewTableName + ".hierarchylevel = (d2.hierarchylevel + 1)");
			update.append("  FROM " + clusterDataViewTableName);
			update.append("  JOIN " + clusterDataViewTableName + " d2 ");
			update.append("    ON " + clusterDataViewTableName + ".parentid = d2.clusterid ");
			update.append(" WHERE d2.hierarchylevel = " + lvl);
			stmt = connection.createStatement();
			stmt.executeUpdate(update.toString());
		}
		rs.close();
		stmt.close();
	}
	
	private void sanityCheckDataView() throws SQLException {
		log.error("Performing sanity checks on cluster data view...");
		
		boolean passed = true;
		
		Statement stmt = connection.createStatement();
		
		// check roots for non-null values for root id
		String sql = "SELECT count(*) as total FROM " + clusterDataViewTableName + " WHERE hierarchylevel = 0 AND rootid IS NOT NULL";
		ResultSet rs = stmt.executeQuery(sql);
		if (rs.next() && (rs.getInt("total") > 0)) {
			log.error("WARNING: There are root clusters that have incorrect rootid's.  These values should be NULL for root clusters.");
			passed = false;
		}
		
		// check roots for non-null values for parent id
		sql = "SELECT count(*) as total FROM " + clusterDataViewTableName + " WHERE hierarchylevel = 0 AND parentid IS NOT NULL";
		rs = stmt.executeQuery(sql);
		if (rs.next() && (rs.getInt("total") > 0)) {
			log.error("WARNING: There are root clusters that have incorrect parentid's.  These values should be NULL for root clusters.");
			passed = false;
		}
		
		// check for dangling parents that do not point to valid rows
		sql = "SELECT count(*) as total FROM " + clusterDataViewTableName + " c1 WHERE NOT EXISTS (SELECT * FROM " + clusterDataViewTableName + " WHERE clusterid = c1.parentid) AND c1.hierarchylevel > 0";
		rs = stmt.executeQuery(sql);
		if (rs.next() && (rs.getInt("total") > 0)) {
			log.error("WARNING: There are clusters that have parent id's referencing clusters that do not exist.");
			passed = false;
		}
		
		// check for dangling roots that do not point to valid rows
		sql = "SELECT count(*) as total FROM " + clusterDataViewTableName + " c1 WHERE NOT EXISTS (SELECT * FROM " + clusterDataViewTableName + " WHERE clusterid = c1.rootid) AND hierarchylevel > 0";
		rs = stmt.executeQuery(sql);
		if (rs.next() && (rs.getInt("total") > 0)) {
			log.error("WARNING: There are clusters that have root id's referencing clusters that do not exist.");
			passed = false;
		}
		
		// check for duplicate cluster id, entity id pairs
		sql = "SELECT count(*) as total FROM " + clusterDataViewTableName + " GROUP BY clusterid, entityid HAVING count(*) > 1";
		rs = stmt.executeQuery(sql);
		if (rs.next() && (rs.getInt("total") > 0)) {
			log.error("WARNING: There are duplicate cluster membership entries.");
			passed = false;
		}
		
		// check for self references: parents of themselves
		sql = "SELECT count(*) as total FROM " + clusterDataViewTableName + " WHERE clusterid = parentid";
		rs = stmt.executeQuery(sql);
		if (rs.next() && (rs.getInt("total") > 0)) {
			log.error("WARNING: There are clusters that have a parent id that references itself.");
			passed = false;
		}
		
		if (passed) {
			log.error("Cluster dataview SUCCESSFULLY passed sanity checks");
		}
		else {
			log.error("Cluster dataview FAILED some sanity checks");
		}
		
		stmt.close();
	}
	
	public void persistClusters() throws SQLException, ClassNotFoundException, IOException {
		log.error("Writing clusters...");
		writeClusters(null, 0, inputDir);
	}
	
	public void postProcessClusters() throws SQLException, ClassNotFoundException {
		log.error("Updating cluster hierarchy level...");
		updateLevelNumber();
		log.error("Updating cluster root ids...");
		updateRootIds();
		log.error("Updating leaf flag...");
		updateLeafFlag();
		log.error("Completed upload");
	}
	
	private void writeClusters(String parentId, int level, String path) throws IOException {
	
		File dir = new File(path);
		File[] list = dir.listFiles();
		
		String pId = parentId;
		int lvl = level;
		
		for (File file : list) {
			String fileName = file.getName();
			
			if ( file.isDirectory() ) {
				if ( fileName.contains("lvl") ) {
					lvl = Integer.parseInt( fileName.substring(fileName.indexOf("lvl")+3) );
				}
				if ( lvl > 0 ) {
					pId = fileName;
				}
				writeClusters(pId, lvl, path + "/" + fileName);
			}
			else if (fileName.startsWith(".") == false) {
				BufferedReader br = null;
				
				try {
					br = new BufferedReader(new FileReader(file));
					
					String str = null;
					String line = null;
					List<ClusterRow> values = new LinkedList<ClusterRow>();
					
					while ( (line = br.readLine()) != null) {
						str = line;
						
						String clusterId = null;
						if (line.startsWith("(")) {
							clusterId = str.substring(1, str.indexOf(","));
							str = str.substring(str.indexOf(",")+1);
						}
						if (line.endsWith(")")) {
							str = str.substring(0, str.length()-1);
						}
					
						SparkInstanceParserHelper parser = new SparkInstanceParserHelper(str);	
						String entityId = parser.fieldToString("id");
					
						if (clusterMembers.containsKey(clusterId) == false) {
							clusterMembers.put(clusterId, new HashSet<String>());
						}
						
						// only add if we have not seen this cluster membership
						if (clusterMembers.get(clusterId).contains(entityId) == false) {
							values.add(new ClusterRow(parentId, clusterId, lvl, entityId));
							clusterMembers.get(clusterId).add(entityId);
						}
					}
					if (exportToCSV) {
						writeClusterMembersToCSV(values);
					}
					if (exportToDB) {
						writeClusterMembersToDB(values);
					}
					
				} catch (Exception e) {
					e.printStackTrace();
				} finally {
					if (br != null) {
						try {
							br.close();
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
				}
				
			}
		}
	}
	
	private static void printUsageMsg() {
		System.out.println("Please specify an input directory of cluster output files");
		System.out.println("USAGE: PopulateClusterDataViews --inputdir=\"<INPUT DIR>\" --dbconstr=\"<DATABASE CONNECTION STRING>\" --dbuser=\"<DATABASE USERNAME>\" --dbpassword=\"<DATABASE PASSWORD>\" --dataviewtable=\"<CLUSTER DATAVIEW TABLENAME>\" --createTables=\"true|false\" --exportToDB=\"true|false\" --exportToCSV=\"true|false\" --postProcessClusters=\"true|false\" --sanityCheck=\"true|false\"");
		System.out.println("EXAMPLE:  PopulateClusterDataViews --inputdir=\"instances\" --dbconstr=\"jdbc:jtds:sqlserver://mydatabaseserver:1433;databaseName=Kiva;selectMethod=cursor;\" --dbuser=\"test\" --dbpassword=\"test\" --dataviewtable=\"global_cluster_dataview\" --exportToDB=\"true\" --postProcessClusters=\"true\" --sanityCheck=\"true\"");
	}
	
	public static void main(String[] args) {

		try {
			if (args.length < 5) {
				printUsageMsg();
				return;
			}
			String inputDir = null;
			String dbConStr = null;
			String dbuser = null;
			String dbpassword = null;
			String dataviewtable = null;
			boolean exportToDB = false;
			boolean exportToCSV = false;
			boolean postProcessClusters = false;
			boolean sanityCheck = false;
			boolean createTables = false;
			
			Map<String, String> argMap = Utils.parseArguments(args);
			
			for (String key : argMap.keySet()) {
				if (key.equalsIgnoreCase("dbconstr")) {
					dbConStr = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("dbuser")) {
					dbuser = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("dbpassword")) {
					dbpassword = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("dataviewtable")) {
					dataviewtable = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("inputdir")) {
					inputDir = argMap.get(key);
				}
				else if (key.equalsIgnoreCase("createTables")) {
					createTables = Boolean.parseBoolean(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("postProcessClusters")) {
					postProcessClusters = Boolean.parseBoolean(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("exportToDB")) {
					exportToDB = Boolean.parseBoolean(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("exportToCSV")) {
					exportToCSV = Boolean.parseBoolean(argMap.get(key));
				}
				else if (key.equalsIgnoreCase("sanityCheck")) {
					sanityCheck = Boolean.parseBoolean(argMap.get(key));
				}
			}

			if (inputDir == null || 
					((exportToDB || createTables || postProcessClusters || sanityCheck) && dbConStr == null || dbuser == null || dbpassword == null || dataviewtable == null)) throw new IllegalArgumentException("Missing argument!");
		
			log.error("Input directory: " + inputDir);
			
			log.error("Operations to be performed:");
			
			if (createTables) {
				log.error(" * Create Influent cluster data view table: " + dataviewtable);
			}
			if (exportToDB) {
				log.error(" * Populating Influent cluster data view table: " + dataviewtable);
			}
			if (exportToCSV) {
				log.error(" * Exporting clusters to CSV file");
			}
			if (sanityCheck) {
				log.error(" * Sanity checking Influent cluster data view table: " + dataviewtable);
			}
			if (postProcessClusters) {
				log.error(" * Post process the Influent cluster data view table: " + dataviewtable);
			}
			
			(new PopulateClusterDataViews(inputDir, dbConStr, dbuser, dbpassword, dataviewtable, createTables, postProcessClusters, sanityCheck, exportToDB, exportToCSV)).start();
			
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
