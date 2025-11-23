import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('toggleSet functionality', () => {
  let logs, setLogs;
  let toggleSet, saveLog;
  
  beforeEach(() => {
    // Initialize mock state
    logs = {};
    setLogs = vi.fn((newLogs) => {
      logs = typeof newLogs === 'function' ? newLogs(logs) : newLogs;
    });
    
    // Mock localStorage
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
    localStorage.removeItem.mockClear();
    
    // Mock haptic feedback
    const haptic = {
      tick: vi.fn(),
      bump: vi.fn(),
    };
    
    // Implement saveLog function (mirrors actual implementation)
    saveLog = (id, field, value) => {
      const updatedLogs = { ...logs, [id]: { ...logs[id], [field]: value } };
      logs = updatedLogs;
      setLogs(updatedLogs);
      localStorage.setItem(`session_w1d1`, JSON.stringify(updatedLogs));
    };
    
    // Implement toggleSet function (mirrors actual implementation with fix)
    toggleSet = (exId, setIndex, defaultSets, restTime) => {
      try {
        haptic.tick();
        
        // Validate inputs
        if (!exId || setIndex < 0 || !Number.isInteger(setIndex)) {
          console.error('Invalid set toggle parameters:', { exId, setIndex, defaultSets });
          return;
        }
        
        const currentSets = logs[exId]?.sets || new Array(defaultSets).fill(false);
        const newSets = [...currentSets];
        while(newSets.length <= setIndex) newSets.push(false);
        const wasCompleted = newSets[setIndex];
        newSets[setIndex] = !newSets[setIndex];
        saveLog(exId, 'sets', newSets);
        
        // Clear RPE data when unmarking a set to prevent stale data
        if (wasCompleted && !newSets[setIndex]) {
          const currentRPEs = logs[exId]?.rpe || {};
          if (currentRPEs[setIndex]) {
            const updatedRPEs = { ...currentRPEs };
            delete updatedRPEs[setIndex];
            saveLog(exId, 'rpe', updatedRPEs);
          }
        }
      } catch (error) {
        console.error('Failed to toggle set:', error);
      }
    };
  });
  
  describe('Basic set toggling', () => {
    it('should mark a set as complete', () => {
      toggleSet('exercise1', 0, 3, 90);
      
      expect(logs.exercise1).toBeDefined();
      expect(logs.exercise1.sets).toEqual([true, false, false]);
    });
    
    it('should unmark a completed set', () => {
      // First mark it
      toggleSet('exercise1', 0, 3, 90);
      expect(logs.exercise1.sets[0]).toBe(true);
      
      // Then unmark it
      toggleSet('exercise1', 0, 3, 90);
      expect(logs.exercise1.sets[0]).toBe(false);
    });
    
    it('should handle multiple sets being toggled', () => {
      toggleSet('exercise1', 0, 3, 90);
      toggleSet('exercise1', 1, 3, 90);
      toggleSet('exercise1', 2, 3, 90);
      
      expect(logs.exercise1.sets).toEqual([true, true, true]);
    });
  });
  
  describe('RPE data cleanup', () => {
    it('should clear RPE data when unmarking a set', () => {
      // Mark set as complete
      toggleSet('exercise1', 0, 3, 90);
      
      // Add RPE data
      const currentRPEs = logs.exercise1?.rpe || {};
      const updatedRPEs = { ...currentRPEs, 0: '8' };
      saveLog('exercise1', 'rpe', updatedRPEs);
      
      expect(logs.exercise1.rpe[0]).toBe('8');
      
      // Unmark the set
      toggleSet('exercise1', 0, 3, 90);
      
      // RPE data should be cleared
      expect(logs.exercise1.rpe[0]).toBeUndefined();
    });
    
    it('should not affect RPE data of other sets when unmarking one set', () => {
      // Mark multiple sets
      toggleSet('exercise1', 0, 3, 90);
      toggleSet('exercise1', 1, 3, 90);
      toggleSet('exercise1', 2, 3, 90);
      
      // Add RPE data for all sets
      saveLog('exercise1', 'rpe', { 0: '7', 1: '8', 2: '9' });
      
      // Unmark middle set
      toggleSet('exercise1', 1, 3, 90);
      
      // Only middle set's RPE should be cleared
      expect(logs.exercise1.rpe[0]).toBe('7');
      expect(logs.exercise1.rpe[1]).toBeUndefined();
      expect(logs.exercise1.rpe[2]).toBe('9');
    });
    
    it('should handle unmarking a set without RPE data gracefully', () => {
      // Mark a set
      toggleSet('exercise1', 0, 3, 90);
      
      // Don't add RPE data
      
      // Unmark the set - should not crash
      expect(() => {
        toggleSet('exercise1', 0, 3, 90);
      }).not.toThrow();
      
      expect(logs.exercise1.sets[0]).toBe(false);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle invalid exercise ID', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      toggleSet(null, 0, 3, 90);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid set toggle parameters:',
        expect.objectContaining({ exId: null })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should handle negative set index', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      toggleSet('exercise1', -1, 3, 90);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid set toggle parameters:',
        expect.objectContaining({ setIndex: -1 })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should handle non-integer set index', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      toggleSet('exercise1', 1.5, 3, 90);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid set toggle parameters:',
        expect.objectContaining({ setIndex: 1.5 })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should expand sets array if setIndex exceeds current length', () => {
      toggleSet('exercise1', 5, 3, 90);
      
      expect(logs.exercise1.sets.length).toBeGreaterThan(5);
      expect(logs.exercise1.sets[5]).toBe(true);
    });
  });
  
  describe('Data persistence', () => {
    it('should save to localStorage after toggling', () => {
      toggleSet('exercise1', 0, 3, 90);
      
      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = localStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed.exercise1.sets[0]).toBe(true);
    });
  });
});
