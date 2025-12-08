#!/usr/bin/env node
/**
 * Migration script: v2.3 → v2.4
 *
 * Updates:
 * 1. Updates schema reference and formatVersion to 2.4.0
 * 2. Adds flow exercise options to ex-mobility-flow
 * 3. Adds isFlow flag to the exercise template
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Flow definitions
const flowOptions = [
  {
    optionName: "Flow 1 - Squat/Lunge",
    description: "Dynamic squat and lunge sequence with push-up and downward dog transitions",
    flowMovements: [
      "Deep Squat",
      "Spiderman Lunge",
      "Downward Dog",
      "Plank",
      "Slow Push-up",
      "Upward Dog",
      "Downward Dog",
      "Deep Squat",
      "Stand"
    ]
  },
  {
    optionName: "Flow 2 - Beast to Plank",
    description: "Quadruped-based flow with beast position and spinal wave movements",
    flowMovements: [
      "Quadruped (all fours)",
      "Beast (lift knees 1 inch)",
      "Step back to Plank",
      "Pike to Downward Dog",
      "Spinal Wave to Upward Dog",
      "Push back to Plank",
      "Return to Beast",
      "Knees down"
    ]
  },
  {
    optionName: "Flow 3 - Cossack/Lunge",
    description: "Lateral movement flow with Cossack squats and rotational transitions",
    flowMovements: [
      "Wide Stance",
      "Cossack Squat (Left)",
      "Rotate to Low Lunge (Left)",
      "Hands down, step to Plank",
      "Pike to Downward Dog",
      "Step forward to Low Lunge (Right)",
      "Rotate to Cossack Squat (Right)",
      "Return to center"
    ]
  },
  {
    optionName: "Flow 4 - Spinal Wave",
    description: "Vertebra-by-vertebra spinal mobility with segmental movements",
    flowMovements: [
      "Standing",
      "Roll down (one vertebra at a time)",
      "Walk hands to Plank",
      "Segmental Cat-Cows (2-3 reps)",
      "Push to Downward Dog",
      "Spinal Waves (3-5 reps)",
      "Walk hands back to feet",
      "Roll up (one vertebra at a time)"
    ]
  },
  {
    optionName: "Flow 5 - Freestyle",
    description: "Combine movements from other flows. Focus on tight areas, move continuously, link breath.",
    flowMovements: [
      "Choose your own movements",
      "Focus on tight areas",
      "Move continuously",
      "Link your breath",
      "Explore the movements"
    ]
  },
  {
    optionName: "Flow 6 - Thoracic & Shoulder",
    description: "Upper body focused mobility with thread the needle and scapular work",
    flowMovements: [
      "Quadruped",
      "Cat-Cow (5 reps)",
      "Thread the Needle (5 each side)",
      "Sit back on heels",
      "Scapular Push-ups (10 reps)",
      "Prone Snow Angels (10 reps)",
      "Child's Pose (30s)"
    ]
  },
  {
    optionName: "Flow 7 - Hip Opener",
    description: "Comprehensive hip mobility sequence with squat and 90/90 stretches",
    flowMovements: [
      "Deep Squat Hold (1 min)",
      "Spiderman Lunge (10 alternating)",
      "Cossack Squat (10 alternating)",
      "90/90 Stretch (30s each side)",
      "Frog Stretch (1 min)",
      "Pigeon Stretch (30s each side)"
    ]
  },
  {
    optionName: "Flow 8 - Spinal Decompression",
    description: "Recovery-focused flow with hanging and gentle stretches for spine health",
    flowMovements: [
      "Dead Hang (1 min or 3x20s)",
      "Segmental Cat-Cow (10 reps)",
      "Seal Stretch (1 min)",
      "Supine Twist (1 min each side)",
      "Child's Pose (1 min)"
    ]
  }
];

function migrate() {
  const inputPath = join(__dirname, '..', 'data', 'workout-plan-v2.3.json');
  const outputPath = join(__dirname, '..', 'data', 'workout-plan-v2.4.json');

  console.log('Reading v2.3 workout plan...');
  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));

  // Update schema and version
  data.$schema = './workout-plan-v2.4.schema.json';
  data.formatVersion = '2.4.0';

  // Update lastModified
  data.plan.lastModified = new Date().toISOString();

  // Find and update ex-mobility-flow template
  const exerciseTemplates = data.plan.exerciseTemplates;
  const mobilityFlowIndex = exerciseTemplates.findIndex(t => t.id === 'ex-mobility-flow');

  if (mobilityFlowIndex === -1) {
    console.error('Could not find ex-mobility-flow template!');
    process.exit(1);
  }

  console.log(`Found ex-mobility-flow at index ${mobilityFlowIndex}`);

  // Update the mobility flow template with flow options
  exerciseTemplates[mobilityFlowIndex] = {
    ...exerciseTemplates[mobilityFlowIndex],
    isFlow: true,
    notes: "Choose a flow that matches your goals. Focus on tight areas, move continuously, link breath.",
    exerciseOptions: flowOptions
  };

  console.log('Updated ex-mobility-flow with 8 flow options');

  // Write output
  writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Successfully wrote ${outputPath}`);

  // Also copy to public folder
  const publicPath = join(__dirname, '..', 'public', 'workout-plan-v2.4.json');
  writeFileSync(publicPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Also copied to ${publicPath}`);
}

migrate();
