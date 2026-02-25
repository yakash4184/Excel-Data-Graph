export const INDIA_CENTER = [22.9734, 78.6569];
export const INDIA_BOUNDS = [
  [6.0, 67.0],
  [38.5, 98.5],
];

export const STATE_CENTER_MAP = {
  'andhra pradesh': { center: [15.9129, 79.74], spread: 1.7 },
  'arunachal pradesh': { center: [28.218, 94.7278], spread: 1.8 },
  assam: { center: [26.2006, 92.9376], spread: 1.6 },
  bihar: { center: [25.0961, 85.3131], spread: 1.4 },
  chhattisgarh: { center: [21.2787, 81.8661], spread: 1.7 },
  goa: { center: [15.2993, 74.124], spread: 0.45 },
  gujarat: { center: [22.2587, 71.1924], spread: 1.8 },
  haryana: { center: [29.0588, 76.0856], spread: 1.1 },
  'himachal pradesh': { center: [31.1048, 77.1734], spread: 1.1 },
  jharkhand: { center: [23.6102, 85.2799], spread: 1.3 },
  karnataka: { center: [15.3173, 75.7139], spread: 1.8 },
  kerala: { center: [10.8505, 76.2711], spread: 0.95 },
  'madhya pradesh': { center: [22.9734, 78.6569], spread: 1.9 },
  maharashtra: { center: [19.7515, 75.7139], spread: 1.9 },
  manipur: { center: [24.6637, 93.9063], spread: 0.8 },
  meghalaya: { center: [25.467, 91.3662], spread: 0.7 },
  mizoram: { center: [23.1645, 92.9376], spread: 0.75 },
  nagaland: { center: [26.1584, 94.5624], spread: 0.75 },
  odisha: { center: [20.9517, 85.0985], spread: 1.6 },
  punjab: { center: [31.1471, 75.3412], spread: 1.0 },
  rajasthan: { center: [27.0238, 74.2179], spread: 2.1 },
  sikkim: { center: [27.533, 88.5122], spread: 0.45 },
  'tamil nadu': { center: [11.1271, 78.6569], spread: 1.4 },
  telangana: { center: [18.1124, 79.0193], spread: 1.2 },
  tripura: { center: [23.9408, 91.9882], spread: 0.55 },
  'uttar pradesh': { center: [26.8467, 80.9462], spread: 2.2 },
  uttarakhand: { center: [30.0668, 79.0193], spread: 0.95 },
  'west bengal': { center: [22.9868, 87.855], spread: 1.45 },
  delhi: { center: [28.7041, 77.1025], spread: 0.35 },
  chandigarh: { center: [30.7333, 76.7794], spread: 0.25 },
  'jammu and kashmir': { center: [33.7782, 76.5762], spread: 1.4 },
  ladakh: { center: [34.1526, 77.5771], spread: 1.6 },
  lakshadweep: { center: [10.5667, 72.6417], spread: 0.35 },
  puducherry: { center: [11.9416, 79.8083], spread: 0.25 },
  'andaman and nicobar islands': { center: [11.7401, 92.6586], spread: 1.5 },
  'dadra and nagar haveli and daman and diu': { center: [20.3974, 72.8328], spread: 0.35 },
};

const STATE_ALIASES = {
  up: 'uttar pradesh',
  'u.p': 'uttar pradesh',
  'u.p.': 'uttar pradesh',
  mp: 'madhya pradesh',
  'm.p': 'madhya pradesh',
  'm.p.': 'madhya pradesh',
  tn: 'tamil nadu',
  ap: 'andhra pradesh',
  wb: 'west bengal',
  od: 'odisha',
  orissa: 'odisha',
  nct: 'delhi',
  'nct of delhi': 'delhi',
  'j&k': 'jammu and kashmir',
  'andaman & nicobar islands': 'andaman and nicobar islands',
};

export const normalizeStateName = (stateName) => {
  const cleaned = String(stateName ?? '').trim().toLowerCase();
  return STATE_ALIASES[cleaned] || cleaned;
};

export const getStateGeo = (stateName) => {
  const key = normalizeStateName(stateName);
  return STATE_CENTER_MAP[key] || { center: INDIA_CENTER, spread: 2.2 };
};
