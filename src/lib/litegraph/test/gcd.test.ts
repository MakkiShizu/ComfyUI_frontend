import { expect, describe, it } from 'vitest'

// Copy the GCD function from CanvasPointer for testing
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

describe('GCD Calculation', () => {
  it('should calculate GCD correctly', () => {
    expect(gcd(10, 20)).toBe(10)
    expect(gcd(10, 10)).toBe(10)
    expect(gcd(20, 40)).toBe(20)
    expect(gcd(10, 40)).toBe(10)
    
    // Test with multiple values like in our case
    let result = 10
    result = gcd(result, 20)
    expect(result).toBe(10)
    result = gcd(result, 10)
    expect(result).toBe(10)
    result = gcd(result, 40)
    expect(result).toBe(10)
    
    console.log('GCD of [10,20,10,40] is', result)
  })
})