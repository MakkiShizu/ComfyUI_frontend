import { expect, describe, it, beforeEach } from 'vitest'
import { CanvasPointer } from '../src/CanvasPointer'

describe('CanvasPointer Debug', () => {
  let element: HTMLDivElement
  let pointer: CanvasPointer

  beforeEach(() => {
    element = document.createElement('div')
    pointer = new CanvasPointer(element)
    CanvasPointer.trackpadThreshold = 60
    CanvasPointer.detentDetectionEnabled = true
  })

  it('debug detent detection', () => {
    const events = [
      { deltaY: 10, deltaX: 0, timeStamp: 100 },
      { deltaY: 20, deltaX: 0, timeStamp: 150 },
      { deltaY: 10, deltaX: 0, timeStamp: 200 },
      { deltaY: 40, deltaX: 0, timeStamp: 250 },
      { deltaY: 10, deltaX: 0, timeStamp: 300 }
    ]

    events.forEach((eventData, index) => {
      const event = new WheelEvent('wheel', eventData)
      const isTrackpad = pointer.isTrackpadGesture(event)
      
      // Log the buffer contents
      const deltas = pointer.recentWheelDeltas.map(e => e.deltaY)
      console.log(`Event ${index}: deltaY=${eventData.deltaY}, isTrackpad=${isTrackpad}, detectedDetent=${pointer.detectedDetent}, buffer=[${deltas.join(',')}]`)
      
      // Check if we have enough events for detent detection
      if (pointer.recentWheelDeltas.length >= 3) {
        // Try to manually calculate GCD to debug
        const absDeltas = pointer.recentWheelDeltas
          .map(e => Math.abs(Math.round(e.deltaY)))
          .filter(d => d > 0)
        console.log(`  Absolute deltas for GCD: [${absDeltas.join(',')}]`)
      }
    })
  })

  it('debug time gap with manual timestamps', () => {
    // Create our own pointer to track state
    const testPointer = new CanvasPointer(element)
    
    // First event - should be detected as trackpad
    const event1 = Object.create(WheelEvent.prototype)
    event1.deltaY = 5
    event1.deltaX = 0
    event1.timeStamp = 100
    event1.deltaMode = 0
    
    const result1 = testPointer.isTrackpadGesture(event1)
    console.log(`Event 1: deltaY=5, isTrackpad=${result1}`)
    console.log(`  lastTrackpadEvent set: ${testPointer.lastTrackpadEvent !== undefined}`)
    
    // Second event - should NOT be continuation (gap > 200ms)
    const event2 = Object.create(WheelEvent.prototype)
    event2.deltaY = 100
    event2.deltaX = 0
    event2.timeStamp = 350  // 250ms gap
    event2.deltaMode = 0
    
    // Manually check if it would be a continuation
    if (testPointer.lastTrackpadEvent) {
      const gap = event2.timeStamp - testPointer.lastTrackpadEvent.timeStamp
      console.log(`  Actual gap calculation: ${gap}ms (should be 250ms)`)
      console.log(`  Would be continuation: ${gap < 200}`)
    }
    
    const result2 = testPointer.isTrackpadGesture(event2)
    console.log(`Event 2: deltaY=100, isTrackpad=${result2} (should be false)`)
  })
})