export function convertToIndex(cell: { row: number, column: number }, stride: number) {
  return cell.row * stride + cell.column;
}

export function convertFromIndex(index: number, stride: number): { row: number, column: number } {
  return {
    row: Math.floor(index / stride),
    column: index % stride
  };
}
