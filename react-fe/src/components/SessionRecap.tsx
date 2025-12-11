import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_URL, API_KEY } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'

const SessionRecap: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const sessionId = location.state?.sessionId as string | undefined
  const directSummary = location.state?.summary as string | undefined

  const [summary, setSummary] = useState<string | null>(directSummary ?? null)
  const [error, setError] = useState<string | null>(null)
  const { fetchWithAuth } = useFetchWithAuth()

  useEffect(() => {
    if (!summary && sessionId) {
      const fetchRecap = async () => {
        try {
          const res = await fetchWithAuth(
            `${API_URL}/sessions/recap?session_id=${sessionId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
              },
            },
          )
          if (!res.ok) {
            throw new Error(`Failed to fetch recap (${res.status})`)
          }
          const data = await res.json()
          setSummary(data.summary)
        } catch (err) {
          setError((err as Error).message)
        }
      }
      fetchRecap()
    }
  }, [sessionId, summary])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Opsummering af samtale</h1>

      {error && <div className="text-red-600 mb-4">Error: {error}</div>}

      {summary ? (
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {summary}
        </pre>
      ) : (
        <div className="text-gray-500">Henter opsummering...</div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          New Session
        </button>
      </div>
    </div>
  )
}

export default SessionRecap
