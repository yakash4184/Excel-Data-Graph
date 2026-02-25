import { REQUIRED_COLUMNS } from '../constants/columns';

const SAMPLE_ROWS = [
  {
    State: 'Maharashtra',
    District: 'Pune',
    Population: 9429408,
    Cases: 15320,
    Vaccinated: 7753000,
    Latitude: 18.5204,
    Longitude: 73.8567,
  },
  {
    State: 'Maharashtra',
    District: 'Mumbai',
    Population: 12478447,
    Cases: 21450,
    Vaccinated: 10104000,
    Latitude: 19.076,
    Longitude: 72.8777,
  },
  {
    State: 'Karnataka',
    District: 'Bengaluru Urban',
    Population: 9621551,
    Cases: 17600,
    Vaccinated: 8421000,
    Latitude: 12.9716,
    Longitude: 77.5946,
  },
];

export const downloadSampleWorkbook = async () => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, {
    header: REQUIRED_COLUMNS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SampleData');
  XLSX.writeFile(workbook, 'sample-disease-data.xlsx');
};
