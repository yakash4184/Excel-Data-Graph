import { REQUIRED_COLUMNS } from '../constants/columns';

const SAMPLE_ROWS = [
  {
    State: 'Maharashtra',
    District: 'Pune',
    'Client Name': 'Rahul Sharma',
    'Mobile Number': '9876543210',
    Population: 9429408,
    Cases: 15320,
    Vaccinated: 7753000,
    Latitude: 18.5204,
    Longitude: 73.8567,
  },
  {
    State: 'Maharashtra',
    District: 'Pune',
    'Client Name': 'Priya Kulkarni',
    'Mobile Number': '9823012345',
    Population: 9429408,
    Cases: 15320,
    Vaccinated: 7753000,
    Latitude: 18.5204,
    Longitude: 73.8567,
  },
  {
    State: 'Maharashtra',
    District: 'Mumbai',
    'Client Name': 'Aman Verma',
    'Mobile Number': '9811122233',
    Population: 12478447,
    Cases: 21450,
    Vaccinated: 10104000,
    Latitude: 19.076,
    Longitude: 72.8777,
  },
  {
    State: 'Maharashtra',
    District: 'Mumbai',
    'Client Name': 'Neha Singh',
    'Mobile Number': '9898989898',
    Population: 12478447,
    Cases: 21450,
    Vaccinated: 10104000,
    Latitude: 19.076,
    Longitude: 72.8777,
  },
  {
    State: 'Karnataka',
    District: 'Bengaluru Urban',
    'Client Name': 'Suresh Reddy',
    'Mobile Number': '9845011122',
    Population: 9621551,
    Cases: 17600,
    Vaccinated: 8421000,
    Latitude: 12.9716,
    Longitude: 77.5946,
  },
  {
    State: 'Karnataka',
    District: 'Mysuru',
    'Client Name': 'Kiran Gowda',
    'Mobile Number': '9900012345',
    Population: 2994744,
    Cases: 6400,
    Vaccinated: 2310000,
    Latitude: 12.2958,
    Longitude: 76.6394,
  },
  {
    State: 'Gujarat',
    District: 'Ahmedabad',
    'Client Name': 'Mehul Patel',
    'Mobile Number': '9825010101',
    Population: 7214225,
    Cases: 9800,
    Vaccinated: 6150000,
    Latitude: 23.0225,
    Longitude: 72.5714,
  },
  {
    State: 'Gujarat',
    District: 'Surat',
    'Client Name': 'Riya Desai',
    'Mobile Number': '9979004455',
    Population: 6081322,
    Cases: 8700,
    Vaccinated: 5080000,
    Latitude: 21.1702,
    Longitude: 72.8311,
  },
];

export const downloadSampleWorkbook = async () => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, {
    header: REQUIRED_COLUMNS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SampleData');
  XLSX.writeFile(workbook, 'sample-client-sales-data.xlsx');
};
