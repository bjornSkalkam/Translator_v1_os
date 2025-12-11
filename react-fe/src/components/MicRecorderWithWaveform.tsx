import React, { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'

interface MicRecorderProps {
  onRecorded: (file: File) => void
  onRecordingStateChange?: (recording: boolean) => void
  onWaveformReady?: (ready: boolean) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  preloadedAudioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
  micReady?: boolean
  className?: string
  style?: React.CSSProperties
}

const MicRecorderWithWaveform: React.FC<MicRecorderProps> = ({
  onRecorded,
  onRecordingStateChange,
  onWaveformReady,
  canvasRef,
  preloadedAudioContext,
  preloadedStream,
  micReady = false,
  className = '',
  style,
}) => {
  /* --------------------- internal state ---------------------- */
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [seconds, setSeconds] = useState(0)

  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [waveformReady, setWaveformReady] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const rafIdRef = useRef<number | null>(null)

  /* ---------------------- timer helpers ----------------------- */
  const startTimer = () => {
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }
  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setSeconds(0)
  }

  /* -------------------- waveform drawing ---------------------- */
  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current
    if (!ctx || !analyser || !dataArray) return

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray)

      /* notify parent the first time non-silence appears */
      if (!waveformReady && dataArray.some((v) => v !== 128)) {
        setWaveformReady(true)
        onWaveformReady?.(true)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#3B82F6'
      ctx.beginPath()

      const sliceWidth = canvas.width / dataArray.length
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()

      rafIdRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  /* --------------------- recording logic ---------------------- */
  const startRecording = async () => {
    try {
      setWaveformReady(false)
      onWaveformReady?.(false)

      /* stream management */
      let stream = preloadedStream
      if (stream && !stream.active) stream = null
      if (!stream)
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      /* AudioContext handling */
      let finalAudioCtx = preloadedAudioContext || null
      if (finalAudioCtx) {
        if (finalAudioCtx.state === 'closed') finalAudioCtx = new AudioContext()
        else if (finalAudioCtx.state === 'suspended')
          await finalAudioCtx.resume()
      } else {
        finalAudioCtx = new AudioContext()
      }
      audioCtxRef.current = finalAudioCtx

      const analyser = finalAudioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      const source = finalAudioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      /* MediaRecorder setup */
      let chosenMime = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(chosenMime)) chosenMime = ''

      const recorder = new MediaRecorder(
        stream,
        chosenMime ? { mimeType: chosenMime } : {},
      )
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const ext = recorder.mimeType.includes('webm') ? 'webm' : 'wav'
        const file = new File(
          [finalBlob],
          `mic_recording_${Date.now()}.${ext}`,
          { type: finalBlob.type },
        )
        onRecorded(file)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)
      onRecordingStateChange?.(true)
      startTimer()
    } catch (err) {
      console.error('[MicRecorder] Error starting mic:', err)
      alert(`[MicRecorder] Error: ${err}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
    stopTimer()

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = null

    if (!preloadedAudioContext && audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }

    analyserRef.current = null
    dataArrayRef.current = null

    setRecording(false)
    onRecordingStateChange?.(false)
  }

  const toggleRecording = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  /* start waveform animation when recording starts */
  useEffect(() => {
    if (recording && canvasRef.current) drawWaveform()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (recording) stopRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -------------------------- view ---------------------------- */
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={toggleRecording}
        style={style}
        className={`
          flex items-center justify-center h-20 w-20 rounded-full
          transition-colors shadow-sm
          ${
            recording
              ? 'bg-red-500 text-white animate-pulse'
              : micReady
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400'
          }
          ${className}
        `}
      >
        <Mic className="h-9 w-9 pointer-events-none" />
      </button>

      {/* always-reserved timer slot; invisible when idle */}
      <span
        className={`mt-2 h-4 text-center text-xs font-medium text-gray-600 ${
          recording ? '' : 'invisible'
        }`}
      >
        {recording ? `${seconds}s` : '0s'}
      </span>
    </div>
  )
}

export default MicRecorderWithWaveform
