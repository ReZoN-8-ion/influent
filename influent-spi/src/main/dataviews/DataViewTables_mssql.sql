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

-- ------------------------------------------------------------------------------
-- Influent Data View Script
--     Run the following script in steps. At each step, please ensure that you
--     modify the script to reflect your own data and the type of Influent
--     installation you would like.
-- ------------------------------------------------------------------------------



-- ------------------------------------------------------------------------------
-- STEP 1: No modifications required
--
--    Run the following scripts to create link flow tables
-- ------------------------------------------------------------------------------



--
-- FLOW AGGREGATION TABLE
--     Used to build the aggregate flow diagrams
--
-- Columns:
--     FromEntityId     - entity UID that is the source of the aggregated
--                        transactions
--     FromEntityType   - type of src entity: O = owner summary, A = account,
--                        S = cluster summary entity
--     ToEntityId       - entity UID that is the target of the aggregated
--                        transactions
--     ToEntityType     - type of dst entity: O = owner summary, A = account,
--                        S = cluster summary entity
--     FirstTransaction - datetime of first transaction
--     LastTransaction  - datetime of last transaction
--     Amount           - aggregate amount
--
create table LinkFlow(
	FromEntityId varchar(100),
	FromEntityType varchar(1),
	ToEntityId varchar(100),
	ToEntityType varchar(1),
	FirstTransaction datetime,
	LastTransaction datetime,
	Amount float,
	constraint pk_lf_from_to primary key (FromEntityId, ToEntityId)
);

--
-- TIME SERIES FLOW AGGREGATION TABLES
--     Used to build the aggregate flow diagrams (aggregated by time)
--     and used to build the highlighted sub-section of the time series
--     charts on entities.
--
-- Columns:
--     FromEntityId - entity UID that is the source of the aggregated
--                    transactions
--     FromEntityType - type of src entity: O = owner summary,
--                      A = account, S = cluster summary entity
--     ToEntityId - entity UID that is the target of the aggregated transactions
--     ToEntityType - type of dst entity: O = owner summary, A = account,
--                    S = cluster summary entity
--     Amount - aggregate amount for this time period
--     PeriodDate - start of the time period
--
create table LinkFlowDaily(
	FromEntityId varchar(100),
	FromEntityType varchar(1),
	ToEntityId varchar(100),
	ToEntityType varchar(1),
	Amount float,
	PeriodDate datetime,
	constraint pk_lfd_from_to_date primary key (FromEntityId, ToEntityId, PeriodDate)
);
create table LinkFlowWeekly(
	FromEntityId varchar(100),
	FromEntityType varchar(1),
	ToEntityId varchar(100),
	ToEntityType varchar(1),
	Amount float,
	PeriodDate datetime,
	constraint pk_lfw_from_to_date primary key (FromEntityId, ToEntityId, PeriodDate)
);
create table LinkFlowMonthly(
	FromEntityId varchar(100),
	FromEntityType varchar(1),
	ToEntityId varchar(100),
	ToEntityType varchar(1),
	Amount float,
	PeriodDate datetime,
	constraint pk_lfm_from_to_date primary key (FromEntityId, ToEntityId, PeriodDate)
);
create table LinkFlowQuarterly(
	FromEntityId varchar(100),
	FromEntityType varchar(1),
	ToEntityId varchar(100),
	ToEntityType varchar(1),
	Amount float,
	PeriodDate datetime,
	constraint pk_lfq_from_to_date primary key (FromEntityId, ToEntityId, PeriodDate)
);
create table LinkFlowYearly(
	FromEntityId varchar(100),
	FromEntityType varchar(1),
	ToEntityId varchar(100),
	ToEntityType varchar(1),
	Amount float,
	PeriodDate datetime,
	constraint pk_lfy_from_to_date primary key (FromEntityId, ToEntityId, PeriodDate)
);



-- ------------------------------------------------------------------------------
-- STEP 2: Modifications required
--
--     Modify this to pull data from your raw data.  Add any transactions to
--     cluster summaries as well.
-- ------------------------------------------------------------------------------



--
-- you will need to modify the following:
--
--     source_id     - the column in your raw data table that corresponds to the
--                     source entity id
--     dest_id       - the column in your raw data table that corresponds to the
--                     target entity id
--     amount        - the column in your raw data table that corresponds to the
--                     transaction amount
--     dt            - the column in your raw data table that corresponds to the
--                     transaction timestamp
--     YOUR_RAW_DATA - the name of your raw transaction data table
--
insert into LinkFlowDaily
select
	[source_id],
	'A',
	[dest_id],
	'A',
	sum([amount]),
	convert(varchar(50), [dt], 101)
from YOUR_RAW_DATA
group by [source_id], [dest_id], convert(varchar(50), [dt], 101)

-- create LinkFlowDaily indices
create index ix_lfd_from_date_to_amount on LinkFlowDaily (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_lfd_to_date_from_amount on LinkFlowDaily (ToEntityId,   PeriodDate, FromEntityId, Amount);



-- ------------------------------------------------------------------------------
-- STEP 3: Modifications required
--
--    Run the following scripts to create entity tables. If you are building
--    a multi-type installation, you are required to repeat this step for each
--    entity type
-- ------------------------------------------------------------------------------



--
-- ENTITY AGGREGATION TABLE
--     Used to build the  and
--
-- Columns:
--     EntityId            - entity UID
--     IncomingLinks       - the number of incoming links to this entity
--     UniqueIncomingLinks - the number of entities that have outgoing links to
--                           this entity
--     OutgoingLinks       - the number of outgoing links from this entity
--     UniqueOutgoingLinks - the number of entities that have incoming links
--                           from this entity
--     NumLinks            - the total number of links to and from this entity
--     MaxTransaction      - the maximum transaction size to or from this entity
--     AvgTransaction      - the average transaction size to and from this entity
--     StartDate           - the earliest transaction to or from this entity
--     EndDate             - the latest transaction to or from this entity

--
-- you will need to modify the following:
--
--     EntitySummary      - if you are building a multi-type installation, you
--                          should rename this table to include the type name
--                          (e.g. EntitySummaryMyType)
--     Additional columns - you can add type specific entity columns that
--                          Influent can search on and display.
create table EntitySummary(
	EntityId varchar(100) primary key,
	IncomingLinks int not null,
	UniqueIncomingLinks int not null,
	OutgoingLinks int not null,
	UniqueOutgoingLinks int not null,
	NumLinks int,
	MaxTransaction float,
	AvgTransaction float,
	StartDate datetime,
	EndDate datetime
	-- additional type specific columns added here --
);

--
-- TIME SERIES FLOW AGGREGATION TABLES
--     Used to build the time series charts on entities (aggregated by time).
--
-- Columns:
--     EntityId       - entity UID
--     PeriodDate     - start of the time period
--     InboundAmount  - aggregate credits for this time period
--     IncomingLinks  - unique inbound transactions by entity
--     OutboundAmount - aggregate debits for this time period
--     OutgoingLinks  - unique outbound transactions by entity
--
create table EntityDaily(
	EntityId varchar(100),
	PeriodDate datetime,
	InboundAmount float,
	IncomingLinks int,
	OutboundAmount float,
	OutgoingLinks int,
	constraint pk_ed_id_date primary key (EntityId, PeriodDate)
);
create table EntityWeekly(
	EntityId varchar(100),
	PeriodDate datetime,
	InboundAmount float,
	IncomingLinks int,
	OutboundAmount float,
	OutgoingLinks int,
	constraint pk_ew_id_date primary key (EntityId, PeriodDate)
);
create table EntityMonthly(
	EntityId varchar(100),
	PeriodDate datetime,
	InboundAmount float,
	IncomingLinks int,
	OutboundAmount float,
	OutgoingLinks int,
	constraint pk_em_id_date primary key (EntityId, PeriodDate)
);
create table EntityQuarterly(
	EntityId varchar(100),
	PeriodDate datetime,
	InboundAmount float,
	IncomingLinks int,
	OutboundAmount float,
	OutgoingLinks int,
	constraint pk_eq_id_date primary key (EntityId, PeriodDate)
);
create table EntityYearly(
	EntityId varchar(100),
	PeriodDate datetime,
	InboundAmount float,
	IncomingLinks int,
	OutboundAmount float,
	OutgoingLinks int,
	constraint pk_ey_id_date primary key (EntityId, PeriodDate)
);

--
-- you will need to modify the following:
--
--     EntitySummary - if you are building a multi-type installation, you
--                     should rename this table to include the type name
--                     (e.g. EntitySummaryMyType)
--     source_id     - the column in your raw data table that corresponds to the
--                     source entity id
--     dest_id       - the column in your raw data table that corresponds to the
--                     target entity id
--     amount        - the column in your raw data table that corresponds to the
--                     transaction amount
--     dt            - the column in your raw data table that corresponds to the
--                     transaction timestamp
--     YOUR_RAW_DATA - the name of your raw transaction data table
--     where clause  - if you are building a multi-type installation, you should
--                     uncomment this line and replace 'myType' with the actual
--                     name of your entity type
--
insert into EntitySummary(
	EntityId,
	IncomingLinks,
	UniqueIncomingLinks,
	OutgoingLinks,
	UniqueOutgoingLinks,
	NumLinks,
	MaxTransaction,
	AvgTransaction,
	StartDate,
	EndDate
)
select
	EntityId,
	sum(IncomingLinks) as IncomingLinks,
	sum(UniqueIncomingLinks) as UniqueIncomingLinks,
	sum(OutgoingLinks) as OutgoingLinks ,
	sum(UniqueOutgoingLinks) as UniqueOutgoingLinks,
	sum(NumLinks) as NumLinks,
	max(MaxTransaction) as MaxTransaction,
	sum(TotalTransactions) / sum(NumLinks) as AvgTransaction,
	min(StartDate) as StartDate,
	max(EndDate) as EndDate
from (
	select  [dest_id] as EntityId,
			count([source_id]) as IncomingLinks,
			count( distinct [source_id] ) as UniqueIncomingLinks,
			0 as OutgoingLinks,
			0 as UniqueOutgoingLinks,
			count([dest_id]) as NumLinks,
			max([amount]) as MaxTransaction,
			sum([amount]) as TotalTransactions,
			min([dt]) as StartDate,
			max([dt]) as EndDate
	from YOUR_RAW_DATA
	group by [dest_id]
	union
	select [source_id] as EntityId,
			0 as IncomingLinks,
			0 as UniqueIncomingLinks,
			count([dest_id]) as OutgoingLinks,
			count( distinct [dest_id] ) as UniqueOutgoingLinks,
			sum( case when [source_id] <> [dest_id] then 1 else 0 end ) as NumLinks,
			max([amount]) as MaxTransaction,
			sum([amount]) as TotalTransactions,
			min([dt]) as StartDate,
			max([dt]) as EndDate
	from YOUR_RAW_DATA
	group by [source_id]
)q
-- where EntityId like 'myType.%' --
group by EntityId

--
-- you will need to modify the following:
--
--     Additional columns              - if you added additional columns to your
--                                       EntitySummary table, you will want to
--                                       uncomment and set them in the code below
--     EntitySummary                   - if you are building a multi-type
--                                       installation, you should rename this
--                                       table to include the type name
--                                       (e.g. EntitySummaryMyType)
--     ES.EntityId = EP.id -           - you may need to modify this line if the
--                                       EntityId and the raw data id differ
--                                       (i.e. with multi-type installations, the
--                                       EntityId might look like 'myType.123'
--                                       whereas the raw data id is '123'. You
--                                       will need to account for these
--                                       differences)
--     YOUR_RAW_ENTITY_PROPERTIES_DATA - the name of your raw transaction data
--                                       table
--

--update EntitySummary
--set
--	-- additional type specific columns added here
--	-- (e.g. EntitySummary.myColumn = YOUR_RAW_ENTITY_PROPERTIES_DATA.myColumn)
--from EntitySummary ES
--inner join
--YOUR_RAW_ENTITY_PROPERTIES_DATA EP
--on ES.EntityId = EP.id

--
-- you will need to modify the following:
--
--     EntitySummary - if you are building a multi-type installation, you
--                     should rename this table to include the type name
--                     (e.g. EntitySummaryMyType)
create index ix_es_id on EntitySummary (EntityId);



-- ------------------------------------------------------------------------------
-- STEP 4: No modifications required
--
--     The following section will collect data from LinkFlowDaily and requires no
--     modifications
-- ------------------------------------------------------------------------------



-- build LinkFlowWeekly time series aggregation
insert into LinkFlowWeekly
select
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	sum(Amount),
	convert(varchar(50), (dateadd(dd, @@DATEFIRST - datepart(dw, PeriodDate) - 6, PeriodDate)), 101)
from LinkFlowDaily
group by
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	convert(varchar(50), (dateadd(dd, @@DATEFIRST - datepart(dw, PeriodDate) - 6, PeriodDate)), 101);

-- build LinkFlowMonthly time series aggregation
insert into LinkFlowMonthly
select
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	sum(Amount),
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + convert(varchar(2), datepart(mm, PeriodDate)) + '/01', 101)
from LinkFlowDaily
group by
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + convert(varchar(2), datepart(mm, PeriodDate)) + '/01', 101);

-- build LinkFlowQuarterly time series aggregation
insert into LinkFlowQuarterly
select
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	sum(Amount),
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + case when datepart(q, PeriodDate)=1 then '01' when datepart(q, PeriodDate)=2 then '04' when datepart(q, PeriodDate)=3 then '07' when datepart(q, PeriodDate)=4 then '010' end + '/01', 101)
from LinkFlowMonthly
group by
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + case when datepart(q, PeriodDate)=1 then '01' when datepart(q, PeriodDate)=2 then '04' when datepart(q, PeriodDate)=3 then '07' when datepart(q, PeriodDate)=4 then '010' end + '/01', 101);

-- build LinkFlowYearly time series aggregation
insert into LinkFlowYearly
select
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	sum(Amount),
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/01/01', 101)
from LinkFlowMonthly
group by
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/01/01', 101);

--  create LinkFlow time series aggregation indices
create index ix_lfw_from_date_to_amount on LinkFlowWeekly (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_lfw_to_date_from_amount on LinkFlowWeekly (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_lfm_from_date_to_amount on LinkFlowMonthly (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_lfm_to_date_from_amount on LinkFlowMonthly (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_lfq_from_date_to_amount on LinkFlowQuarterly (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_lfq_to_date_from_amount on LinkFlowQuarterly (ToEntityId,   PeriodDate, FromEntityId, Amount);
create index ix_lfy_from_date_to_amount on LinkFlowYearly (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_lfy_to_date_from_amount on LinkFlowYearly (ToEntityId,   PeriodDate, FromEntityId, Amount);

--  build LinkFlow aggregation table
insert into LinkFlow
select
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType,
	min(PeriodDate),
	max(PeriodDate),
	sum(Amount)
from LinkFlowDaily
group by
	FromEntityId,
	FromEntityType,
	ToEntityId,
	ToEntityType;

create index ix_lf_to_from on LinkFlow (ToEntityId, FromEntityId);
create index ix_lf_from_to on LinkFlow (FromEntityId, ToEntityId);

--  build EntityDaily
create table temp_ids (Entity varchar(100));
create index tids on temp_ids (Entity);

insert into temp_ids
select distinct FromEntityId
from LinkFlowYearly
union
select distinct ToEntityId
from LinkFlowYearly;

insert into EntityDaily
select
	Entity,
	PeriodDate,
    sum(case when ToEntityId = Entity and FromEntityType = 'A' then Amount else 0 end),
    sum(case when ToEntityId = Entity and FromEntityType = 'A' then 1 else 0 end), -- calculate inbound degree
    sum(case when FromEntityId = Entity and ToEntityType = 'A' then Amount else 0 end),
    sum(case when FromEntityId = Entity and ToEntityType = 'A' then 1 else 0 end), -- calculate outbound degree
from temp_ids
join LinkFlowDaily
on FromEntityId = Entity or ToEntityId = Entity
group by Entity, PeriodDate;

-- cleanup
drop table temp_ids;

-- build EntityWeekly time series aggregation
insert into EntityWeekly
select
	EntityId,
	convert(varchar(50), (dateadd(dd, @@DATEFIRST - datepart(dw, PeriodDate) - 6, PeriodDate)), 101),
	sum(InboundAmount),
	sum(IncomingLinks),
	sum(OutboundAmount),
	sum(OutgoingLinks),
	0
from EntityDaily
group by
	EntityId,
	convert(varchar(50), (dateadd(dd, @@DATEFIRST - datepart(dw, PeriodDate) - 6, PeriodDate)), 101);

-- build EntityMonthly time series aggregation
insert into EntityMonthly
select
	EntityId,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + convert(varchar(2), datepart(mm, PeriodDate)) + '/01', 101),
	sum(InboundAmount),
	sum(IncomingLinks),
	sum(OutboundAmount),
	sum(OutgoingLinks),
	0
from EntityDaily
group by
	EntityId,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + convert(varchar(2), datepart(mm, PeriodDate)) + '/01', 101);

-- build EntityQuarterly time series aggregation
insert into EntityQuarterly
select
	EntityId,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + case when datepart(q, PeriodDate)=1 then '01' when datepart(q, PeriodDate)=2 then '04' when datepart(q, PeriodDate)=3 then '07' when datepart(q, PeriodDate)=4 then '010' end + '/01', 101),
	sum(InboundAmount),
	sum(IncomingLinks),
	sum(OutboundAmount),
	sum(OutgoingLinks),
	0
from EntityMonthly
group by
	EntityId,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/' + case when datepart(q, PeriodDate)=1 then '01' when datepart(q, PeriodDate)=2 then '04' when datepart(q, PeriodDate)=3 then '07' when datepart(q, PeriodDate)=4 then '010' end + '/01', 101);

-- build EntityYearly time series aggregation
insert into EntityYearly
select
	EntityId,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/01/01', 101),
	sum(InboundAmount),
	sum(IncomingLinks),
	sum(OutboundAmount),
	sum(OutgoingLinks),
	0
from EntityQuarterly
group by
	EntityId,
	convert(varchar(50), convert(varchar(4), datepart(yyyy, PeriodDate)) + '/01/01', 101);

--  create Entity time series aggregation indices
create index ix_ed_id_date_in_out on EntityDaily (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_ew_id_date_in_out on EntityWeekly (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_em_id_date_in_out on EntityMonthly (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_eq_id_date_in_out on EntityQuarterly (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_ey_id_date_in_out on EntityYearly (EntityId, PeriodDate, InboundAmount, OutboundAmount);



-- ------------------------------------------------------------------------------
-- STEP 5: Modifications required
--
--     The following section will build cluster summary tables. You only need to
--     run this section if you have a dataset that has the potential for
--     extremely large high degree clusters. The cluster summary table will
--     allow the system to still explore these cluster at a high level but will
--     limit in-depth exploration
-- ------------------------------------------------------------------------------



--
-- CLUSTER SUMMARY TABLE
--     Used to summarize an entity with a large number of associated entities
--     (e.g. account owner with a large number of accounts) It is up to each
--     application to determine what cluster summaries to generate based on the
--     size of data
--
-- Columns:
--     EntityId - entity UID of cluster entity
--     Property - name of summary property
--     Tag      - Property_Tag to associate with property
--     Type     - FL_PropertyType data type of property value (DOUBLE, LONG,
--                BOOLEAN, STRING, DATE, GEO, OTHER)
--     Value    - the string representation of the property value
--     Stat     - an associated stat for the property value such as frequency
--                or weight
--
-- Note:
--     Cluster summaries that represent an account owner should have an account
--     owner property that associates the entity id of the account owner to the
--     cluster summary. For example:
--         EnitityId = 'cluster123',
--         Property = 'ownerId',
--         Tag = 'ACCOUNT_OWNER',
--         Type = 'String',
--         Value = 'partner123',
--         Stat = 0
--
--     Cluster summaries that do not support branching should have a property of
--     UNBRANCHABLE (by default all cluster summaries are branchable). For
--     example:
--         EnitityId = 'cluster123',
--         Property = 'UNBRANCHABLE',
--         Tag = 'ENTITY_TYPE',
--         Type = 'BOOLEAN',
--         Value = 'true',
--         Stat = 0
--
create table ClusterSummary	(
	EntityId varchar(100),
	Property varchar(50),
	Tag varchar(50),
	[Type] varchar(50),
	[Value] varchar(200),
	Stat float,
	constraint pk_cs_id_prop_val primary key (EntityId, Property, [Value])
);

--
-- CLUSTER SUMMARY MEMBERS
--     Used to keep track of entities that are members of a cluster summary
--     It is up to each application to determine what cluster summaries to
--     generate based on the size of data
--
--   SummaryId - UID of cluster summary
--   EntityId  - member entity UID
--
create table ClusterSummaryMembers (
	SummaryId varchar(100),
	EntityId varchar(100),
	constraint pk_csm_sum_id primary key (SummaryId, EntityId)
);

--  create cluster summary indices
create index ix_cs_id on ClusterSummary	(EntityId);
create index ix_csm_sum on ClusterSummaryMembers  (SummaryId);



-- ------------------------------------------------------------------------------
-- STEP 6: Modifications required
--
--     The following section will build summary information on the data for
--     display on the summary page
--
--     Modify this section as needed to reflect the nature of your dataset.
--     The first stat in the table should be a description of your dataset. The
--     following inserts show an example of typical summary statistics. Note that
--     you will in most cases want to format the values nicely for reading. The
--     script as is here will simply copy most types of values over in their
--     default format. UnformattedNumeric and UnformattedDatetime are added to
--     provide a reference in case the formatted value corrupts or loses
--     valuable information.
-- ------------------------------------------------------------------------------



create table DataSummary (
	SummaryOrder int not null,
	SummaryKey varchar(100) not null,
	SummaryLabel varchar(1000) null,
	SummaryValue text null,
	UnformattedNumeric float null,
	UnformattedDatetime datetime null,
	constraint pk_ds_order primary key (SummaryOrder)
);

-- Modify the following to create a summary description
insert into DataSummary(
	SummaryOrder,
	SummaryKey,
	SummaryLabel,
	SummaryValue,
	UnformattedNumeric,
	UnformattedDatetime
)
values (
	1,
	'InfoSummary',
	'About',
	'Some interesting description of your dataset can be written here.',
	null,
	null
);

-- The following calculates the number of accounts in the data
insert into DataSummary(
	SummaryOrder,
	SummaryKey,
	SummaryLabel,
	SummaryValue,
	UnformattedNumeric,
	UnformattedDatetime
)
values (
	2,
	'NumAccounts',
	'Accounts',
	cast((select count(*) from EntitySummary) as varchar),
	(select count(*) from EntitySummary),
	null
);

-- The following calculates the number of transactions in the data
insert into DataSummary(
	SummaryOrder,
	SummaryKey,
	SummaryLabel,
	SummaryValue,
	UnformattedNumeric,
	UnformattedDatetime
)
values (
	3,
	'NumLinks',
	'Transactions',
	cast((select count(*) from YOUR_RAW_DATA) as varchar),
	(select count(*) from YOUR_RAW_DATA),
	null
);

-- The following calculates the earliest transaction in the data
insert into DataSummary(
	SummaryOrder,
	SummaryKey,
	SummaryLabel,
	SummaryValue,
	UnformattedNumeric,
	UnformattedDatetime
)
values (
	4,
	'StartDate',
	'Earliest Transaction',
	(select convert(varchar, min(firstTransaction), 126) from LinkFlow),
	null,
	(select min(firstTransaction) from LinkFlow)
);

-- The following calculates the latest transaction in the data
insert into DataSummary(
	SummaryOrder,
	SummaryKey,
	SummaryLabel,
	SummaryValue,
	UnformattedNumeric,
	UnformattedDatetime
)
values (
	5,
	'EndDate',
	'Latest Transaction',
	(select convert(varchar, max(lastTransaction), 126) from LinkFlow),
	null,
	(select max(lastTransaction) from LinkFlow)
);

-- Other statistics can be entered in a similar fashion.
