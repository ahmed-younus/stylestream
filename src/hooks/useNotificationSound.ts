// Simple notification sound using Web Audio API
export const useNotificationSound = () => {
  const isSoundEnabled = () => {
    const saved = localStorage.getItem("notificationSoundEnabled");
    return saved !== "false"; // Default to true
  };

  const playSuccessSound = () => {
    // Check if sound is enabled
    if (!isSoundEnabled()) {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant two-tone chime
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playTone(880, now, 0.15); // A5
      playTone(1108.73, now + 0.12, 0.2); // C#6
      
      // Clean up after sounds complete
      setTimeout(() => audioContext.close(), 500);
    } catch (e) {
      console.log('Audio notification not supported');
    }
  };

  return { playSuccessSound, isSoundEnabled };
};
