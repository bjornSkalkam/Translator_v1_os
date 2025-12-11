// A super-thin hook that hides fetchWithAuth
import { playTTS } from '../lib/tts'
import { useFetchWithAuth } from '../lib/fetchWithAuth'

/**
 * Returns a `speak` function.
 *
 * You *must* pass the language every time (the component that knows which side
 * of the dialogue it is).  `sessionId` is usually constant for the whole view,
 * so you can capture it when you create the hook.
 *
 * @example
 *   const speak = useTTS(sessionData.session_id)
 *   speak('Bonjour !', 'fr-FR')   // plays with French voice
 */
export const useTTS = (sessionId?: string) => {
  const { fetchWithAuth } = useFetchWithAuth()

  return async (
    text: string,
    lang: string,
    voice?: string, // pass if user overrides voice manually
  ): Promise<void> => playTTS(text, fetchWithAuth, { lang, sessionId, voice })
}
