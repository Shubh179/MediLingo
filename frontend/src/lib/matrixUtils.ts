/**
 * Matrix Operations Utilities for Kalman Filter
 * Provides essential matrix operations needed for GPS tracking
 */

export type Matrix = number[][];
export type Vector = number[];

/**
 * Create a matrix filled with zeros
 */
export function zeros(rows: number, cols: number): Matrix {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

/**
 * Create an identity matrix
 */
export function identity(size: number): Matrix {
  const matrix = zeros(size, size);
  for (let i = 0; i < size; i++) {
    matrix[i][i] = 1;
  }
  return matrix;
}

/**
 * Matrix multiplication: C = A × B
 */
export function multiply(A: Matrix, B: Matrix): Matrix {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix dimensions mismatch: ${colsA} !== ${rowsB}`);
  }

  const result = zeros(rowsA, colsB);

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}

/**
 * Matrix addition: C = A + B
 */
export function add(A: Matrix, B: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0].length;

  if (rows !== B.length || cols !== B[0].length) {
    throw new Error('Matrix dimensions must match for addition');
  }

  const result = zeros(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] + B[i][j];
    }
  }

  return result;
}

/**
 * Matrix subtraction: C = A - B
 */
export function subtract(A: Matrix, B: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0].length;

  if (rows !== B.length || cols !== B[0].length) {
    throw new Error('Matrix dimensions must match for subtraction');
  }

  const result = zeros(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] - B[i][j];
    }
  }

  return result;
}

/**
 * Matrix transpose: A^T
 */
export function transpose(A: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0].length;
  const result = zeros(cols, rows);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }

  return result;
}

/**
 * Scalar multiplication: k × A
 */
export function scale(A: Matrix, scalar: number): Matrix {
  const rows = A.length;
  const cols = A[0].length;
  const result = zeros(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] * scalar;
    }
  }

  return result;
}

/**
 * Matrix inverse (Gauss-Jordan elimination)
 * Only works for square matrices
 */
export function inverse(A: Matrix): Matrix {
  const n = A.length;

  if (n !== A[0].length) {
    throw new Error('Matrix must be square for inversion');
  }

  // Create augmented matrix [A | I]
  const augmented: number[][] = A.map((row, i) => [
    ...row,
    ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
  ]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Matrix is singular and cannot be inverted');
    }

    // Scale pivot row
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }

    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }

  // Extract inverse matrix from right half
  return augmented.map(row => row.slice(n));
}

/**
 * Matrix determinant (for 2x2 and 3x3 matrices)
 */
export function determinant(A: Matrix): number {
  const n = A.length;

  if (n !== A[0].length) {
    throw new Error('Matrix must be square');
  }

  if (n === 1) {
    return A[0][0];
  }

  if (n === 2) {
    return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  }

  if (n === 3) {
    return (
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
    );
  }

  throw new Error('Determinant only implemented for 1x1, 2x2, and 3x3 matrices');
}

/**
 * Convert vector to column matrix
 */
export function vectorToMatrix(v: Vector): Matrix {
  return v.map(val => [val]);
}

/**
 * Convert column matrix to vector
 */
export function matrixToVector(m: Matrix): Vector {
  return m.map(row => row[0]);
}

/**
 * Print matrix for debugging
 */
export function printMatrix(A: Matrix, label?: string): void {
  if (label) console.log(`${label}:`);
  console.log(A.map(row => 
    row.map(val => val.toFixed(6).padStart(12)).join(' ')
  ).join('\n'));
}

/**
 * Clone a matrix
 */
export function clone(A: Matrix): Matrix {
  return A.map(row => [...row]);
}
