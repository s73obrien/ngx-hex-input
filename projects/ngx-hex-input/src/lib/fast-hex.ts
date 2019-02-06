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

export function fastHex(value: number): string {
    // tslint:disable-next-line:no-bitwise
    return  lookup[(value >> 4) & 0x0F] + lookup[value & 0x0F];
}
