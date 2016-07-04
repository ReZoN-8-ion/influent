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

--
-- FINANCIAL FLOW
--
create table FinFlow (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), FirstTransaction datetime, LastTransaction datetime, Amount float, CONSTRAINT pk_FF_ID PRIMARY KEY (FromEntityId, ToEntityId));

--
-- FINANCIAL FLOW SUMMARY
--
create table FinFlowDaily     (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFD_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowWeekly    (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFW_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowMonthly   (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFM_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowQuarterly (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFQ_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));
create table FinFlowYearly    (FromEntityId varchar(100), FromEntityType varchar(1), ToEntityId varchar(100), ToEntityType varchar(1), Amount float, PeriodDate datetime, CONSTRAINT pk_FFY_ID PRIMARY KEY (FromEntityId, ToEntityId, PeriodDate));

--
-- FINANCIAL ENTITY SUMMARY
--
create table FinEntityDaily     (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FED_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityWeekly    (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEW_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityMonthly   (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEM_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityQuarterly (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEQ_ID PRIMARY KEY (EntityId, PeriodDate));
create table FinEntityYearly    (EntityId varchar(100), PeriodDate datetime, InboundAmount float, IncomingLinks int, OutboundAmount float, OutgoingLinks int, Balance float, CONSTRAINT pk_FEY_ID PRIMARY KEY (EntityId, PeriodDate));

--
-- CLUSTER SUMMARY
--
--create table ClusterSummary	(EntityId varchar(100), Property varchar(50), Tag varchar(50), Type varchar(50), Value varchar(200), Stat float, CONSTRAINT pk_CS_ID PRIMARY KEY (EntityId, Property, Value));

--
-- CLUSTER SUMMARY MEMBERS
--
--create table ClusterSummaryMembers (SummaryId varchar(100), EntityId varchar(100), CONSTRAINT pk_CSM_ID PRIMARY KEY (SummaryId, EntityId));

--
-- KIVA FLOW GENERATION
--
insert into FinFlowDaily (FromEntityId, FromEntityType, ToEntityId, ToEntityType, Amount, PeriodDate)
	select
		TransactionSource,
		'A',
		TransactionTarget,
		'A',
		sum(TransactionAmount),
		convert(varchar(50), TransactionDate, 101)
	from Transactions
	group by TransactionSource, TransactionTarget, convert(varchar(50), TransactionDate, 101)

insert into FinFlowDaily (FromEntityId, FromEntityType, ToEntityId, ToEntityType, Amount, PeriodDate)
 	select
		substring(TransactionSource, 1, charindex('-',TransactionSource)-1),
		'O',
		TransactionTarget,
		'A',
		sum(TransactionAmount),
		convert(varchar(50), TransactionDate, 101)
  	from Transactions
  	where substring(TransactionSource,1,8) = 'partner.'
  	group by substring(TransactionSource,1,charindex('-',TransactionSource)-1), TransactionTarget, convert(varchar(50), TransactionDate, 101)

insert into FinFlowDaily (FromEntityId, FromEntityType, ToEntityId, ToEntityType, Amount, PeriodDate)
 	select
		TransactionSource,
		'A',
		substring(TransactionTarget,1,charindex('-',TransactionTarget)-1),
		'O',
		sum(TransactionAmount),
		convert(varchar(50), TransactionDate, 101)
  	from Transactions
  	where substring(TransactionTarget,1,8) = 'partner.'
  	group by TransactionSource, substring(TransactionTarget,1,charindex('-',TransactionTarget)-1), convert(varchar(50), TransactionDate, 101)

--  create FinFlowDaily indices
create index ix_ffd_from on FinFlowDaily     (FromEntityId, PeriodDate, ToEntityId,   Amount);
create index ix_ffd_to   on FinFlowDaily     (ToEntityId,   PeriodDate, FromEntityId, Amount);

--
-- KIVA ENTITY GENERATION (LOANS)
--

-- create Fin Entity Loan table
create table FinEntityLoan(
	EntityId varchar(100) PRIMARY KEY,
	IncomingLinks int,
	UniqueIncomingLinks int,
	OutgoingLinks int,
	UniqueOutgoingLinks int,
	NumTransactions int,
	MaxTransaction float,
	AvgTransaction float,
	StartDate datetime,
	EndDate datetime,
	[type] varchar(20),
	LoanId bigint,
	LoanName varchar(512),
	LoanUse varchar(max),
	LoanActivity varchar(512),
	LoanSector varchar(512),
	LoanStatus varchar(512),
	LoanAmount bigint,
	LoanFundedAmount bigint,
	LoanBasketAmount bigint,
	LoanPaidAmount float,
	LoanCurrencyExchangeLossAmount float,
	LoanPostedDate datetime,
	LoanPaidDate datetime,
	LoanDelinquent bit,
	LoanFundedDate datetime,
	LoanPlannedExpirationDate datetime,
	LoanDescriptionTexts_en varchar(max),
	LoanDescriptionTexts_ru varchar(max),
	LoanDescriptionTexts_fr varchar(max),
	LoanDescriptionTexts_es varchar(max),
	LoanDescriptionTexts_vi varchar(max),
	LoanDescriptionTexts_id varchar(max),
	LoanDescriptionTexts_pt varchar(max),
	LoanDescriptionTexts_mn varchar(max),
	LoanDescriptionTexts_ar varchar(max),
	LoanImageId bigint,
	LoanImageURL varchar(2048),
	LoanVideoId bigint,
	LoanVideoYoutubeId varchar(512),
	LoanLocationGeoLevel varchar(512),
	LoanLocationGeoPairs varchar(512),
	LoanLocationGeoType varchar(512),
	LoanLocationTown varchar(512),
	LoanLocationCountryCode varchar(20),
	LoanLocationCountry varchar(512),
	LoanTermsLoanAmount bigint,
	LoanTermsDisbursalDate datetime,
	LoanTermsDisbursalCurrency varchar(30),
	LoanTermsDisbursalAmount float,
	LoanTermsLossLiabilityCurrencyExchange varchar(512),
	LoanTermsLossLiabilityCurrencyExchangeCoverageRate float,
	LoanTermsLossLiabilityNonpayment varchar(512),
	LoanJournalTotalsEntries bigint,
	LoanJournalTotalsBulkEntries bigint,
	LoanLat float,
	LoanLon float
);

-- populate table with common attributes
insert into FinEntityLoan (
	EntityId,
	IncomingLinks,
	UniqueIncomingLinks,
	OutgoingLinks,
	UniqueOutgoingLinks,
	NumTransactions,
	MaxTransaction,
	AvgTransaction,
	StartDate,
	EndDate
)
select
	EntityId,
	sum(IncomingLinks) as IncomingLinks,
	sum(UniqueIncomingLinks) as UniqueIncomingLinks,
	sum(OutgoingLinks) as OutgoingLinks,
	sum(UniqueOutgoingLinks) as UniqueOutgoingLinks,
	sum(NumTransactions) as NumTransactions,
	max(MaxTransaction) as MaxTransaction,
	sum(TotalTransactions) / sum(NumTransactions) as AvgTransaction,
	min(StartDate) as StartDate,
	max(EndDate) as EndDate
from (
	select  TransactionTarget as EntityId,
			count(TransactionSource) as IncomingLinks,
			count( distinct TransactionSource ) as UniqueIncomingLinks,
			0 as OutgoingLinks,
			0 as UniqueOutgoingLinks,
			count(TransactionTarget) as NumTransactions,
			max(TransactionAmount) as MaxTransaction,
			sum(TransactionAmount) as TotalTransactions,
			min(TransactionDate) as StartDate,
			max(TransactionDate) as EndDate
	from Transactions
	group by TransactionTarget
	union
	select TransactionSource as EntityId,
			0 as IncomingLinks,
			0 as UniqueIncomingLinks,
			count(TransactionTarget) as OutgoingLinks,
			count( distinct TransactionTarget ) as UniqueOutgoingLinks,
			sum( case when TransactionSource <> TransactionTarget then 1 else 0 end ) as NumTransactions,
			max(TransactionAmount) as MaxTransaction,
			sum(TransactionAmount) as TotalTransactions,
			min(TransactionDate) as StartDate,
			max(TransactionDate) as EndDate
	from Transactions
	group by TransactionSource
)q
where EntityId like 'loan.%'
group by EntityId

-- update table with loan specific attributes
update FinEntityLoan
set
	[type] = 'loan',
	LoanId = FEP.LoanId,
	LoanName = FEP.LoanName,
	LoanUse = FEP.LoanUse,
	LoanActivity = FEP.LoanActivity,
	LoanSector = FEP.LoanSector,
	LoanStatus = FEP.LoanStatus,
	LoanAmount = FEP.LoanAmount,
	LoanFundedAmount = FEP.LoanFundedAmount,
	LoanBasketAmount = FEP.LoanBasketAmount,
	LoanPaidAmount = FEP.LoanPaidAmount,
	LoanCurrencyExchangeLossAmount = FEP.LoanCurrencyExchangeLossAmount,
	LoanPostedDate = FEP.LoanPostedDate,
	LoanPaidDate = FEP.LoanPaidDate,
	LoanDelinquent = FEP.LoanDelinquent,
	LoanFundedDate = FEP.LoanFundedDate,
	LoanPlannedExpirationDate = FEP.LoanPlannedExpirationDate,
	LoanDescriptionTexts_en = FEP.LoanDescriptionTexts_en,
	LoanDescriptionTexts_ru = FEP.LoanDescriptionTexts_ru,
	LoanDescriptionTexts_fr = FEP.LoanDescriptionTexts_fr,
	LoanDescriptionTexts_es = FEP.LoanDescriptionTexts_es,
	LoanDescriptionTexts_vi = FEP.LoanDescriptionTexts_vi,
	LoanDescriptionTexts_id = FEP.LoanDescriptionTexts_id,
	LoanDescriptionTexts_pt = FEP.LoanDescriptionTexts_pt,
	LoanDescriptionTexts_mn = FEP.LoanDescriptionTexts_mn,
	LoanDescriptionTexts_ar = FEP.LoanDescriptionTexts_ar,
	LoanImageId = FEP.LoanImageId,
	LoanImageURL = FEP.LoanImageURL,
	LoanVideoId = FEP.LoanVideoId,
	LoanVideoYoutubeId = FEP.LoanVideoYoutubeId,
	LoanLocationGeoLevel = FEP.LoanLocationGeoLevel,
	LoanLocationGeoPairs = FEP.LoanLocationGeoPairs,
	LoanLocationGeoType = FEP.LoanLocationGeoType,
	LoanLocationTown = FEP.LoanLocationTown,
	LoanLocationCountryCode = FEP.LoanLocationCountryCode,
	LoanLocationCountry = FEP.LoanLocationCountry,
	LoanTermsLoanAmount = FEP.LoanTermsLoanAmount,
	LoanTermsDisbursalDate = FEP.LoanTermsDisbursalDate,
	LoanTermsDisbursalCurrency = FEP.LoanTermsDisbursalCurrency,
	LoanTermsDisbursalAmount = FEP.LoanTermsDisbursalAmount,
	LoanTermsLossLiabilityCurrencyExchange = FEP.LoanTermsLossLiabilityCurrencyExchange,
	LoanTermsLossLiabilityCurrencyExchangeCoverageRate = FEP.LoanTermsLossLiabilityCurrencyExchangeCoverageRate,
	LoanTermsLossLiabilityNonpayment = FEP.LoanTermsLossLiabilityNonpayment,
	LoanJournalTotalsEntries = FEP.LoanJournalTotalsEntries,
	LoanJournalTotalsBulkEntries = FEP.LoanJournalTotalsBulkEntries,
	LoanLat = FEP.LoanLat,
	LoanLon = FEP.LoanLon
from FinEntityLoan FE
inner join
LoanProperties FEP
on FE.EntityId = FEP.EntityId

-- create index on Fin Entity Loan table
create index ix_fe_lo_id on FinEntityLoan (EntityId);

--
-- KIVA ENTITY GENERATION (LENDERS)
--

-- create Fin Entity Lender table
create table FinEntityLender(
	EntityId varchar(100) PRIMARY KEY,
	IncomingLinks int,
	UniqueIncomingLinks int,
	OutgoingLinks int,
	UniqueOutgoingLinks int,
	NumTransactions int,
	MaxTransaction float,
	AvgTransaction float,
	StartDate datetime,
	EndDate datetime,
	[type] varchar(20),
	LenderId varchar(512),
    LenderName varchar(512),
    LenderImageId bigint,
	LenderImageURL varchar(2048),
    LenderMemberSince datetime,
    LenderWhereabouts varchar(512),
    LenderCountryCode varchar(20),
    LenderOccupation varchar(512),
    LenderOccupationalInfo varchar(2048),
    LenderInviterId varchar(512),
    LenderInviteeCount bigint,
    LenderLoanCount bigint,
    LenderLoanBecause varchar(2048),
    LenderLat float,
    LenderLon float
);

-- populate table with common attributes
insert into FinEntityLender (
	EntityId,
	IncomingLinks,
	UniqueIncomingLinks,
	OutgoingLinks,
	UniqueOutgoingLinks,
	NumTransactions,
	MaxTransaction,
	AvgTransaction,
	StartDate,
	EndDate
)
select
	EntityId,
	sum(IncomingLinks) as IncomingLinks,
	sum(UniqueIncomingLinks) as UniqueIncomingLinks,
	sum(OutgoingLinks) as OutgoingLinks,
	sum(UniqueOutgoingLinks) as UniqueOutgoingLinks,
	sum(NumTransactions) as NumTransactions,
	max(MaxTransaction) as MaxTransaction,
	sum(TotalTransactions) / sum(NumTransactions) as AvgTransaction,
	min(StartDate) as StartDate,
	max(EndDate) as EndDate
from (
	select  TransactionTarget as EntityId,
			count(TransactionSource) as IncomingLinks,
			count( distinct TransactionSource ) as UniqueIncomingLinks,
			0 as OutgoingLinks,
			0 as UniqueOutgoingLinks,
			count(TransactionTarget) as NumTransactions,
			max(TransactionAmount) as MaxTransaction,
			sum(TransactionAmount) as TotalTransactions,
			min(TransactionDate) as StartDate,
			max(TransactionDate) as EndDate
	from Transactions
	group by TransactionTarget
	union
	select TransactionSource as EntityId,
			0 as IncomingLinks,
			0 as UniqueIncomingLinks,
			count(TransactionTarget) as OutgoingLinks,
			count( distinct TransactionTarget ) as UniqueOutgoingLinks,
			sum( case when TransactionSource <> TransactionTarget then 1 else 0 end ) as NumTransactions,
			max(TransactionAmount) as MaxTransaction,
			sum(TransactionAmount) as TotalTransactions,
			min(TransactionDate) as StartDate,
			max(TransactionDate) as EndDate
	from Transactions
	group by TransactionSource
)q
where EntityId like 'lender.%'
group by EntityId

-- update table with lender specific attributes
update FinEntityLender
set
	[type] = 'lender',
	LenderId = FEP.LenderId,
	LenderName = FEP.LenderName,
	LenderImageId = FEP.LenderImageId,
	LenderImageURL = 'http://www.kiva.org/img/default_lender.png',
	LenderMemberSince = FEP.LenderMemberSince,
	LenderWhereabouts = FEP.LenderWhereabouts,
	LenderCountryCode = FEP.LenderCountryCode,
	LenderOccupation = FEP.LenderOccupation,
	LenderOccupationalInfo = FEP.LenderOccupationalInfo,
	LenderInviterId = FEP.LenderInviterId,
	LenderInviteeCount = FEP.LenderInviteeCount,
	LenderLoanCount = FEP.LenderLoanCount,
	LenderLoanBecause = FEP.LenderLoanBecause,
	LenderLat = FEP.LenderLat,
	LenderLon = FEP.LenderLon
from FinEntityLender FE
inner join
LenderProperties FEP
on FE.EntityId = FEP.EntityId

-- create index on Fin Entity Lender table
create index ix_fe_le_id on FinEntityLender (EntityId);

--
-- KIVA ENTITY GENERATION (PARTNERS + BROKERS)
--

-- create Fin Entity Partner table
create table FinEntityPartner(
	EntityId varchar(100) PRIMARY KEY,
	IncomingLinks int,
	UniqueIncomingLinks int,
	OutgoingLinks int,
	UniqueOutgoingLinks int,
	NumTransactions int,
	MaxTransaction float,
	AvgTransaction float,
	StartDate datetime,
	EndDate datetime,
	[type] varchar(20),
	PartnerId bigint,
	OwnerId varchar(512),
    PartnerName varchar(512),
    PartnerStatus varchar(512),
    PartnerRating varchar(512),
    PartnerDueDiligenceType varchar(512),
    PartnerImageId bigint,
	PartnerImageURL varchar(2048),
    PartnerStartDate datetime,
    PartnerDelinquencyRate float,
    PartnerDefaultRate float,
    PartnerTotalAmountRaised float,
    PartnerLoansPosted bigint,
    PartnerCountryCode varchar(max),
    PartnerLat varchar(max),
    PartnerLon varchar(max),
);

-- populate table with common attributes for brokers
insert into FinEntityPartner (
	EntityId,
	IncomingLinks,
	UniqueIncomingLinks,
	OutgoingLinks,
	UniqueOutgoingLinks,
	NumTransactions,
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
	sum(NumTransactions) as NumTransactions,
	max(MaxTransaction) as MaxTransaction,
	sum(TotalTransactions) / sum(NumTransactions) as AvgTransaction,
	min(StartDate) as StartDate,
	max(EndDate) as EndDate
from (
	select  TransactionTarget as EntityId,
			count(TransactionSource) as IncomingLinks,
			count( distinct TransactionSource ) as UniqueIncomingLinks,
			0 as OutgoingLinks,
			0 as UniqueOutgoingLinks,
			count(TransactionTarget) as NumTransactions,
			max(TransactionAmount) as MaxTransaction,
			sum(TransactionAmount) as TotalTransactions,
			min(TransactionDate) as StartDate,
			max(TransactionDate) as EndDate
	from Transactions
	group by TransactionTarget
	union
	select TransactionSource as EntityId,
			0 as IncomingLinks,
			0 as UniqueIncomingLinks,
			count(TransactionTarget) as OutgoingLinks,
			count( distinct TransactionTarget ) as UniqueOutgoingLinks,
			sum( case when TransactionSource <> TransactionTarget then 1 else 0 end ) as NumTransactions,
			max(TransactionAmount) as MaxTransaction,
			sum(TransactionAmount) as TotalTransactions,
			min(TransactionDate) as StartDate,
			max(TransactionDate) as EndDate
	from Transactions
	group by TransactionSource
)q
where EntityId like 'partner.%'
group by EntityId

-- populate table with common attributes for partners
insert into FinEntityPartner (
	EntityId,
	IncomingLinks,
	UniqueIncomingLinks,
	OutgoingLinks,
	UniqueOutgoingLinks,
	NumTransactions,
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
	sum(NumTransactions) as NumTransactions,
	max(MaxTransaction) as MaxTransaction,
	sum(TotalTransactions) / sum(NumTransactions) as AvgTransaction,
	min(StartDate) as StartDate,
	max(EndDate) as EndDate
from (
	select
		left(TransactionTarget, (charindex('-', TransactionTarget) - 1)) as EntityId,
		count(TransactionSource) as IncomingLinks,
		count( distinct TransactionSource ) as UniqueIncomingLinks,
		0 as OutgoingLinks,
		0 as UniqueOutgoingLinks,
		count(TransactionTarget) as NumTransactions,
		max(TransactionAmount) as MaxTransaction,
		sum(TransactionAmount) as TotalTransactions,
		min(TransactionDate) as StartDate,
		max(TransactionDate) as EndDate
	from Transactions
	where TransactionTarget like 'partner.%'
	group by
		left(TransactionTarget, (charindex('-', TransactionTarget) - 1))
	union
	select
		left(TransactionSource, (charindex('-', TransactionSource) - 1)) as EntityId,
		0 as IncomingLinks,
		0 as UniqueIncomingLinks,
		count(TransactionTarget) as OutgoingLinks,
		count( distinct TransactionTarget ) as UniqueOutgoingLinks,
		sum( case when TransactionSource <> TransactionTarget then 1 else 0 end ) as NumTransactions,
		max(TransactionAmount) as MaxTransaction,
		sum(TransactionAmount) as TotalTransactions,
		min(TransactionDate) as StartDate,
		max(TransactionDate) as EndDate
	from Transactions
	where TransactionSource like 'partner.%'
	group by
		left(TransactionSource, (charindex('-', TransactionSource) - 1))
)q
where EntityId like 'partner.%'
group by EntityId
order by EntityId

-- update table with partner specific attributes
update FinEntityPartner
set
	[type] = 'partner',
	PartnerId = FEP.PartnerId,
	PartnerName = FEP.PartnerName,
	PartnerStatus = FEP.PartnerStatus,
	PartnerRating = FEP.PartnerRating,
	PartnerDueDiligenceType = FEP.PartnerDueDiligenceType,
	PartnerImageId = FEP.PartnerImageId,
	PartnerImageURL = FEP.PartnerImageURL,
    PartnerStartDate = FEP.PartnerStartDate,
    PartnerDelinquencyRate = FEP.PartnerDelinquencyRate,
    PartnerDefaultRate = FEP.PartnerDefaultRate,
    PartnerTotalAmountRaised = FEP.PartnerTotalAmountRaised,
    PartnerLoansPosted = FEP.PartnerLoansPosted,
    PartnerCountryCode = FEP.PartnerCountryCode,
    PartnerLat = FEP.PartnerLat,
    PartnerLon = FEP.PartnerLon
from FinEntityPartner FE
inner join
PartnerProperties FEP
on
case
	when charindex('-', FE.EntityId) > 0 then left(FE.EntityId, (charindex('-', FE.EntityId) - 1))
	else FE.EntityId
end = FEP.EntityId

-- add ownerId information
update FinEntityPartner
set OwnerId = left(EntityId, (charindex('-', EntityId) - 1))
where charindex('-', EntityId) > 0

-- create index on Fin Entity Partner table
create index ix_fe_pa_id on FinEntityPartner (EntityId);

--
--  FIN FLOW AGGREGATIONS
--
insert into FinFlowWeekly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), CONVERT(varchar(50), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate)), 101)
  from FinFlowDaily
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, CONVERT(varchar(50), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate)), 101);

insert into FinFlowMonthly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01', 101)
  from FinFlowDaily
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01', 101);

insert into FinFlowQuarterly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01', 101)
  from FinFlowMonthly
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01', 101);

insert into FinFlowYearly
 select FromEntityId, FromEntityType, ToEntityId, ToEntityType, sum(Amount), CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01', 101)
  from FinFlowMonthly
  group by FromEntityId, FromEntityType, ToEntityId, ToEntityType, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01', 101);

--  create FinFlow indices
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

--
--  FIN ENTITY AGGREGATIONS
--
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

insert into FinEntityWeekly
 select EntityId, CONVERT(varchar(50), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate)), 101), sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityDaily
  group by EntityId, CONVERT(varchar(50), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, PeriodDate) - 6, PeriodDate)), 101);

insert into FinEntityMonthly
 select EntityId, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01', 101), sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityDaily
  group by EntityId, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + convert(varchar(2), DATEPART(mm, PeriodDate)) + '/01', 101);

insert into FinEntityQuarterly
 select EntityId, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01', 101), sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityMonthly
  group by EntityId, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/' + case when DATEPART(q, PeriodDate)=1 then '01' when DATEPART(q, PeriodDate)=2 then '04' when DATEPART(q, PeriodDate)=3 then '07' when DATEPART(q, PeriodDate)=4 then '010' end + '/01', 101);

insert into FinEntityYearly
 select EntityId, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01', 101), sum(InboundAmount), sum(IncomingLinks), sum(OutboundAmount), sum(OutgoingLinks), 0
  from FinEntityQuarterly
  group by EntityId, CONVERT(varchar(50), convert(varchar(4), DATEPART(yyyy, PeriodDate)) + '/01/01', 101);

create index ix_fed on FinEntityDaily     (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_few on FinEntityWeekly    (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_fem on FinEntityMonthly   (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_feq on FinEntityQuarterly (EntityId, PeriodDate, InboundAmount, OutboundAmount);
create index ix_fey on FinEntityYearly    (EntityId, PeriodDate, InboundAmount, OutboundAmount);

--create index ix_csum on ClusterSummary	(EntityId);
--create index ix_cmem on ClusterSummaryMembers  (SummaryId);
