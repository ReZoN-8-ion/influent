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
-- Influent Data Views 1.2 DRAFT
-- -----------------------------

--
-- FINANCIAL FLOW - ALL
--  Used to build the aggregate flow diagrams
--
--   FromEntityId - entity UID that is the source of the transactions
--   FromEntityType - type of src entity: O = owner summary, A = account, S = cluster summary entity
--   ToEntityId - entity UID that is the target of the transactions
--   ToEntityType - type of dst entity: O = owner summary, A = account, S = cluster summary entity
--   FirstTransaction - datetime of first transaction
--   LastTransaction - datetime of last transaction
--   Amount - aggregate amount
--
create table FinFlow (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), FirstTransaction datetime, LastTransaction datetime, Amount float, CONSTRAINT pk_FF_ID PRIMARY KEY (FromEntityId, ToEntityId));

create table FinEntity(EntityId varchar(100) PRIMARY KEY, IncomingLinks int, UniqueIncomingLinks int,  OutgoingLinks int, UniqueOutgoingLinks int);

--
-- FINANCIAL FLOW - AGGREGATED BY TIME
--  Used to build the aggregate flow diagrams (aggregated by time)
--  and used to build the highlighted sub-section of the time series charts on entities.
--
--   FromEntityId - entity UID that is the source of the transactions
--   FromEntityType - type of src entity: O = owner summary, A = account, S = cluster summary entity
--   ToEntityId - entity UID that is the target of the transactions
--   ToEntityType - type of dst entity: O = owner summary, A = account, S = cluster summary entity
--   Amount - aggregate amount for this time period
--   Date - start of the time period
--
create table FinFlowDaily     (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFD_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowWeekly    (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFW_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowMonthly   (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFM_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowQuarterly (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFQ_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowYearly    (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFY_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));

--
-- FINANCIAL ENTITY SUMMARY
--  Used to build the time series charts on entities (aggregated by time).
--
--   EntityId - entity UID
--   Date - start of the time period
--   InboundAmount - aggregate credits for this time period
--   IncomingLinks - unique inbound transations by entity
--   OutboundAmount - aggregate debits for this time period
--   OutgoingLinks - unique outbound transations by entity
--   Balance - aggregate credits - debits up until this time period
--
create table FinEntityDaily     (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FED_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityWeekly    (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEW_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityMonthly   (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEM_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityQuarterly (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEQ_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityYearly    (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEY_ID PRIMARY KEY (EntityId, PeriodDate));

--
-- CLUSTER SUMMARY
--  Used to summarize an entity with a large number of associated entities (e.g. account owner with a large number of accounts)
--   It is up to each application to determine what cluster summaries to generate based on the size of data
--
--   EntityId - entity UID of cluster entity
--   Property - name of summary property
--   Tag - Property_Tag to associate with property
--   Type - FL_PropertyType data type of property value (DOUBLE, LONG, BOOLEAN, STRING, DATE, GEO, OTHER)
--   Value - the string representation of the property value
--   Stat - an associated stat for the propety value such as frequency or weight
--
--   NOTES:  Cluster summaries that represent an account owner should have an account owner property that associates the entity id of the account owner to the cluster summary:
--                 Ex: EnitityId = 'cluster123', Property = 'ownerId', Tag = 'ACCOUNT_OWNER', Type = 'String', Value = 'partner123', Stat = 0
--           Cluster summaries that do not support branching should have a property of UNBRANCHABLE (by default all cluster summaries are branchable)
--                 Ex: EnitityId = 'cluster123', Property = 'UNBRANCHABLE', Tag = 'ENTITY_TYPE', Type = 'BOOLEAN', Value = 'true', Stat = 0
create table ClusterSummary	(EntityId varchar(100), Property varchar(50), Tag varchar(50), Type varchar(50), Value varchar(200), Stat float, CONSTRAINT pk_CS_ID PRIMARY KEY (EntityId, Property, Value));

--
-- CLUSTER SUMMARY MEMBERS
--  Used to keep track of entities that are members of a cluster summary
--   It is up to each application to determine what cluster summaries to generate based on the size of data
--
--   SummaryId - UID of cluster summary
--   EntityId - member entity UID
--
create table ClusterSummaryMembers (SummaryId varchar(100), EntityId varchar(100), CONSTRAINT pk_CSM_ID PRIMARY KEY (SummaryId, EntityId));

--
-- DATA VIEW DRIVERS
--  These scripts will populate the data views above.
--
--  Step 1. Modify this to pull data from your raw data.  Add any transactions to cluster summaries as well.
--
insert into FinFlowDaily
 SELECT FromAddress, 'A', ToAddress, 'A', COUNT(*), SentDate
	FROM dbo.Transactions
	WHERE FromAddress != '' AND ToAddress != '' AND SentDate IS NOT NULL
	group by FromAddress, ToAddress, SentDate

-- build FinEntity
insert into FinEntity (EntityId, IncomingLinks, UniqueIncomingLinks,  OutgoingLinks, UniqueOutgoingLinks, NumTransactions, MaxTransaction, AvgTransaction, StartDate, EndDate)
Select EntityId, sum(IncomingLinks) as IncomingLinks, sum(UniqueIncomingLinks) as UniqueIncomingLinks, sum(OutgoingLinks) as OutgoingLinks , sum(UniqueOutgoingLinks) as UniqueOutgoingLinks, sum(numTransactions) as NumTransactions, max(MaxTransaction) as MaxTransactions, sum(TotalTransactions) / sum(numTransactions) as AvgTransactions, min(StartDate) as StartDate, max(EndDate) as EndDate
From (
	select  ToAddress as EntityId,
			count(FromAddress) as IncomingLinks,
			count( distinct FromAddress ) as UniqueIncomingLinks,
			0 as OutgoingLinks,
			0 as UniqueOutgoingLinks,
			count(ToAddress) as numTransactions,
			1 as MaxTransaction,						-- TODO what should this be for Walker?
			count(ToAddress) as TotalTransactions, 		-- TODO what should this be for Walker?
			min(SentDate) as StartDate,
			max(SentDate) as EndDate
	from dbo.Transactions
	group by ToAddress
	UNION
	select FromAddress as EntityId,
			0 as IncomingLinks,
			0 as UniqueIncomingLinks,
			count(ToAddress) as OutgoingLinks,
			count( distinct ToAddress ) as UniqueOutgoingLinks,
			sum( case when FromAddress <> ToAddress then 1 else 0 end ) as numTransactions,
			1 as MaxTransaction, 						-- TODO what should this be for Walker?
			count(FromAddress) as TotalTransactions, 	-- TODO what should this be for Walker?
			min(SentDate) as StartDate,
			max(SentDate) as EndDate
	from dbo.Transactions
	group by FromAddress
)q
group by EntityId

create index ix_ff_id on FinEntity (EntityId);

--
--  Step 2. The rest of the script will collect data from FinFlowDaily.
--          Execute the rest of this script "as-is".
--

--  build the rest of the FinFlow aggregations

insert into FinFlowWeekly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate))
  from FinFlowDaily
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate));

insert into FinFlowMonthly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01'
  from FinFlowDaily
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01';

insert into FinFlowQuarterly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01'
  from FinFlowMonthly
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01';

insert into FinFlowYearly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01'
  from FinFlowMonthly
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01';

--  create FinFlow indices
create index ix_ffd_from on FinFlowDaily     (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_ffd_to   on FinFlowDaily     (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_ffw_from on FinFlowWeekly    (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_ffw_to   on FinFlowWeekly    (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_ffm_from on FinFlowMonthly   (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_ffm_to   on FinFlowMonthly   (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_ffq_from on FinFlowQuarterly (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_ffq_to   on FinFlowQuarterly (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_ffy_from on FinFlowYearly    (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_ffy_to   on FinFlowYearly    (ToEntityId,   PeriodDate, FromEntityId, Amount);

--  build FinFlow
insert into FinFlow
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, min(PeriodDate), max(PeriodDate), sum(Amount)
  from FinFlowDaily
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType;

create index ix_ff_to_from on FinFlow (ToEntityId, FromEntityId);
create index ix_ff_from_to on FinFlow (FromEntityId, ToEntityId);

--  build FinEntityDaily
create table temp_ids (Entity varchar(100));
create index tids on temp_ids (Entity);

insert into temp_ids
 select distinct FromEntityId
  from FinFlowYearly
 union
 select distinct ToEntityId
  from FinFlowYearly;

insert into FinEntityDaily select Entity, PeriodDate,
       sum(case when ToEntityId = Entity and FromEntityType = 'A' then Amount else 0 end),
       sum(case when ToEntityId = Entity and FromEntityType = 'A' then 1 else 0 end), -- calculate inbound degree
       sum(case when FromEntityId = Entity and ToEntityType = 'A' then Amount else 0 end),
       sum(case when FromEntityId = Entity and ToEntityType = 'A' then 1 else 0 end), -- calculate outbound degree
       0 -- TODO calculate balance
 from temp_ids
 join FinFlowDaily on FromEntityId = Entity or ToEntityId = Entity
 group by Entity, PeriodDate;

-- cleanup
drop table temp_ids;

-- build the rest of the FinEntity aggregations
insert into FinEntityWeekly
 select EntityId, (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate)), sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityDaily
  group by EntityId, (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate));

insert into FinEntityMonthly
 select EntityId,  convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01', sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityDaily
  group by EntityId, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01';

insert into FinEntityQuarterly
 select EntityId, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01', sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityMonthly
  group by EntityId, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01';

insert into FinEntityYearly
 select EntityId, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01', sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityQuarterly
  group by EntityId, convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01';

create index ix_fed on FinEntityDaily     (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_few on FinEntityWeekly    (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_fem on FinEntityMonthly   (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_feq on FinEntityQuarterly (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_fey on FinEntityYearly    (EntityId, PeriodDate, InboundAmount, OutboundAmount);

create index ix_csum on ClusterSummary	(EntityId);
create index ix_cmem on ClusterSummaryMembers  (SummaryId);
