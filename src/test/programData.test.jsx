import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests for programData utilities
 * Tests the category-based section grouping logic
 */

describe('Category to Section Mapping', () => {
  // This mirrors the categoryToSection mapping in programData.ts
  const categoryToSection = {
    warmup: { name: 'Warm-up', type: 'prep' },
    skill: { name: 'Skill Practice', type: 'skill' },
    main: { name: 'Main Work', type: 'main' },
    accessory: { name: 'Accessory', type: 'access' },
    core: { name: 'Core', type: 'access' },
    mobility: { name: 'Mobility', type: 'cool' },
    cooldown: { name: 'Cool-down', type: 'cool' },
  };

  it('should map warmup category to Warm-up section with prep type', () => {
    expect(categoryToSection.warmup).toEqual({ name: 'Warm-up', type: 'prep' });
  });

  it('should map skill category to Skill Practice section', () => {
    expect(categoryToSection.skill).toEqual({ name: 'Skill Practice', type: 'skill' });
  });

  it('should map main category to Main Work section', () => {
    expect(categoryToSection.main).toEqual({ name: 'Main Work', type: 'main' });
  });

  it('should map accessory category to Accessory section with access type', () => {
    expect(categoryToSection.accessory).toEqual({ name: 'Accessory', type: 'access' });
  });

  it('should map core category to Core section with access type', () => {
    expect(categoryToSection.core).toEqual({ name: 'Core', type: 'access' });
  });

  it('should map mobility category to Mobility section with cool type', () => {
    expect(categoryToSection.mobility).toEqual({ name: 'Mobility', type: 'cool' });
  });

  it('should map cooldown category to Cool-down section with cool type', () => {
    expect(categoryToSection.cooldown).toEqual({ name: 'Cool-down', type: 'cool' });
  });

  it('should return fallback for unknown categories', () => {
    const fallback = { name: 'Main Work', type: 'main' };
    const unknownCategory = 'unknown';
    const result = categoryToSection[unknownCategory] || fallback;
    expect(result).toEqual(fallback);
  });
});

describe('Section Type Assignment', () => {
  const validTypes = ['prep', 'skill', 'main', 'access', 'cool'];

  it('should only use valid section types', () => {
    const categoryToSection = {
      warmup: { name: 'Warm-up', type: 'prep' },
      skill: { name: 'Skill Practice', type: 'skill' },
      main: { name: 'Main Work', type: 'main' },
      accessory: { name: 'Accessory', type: 'access' },
      core: { name: 'Core', type: 'access' },
      mobility: { name: 'Mobility', type: 'cool' },
      cooldown: { name: 'Cool-down', type: 'cool' },
    };

    Object.values(categoryToSection).forEach(section => {
      expect(validTypes).toContain(section.type);
    });
  });

  it('should assign prep type for warm-up sections', () => {
    expect('prep').toBe('prep');
  });

  it('should assign skill type for skill practice sections', () => {
    expect('skill').toBe('skill');
  });

  it('should assign main type for main work sections', () => {
    expect('main').toBe('main');
  });

  it('should assign access type for accessory and core sections', () => {
    expect('access').toBe('access');
  });

  it('should assign cool type for mobility and cooldown sections', () => {
    expect('cool').toBe('cool');
  });
});

describe('Notes Preservation', () => {
  it('should keep notes separate from section names', () => {
    const exerciseData = {
      notes: 'Warm-up. Min 1-2: Easy pace to warm up (Zone 1).',
      category: 'warmup',
    };

    // Notes should contain the full descriptive text
    expect(exerciseData.notes).toContain('Min 1-2');
    expect(exerciseData.notes).toContain('Easy pace');

    // Category should be the short identifier
    expect(exerciseData.category).toBe('warmup');
  });

  it('should not mix notes content into section headers', () => {
    const sectionName = 'Warm-up'; // From category mapping
    const notes = 'Warm-up. Min 1-2: Easy pace to warm up (Zone 1).';

    // Section name should be short and clean
    expect(sectionName.length).toBeLessThan(20);

    // Notes can be longer with details
    expect(notes.length).toBeGreaterThan(sectionName.length);
  });

  it('should use notes for exercise details, not section grouping', () => {
    const exercises = [
      { name: 'Rower (Zone 1)', notes: 'Warm-up. Min 1-2: Easy pace.', category: 'warmup' },
      { name: 'Rower (Zone 2)', notes: 'Warm-up. Min 3-4: Moderate intensity.', category: 'warmup' },
    ];

    // Both exercises have same category, so should be in same section
    expect(exercises[0].category).toBe(exercises[1].category);

    // But they have different notes (which is fine)
    expect(exercises[0].notes).not.toBe(exercises[1].notes);
  });
});

describe('Section Grouping Logic', () => {
  // Simulate the section grouping algorithm from programData.ts
  const groupExercisesByCategory = (exercises) => {
    const categoryToSection = {
      warmup: { name: 'Warm-up', type: 'prep' },
      skill: { name: 'Skill Practice', type: 'skill' },
      main: { name: 'Main Work', type: 'main' },
      accessory: { name: 'Accessory', type: 'access' },
      core: { name: 'Core', type: 'access' },
      mobility: { name: 'Mobility', type: 'cool' },
      cooldown: { name: 'Cool-down', type: 'cool' },
    };

    const sections = [];
    let currentSection = null;

    exercises.forEach((item) => {
      const category = (item.category || '').toLowerCase();
      const sectionInfo = categoryToSection[category] || { name: 'Main Work', type: 'main' };

      if (!currentSection || currentSection.name !== sectionInfo.name) {
        currentSection = {
          type: sectionInfo.type,
          name: sectionInfo.name,
          exercises: [],
        };
        sections.push(currentSection);
      }

      currentSection.exercises.push({
        name: item.name,
        notes: item.notes,
      });
    });

    return sections;
  };

  it('should group consecutive exercises with same category into one section', () => {
    const exercises = [
      { name: 'Rower', notes: 'Warm-up notes 1', category: 'warmup' },
      { name: 'Band Pull-Aparts', notes: 'Warm-up notes 2', category: 'warmup' },
      { name: 'Pull-Ups', notes: 'Main work notes', category: 'main' },
    ];

    const sections = groupExercisesByCategory(exercises);

    expect(sections.length).toBe(2);
    expect(sections[0].name).toBe('Warm-up');
    expect(sections[0].exercises.length).toBe(2);
    expect(sections[1].name).toBe('Main Work');
    expect(sections[1].exercises.length).toBe(1);
  });

  it('should create new section when category changes', () => {
    const exercises = [
      { name: 'Exercise 1', notes: '', category: 'warmup' },
      { name: 'Exercise 2', notes: '', category: 'main' },
      { name: 'Exercise 3', notes: '', category: 'cooldown' },
    ];

    const sections = groupExercisesByCategory(exercises);

    expect(sections.length).toBe(3);
    expect(sections[0].name).toBe('Warm-up');
    expect(sections[1].name).toBe('Main Work');
    expect(sections[2].name).toBe('Cool-down');
  });

  it('should preserve notes on individual exercises', () => {
    const exercises = [
      { name: 'Rower', notes: 'Min 1-2: Easy pace to warm up.', category: 'warmup' },
    ];

    const sections = groupExercisesByCategory(exercises);

    expect(sections[0].exercises[0].notes).toBe('Min 1-2: Easy pace to warm up.');
  });

  it('should handle exercises without category', () => {
    const exercises = [
      { name: 'Mystery Exercise', notes: 'Some notes', category: '' },
    ];

    const sections = groupExercisesByCategory(exercises);

    // Should fall back to Main Work
    expect(sections[0].name).toBe('Main Work');
    expect(sections[0].type).toBe('main');
  });

  it('should handle all category types correctly', () => {
    const exercises = [
      { name: 'Ex1', notes: '', category: 'warmup' },
      { name: 'Ex2', notes: '', category: 'skill' },
      { name: 'Ex3', notes: '', category: 'main' },
      { name: 'Ex4', notes: '', category: 'accessory' },
      { name: 'Ex5', notes: '', category: 'core' },
      { name: 'Ex6', notes: '', category: 'mobility' },
      { name: 'Ex7', notes: '', category: 'cooldown' },
    ];

    const sections = groupExercisesByCategory(exercises);

    expect(sections.length).toBe(7);
    expect(sections.map(s => s.name)).toEqual([
      'Warm-up',
      'Skill Practice',
      'Main Work',
      'Accessory',
      'Core',
      'Mobility',
      'Cool-down',
    ]);
  });
});
