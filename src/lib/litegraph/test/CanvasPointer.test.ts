import { expect, describe, it, beforeEach } from 'vitest'
import { CanvasPointer } from '../src/CanvasPointer'

describe('CanvasPointer', () => {
  let element: HTMLDivElement
  let pointer: CanvasPointer

  beforeEach(() => {
    element = document.createElement('div')
    pointer = new CanvasPointer(element)
    // Reset static configuration
    CanvasPointer.trackpadThreshold = 60
    CanvasPointer.detentDetectionEnabled = true
  })

  describe('isTrackpadGesture', () => {
    describe('detent detection for mouse wheels', () => {
      it('should detect mouse wheel with consistent detent of 10 (Linux high DPI)', () => {
        // Simulate Linux high DPI mouse wheel events with detent = 10
        const events = [
          { deltaY: 10, deltaX: 0, timeStamp: 100 },
          { deltaY: 20, deltaX: 0, timeStamp: 150 },
          { deltaY: 10, deltaX: 0, timeStamp: 200 },
          { deltaY: 40, deltaX: 0, timeStamp: 250 },
          { deltaY: 10, deltaX: 0, timeStamp: 300 }
        ]

        // First few events might be detected as trackpad until pattern emerges
        events.forEach((eventData, index) => {
          const event = new WheelEvent('wheel', eventData)
          const isTrackpad = pointer.isTrackpadGesture(event)
          
          // After 3 events, detent pattern should be detected
          if (index >= 2) {
            expect(isTrackpad).toBe(false) // Should be detected as mouse wheel
            expect(pointer.detectedDetent).toBe(10)
          }
        })
      })

      it('should detect mouse wheel with consistent detent of 120 (traditional)', () => {
        // Traditional mouse wheel with detent = 120
        const events = [
          { deltaY: 120, deltaX: 0, timeStamp: 100 },
          { deltaY: -120, deltaX: 0, timeStamp: 200 },
          { deltaY: 240, deltaX: 0, timeStamp: 300 },
          { deltaY: 120, deltaX: 0, timeStamp: 400 }
        ]

        events.forEach((eventData) => {
          const event = new WheelEvent('wheel', eventData)
          const isTrackpad = pointer.isTrackpadGesture(event)
          
          // These values exceed threshold (60), so would be mouse wheel anyway
          expect(isTrackpad).toBe(false)
        })
      })

      it('should not detect detent for values below minimum threshold', () => {
        // Very small values that have GCD < 5
        const events = [
          { deltaY: 3, deltaX: 0, timeStamp: 100 },
          { deltaY: 6, deltaX: 0, timeStamp: 150 },
          { deltaY: 3, deltaX: 0, timeStamp: 200 },
          { deltaY: 9, deltaX: 0, timeStamp: 250 }
        ]

        events.forEach((eventData) => {
          const event = new WheelEvent('wheel', eventData)
          const isTrackpad = pointer.isTrackpadGesture(event)
          
          // Should be detected as trackpad (small values, no valid detent)
          expect(isTrackpad).toBe(true)
        })
        
        // GCD would be 3, which is below minDetentValue of 5
        expect(pointer.detectedDetent).toBeNull()
      })
    })

    describe('trackpad detection', () => {
      it('should detect trackpad with smooth scrolling values', () => {
        // Trackpad with smooth, non-detent values
        const events = [
          { deltaY: 2.5, deltaX: 0, timeStamp: 100 },
          { deltaY: 5.75, deltaX: 0.25, timeStamp: 110 },
          { deltaY: 8.333, deltaX: 0, timeStamp: 120 },
          { deltaY: 3.14159, deltaX: 0, timeStamp: 130 }
        ]

        events.forEach((eventData) => {
          const event = new WheelEvent('wheel', eventData)
          const isTrackpad = pointer.isTrackpadGesture(event)
          
          // Should be detected as trackpad (fractional values)
          expect(isTrackpad).toBe(true)
        })
      })

      it('should detect trackpad with horizontal scrolling', () => {
        const event = new WheelEvent('wheel', {
          deltaY: 5,
          deltaX: 10, // Non-zero deltaX suggests 2D scrolling
          timeStamp: 100
        })

        expect(pointer.isTrackpadGesture(event)).toBe(true)
      })

      it('should detect trackpad continuation within time gap', () => {
        const event1 = new WheelEvent('wheel', {
          deltaY: 5,
          deltaX: 0,
          timeStamp: 100
        })
        
        const event2 = new WheelEvent('wheel', {
          deltaY: 100, // Large value, but within continuation window
          deltaX: 0,
          timeStamp: 150 // Within trackpadMaxGap (200ms)
        })

        pointer.isTrackpadGesture(event1)
        expect(pointer.isTrackpadGesture(event2)).toBe(true) // Continuation
      })

      it('should not continue trackpad after time gap', () => {
        const event1 = new WheelEvent('wheel', {
          deltaY: 5,
          deltaX: 0,
          timeStamp: 100
        })
        
        const event2 = new WheelEvent('wheel', {
          deltaY: 100,
          deltaX: 0,
          timeStamp: 350 // Beyond trackpadMaxGap (200ms)
        })

        pointer.isTrackpadGesture(event1)
        expect(pointer.isTrackpadGesture(event2)).toBe(false) // Not continuation
      })
    })

    describe('bug fix: lastTrackpadEvent saving', () => {
      it('should save lastTrackpadEvent on initial detection', () => {
        const event = new WheelEvent('wheel', {
          deltaY: 5,
          deltaX: 0,
          timeStamp: 100
        })

        expect(pointer.lastTrackpadEvent).toBeUndefined()
        pointer.isTrackpadGesture(event)
        expect(pointer.lastTrackpadEvent).toBe(event)
      })

      it('should update lastTrackpadEvent on continuation', () => {
        const event1 = new WheelEvent('wheel', {
          deltaY: 5,
          deltaX: 0,
          timeStamp: 100
        })
        
        const event2 = new WheelEvent('wheel', {
          deltaY: 8,
          deltaX: 0,
          timeStamp: 150
        })

        pointer.isTrackpadGesture(event1)
        pointer.isTrackpadGesture(event2)
        expect(pointer.lastTrackpadEvent).toBe(event2)
      })
    })

    describe('additional heuristics', () => {
      it('should detect trackpad with non-integer deltaY', () => {
        const event = new WheelEvent('wheel', {
          deltaY: 5.5, // Non-integer value
          deltaX: 0,
          timeStamp: 100
        })

        expect(pointer.isTrackpadGesture(event)).toBe(true)
      })

      it('should detect trackpad with very small pixel mode values', () => {
        const event = new WheelEvent('wheel', {
          deltaY: 3,
          deltaX: 0,
          deltaMode: 0, // DOM_DELTA_PIXEL
          timeStamp: 100
        })

        expect(pointer.isTrackpadGesture(event)).toBe(true)
      })
    })

    describe('configuration', () => {
      it('should respect detentDetectionEnabled flag', () => {
        CanvasPointer.detentDetectionEnabled = false

        // Events that would normally trigger detent detection
        const events = [
          { deltaY: 10, deltaX: 0, timeStamp: 100 },
          { deltaY: 20, deltaX: 0, timeStamp: 150 },
          { deltaY: 10, deltaX: 0, timeStamp: 200 },
          { deltaY: 30, deltaX: 0, timeStamp: 250 }
        ]

        events.forEach((eventData) => {
          const event = new WheelEvent('wheel', eventData)
          pointer.isTrackpadGesture(event)
        })

        // Detent should not be detected when disabled
        expect(pointer.detectedDetent).toBeNull()
      })

      it('should respect trackpadThreshold configuration', () => {
        CanvasPointer.trackpadThreshold = 30

        const event = new WheelEvent('wheel', {
          deltaY: 40, // Above new threshold
          deltaX: 0,
          timeStamp: 100
        })

        expect(pointer.isTrackpadGesture(event)).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle zero deltaY values', () => {
        const event = new WheelEvent('wheel', {
          deltaY: 0,
          deltaX: 0,
          timeStamp: 100
        })

        expect(pointer.isTrackpadGesture(event)).toBe(true)
      })

      it('should handle negative deltaY values in detent detection', () => {
        const events = [
          { deltaY: -10, deltaX: 0, timeStamp: 100 },
          { deltaY: 20, deltaX: 0, timeStamp: 150 },
          { deltaY: -30, deltaX: 0, timeStamp: 200 },
          { deltaY: 10, deltaX: 0, timeStamp: 250 }
        ]

        events.forEach((eventData, index) => {
          const event = new WheelEvent('wheel', eventData)
          pointer.isTrackpadGesture(event)
          
          if (index >= 2) {
            // Should detect detent of 10 despite mixed signs
            expect(pointer.detectedDetent).toBe(10)
          }
        })
      })

      it('should clear old events from buffer', () => {
        // Add old event
        const oldEvent = new WheelEvent('wheel', {
          deltaY: 10,
          deltaX: 0,
          timeStamp: 100
        })
        pointer.isTrackpadGesture(oldEvent)

        // Add new event after 600ms (beyond 500ms window)
        const newEvent = new WheelEvent('wheel', {
          deltaY: 20,
          deltaX: 0,
          timeStamp: 700
        })
        pointer.isTrackpadGesture(newEvent)

        // Buffer should only contain the new event
        expect(pointer.recentWheelDeltas.length).toBe(1)
      })
    })
  })
})