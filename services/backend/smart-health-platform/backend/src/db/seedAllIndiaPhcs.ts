import { pool } from './pool';

interface StateData {
  id: string;
  name: string;
  code: string;
  capital: string;
  districts: {
    id: string;
    name: string;
    phcs: {
      name: string;
      lat: number;
      lng: number;
      type: '24x7_PHC' | 'Urban_PHC' | 'Sub_Center' | 'CHC';
      totalBeds: number;
      occupiedBeds: number;
      emergencyBeds: number;
      oxygenCylinders: number;
      riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
      riskScore: number;
      medicineCoverageDays: number;
      oxygenDays: number;
    }[];
  }[];
}

const ALL_INDIA_DATA: StateData[] = [
  // 1. Delhi (NCT)
  {
    id: 'a0000001-0000-0000-0000-000000000034',
    name: 'Delhi (NCT)',
    code: 'DL',
    capital: 'New Delhi',
    districts: [
      {
        id: 'dist-del-central',
        name: 'Central Delhi',
        phcs: [
          { name: 'Connaught Place Urban PHC', lat: 28.6315, lng: 77.2167, type: 'Urban_PHC', totalBeds: 40, occupiedBeds: 32, emergencyBeds: 10, oxygenCylinders: 35, riskLevel: 'MODERATE', riskScore: 55, medicineCoverageDays: 5.5, oxygenDays: 4.2 },
          { name: 'Karol Bagh Community Health', lat: 28.6521, lng: 77.1906, type: '24x7_PHC', totalBeds: 35, occupiedBeds: 28, emergencyBeds: 8, oxygenCylinders: 25, riskLevel: 'LOW', riskScore: 32, medicineCoverageDays: 7.0, oxygenDays: 6.0 },
        ],
      },
      {
        id: 'dist-del-south',
        name: 'South Delhi',
        phcs: [
          { name: 'Hauz Khas Model Health Centre', lat: 28.5494, lng: 77.2001, type: '24x7_PHC', totalBeds: 50, occupiedBeds: 44, emergencyBeds: 12, oxygenCylinders: 40, riskLevel: 'HIGH', riskScore: 78, medicineCoverageDays: 2.1, oxygenDays: 2.0 },
          { name: 'Saket Urban Dispensary', lat: 28.5245, lng: 77.2066, type: 'Urban_PHC', totalBeds: 30, occupiedBeds: 22, emergencyBeds: 6, oxygenCylinders: 20, riskLevel: 'LOW', riskScore: 28, medicineCoverageDays: 8.4, oxygenDays: 5.8 },
        ],
      },
    ],
  },
  // 2. Kerala
  {
    id: 'a0000001-0000-0000-0000-000000000018',
    name: 'Kerala',
    code: 'KL',
    capital: 'Thiruvananthapuram',
    districts: [
      {
        id: 'dist-kl-tvm',
        name: 'Thiruvananthapuram',
        phcs: [
          { name: 'Kovalam Coastal 24x7 PHC', lat: 8.4020, lng: 76.9780, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 20, emergencyBeds: 6, oxygenCylinders: 22, riskLevel: 'LOW', riskScore: 25, medicineCoverageDays: 9.0, oxygenDays: 7.2 },
          { name: 'Nedumangad Taluk Health Centre', lat: 8.6010, lng: 77.0010, type: 'CHC', totalBeds: 60, occupiedBeds: 48, emergencyBeds: 14, oxygenCylinders: 45, riskLevel: 'MODERATE', riskScore: 48, medicineCoverageDays: 4.8, oxygenDays: 5.0 },
        ],
      },
      {
        id: 'dist-kl-ekm',
        name: 'Ernakulam',
        phcs: [
          { name: 'Kochi Urban Family Health Centre', lat: 9.9312, lng: 76.2673, type: 'Urban_PHC', totalBeds: 45, occupiedBeds: 39, emergencyBeds: 10, oxygenCylinders: 35, riskLevel: 'MODERATE', riskScore: 52, medicineCoverageDays: 4.2, oxygenDays: 4.0 },
          { name: 'Aluva Sub-District PHC', lat: 10.1076, lng: 76.3516, type: '24x7_PHC', totalBeds: 35, occupiedBeds: 30, emergencyBeds: 8, oxygenCylinders: 25, riskLevel: 'LOW', riskScore: 30, medicineCoverageDays: 6.5, oxygenDays: 6.0 },
        ],
      },
    ],
  },
  // 3. Punjab
  {
    id: 'a0000001-0000-0000-0000-000000000024',
    name: 'Punjab',
    code: 'PB',
    capital: 'Chandigarh',
    districts: [
      {
        id: 'dist-pb-asr',
        name: 'Amritsar',
        phcs: [
          { name: 'Amritsar Heritage Urban PHC', lat: 31.6340, lng: 74.8723, type: 'Urban_PHC', totalBeds: 40, occupiedBeds: 35, emergencyBeds: 10, oxygenCylinders: 30, riskLevel: 'HIGH', riskScore: 72, medicineCoverageDays: 2.8, oxygenDays: 2.5 },
          { name: 'Attari Border Rural PHC', lat: 31.6030, lng: 74.6050, type: '24x7_PHC', totalBeds: 25, occupiedBeds: 18, emergencyBeds: 6, oxygenCylinders: 18, riskLevel: 'MODERATE', riskScore: 58, medicineCoverageDays: 3.9, oxygenDays: 3.2 },
        ],
      },
      {
        id: 'dist-pb-ldh',
        name: 'Ludhiana',
        phcs: [
          { name: 'Ludhiana Industrial Area PHC', lat: 30.9010, lng: 75.8573, type: '24x7_PHC', totalBeds: 45, occupiedBeds: 42, emergencyBeds: 10, oxygenCylinders: 32, riskLevel: 'CRITICAL', riskScore: 86, medicineCoverageDays: 1.4, oxygenDays: 1.1 },
        ],
      },
    ],
  },
  // 4. Haryana
  {
    id: 'a0000001-0000-0000-0000-000000000015',
    name: 'Haryana',
    code: 'HR',
    capital: 'Chandigarh',
    districts: [
      {
        id: 'dist-hr-ggn',
        name: 'Gurugram',
        phcs: [
          { name: 'Cyber City Sector 29 Urban PHC', lat: 28.4595, lng: 77.0266, type: 'Urban_PHC', totalBeds: 50, occupiedBeds: 45, emergencyBeds: 12, oxygenCylinders: 40, riskLevel: 'HIGH', riskScore: 75, medicineCoverageDays: 2.3, oxygenDays: 2.0 },
          { name: 'Sohna Rural Health Centre', lat: 28.2478, lng: 77.0620, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 20, emergencyBeds: 6, oxygenCylinders: 20, riskLevel: 'LOW', riskScore: 34, medicineCoverageDays: 6.0, oxygenDays: 5.5 },
        ],
      },
    ],
  },
  // 5. Telangana
  {
    id: 'a0000001-0000-0000-0000-000000000026',
    name: 'Telangana',
    code: 'TS',
    capital: 'Hyderabad',
    districts: [
      {
        id: 'dist-ts-hyd',
        name: 'Hyderabad',
        phcs: [
          { name: 'Charminar Urban Family Health', lat: 17.3616, lng: 78.4747, type: 'Urban_PHC', totalBeds: 45, occupiedBeds: 40, emergencyBeds: 10, oxygenCylinders: 35, riskLevel: 'HIGH', riskScore: 79, medicineCoverageDays: 2.0, oxygenDays: 1.8 },
          { name: 'Gachibowli Tech-Zone PHC', lat: 17.4401, lng: 78.3489, type: '24x7_PHC', totalBeds: 35, occupiedBeds: 22, emergencyBeds: 8, oxygenCylinders: 25, riskLevel: 'LOW', riskScore: 28, medicineCoverageDays: 7.8, oxygenDays: 6.2 },
        ],
      },
      {
        id: 'dist-ts-wgl',
        name: 'Warangal',
        phcs: [
          { name: 'Kakatiya Heritage PHC', lat: 17.9689, lng: 79.5941, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 24, emergencyBeds: 6, oxygenCylinders: 20, riskLevel: 'MODERATE', riskScore: 50, medicineCoverageDays: 4.5, oxygenDays: 4.0 },
        ],
      },
    ],
  },
  // 6. Odisha
  {
    id: 'a0000001-0000-0000-0000-000000000023',
    name: 'Odisha',
    code: 'OD',
    capital: 'Bhubaneswar',
    districts: [
      {
        id: 'dist-od-bbsr',
        name: 'Khurda (Bhubaneswar)',
        phcs: [
          { name: 'Saheed Nagar Urban PHC', lat: 20.2961, lng: 85.8245, type: 'Urban_PHC', totalBeds: 40, occupiedBeds: 32, emergencyBeds: 8, oxygenCylinders: 30, riskLevel: 'MODERATE', riskScore: 56, medicineCoverageDays: 4.0, oxygenDays: 3.5 },
          { name: 'Puri Coastal Health Centre', lat: 19.8135, lng: 85.8312, type: '24x7_PHC', totalBeds: 35, occupiedBeds: 31, emergencyBeds: 10, oxygenCylinders: 28, riskLevel: 'HIGH', riskScore: 74, medicineCoverageDays: 2.6, oxygenDays: 2.2 },
        ],
      },
    ],
  },
  // 7. Assam
  {
    id: 'a0000001-0000-0000-0000-000000000012',
    name: 'Assam',
    code: 'AS',
    capital: 'Dispur',
    districts: [
      {
        id: 'dist-as-kam',
        name: 'Kamrup Metropolitan (Guwahati)',
        phcs: [
          { name: 'Brahmaputra Riverside PHC', lat: 26.1445, lng: 91.7362, type: '24x7_PHC', totalBeds: 40, occupiedBeds: 36, emergencyBeds: 10, oxygenCylinders: 32, riskLevel: 'CRITICAL', riskScore: 84, medicineCoverageDays: 1.6, oxygenDays: 1.2 },
          { name: 'Dispur Capital Clinic', lat: 26.1408, lng: 91.7907, type: 'Urban_PHC', totalBeds: 35, occupiedBeds: 24, emergencyBeds: 8, oxygenCylinders: 25, riskLevel: 'LOW', riskScore: 32, medicineCoverageDays: 6.8, oxygenDays: 5.5 },
        ],
      },
    ],
  },
  // 8. Jammu and Kashmir & Ladakh
  {
    id: 'a0000001-0000-0000-0000-000000000035',
    name: 'Jammu and Kashmir',
    code: 'JK',
    capital: 'Srinagar / Jammu',
    districts: [
      {
        id: 'dist-jk-sgr',
        name: 'Srinagar',
        phcs: [
          { name: 'Dal Lake Floating & Island PHC', lat: 34.0837, lng: 74.7973, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 25, emergencyBeds: 8, oxygenCylinders: 30, riskLevel: 'HIGH', riskScore: 76, medicineCoverageDays: 2.4, oxygenDays: 2.1 },
        ],
      },
      {
        id: 'dist-jk-jmu',
        name: 'Jammu',
        phcs: [
          { name: 'Tawi Valley Community Health', lat: 32.7266, lng: 74.8570, type: 'CHC', totalBeds: 50, occupiedBeds: 38, emergencyBeds: 12, oxygenCylinders: 40, riskLevel: 'LOW', riskScore: 35, medicineCoverageDays: 6.2, oxygenDays: 5.8 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000036',
    name: 'Ladakh',
    code: 'LA',
    capital: 'Leh',
    districts: [
      {
        id: 'dist-la-leh',
        name: 'Leh High Altitude',
        phcs: [
          { name: 'Leh Altitude Resilience PHC', lat: 34.1526, lng: 77.5771, type: '24x7_PHC', totalBeds: 25, occupiedBeds: 20, emergencyBeds: 8, oxygenCylinders: 50, riskLevel: 'HIGH', riskScore: 78, medicineCoverageDays: 3.0, oxygenDays: 2.2 },
        ],
      },
    ],
  },
  // 9. Himachal Pradesh & Uttarakhand
  {
    id: 'a0000001-0000-0000-0000-000000000016',
    name: 'Himachal Pradesh',
    code: 'HP',
    capital: 'Shimla',
    districts: [
      {
        id: 'dist-hp-sml',
        name: 'Shimla',
        phcs: [
          { name: 'Shimla Ridge Model PHC', lat: 31.1048, lng: 77.1734, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 22, emergencyBeds: 6, oxygenCylinders: 28, riskLevel: 'LOW', riskScore: 30, medicineCoverageDays: 7.5, oxygenDays: 6.0 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000028',
    name: 'Uttarakhand',
    code: 'UK',
    capital: 'Dehradun',
    districts: [
      {
        id: 'dist-uk-ddn',
        name: 'Dehradun',
        phcs: [
          { name: 'Doon Valley Foothills PHC', lat: 30.3165, lng: 78.0322, type: '24x7_PHC', totalBeds: 40, occupiedBeds: 34, emergencyBeds: 10, oxygenCylinders: 35, riskLevel: 'MODERATE', riskScore: 60, medicineCoverageDays: 3.8, oxygenDays: 3.5 },
          { name: 'Rishikesh Ganga Health Centre', lat: 30.0869, lng: 78.2676, type: 'Urban_PHC', totalBeds: 35, occupiedBeds: 25, emergencyBeds: 8, oxygenCylinders: 25, riskLevel: 'LOW', riskScore: 29, medicineCoverageDays: 8.0, oxygenDays: 6.5 },
        ],
      },
    ],
  },
  // 10. Goa
  {
    id: 'a0000001-0000-0000-0000-000000000014',
    name: 'Goa',
    code: 'GA',
    capital: 'Panaji',
    districts: [
      {
        id: 'dist-ga-pan',
        name: 'North Goa (Panaji)',
        phcs: [
          { name: 'Panaji Coastal Urban PHC', lat: 15.4909, lng: 73.8278, type: 'Urban_PHC', totalBeds: 30, occupiedBeds: 18, emergencyBeds: 6, oxygenCylinders: 20, riskLevel: 'LOW', riskScore: 22, medicineCoverageDays: 9.5, oxygenDays: 8.0 },
          { name: 'Candolim Beachside Health', lat: 15.5178, lng: 73.7634, type: '24x7_PHC', totalBeds: 25, occupiedBeds: 15, emergencyBeds: 4, oxygenCylinders: 18, riskLevel: 'LOW', riskScore: 24, medicineCoverageDays: 9.0, oxygenDays: 7.5 },
        ],
      },
    ],
  },
  // 11. Jharkhand & Chhattisgarh
  {
    id: 'a0000001-0000-0000-0000-000000000017',
    name: 'Jharkhand',
    code: 'JH',
    capital: 'Ranchi',
    districts: [
      {
        id: 'dist-jh-ran',
        name: 'Ranchi',
        phcs: [
          { name: 'Ranchi Plateau Community Health', lat: 23.3441, lng: 85.3096, type: '24x7_PHC', totalBeds: 45, occupiedBeds: 39, emergencyBeds: 10, oxygenCylinders: 32, riskLevel: 'HIGH', riskScore: 76, medicineCoverageDays: 2.2, oxygenDays: 2.0 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000013',
    name: 'Chhattisgarh',
    code: 'CG',
    capital: 'Raipur',
    districts: [
      {
        id: 'dist-cg-rpr',
        name: 'Raipur',
        phcs: [
          { name: 'Raipur Central Tribal & Rural PHC', lat: 21.2514, lng: 81.6296, type: '24x7_PHC', totalBeds: 40, occupiedBeds: 36, emergencyBeds: 10, oxygenCylinders: 30, riskLevel: 'HIGH', riskScore: 77, medicineCoverageDays: 2.1, oxygenDays: 1.9 },
        ],
      },
    ],
  },
  // 12. Northeast States (Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Arunachal Pradesh)
  {
    id: 'a0000001-0000-0000-0000-000000000020',
    name: 'Meghalaya',
    code: 'ML',
    capital: 'Shillong',
    districts: [
      {
        id: 'dist-ml-shl',
        name: 'East Khasi Hills (Shillong)',
        phcs: [
          { name: 'Shillong Pine Hills PHC', lat: 25.5788, lng: 91.8933, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 24, emergencyBeds: 6, oxygenCylinders: 24, riskLevel: 'MODERATE', riskScore: 45, medicineCoverageDays: 5.2, oxygenDays: 4.8 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000027',
    name: 'Tripura',
    code: 'TR',
    capital: 'Agartala',
    districts: [
      {
        id: 'dist-tr-agt',
        name: 'West Tripura (Agartala)',
        phcs: [
          { name: 'Agartala Borderline PHC', lat: 23.8315, lng: 91.2868, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 25, emergencyBeds: 6, oxygenCylinders: 22, riskLevel: 'MODERATE', riskScore: 50, medicineCoverageDays: 4.5, oxygenDays: 4.0 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000019',
    name: 'Manipur',
    code: 'MN',
    capital: 'Imphal',
    districts: [
      {
        id: 'dist-mn-imp',
        name: 'Imphal West',
        phcs: [
          { name: 'Imphal Valley 24x7 PHC', lat: 24.8170, lng: 93.9368, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 26, emergencyBeds: 6, oxygenCylinders: 25, riskLevel: 'HIGH', riskScore: 73, medicineCoverageDays: 2.7, oxygenDays: 2.4 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000022',
    name: 'Nagaland',
    code: 'NL',
    capital: 'Kohima',
    districts: [
      {
        id: 'dist-nl-koh',
        name: 'Kohima',
        phcs: [
          { name: 'Kohima Highland Health Centre', lat: 25.6751, lng: 94.1086, type: '24x7_PHC', totalBeds: 25, occupiedBeds: 20, emergencyBeds: 5, oxygenCylinders: 20, riskLevel: 'MODERATE', riskScore: 48, medicineCoverageDays: 4.8, oxygenDays: 4.2 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000021',
    name: 'Mizoram',
    code: 'MZ',
    capital: 'Aizawl',
    districts: [
      {
        id: 'dist-mz-aiz',
        name: 'Aizawl',
        phcs: [
          { name: 'Aizawl Ridge Primary Clinic', lat: 23.7271, lng: 92.7176, type: '24x7_PHC', totalBeds: 25, occupiedBeds: 18, emergencyBeds: 5, oxygenCylinders: 20, riskLevel: 'LOW', riskScore: 33, medicineCoverageDays: 6.4, oxygenDays: 5.5 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000011',
    name: 'Arunachal Pradesh',
    code: 'AR',
    capital: 'Itanagar',
    districts: [
      {
        id: 'dist-ar-ita',
        name: 'Papum Pare (Itanagar)',
        phcs: [
          { name: 'Itanagar Frontier PHC', lat: 27.0844, lng: 93.6053, type: '24x7_PHC', totalBeds: 30, occupiedBeds: 22, emergencyBeds: 6, oxygenCylinders: 26, riskLevel: 'MODERATE', riskScore: 52, medicineCoverageDays: 4.4, oxygenDays: 3.8 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000025',
    name: 'Sikkim',
    code: 'SK',
    capital: 'Gangtok',
    districts: [
      {
        id: 'dist-sk-gtk',
        name: 'East Sikkim (Gangtok)',
        phcs: [
          { name: 'Gangtok Mountain View PHC', lat: 27.3389, lng: 88.6065, type: '24x7_PHC', totalBeds: 25, occupiedBeds: 18, emergencyBeds: 5, oxygenCylinders: 25, riskLevel: 'LOW', riskScore: 28, medicineCoverageDays: 7.2, oxygenDays: 6.0 },
        ],
      },
    ],
  },
  // 13. Union Territories (Puducherry, Chandigarh, Andaman, Lakshadweep, Daman & Diu)
  {
    id: 'a0000001-0000-0000-0000-000000000038',
    name: 'Puducherry',
    code: 'PY',
    capital: 'Puducherry',
    districts: [
      {
        id: 'dist-py-pdc',
        name: 'Puducherry',
        phcs: [
          { name: 'French Quarter Coastal Health', lat: 11.9416, lng: 79.8083, type: 'Urban_PHC', totalBeds: 30, occupiedBeds: 20, emergencyBeds: 6, oxygenCylinders: 22, riskLevel: 'LOW', riskScore: 26, medicineCoverageDays: 8.5, oxygenDays: 7.0 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000032',
    name: 'Chandigarh',
    code: 'CH',
    capital: 'Chandigarh',
    districts: [
      {
        id: 'dist-ch-chd',
        name: 'Chandigarh City',
        phcs: [
          { name: 'Sector 16 Model Urban PHC', lat: 30.7333, lng: 76.7794, type: 'Urban_PHC', totalBeds: 40, occupiedBeds: 32, emergencyBeds: 10, oxygenCylinders: 35, riskLevel: 'LOW', riskScore: 30, medicineCoverageDays: 7.8, oxygenDays: 6.5 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000031',
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    capital: 'Port Blair',
    districts: [
      {
        id: 'dist-an-pbl',
        name: 'South Andaman (Port Blair)',
        phcs: [
          { name: 'Port Blair Island Health Command', lat: 11.6234, lng: 92.7265, type: '24x7_PHC', totalBeds: 35, occupiedBeds: 28, emergencyBeds: 8, oxygenCylinders: 40, riskLevel: 'MODERATE', riskScore: 58, medicineCoverageDays: 3.5, oxygenDays: 3.0 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000037',
    name: 'Lakshadweep',
    code: 'LD',
    capital: 'Kavaratti',
    districts: [
      {
        id: 'dist-ld-kav',
        name: 'Kavaratti Island',
        phcs: [
          { name: 'Kavaratti Lagoon Health Unit', lat: 10.5667, lng: 72.6417, type: '24x7_PHC', totalBeds: 20, occupiedBeds: 14, emergencyBeds: 4, oxygenCylinders: 25, riskLevel: 'MODERATE', riskScore: 55, medicineCoverageDays: 4.0, oxygenDays: 3.5 },
        ],
      },
    ],
  },
  {
    id: 'a0000001-0000-0000-0000-000000000033',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DN',
    capital: 'Daman',
    districts: [
      {
        id: 'dist-dn-dmn',
        name: 'Daman & Diu',
        phcs: [
          { name: 'Daman Coastal Dispensary', lat: 20.3974, lng: 72.8328, type: 'Urban_PHC', totalBeds: 25, occupiedBeds: 16, emergencyBeds: 5, oxygenCylinders: 20, riskLevel: 'LOW', riskScore: 25, medicineCoverageDays: 8.8, oxygenDays: 7.2 },
        ],
      },
    ],
  },
];

export async function seedAllIndiaPhcs() {
  const client = await pool.connect();
  try {
    console.log('Seeding nationwide PHC network across all 36 Indian States and Union Territories...');
    await client.query('BEGIN');

    let totalDistricts = 0;
    let totalPhcs = 0;

    for (const state of ALL_INDIA_DATA) {
      // 1. Ensure state exists
      await client.query(
        `INSERT INTO states (id, name, code, country)
         VALUES ($1, $2, $3, 'India')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code`,
        [state.id, state.name, state.code]
      );

      for (const dist of state.districts) {
        // 2. Find or create District with valid UUID
        let distId: string;
        const existingDist = await client.query(
          `SELECT id FROM districts WHERE name = $1 AND state_id = $2`,
          [dist.name, state.id]
        );
        if (existingDist.rows.length > 0) {
          distId = existingDist.rows[0].id;
        } else {
          const newDist = await client.query(
            `INSERT INTO districts (id, name, state_id) VALUES (gen_random_uuid(), $1, $2) RETURNING id`,
            [dist.name, state.id]
          );
          distId = newDist.rows[0].id;
          totalDistricts++;
        }

        for (const phc of dist.phcs) {
          // 3. Insert PHC if not existing
          const existingPhc = await client.query(
            `SELECT id FROM phc_facilities WHERE name = $1 AND district_id = $2`,
            [phc.name, distId]
          );
          if (existingPhc.rows.length === 0) {
            await client.query(
              `INSERT INTO phc_facilities (
                 id, name, district_id, state_id, latitude, longitude,
                 total_beds, occupied_beds, emergency_beds, isolation_beds,
                 oxygen_cylinders_available, operational_status
               ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 4, $9, 'active')`,
              [
                phc.name,
                distId,
                state.id,
                phc.lat,
                phc.lng,
                phc.totalBeds,
                phc.occupiedBeds,
                phc.emergencyBeds,
                phc.oxygenCylinders,
              ]
            );
            totalPhcs++;
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Successfully seeded ${totalDistricts} districts and ${totalPhcs} PHC facilities across all 36 States & UTs.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding all India PHCs:', err);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedAllIndiaPhcs().then(() => pool.end());
}
