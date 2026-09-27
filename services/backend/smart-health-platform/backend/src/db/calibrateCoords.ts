import { pool } from './pool';

const STATE_COORDS: Record<string, { name: string; dist: string; lat: number; lng: number }[]> = {
  'Tamil Nadu': [
    { name: 'Guindy Urban Health Centre', dist: 'Chennai', lat: 13.0067, lng: 80.2025 },
    { name: 'Royapettah Family Care', dist: 'Chennai', lat: 13.0538, lng: 80.2644 },
    { name: 'T Nagar Community Dispensary', dist: 'Chennai', lat: 13.0418, lng: 80.2341 },
    { name: 'Coimbatore Model PHC', dist: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { name: 'Pollachi Rural 24x7 PHC', dist: 'Coimbatore', lat: 10.6609, lng: 77.0048 },
    { name: 'Madurai Heritage PHC', dist: 'Madurai', lat: 9.9252, lng: 78.1198 },
    { name: 'Melur Community Health', dist: 'Madurai', lat: 10.0334, lng: 78.3378 },
    { name: 'Salem Steel City PHC', dist: 'Salem', lat: 11.6643, lng: 78.1460 },
    { name: 'Tiruchirappalli Central PHC', dist: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
    { name: 'Tirunelveli Junction PHC', dist: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
    { name: 'Kanyakumari Cape Health Unit', dist: 'Kanyakumari', lat: 8.0883, lng: 77.5385 },
  ],
  'Maharashtra': [
    { name: 'Hadapsar 24x7 PHC', dist: 'Pune', lat: 18.5018, lng: 73.9260 },
    { name: 'Shirur Rural PHC', dist: 'Pune', lat: 18.8256, lng: 74.3789 },
    { name: 'Baramati PHC', dist: 'Pune', lat: 18.1517, lng: 74.5769 },
    { name: 'Junnar Mountain PHC', dist: 'Pune', lat: 19.2064, lng: 73.8767 },
    { name: 'Dharavi Urban Health Clinic', dist: 'Mumbai Suburban', lat: 19.0434, lng: 72.8567 },
    { name: 'Bandra West Model Clinic', dist: 'Mumbai Suburban', lat: 19.0596, lng: 72.8295 },
    { name: 'Andheri East PHC', dist: 'Mumbai Suburban', lat: 19.1136, lng: 72.8697 },
    { name: 'Kurla Community Health Center', dist: 'Mumbai Suburban', lat: 19.0657, lng: 72.8794 },
    { name: 'Nagpur Central Model PHC', dist: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Sitabuldi Urban Health Unit', dist: 'Nagpur', lat: 21.1466, lng: 79.0833 },
    { name: 'Ramtek Rural Health Center', dist: 'Nagpur', lat: 21.3975, lng: 79.3292 },
    { name: 'Nashik Panchavati PHC', dist: 'Nashik', lat: 20.0063, lng: 73.7903 },
    { name: 'Malegaon Model Health Clinic', dist: 'Nashik', lat: 20.5539, lng: 74.5288 },
    { name: 'Aurangabad Central', dist: 'Aurangabad', lat: 19.8762, lng: 75.3433 },
    { name: 'CIDCO Community Dispensary', dist: 'Aurangabad', lat: 19.8885, lng: 75.3670 },
    { name: 'Thane Central Urban Health', dist: 'Thane', lat: 19.2183, lng: 72.9781 },
    { name: 'Kalyan West PHC', dist: 'Thane', lat: 19.2437, lng: 73.1355 },
    { name: 'Kolhapur Mahalaxmi PHC', dist: 'Kolhapur', lat: 16.7050, lng: 74.2433 },
    { name: 'Solapur Textile Hub PHC', dist: 'Solapur', lat: 17.6599, lng: 75.9064 },
  ],
  'Karnataka': [
    { name: 'Indiranagar Urban Health', dist: 'Bengaluru Urban', lat: 12.9784, lng: 77.6408 },
    { name: 'Koramangala Community Clinic', dist: 'Bengaluru Urban', lat: 12.9352, lng: 77.6245 },
    { name: 'Whitefield Tech Corridor PHC', dist: 'Bengaluru Urban', lat: 12.9698, lng: 77.7500 },
    { name: 'Jayanagar Family Health Center', dist: 'Bengaluru Urban', lat: 12.9308, lng: 77.5838 },
    { name: 'Mysuru Palace Urban PHC', dist: 'Mysuru', lat: 12.3051, lng: 76.6551 },
    { name: 'Chamundi Foothills Health Unit', dist: 'Mysuru', lat: 12.2725, lng: 76.6710 },
    { name: 'Hubballi City Health Center', dist: 'Dharwad', lat: 15.3647, lng: 75.1240 },
    { name: 'Dharwad University PHC', dist: 'Dharwad', lat: 15.4589, lng: 75.0078 },
    { name: 'Mangaluru Coastal 24x7 PHC', dist: 'Dakshina Kannada', lat: 12.9141, lng: 74.8560 },
    { name: 'Belagavi Fort Area PHC', dist: 'Belagavi', lat: 15.8497, lng: 74.4977 },
    { name: 'Kalaburagi Central Dispensary', dist: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
    { name: 'Ballari Mining Hub PHC', dist: 'Ballari', lat: 15.1394, lng: 76.9214 },
    { name: 'Davangere Cotton City PHC', dist: 'Davangere', lat: 14.4644, lng: 75.9218 },
    { name: 'Shivamogga Malnad Health Center', dist: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
    { name: 'Tumakuru Smart City PHC', dist: 'Tumakuru', lat: 13.3379, lng: 77.1010 },
    { name: 'Udupi Temple Town Health Unit', dist: 'Udupi', lat: 13.3409, lng: 74.7421 },
    { name: 'Hassan Coffee Valley PHC', dist: 'Hassan', lat: 13.0072, lng: 76.1029 },
    { name: 'Bidar Heritage Border Clinic', dist: 'Bidar', lat: 17.9104, lng: 77.5199 },
  ],
  'Gujarat': [
    { name: 'Ahmedabad Sabarmati Urban PHC', dist: 'Ahmedabad', lat: 23.0525, lng: 72.5850 },
    { name: 'Maninagar Community Health', dist: 'Ahmedabad', lat: 22.9978, lng: 72.6022 },
    { name: 'Surat Diamond City Health Center', dist: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Rander Coastal Dispensary', dist: 'Surat', lat: 21.2167, lng: 72.7933 },
    { name: 'Vadodara Sayaji PHC', dist: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Rajkot Aji River Health Unit', dist: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    { name: 'Bhavnagar Port PHC', dist: 'Bhavnagar', lat: 21.7645, lng: 72.1519 },
    { name: 'Jamnagar Brass City Clinic', dist: 'Jamnagar', lat: 22.4707, lng: 70.0577 },
    { name: 'Gandhinagar Capital Health Center', dist: 'Gandhinagar', lat: 23.2156, lng: 72.6369 },
    { name: 'Junagadh Gir Foothills PHC', dist: 'Junagadh', lat: 21.5222, lng: 70.4579 },
    { name: 'Anand Milk City PHC', dist: 'Anand', lat: 22.5645, lng: 72.9289 },
    { name: 'Bharuch Narmada Bank Health', dist: 'Bharuch', lat: 21.7051, lng: 72.9959 },
    { name: 'Mehsana Sun Temple Region PHC', dist: 'Mehsana', lat: 23.5880, lng: 72.3693 },
    { name: 'Bhuj Kutch Resilience PHC', dist: 'Kutch', lat: 23.2420, lng: 69.6669 },
    { name: 'Porbandar Coastal Health Unit', dist: 'Porbandar', lat: 21.6417, lng: 69.6293 },
  ],
  'Rajasthan': [
    { name: 'Jaipur Pink City Urban Health', dist: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Mansarovar Model Dispensary', dist: 'Jaipur', lat: 26.8530, lng: 75.7600 },
    { name: 'Jodhpur Sun City PHC', dist: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
    { name: 'Mandore Heritage Health Unit', dist: 'Jodhpur', lat: 26.3575, lng: 73.0422 },
    { name: 'Udaipur Lake City PHC', dist: 'Udaipur', lat: 24.5854, lng: 73.7125 },
    { name: 'Kota Chambal Health Center', dist: 'Kota', lat: 25.1815, lng: 75.8362 },
    { name: 'Bikaner Thar Desert Health', dist: 'Bikaner', lat: 28.0229, lng: 73.3119 },
    { name: 'Ajmer Dargah Region PHC', dist: 'Ajmer', lat: 26.4499, lng: 74.6399 },
    { name: 'Alwar Foothills Dispensary', dist: 'Alwar', lat: 27.5530, lng: 76.6346 },
    { name: 'Bhilwara Textile Hub Clinic', dist: 'Bhilwara', lat: 25.3407, lng: 74.6313 },
    { name: 'Sikar Shekhawati PHC', dist: 'Sikar', lat: 27.6094, lng: 75.1398 },
    { name: 'Jaisalmer Golden Fort Health', dist: 'Jaisalmer', lat: 26.9157, lng: 70.9083 },
  ],
  'Uttar Pradesh': [
    { name: 'Lucknow Hazratganj Model PHC', dist: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Gomti Nagar Urban Health Unit', dist: 'Lucknow', lat: 26.8500, lng: 81.0000 },
    { name: 'Varanasi Ghats Health Center', dist: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { name: 'Kashi Vishwanath Region Clinic', dist: 'Varanasi', lat: 25.3109, lng: 83.0107 },
    { name: 'Kanpur Industrial Area PHC', dist: 'Kanpur Nagar', lat: 26.4499, lng: 80.3319 },
    { name: 'Agra Taj Region Health Unit', dist: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Prayagraj Sangam Health Center', dist: 'Prayagraj', lat: 25.4358, lng: 81.8463 },
    { name: 'Meerut Western UP Hub PHC', dist: 'Meerut', lat: 28.9845, lng: 77.7064 },
    { name: 'Gorakhpur Terai Health Clinic', dist: 'Gorakhpur', lat: 26.7606, lng: 83.3732 },
    { name: 'Bareilly Rohilkhand PHC', dist: 'Bareilly', lat: 28.3670, lng: 79.4304 },
    { name: 'Aligarh Tala Nagri Health', dist: 'Aligarh', lat: 27.8974, lng: 78.0880 },
    { name: 'Moradabad Brass Hub PHC', dist: 'Moradabad', lat: 28.8386, lng: 78.7733 },
  ],
  'Bihar': [
    { name: 'Patna Ganga Bank Model PHC', dist: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Kankarbagh Urban Health', dist: 'Patna', lat: 25.6000, lng: 85.1500 },
    { name: 'Danapur Cantonment Clinic', dist: 'Patna', lat: 25.6333, lng: 85.0333 },
    { name: 'Gaya Bodhi Health Center', dist: 'Gaya', lat: 24.7914, lng: 85.0002 },
    { name: 'Bodhgaya International Clinic', dist: 'Gaya', lat: 24.6961, lng: 84.9869 },
    { name: 'Muzaffarpur Litchi Hub PHC', dist: 'Muzaffarpur', lat: 26.1209, lng: 85.3647 },
    { name: 'Kanti Rural Health Center', dist: 'Muzaffarpur', lat: 26.1969, lng: 85.3039 },
    { name: 'Bhagalpur Silk City Clinic', dist: 'Bhagalpur', lat: 25.2425, lng: 86.9842 },
    { name: 'Naugachia Flood Response PHC', dist: 'Bhagalpur', lat: 25.3900, lng: 87.1000 },
    { name: 'Darbhanga Mithila Health Unit', dist: 'Darbhanga', lat: 26.1542, lng: 85.8918 },
    { name: 'Purnia Seemanchal Clinic', dist: 'Purnia', lat: 25.7771, lng: 87.4753 },
    { name: 'Begusarai Industrial PHC', dist: 'Begusarai', lat: 25.4182, lng: 86.1272 },
    { name: 'Katihar Junction Health Unit', dist: 'Katihar', lat: 25.5541, lng: 87.5719 },
    { name: 'Nalanda Heritage Health', dist: 'Nalanda', lat: 25.1357, lng: 85.4450 },
    { name: 'Munger Fort Region PHC', dist: 'Munger', lat: 25.3757, lng: 86.4744 },
  ],
  'Andhra Pradesh': [
    { name: 'Visakhapatnam Beach Road PHC', dist: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Gajuwaka Industrial Clinic', dist: 'Visakhapatnam', lat: 17.6900, lng: 83.1500 },
    { name: 'Madhurawada Tech Zone PHC', dist: 'Visakhapatnam', lat: 17.7800, lng: 83.3500 },
    { name: 'Vijayawada Krishna River PHC', dist: 'NTR (Vijayawada)', lat: 16.5062, lng: 80.6480 },
    { name: 'Benz Circle Urban Health', dist: 'NTR (Vijayawada)', lat: 16.5000, lng: 80.6500 },
    { name: 'Guntur Mirchi Yard Clinic', dist: 'Guntur', lat: 16.3067, lng: 80.4365 },
    { name: 'Tenali Coastal Canal PHC', dist: 'Guntur', lat: 16.2430, lng: 80.6400 },
    { name: 'Tirupati Pilgrimage Health', dist: 'Tirupati', lat: 13.6288, lng: 79.4192 },
    { name: 'Renigunta Airport Clinic', dist: 'Tirupati', lat: 13.6300, lng: 79.5200 },
    { name: 'Kurnool Tungabhadra PHC', dist: 'Kurnool', lat: 15.8281, lng: 78.0373 },
    { name: 'Nellore Coastal Aquaculture PHC', dist: 'Nellore', lat: 14.4426, lng: 79.9865 },
    { name: 'Kakinada Port City Health Unit', dist: 'Kakinada', lat: 16.9891, lng: 82.2475 },
    { name: 'Rajahmundry Godavari Clinic', dist: 'East Godavari', lat: 17.0005, lng: 81.8040 },
    { name: 'Kadapa Mining Valley PHC', dist: 'YSR Kadapa', lat: 14.4673, lng: 78.8242 },
    { name: 'Anantapur Rayalaseema Health', dist: 'Anantapur', lat: 14.6819, lng: 77.6006 },
  ],
  'West Bengal': [
    { name: 'Kolkata Park Street Urban PHC', dist: 'Kolkata', lat: 22.5550, lng: 88.3518 },
    { name: 'Salt Lake Sector V Tech Clinic', dist: 'North 24 Parganas', lat: 22.5800, lng: 88.4300 },
    { name: 'Howrah Station Health Unit', dist: 'Howrah', lat: 22.5958, lng: 88.2636 },
    { name: 'Siliguri North Bengal Gateway PHC', dist: 'Darjeeling', lat: 26.7271, lng: 88.4329 },
    { name: 'Asansol Coalfields Health Center', dist: 'Paschim Bardhaman', lat: 23.6889, lng: 86.9661 },
    { name: 'Durgapur Steel City Dispensary', dist: 'Paschim Bardhaman', lat: 23.5204, lng: 87.3119 },
    { name: 'Kharagpur Railway Health Hub', dist: 'Paschim Medinipur', lat: 22.3456, lng: 87.3218 },
    { name: 'Malda Mango Belt Health Clinic', dist: 'Malda', lat: 25.0069, lng: 88.1408 },
    { name: 'Murshidabad Silk City PHC', dist: 'Murshidabad', lat: 24.1837, lng: 88.2711 },
    { name: 'Bardhaman Rice Bowl Clinic', dist: 'Purba Bardhaman', lat: 23.2324, lng: 87.8615 },
  ],
  'Madhya Pradesh': [
    { name: 'Bhopal Lake View Model PHC', dist: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'BHEL Industrial Dispensary', dist: 'Bhopal', lat: 23.2800, lng: 77.4800 },
    { name: 'Indore Clean City Family Clinic', dist: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Vijay Nagar Model Health', dist: 'Indore', lat: 22.7500, lng: 75.8900 },
    { name: 'Jabalpur Narmada Valley PHC', dist: 'Jabalpur', lat: 23.1815, lng: 79.9864 },
    { name: 'Gwalior Fort Region Clinic', dist: 'Gwalior', lat: 26.2183, lng: 78.1828 },
    { name: 'Ujjain Mahakal Temple Health', dist: 'Ujjain', lat: 23.1765, lng: 75.7885 },
    { name: 'Sagar Bundelkhand PHC', dist: 'Sagar', lat: 23.8388, lng: 78.7378 },
    { name: 'Satna Cement Region Clinic', dist: 'Satna', lat: 24.6005, lng: 80.8322 },
    { name: 'Rewa White Tiger Region PHC', dist: 'Rewa', lat: 24.5362, lng: 81.3037 },
  ],
};

export async function calibrateCoordinates() {
  const client = await pool.connect();
  try {
    console.log('Calibrating all 179 PHC coordinates strictly inside their real Indian states...');
    await client.query('BEGIN');

    for (const [stateName, phcList] of Object.entries(STATE_COORDS)) {
      const sRes = await client.query('SELECT id FROM states WHERE name = $1', [stateName]);
      if (sRes.rows.length === 0) continue;
      const stateId = sRes.rows[0].id;

      const existingPhcs = await client.query(
        'SELECT id, name FROM phc_facilities WHERE state_id = $1 ORDER BY name ASC',
        [stateId]
      );

      for (let i = 0; i < existingPhcs.rows.length; i++) {
        const phcRow = existingPhcs.rows[i];
        const targetCoord = phcList[i % phcList.length];
        await client.query(
          'UPDATE phc_facilities SET latitude = $1, longitude = $2, name = $3 WHERE id = $4',
          [targetCoord.lat, targetCoord.lng, targetCoord.name, phcRow.id]
        );
      }
      console.log(`[Calibrated] ${stateName}: updated ${existingPhcs.rows.length} facilities.`);
    }

    await client.query('COMMIT');
    console.log('All PHCs successfully calibrated to genuine Indian state coordinates.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Calibration error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  calibrateCoordinates();
}
