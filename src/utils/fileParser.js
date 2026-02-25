import { REQUIRED_COLUMNS } from '../constants/columns';

const COLUMN = {
  state: 'State Name',
  district: 'District Name',
  distributors: 'Distributor Count',
  salesFY: 'Sum of 2024-25',
  salesCurrent: 'Sum of 24th feb.26',
  retailers: 'Retailer Count',
};

const normalizeHeader = (value) => String(value ?? '').trim();

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;

  const cleaned = String(value)
    .replace(/,/g, '')
    .trim();

  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const validateHeaders = (headerRow) => {
  const normalizedHeaders = headerRow.map(normalizeHeader).filter(Boolean);

  const missing = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));
  const extra = normalizedHeaders.filter((col) => !REQUIRED_COLUMNS.includes(col));

  return {
    isValid: missing.length === 0 && extra.length === 0 && normalizedHeaders.length === REQUIRED_COLUMNS.length,
    missing,
    extra,
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
    const details = [
      headerValidation.missing.length ? `Missing: ${headerValidation.missing.join(', ')}` : '',
      headerValidation.extra.length ? `Unexpected: ${headerValidation.extra.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    throw new Error(`Column mismatch. Required columns: ${REQUIRED_COLUMNS.join(', ')}. ${details}`.trim());
  }

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  if (!rawRows.length) {
    return { rows: [], nullRows: [] };
  }

  const nullRows = [];
  let lastState = '';

  const validRows = rawRows.reduce((acc, row, index) => {
    const rowIndex = index + 2;

    const stateValue = String(row[COLUMN.state] ?? '').trim();
    if (stateValue) {
      lastState = stateValue;
    }

    const normalizedRow = {
      state: stateValue || lastState,
      district: String(row[COLUMN.district] ?? '').trim(),
      distributorCount: parseNumber(row[COLUMN.distributors]),
      salesFY: parseNumber(row[COLUMN.salesFY]),
      salesCurrent: parseNumber(row[COLUMN.salesCurrent]),
      retailerCount: parseNumber(row[COLUMN.retailers]),
    };

    const hasNumericError =
      !Number.isFinite(normalizedRow.distributorCount) ||
      !Number.isFinite(normalizedRow.salesFY) ||
      !Number.isFinite(normalizedRow.salesCurrent) ||
      !Number.isFinite(normalizedRow.retailerCount);

    if (!normalizedRow.district) {
      nullRows.push({
        rowNumber: rowIndex,
        reason: 'District Name missing',
        state: normalizedRow.state || '(blank)',
      });
      return acc;
    }

    if (!normalizedRow.state) {
      nullRows.push({
        rowNumber: rowIndex,
        reason: 'State Name missing',
        state: '(blank)',
      });
      return acc;
    }

    if (hasNumericError) {
      nullRows.push({
        rowNumber: rowIndex,
        reason: 'Numeric fields invalid',
        state: normalizedRow.state,
        district: normalizedRow.district,
      });
      return acc;
    }

    normalizedRow.growth = normalizedRow.salesCurrent - normalizedRow.salesFY;
    normalizedRow.growthPct = normalizedRow.salesFY === 0 ? null : (normalizedRow.growth / normalizedRow.salesFY) * 100;

    acc.push(normalizedRow);
    return acc;
  }, []);

  return {
    rows: validRows,
    nullRows,
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
