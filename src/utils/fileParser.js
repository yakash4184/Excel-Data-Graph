import { OPTIONAL_METRIC_COLUMNS, REQUIRED_COLUMNS } from '../constants/columns';

const COLUMN = {
  state: 'State Name',
  district: 'District Name',
  distributors: 'Distributor Count',
  salesFY: 'Sum of 2024-25',
  salesCurrent: 'Sum of 24th feb.26',
  retailers: 'Retailer Count',
};

const normalizeHeader = (value) => String(value ?? '').trim();

const parseAsNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;

  const cleaned = String(value).replace(/,/g, '').trim();
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseKnownMetric = (value) => {
  const parsed = parseAsNumber(value);
  if (parsed === null) return 0;
  return parsed;
};

const parseCell = (value) => {
  const parsed = parseAsNumber(value);
  if (parsed === null) {
    return typeof value === 'string' ? value.trim() : value ?? '';
  }
  if (Number.isNaN(parsed)) {
    return typeof value === 'string' ? value.trim() : value;
  }
  return parsed;
};

export const validateHeaders = (headerRow) => {
  const normalizedHeaders = headerRow.map(normalizeHeader).filter(Boolean);
  const missing = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));

  return {
    isValid: missing.length === 0,
    missing,
    normalizedHeaders,
  };
};

const parseWorkbookBuffer = async (arrayBuffer) => {
  const XLSX = await import('xlsx');

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No worksheet found in uploaded file.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const [headerRow = []] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  if (!headerRow.length) {
    throw new Error('Header row is missing.');
  }

  const headerValidation = validateHeaders(headerRow);
  if (!headerValidation.isValid) {
    throw new Error(`Missing required columns: ${headerValidation.missing.join(', ')}`);
  }

  const headers = headerValidation.normalizedHeaders;
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  if (!rawRows.length) {
    return {
      rows: [],
      nullRows: [],
      headers,
      numericColumns: [],
      availableMetrics: {
        hasDistributor: headers.includes(COLUMN.distributors),
        hasRetailer: headers.includes(COLUMN.retailers),
        hasSalesFY: headers.includes(COLUMN.salesFY),
        hasSalesCurrent: headers.includes(COLUMN.salesCurrent),
      },
    };
  }

  const nullRows = [];
  const numericColumns = new Set();
  let lastState = '';

  const rows = rawRows.reduce((acc, row, index) => {
    const rowNumber = index + 2;
    const rowData = {};

    headers.forEach((header) => {
      let value = row[header];

      if (header === COLUMN.state) {
        const candidate = String(value ?? '').trim();
        value = candidate || lastState;
      }

      if (header === COLUMN.district) {
        value = String(value ?? '').trim();
      }

      const parsedValue = parseCell(value);
      rowData[header] = parsedValue;

      if (typeof parsedValue === 'number' && Number.isFinite(parsedValue)) {
        numericColumns.add(header);
      }
    });

    const state = String(rowData[COLUMN.state] ?? '').trim();
    const district = String(rowData[COLUMN.district] ?? '').trim();

    if (state) {
      lastState = state;
      rowData[COLUMN.state] = state;
    }

    if (!district) {
      nullRows.push({
        rowNumber,
        reason: 'District Name missing',
        state: state || '(blank)',
      });
      return acc;
    }

    if (!state) {
      nullRows.push({
        rowNumber,
        reason: 'State Name missing',
        state: '(blank)',
        district,
      });
      return acc;
    }

    const distributorCount = parseKnownMetric(rowData[COLUMN.distributors]);
    const retailerCount = parseKnownMetric(rowData[COLUMN.retailers]);
    const salesFY = parseKnownMetric(rowData[COLUMN.salesFY]);
    const salesCurrent = parseKnownMetric(rowData[COLUMN.salesCurrent]);

    if (
      Number.isNaN(distributorCount) ||
      Number.isNaN(retailerCount) ||
      Number.isNaN(salesFY) ||
      Number.isNaN(salesCurrent)
    ) {
      nullRows.push({
        rowNumber,
        reason: 'Numeric metric value invalid',
        state,
        district,
      });
      return acc;
    }

    const growth = salesCurrent - salesFY;
    const growthPct = salesFY === 0 ? null : (growth / salesFY) * 100;

    acc.push({
      state,
      district,
      distributorCount,
      retailerCount,
      salesFY,
      salesCurrent,
      growth,
      growthPct,
      data: rowData,
    });

    return acc;
  }, []);

  return {
    rows,
    nullRows,
    headers,
    numericColumns: [...numericColumns],
    availableMetrics: {
      hasDistributor: headers.includes(COLUMN.distributors),
      hasRetailer: headers.includes(COLUMN.retailers),
      hasSalesFY: headers.includes(COLUMN.salesFY),
      hasSalesCurrent: headers.includes(COLUMN.salesCurrent),
      optionalMetricColumnsPresent: OPTIONAL_METRIC_COLUMNS.filter((name) => headers.includes(name)),
    },
  };
};

export const parseUploadedFile = async (file) => {
  if (!file) {
    throw new Error('Please select a file.');
  }

  const fileName = file.name.toLowerCase();
  const isSupported = fileName.endsWith('.xlsx') || fileName.endsWith('.csv');
  if (!isSupported) {
    throw new Error('Unsupported file type. Please upload .xlsx or .csv file.');
  }

  const arrayBuffer = await file.arrayBuffer();
  return parseWorkbookBuffer(arrayBuffer);
};

export const parseFromArrayBuffer = parseWorkbookBuffer;
