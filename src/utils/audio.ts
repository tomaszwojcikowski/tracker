/**
 * Audio Utilities
 *
 * Functions for playing audio feedback sounds using Web Audio API.
 */

/**
 * Extended Window interface to include webkit prefixed AudioContext
 */
interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Get the AudioContext constructor, handling webkit prefix for older browsers
 */
function getAudioContextConstructor(): typeof AudioContext | undefined {
  const extWindow = window as ExtendedWindow;
  return window.AudioContext || extWindow.webkitAudioContext;
}

/**
 * Play a tick sound for countdown
 */
export const playTickSound = (): void => {
  try {
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      console.warn('AudioContext not supported');
      return;
    }

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // High frequency for tick
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.warn('Failed to play tick sound:', error);
  }
};

/**
 * Play a beep sound for new interval
 */
export const playBeepSound = (): void => {
  try {
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      console.warn('AudioContext not supported');
      return;
    }

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1200; // Higher frequency for beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.warn('Failed to play beep sound:', error);
  }
};
