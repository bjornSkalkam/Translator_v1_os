import React, { useEffect, useState } from 'react'
import { SessionData } from '../App'
import { API_URL, API_KEY } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'

export interface Language {
  code: string
  english_name: string
  native_name: string
  region: string
}

interface LanguageModalProps {
  onSessionCreated: (session: SessionData) => void
}

const LanguageModal: React.FC<LanguageModalProps> = ({ onSessionCreated }) => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [fetchingLanguages, setFetchingLanguages] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string>('')
  const [processingSelection, setProcessingSelection] = useState<boolean>(false)
  const [selectionError, setSelectionError] = useState<string>('')
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<
    string | null
  >(null)
  const { fetchWithAuth } = useFetchWithAuth()

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_URL}/sessions/available-languages`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': API_KEY,
            },
          },
        )
        if (!res.ok) {
          throw new Error('Failed to fetch languages')
        }
        const data = await res.json()
        setLanguages(data)
      } catch (e) {
        setFetchError((e as Error).message)
      } finally {
        setFetchingLanguages(false)
      }
    }
    fetchLanguages()
  }, [])

  const selectLanguage = async (language: string) => {
    if (processingSelection) return
    try {
      setProcessingSelection(true)
      setSelectionError('')
      setSelectedLanguageCode(language)

      const startRes = await fetchWithAuth(
        `${API_URL}/sessions/start-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        },
      )
      if (!startRes.ok) {
        throw new Error('Failed to start session')
      }
      const startData = await startRes.json()

      const selectRes = await fetchWithAuth(
        `${API_URL}/sessions/select-language`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify({
            session_id: startData.session_id,
            language,
          }),
        },
      )
      if (!selectRes.ok) {
        throw new Error('Failed to select language')
      }
      const session = await selectRes.json()

      const selectedLanguage = languages.find((l) => l.code === language)
      if (!selectedLanguage) throw new Error('Could not find language metadata')

      onSessionCreated({
        ...session,
        language_a: selectedLanguage,
        language_b: {
          code: 'da-DK',
          native_name: 'Dansk',
          english_name: 'Danish',
          region: 'da-DK',
        } as Language,
      })
    } catch (err) {
      setSelectionError((err as Error).message)
      console.error(err)
    } finally {
      setProcessingSelection(false)
    }
  }

  const selectedLang = languages.find((l) => l.code === selectedLanguageCode)

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        {fetchingLanguages ? (
          <div className="py-4 text-center">Henter sprog...</div>
        ) : fetchError ? (
          <div className="text-red-500 mb-2 text-center">{fetchError}</div>
        ) : processingSelection && selectedLang ? (
          <div className="text-center">
            <div className="mb-2">
              <span className="font-semibold">Valgt sprog:</span>{' '}
              {selectedLang.english_name} ({selectedLang.native_name})
            </div>
            <div className="flex justify-center items-center gap-2 mt-6">
              <svg
                className="animate-spin h-5 w-5 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span className="animate-pulse">Opretter session...</span>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 font-bold text-center">
              Vælg sprog for at starte:
            </p>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                disabled={processingSelection}
                className="w-full text-left px-3 py-3 border-b hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <span className="font-medium">{lang.english_name}</span>
                <span className="text-gray-500 text-sm ml-2">
                  {lang.native_name}
                </span>
              </button>
            ))}
          </>
        )}

        {selectionError && (
          <div className="text-red-500 text-center mt-2">{selectionError}</div>
        )}
      </div>
    </div>
  )
}

export default LanguageModal
