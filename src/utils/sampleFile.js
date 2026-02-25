import { DEFAULT_SAMPLE_COLUMNS } from '../constants/columns';

const SAMPLE_ROWS = [
  {
    'State Name': 'Chhattisgarh',
    'District Name': 'Balod',
    'Distributor Count': 5,
    'Sum of 2024-25': 17.6435712,
    'Sum of 24th feb.26': 21.1359744,
    'Retailer Count': 87,
  },
  {
    'State Name': 'Chhattisgarh',
    'District Name': 'Baloda Bazar',
    'Distributor Count': 11,
    'Sum of 2024-25': 207.2611804,
    'Sum of 24th feb.26': 194.0510144,
    'Retailer Count': 39,
  },
  {
    'State Name': 'Madhya Pradesh',
    'District Name': 'Bhopal',
    'Distributor Count': 8,
    'Sum of 2024-25': 145.527,
    'Sum of 24th feb.26': 166.302,
    'Retailer Count': 59,
  },
  {
    'State Name': 'Madhya Pradesh',
    'District Name': 'Indore',
    'Distributor Count': 12,
    'Sum of 2024-25': 240.892,
    'Sum of 24th feb.26': 278.142,
    'Retailer Count': 73,
  },
  {
    'State Name': 'Maharashtra',
    'District Name': 'Nagpur',
    'Distributor Count': 10,
    'Sum of 2024-25': 190.404,
    'Sum of 24th feb.26': 221.815,
    'Retailer Count': 65,
  },
];

export const downloadSampleWorkbook = async () => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, {
    header: DEFAULT_SAMPLE_COLUMNS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesReport');
  XLSX.writeFile(workbook, 'sample-district-sales-report.xlsx');
};
