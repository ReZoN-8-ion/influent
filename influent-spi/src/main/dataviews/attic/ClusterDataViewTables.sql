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

-- -----------------------------
-- Influent Data Views 1.5 DRAFT
-- -----------------------------

--
--- Cluster membership dataview - note this view supports hierarchical clustering -  note: fuzzy cluster membership is not supported
---   table is denormalized with no referential integrity for simplicity of integration
--
CREATE TABLE global_cluster_dataview
(
id bigint PRIMARY KEY IDENTITY,
clusterid nvarchar(100),  					-- using nvarchar for uid rather than bigint to support guids and other uid schemes
rootid nvarchar(100), 						-- id of root cluster in hierarchy - NULL if this cluster is a root level cluster
parentid nvarchar(100), 					-- id of parent cluster in hierarchy - NULL if this cluster is a root level cluster
hierarchylevel int NOT NULL DEFAULT 0,		-- level of cluster in hierarchy - level 0 is the root and level N ( N > 0 ) is a leaf cluster
isleaf nvarchar(1) NOT NULL DEFAULT 'N',	-- whether this cluster is a leaf (not a parent of any other cluster) values: 'Y' or 'N'
entityid nvarchar(100) NOT NULL  			-- entity id of cluster member (entity id's are the id's of raw entities that are clustered)
);

--
-- indexes for fast data retrieval
--
CREATE INDEX ix_gcluster_dataview_rowid ON global_cluster_dataview_test (id);
CREATE INDEX ix_gcluster_dataview_id ON global_cluster_dataview_test (clusterid);
CREATE INDEX ix_gcluster_dataview_eid ON global_cluster_dataview_test (entityid);
CREATE INDEX ix_gcluster_dataview_pid ON global_cluster_dataview_test (parentid);
CREATE INDEX ix_gcluster_dataview_id_eid ON global_cluster_dataview_test (clusterid, entityid);
CREATE INDEX ix_gcluster_dataview_rid_lvl ON global_cluster_dataview_test (entityid, hierarchylevel);
