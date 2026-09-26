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
      criticalPhcs
      totalBeds
      occupiedBeds
      bedOccupancyRate
      oxygenCylindersAvailable
      openAlertsCount
      criticalAlertsCount
      staffShortagePhcCount
      pendingRedistributionsCount
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
      totalDistricts
      totalPhcs
      activePhcs
      stockoutAlerts
      criticalShortages
      bedOccupancyRate
      criticalAlertsCount
      districts {
        districtId
        districtName
        totalPhcs
        criticalPhcs
        stockoutRiskCount
        bedOccupancyRate
      }
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
      pendingRequestsCount
      openAlertsCount
      phcList {
        phcId
        name
        totalBeds
        occupiedBeds
        oxygenCylinders
        riskLevel
        openAlerts
        latitude
        longitude
      }
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
  query Forecasts($entity: EntityInput, $metric: String) {
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
  query RedistributionRecommendations($district: ID) {
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
  query SupplyChainShipments($filter: ShipmentFilter) {
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
  query AuditLog($filter: AuditFilter) {
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

// ── Jurisdiction Mutations ──────────────────────────────────────────────────
export const CREATE_PHC_FACILITY = gql`
  mutation CreatePhcFacility(
    $name: String!
    $districtId: ID!
    $stateId: ID!
    $latitude: Float
    $longitude: Float
    $totalBeds: Int
    $emergencyBeds: Int
    $oxygenCylinders: Int
  ) {
    createPhcFacility(
      name: $name
      districtId: $districtId
      stateId: $stateId
      latitude: $latitude
      longitude: $longitude
      totalBeds: $totalBeds
      emergencyBeds: $emergencyBeds
      oxygenCylinders: $oxygenCylinders
    ) {
      phcId
      phcName
      districtId
      districtName
      stateId
      stateName
      totalBeds
      occupiedBeds
      oxygenCylinders
      riskLevel
    }
  }
`;

export const CREATE_DISTRICT = gql`
  mutation CreateDistrict($name: String!, $stateId: ID!) {
    createDistrict(name: $name, stateId: $stateId) {
      districtId
      districtName
      stateId
      stateName
      totalPhcs
      activePhcs
    }
  }
`;

export const CREATE_STATE = gql`
  mutation CreateState($name: String!, $code: String!, $country: String) {
    createState(name: $name, code: $code, country: $country) {
      stateId
      stateName
      totalDistricts
      totalPhcs
    }
  }
`;

export const CREATE_NATION = gql`
  mutation CreateNation($code: String!, $name: String!, $status: String) {
    createNation(code: $code, name: $name, status: $status) {
      countryCode
      countryName
      status
      nodeStatus
      activeModelVersion
      coordinatorEndpoint
    }
  }
`;

// ── Update Mutations ───────────────────────────────────────────────────────────
export const UPDATE_PHC_FACILITY = gql`
  mutation UpdatePhcFacility(
    $phcId: ID!
    $name: String
    $totalBeds: Int
    $oxygenCylinders: Int
    $operationalStatus: String
  ) {
    updatePhcFacility(
      phcId: $phcId
      name: $name
      totalBeds: $totalBeds
      oxygenCylinders: $oxygenCylinders
      operationalStatus: $operationalStatus
    ) {
      phcId
      phcName
      totalBeds
      oxygenCylinders
      riskLevel
    }
  }
`;

export const UPDATE_DISTRICT = gql`
  mutation UpdateDistrict($districtId: ID!, $name: String) {
    updateDistrict(districtId: $districtId, name: $name) {
      districtId
      districtName
      totalPhcs
    }
  }
`;

export const UPDATE_STATE = gql`
  mutation UpdateState($stateId: ID!, $name: String, $code: String) {
    updateState(stateId: $stateId, name: $name, code: $code) {
      stateId
      stateName
      totalDistricts
      totalPhcs
    }
  }
`;

export const UPDATE_NATION = gql`
  mutation UpdateNation($code: String!, $name: String, $status: String) {
    updateNation(code: $code, name: $name, status: $status) {
      countryCode
      countryName
      status
      nodeStatus
    }
  }
`;
