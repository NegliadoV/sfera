import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { DenoiseTrackProcessor } from 'livekit-rnnoise-processor';
import { LocalAudioTrack } from 'livekit-client';

export function useRNNoiseFilter() {
  const { localParticipant } = useLocalParticipant();
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = useState(false);
  const [isNoiseFilterPending, setIsNoiseFilterPending] = useState(false);
  
  const processorRef = useRef<DenoiseTrackProcessor | null>(null);

  const setNoiseFilterEnabled = useCallback(async (enable: boolean) => {
    if (!localParticipant) return;
    
    // Find the primary audio track publication
    const trackPub = Array.from(localParticipant.audioTrackPublications.values()).find(
      (p) => p.track && p.source === 'microphone'
    );
    
    const audioTrack = trackPub?.track as LocalAudioTrack;
    
    if (!audioTrack) {
      console.warn('Cannot enable RNNoise: local audio track not found');
      return;
    }

    setIsNoiseFilterPending(true);

    try {
      if (enable) {
        if (!processorRef.current) {
          // Initialize processor pointing to our self-hosted WASM files
          processorRef.current = new DenoiseTrackProcessor({
             workletCDNURL: window.location.origin + '/rnnoise/' // Must end with slash, absolute URL required
          });
        }
        
        await audioTrack.setProcessor(processorRef.current);
        setIsNoiseFilterEnabled(true);
      } else {
        if (processorRef.current) {
          await audioTrack.stopProcessor();
          // Instead of destroying immediately, we just unbind it so it can be re-enabled quickly
        }
        setIsNoiseFilterEnabled(false);
      }
    } catch (e) {
      console.error('Failed to toggle RNNoise Filter:', e);
      setIsNoiseFilterEnabled(false);
    } finally {
      setIsNoiseFilterPending(false);
    }
  }, [localParticipant]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.destroy().catch(console.error);
        processorRef.current = null;
      }
    };
  }, []);

  return {
    isNoiseFilterEnabled,
    isNoiseFilterPending,
    setNoiseFilterEnabled,
  };
}
