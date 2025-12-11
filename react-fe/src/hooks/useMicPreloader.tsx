// src/hooks/useMicPreloader.ts
import { useRef, useState, useEffect } from 'react'

export function useMicPreloader() {
  const [micReady, setMicReady] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false

    async function initMic() {
      try {
        // Request a microphone stream once
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        if (cancelled) return

        // Create an AudioContext once
        const ctx = new AudioContext()

        // Hook up source just to confirm that context/stream works
        const source = ctx.createMediaStreamSource(stream)
        console.log(source)
        // (We do not need to connect source to output; we only want the track)

        // Store references and mark as ready
        streamRef.current = stream
        audioContextRef.current = ctx
        setMicReady(true)
      } catch (err) {
        console.error('Mic init error:', err)
        setMicReady(false)
      }
    }

    initMic()

    // Cleanup: stop tracks and close audio context on unmount
    return () => {
      cancelled = true
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  return {
    micReady,
    audioContextRef,
    streamRef,
  }
}
