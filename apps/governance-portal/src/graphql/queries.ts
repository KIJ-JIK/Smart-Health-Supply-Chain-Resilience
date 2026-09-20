 // ─────────────────────────────────────────────────────────────────────────────
// GraphQL query definitions — typed against the backend contract.
// These are the exact root fields the backend team has specified.
// ─────────────────────────────────────────────────────────────────────────────
import { gql } from '@apollo/client';

// ── National Overview ─────────────────────────────────────────────────────────
export const NATIONAL_OVERVIEW = gql`
  query NationalOverview {
    nationalOverview {
      totalPhcs
      activePhcs
      stockoutAlerts
      criticalShortages
      pendingRedistributions
      outbreakAlerts
      kpis {
        label
        value
        unit
        trend
        delta
        severity
      }
    }
  }
`;

// ── State Overview ─────────────────────────────────────────────────────────────
export const STATE_OVERVIEW = gql`
  query StateOverview($stateId: ID!) {
    stateOverview(stateId: $stateId) {
      stateId
      stateName
      totalPhcs
      activePhcs
      stockoutAlerts
      criticalShortages
      kpis {
        label
        value
        unit
        trend
        delta
        severity
      }
    }
  }
`;

// ── District Overview ──────────────────────────────────────────────────────────
export const DISTRICT_OVERVIEW = gql`
  query DistrictOverview($districtId: ID!) {
    districtOverview(districtId: $districtId) {
      districtId
      districtName
      stateId
      stateName
      totalPhcs
      activePhcs
      stockoutAlerts
      kpis {
        label
        value
        unit
        trend
        delta
        severity
      }
    }
  }
`;

// ── PHC Detail ─────────────────────────────────────────────────────────────────
export const PHC_DETAIL = gql`
  query PhcDetail($phcId: ID!) {
    phcDetail(phcId: $phcId) {
      phcId
      phcName
      districtId
      districtName
      stateId
      stateName
      lat
      lng
      catchmentPopulation
      activeStaff
      stockStatus
      lastUpdated
    }
  }
`;

// ── Medicine Intelligence ──────────────────────────────────────────────────────
export const MEDICINE_INTELLIGENCE = gql`
  query MedicineIntelligence($scope: ScopeInput!) {
    medicineIntelligence(scope: $scope) {
      medicineId
      medicineName
      genericName
      category
      currentStock
      unit
      coverageDays
      reorderLevel
      criticalLevel
      expiryDate
      status
      phcId
      districtId
      stateId
    }
  }
`;

// ── Resource Intelligence ──────────────────────────────────────────────────────
export const RESOURCE_INTELLIGENCE = gql`
  query ResourceIntelligence($scope: ScopeInput!) {
    resourceIntelligence(scope: $scope) {
      resourceId
      resourceName
      category
      available
      required
      utilization
      unit
      status
    }
  }
`;

// ── Workforce Intelligence ─────────────────────────────────────────────────────
export const WORKFORCE_INTELLIGENCE = gql`
  query WorkforceIntelligence($scope: ScopeInput!) {
    workforceIntelligence(scope: $scope) {
      roleId
      roleName
      sanctioned
      inPosition
      vacancies
      onLeave
      trainingDue
      vacancyRate
    }
  }
`;

// ── Patient Intelligence ───────────────────────────────────────────────────────
export const PATIENT_INTELLIGENCE = gql`
  query PatientIntelligence($scope: ScopeInput!) {
    patientIntelligence(scope: $scope) {
      totalVisits
      avgWaitTimeMinutes
      referralRate
      ncdCoverage
      immunizationCoverage
      maternalCareEnrollment
      period
    }
  }
`;

// ── Forecasts ──────────────────────────────────────────────────────────────────
export const FORECASTS = gql`
  query Forecasts($entity: EntityInput!, $metric: String!) {
    forecasts(entity: $entity, metric: $metric) {
      entityId
      entityType
      metric
      horizon
      model
      confidence
      generatedAt
      points {
        date
        value
        lowerBound
        upperBound
      }
    }
  }
`;

// ── Redistribution Recommendations ────────────────────────────────────────────
export const REDISTRIBUTION_RECOMMENDATIONS = gql`
  query RedistributionRecommendations($district: ID!) {
    redistributionRecommendations(district: $district) {
      recommendationId
      medicineId
      medicineName
      fromPhcId
      fromPhcName
      toPhcId
      toPhcName
      districtId
      quantity
      unit
      urgency
      reason
      aiConfidence
      status
      createdAt
      decisionAt
      decisionBy
      notes
    }
  }
`;

// ── Supply Chain Shipments ─────────────────────────────────────────────────────
export const SUPPLY_CHAIN_SHIPMENTS = gql`
  query SupplyChainShipments($filter: ShipmentFilter!) {
    supplyChainShipments(filter: $filter) {
      shipmentId
      orderDate
      expectedDelivery
      actualDelivery
      status
      supplier
      destinationPhcId
      destinationPhcName
      districtId
      stateId
      totalValue
      currency
      items {
        medicineId
        medicineName
        quantity
        unit
      }
    }
  }
`;

// ── Audit Log ──────────────────────────────────────────────────────────────────
export const AUDIT_LOG = gql`
  query AuditLog($filter: AuditFilter!) {
    auditLog(filter: $filter) {
      auditId
      action
      entityType
      entityId
      userId
      userName
      userRole
      timestamp
      ipAddress
      metadata
    }
  }
`;

// ── Alerts History ─────────────────────────────────────────────────────────────
export const ALERTS_HISTORY = gql`
  query AlertsHistory($districtId: String, $stateId: String, $page: Int, $limit: Int) {
    alertsHistory(districtId: $districtId, stateId: $stateId, page: $page, limit: $limit) {
      id
      severity
      category
      alertType
      alertClass
      title
      message
      entityId
      entityName
      entityType
      copilotQuery
      timestamp
      acknowledged
      districtId
      stateId
    }
  }
`;

