/**
 * Program Data Module
 *
 * Contains workout program structure and helper functions.
 */

import { getCompleteSchedule } from '../utils/schedule';

/**
 * Program block definition
 */
export interface ProgramBlock {
  id: number;
  name: string;
  weeks: number[];
}

/**
 * Exercise in a workout section
 */
export interface WorkoutExercise {
  name: string;
  prescription: string;
  notes: string;
  sets: number;
  rest: number;
  isBodyweight: boolean;
}

/**
 * Section of a workout (e.g., Warm Up, Main Work)
 */
export interface WorkoutSection {
  type: 'prep' | 'skill' | 'main' | 'access' | 'cool';
  name: string;
  exercises: WorkoutExercise[];
}

/**
 * Complete workout for a day
 */
export interface DayWorkout {
  title: string;
  sections: WorkoutSection[];
}

/**
 * Program blocks (training phases)
 */
export const PROGRAM_BLOCKS: ProgramBlock[] = [
  { id: 1, name: 'Foundation', weeks: [1, 2, 3, 4] },
  { id: 2, name: 'Intensification', weeks: [5, 6, 7, 8] },
  { id: 3, name: 'Neutral Grip', weeks: [9, 10, 11, 12] },
  { id: 4, name: 'Accumulation', weeks: [13, 14, 15, 16] },
  { id: 5, name: 'Peak & Taper', weeks: [17, 18, 19, 20] },
  { id: 6, name: 'Reload', weeks: [21] },
];

/**
 * Get the block for a given week
 */
export function getBlockForWeek(week: number): ProgramBlock | undefined {
  return PROGRAM_BLOCKS.find((b) => b.weeks.includes(week));
}

/**
 * Get workout data for a specific week and day
 */
export function getWorkoutForDay(week: number, day: number): DayWorkout {
  const schedule = getCompleteSchedule();
  const dayExercises = schedule.filter((i) => i.w === week && i.d === day);

  if (dayExercises.length === 0) {
    return { title: 'Rest Day', sections: [] };
  }

  const sections: Record<string, WorkoutExercise[]> = {
    prep: [],
    skill: [],
    main: [],
    access: [],
    cool: [],
  };

  dayExercises.forEach((item) => {
    const n = (item.n || '').toLowerCase();
    let type: keyof typeof sections = 'main';
    if (n.includes('warm-up')) type = 'prep';
    else if (n.includes('cool-down')) type = 'cool';
    else if (
      item.ex.toLowerCase().includes('skill') ||
      n.includes('practice')
    )
      type = 'skill';
    else if (n.includes('accessory') || n.includes('core')) type = 'access';

    sections[type].push({
      name: item.ex,
      prescription: `${item.s} x ${item.r}`,
      notes: item.n || '',
      sets: item.s,
      rest: 90,
      isBodyweight: !n.includes('kg'),
    });
  });

  const sectionNameMap: Record<string, string> = {
    prep: 'Warm Up',
    skill: 'Skill',
    main: 'Main Work',
    access: 'Accessory',
    cool: 'Cool Down',
  };

  const finalSections: WorkoutSection[] = [];
  (Object.keys(sections) as Array<keyof typeof sections>).forEach((k) => {
    if (sections[k].length > 0) {
      finalSections.push({
        type: k as WorkoutSection['type'],
        name: sectionNameMap[k],
        exercises: sections[k],
      });
    }
  });

  return { title: `Week ${week} Day ${day}`, sections: finalSections };
}

/**
 * PROGRAM_DATA object for backward compatibility
 */
export const PROGRAM_DATA = {
  blocks: PROGRAM_BLOCKS,
  getWorkout: getWorkoutForDay,
};
