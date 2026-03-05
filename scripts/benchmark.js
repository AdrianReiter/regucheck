const STANDARDS = [
  { id: 'fda', name: 'FDA 510(k)' },
  { id: 'iso13485', name: 'ISO 13485' },
  { id: 'iec62304', name: 'IEC 62304' }
];

const STANDARDS_MAP = STANDARDS.reduce((acc, curr) => {
  acc[curr.id] = curr;
  return acc;
}, {});

const iterations = 10000000;

console.time('Array.find');
for (let i = 0; i < iterations; i++) {
  const name = STANDARDS.find(s => s.id === 'iec62304')?.name;
}
console.timeEnd('Array.find');

console.time('Record lookup');
for (let i = 0; i < iterations; i++) {
  const name = STANDARDS_MAP['iec62304']?.name;
}
console.timeEnd('Record lookup');
