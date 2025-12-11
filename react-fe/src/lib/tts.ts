import { API_KEY, API_URL } from '../config'

/** Anything that behaves like the wrapped fetchWithAuth we use everywhere */
type Fetcher = (input: RequestInfo, init?: RequestInit) => Promise<Response>

interface TTSOptions {
    /** BCP-47 language tag, e.g. "fr-FR".  Drives the BE’s default voice logic. */
    lang?: string
    /** Current session – lets the BE infer the other language if you omit `lang`. */
    sessionId?: string
    /** Hard-override voice short-name (e.g. "en-GB-LibbyNeural"). */
    voice?: string
}

/**
 * Ask the BE to synthesise `text` and play it back.
 *
 * @param text        – The sentence to speak
 * @param fetcher     – fetchWithAuth or anything API-key aware
 * @param opts.lang   – Preferred language of the spoken sentence
 * @param opts.voice  – Optional hard-override voice
 * @param opts.sessionId – Session that the utterance belongs to
 */
export async function playTTS(
    text: string,
    fetcher: Fetcher,
    opts: TTSOptions = {},
): Promise<void> {
    if (!text.trim()) return

    // ---------- 1️⃣  hit the BE -------------------------------------------------
    const res = await fetcher(`${API_URL}/sessions/tts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        body: JSON.stringify({
            text,
            lang: opts.lang,
            voice: opts.voice,
            session_id: opts.sessionId,
        }),
    })

    if (!res.ok) throw new Error(await res.text())

    // ---------- 2️⃣  stream → arrayBuffer --------------------------------------
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
    }
    const wavBuf = await new Blob(chunks, { type: 'audio/wav' }).arrayBuffer()

    // ---------- 3️⃣  decode + play --------------------------------------------
    // Re-use a single AudioContext if possible – browsers hate many!
    // (kept in module scope via closure)
    if (!playTTS._ctx) playTTS._ctx = new AudioContext()

    const ctx = playTTS._ctx
    const audioBuf = await ctx.decodeAudioData(wavBuf)
    const src = ctx.createBufferSource()
    src.buffer = audioBuf
    src.connect(ctx.destination)
    src.start()
}
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
playTTS._ctx = (null as unknown) as AudioContext | null
