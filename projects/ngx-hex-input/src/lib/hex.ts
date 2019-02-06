const lookup = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F'
];

export function hex(value: number, fieldWidth: number = 2): string {
  const out = new Array(fieldWidth);
  for (let i = fieldWidth; i > 0; i--) {
    if (value) {
      // tslint:disable-next-line:no-bitwise
      out[i] = lookup[value & 0x0F];
      // tslint:disable-next-line:no-bitwise
      value >>= 4;
    } else {
      out[i] = '0';
    }
  }

  return out.join('');
}

