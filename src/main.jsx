import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, LoadingScreen, ErrorScreen, buildCompleteSchedule, fetchWithTimeout, FETCH_TIMEOUT_MS, setRAW_SCHEDULE, setEXERCISE_LIBRARY } from './App.jsx';

// Initialize the app with loading state
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LoadingScreen />);

// Load both schedule and exercise library data with timeout
Promise.all([
    fetchWithTimeout(`${import.meta.env.BASE_URL}full-schedule.json`, FETCH_TIMEOUT_MS).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error loading schedule! status: ${response.status}`);
        }
        return response.json();
    }).catch(error => {
        if (error.message === 'Request timeout') {
            throw new Error('Network timeout - check your connection');
        }
        throw error;
    }),
    fetchWithTimeout(`${import.meta.env.BASE_URL}exercises.json`, FETCH_TIMEOUT_MS).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error loading exercises! status: ${response.status}`);
        }
        return response.json();
    }).catch(error => {
        if (error.message === 'Request timeout') {
            throw new Error('Network timeout - check your connection');
        }
        throw error;
    })
])
    .then(([scheduleData, exercisesData]) => {
        // Validate schedule data structure
        if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
            throw new Error('Invalid schedule data: expected non-empty array');
        }
        
        // Basic validation of first schedule item
        const firstItem = scheduleData[0];
        const requiredKeys = ['w', 'd', 'ex', 's', 'r', 'n'];
        const hasRequiredKeys = requiredKeys.every(key => key in firstItem);
        if (!hasRequiredKeys) {
            throw new Error('Invalid schedule data: missing required properties');
        }
        
        // Validate exercise library data
        if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
            throw new Error('Invalid exercise library data: expected non-empty array');
        }
        
        // Validate first exercise has required properties
        const firstExercise = exercisesData[0];
        const requiredExerciseKeys = ['id', 'name', 'category', 'primaryMuscles', 'equipment', 'isBodyweight'];
        const hasRequiredExerciseKeys = requiredExerciseKeys.every(key => key in firstExercise);
        if (!hasRequiredExerciseKeys) {
            throw new Error('Invalid exercise library data: missing required properties');
        }
        
        // Assign the loaded data to global variables using setter functions
        setRAW_SCHEDULE(scheduleData);
        setEXERCISE_LIBRARY(exercisesData);
        
        // Build the complete schedule with standard warmups/cooldowns
        buildCompleteSchedule();
        
        console.log(`Loaded ${scheduleData.length} schedule items and ${exercisesData.length} exercises`);
        
        // Re-render with the actual app now that data is loaded
        root.render(<App />);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        root.render(<ErrorScreen message={`Failed to load data: ${error.message}`} />);
    });
