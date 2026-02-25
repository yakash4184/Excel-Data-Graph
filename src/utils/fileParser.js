import { REQUIRED_COLUMNS } from '../constants/columns';

const NUMERIC_FIELDS = ['Population', 'Cases', 'Vaccinated', 'Latitude', 'Longitude'];

const normalizeHeader = (value) => String(value ?? '').trim();

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '')
    .replace(/,/g, '')
    .trim();
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
    normalizedHeaders,
  };
};

export const parseUploadedFile = async (file) => {
  if (!file) {
    throw new Error('Please select a file.');
  }

  const fileName = file.name.toLowerCase();
  const isSupported = fileName.endsWith('.xlsx') || fileName.endsWith('.csv');
  if (!isSupported) {
    throw new Error('Unsupported file type. Please upload a .xlsx or .csv file.');
  }

  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
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
    throw new Error('Header row is missing. Add required columns and try again.');
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
    return [];
  }

  const invalidRows = [];
  const rows = rawRows.map((row, index) => {
    const clean = {};
    REQUIRED_COLUMNS.forEach((col) => {
      clean[col] = row[col];
    });

    clean.State = String(clean.State ?? '').trim();
    clean.District = String(clean.District ?? '').trim();

    NUMERIC_FIELDS.forEach((field) => {
      clean[field] = parseNumber(clean[field]);
    });

    const rowIndex = index + 2;
    if (!clean.State || !clean.District) {
      invalidRows.push(`${rowIndex}: State/District required`);
    }
    if (!Number.isFinite(clean.Latitude) || !Number.isFinite(clean.Longitude)) {
      invalidRows.push(`${rowIndex}: Latitude/Longitude must be numeric`);
    }
    if (!Number.isFinite(clean.Cases) || !Number.isFinite(clean.Population) || !Number.isFinite(clean.Vaccinated)) {
      invalidRows.push(`${rowIndex}: Population/Cases/Vaccinated must be numeric`);
    }

    return clean;
  });

  if (invalidRows.length) {
    throw new Error(`Data validation failed. Invalid rows: ${invalidRows.slice(0, 8).join(' | ')}`);
  }

  return rows;
};
