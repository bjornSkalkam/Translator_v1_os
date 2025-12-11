import React, { useEffect, useState } from 'react'
import { API_URL, API_KEY } from '../config'
import { useNavigate } from 'react-router-dom'
import { useFetchWithAuth } from '../lib/fetchWithAuth'

interface SessionSummary {
  session_id: string
  status: string
}

const AllSessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const navigate = useNavigate()
  const { fetchWithAuth } = useFetchWithAuth()

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetchWithAuth(`${API_URL}/sessions/list`, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      })
      const data = await res.json()
      setSessions(data)
    }
    fetchSessions()
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Alle Samtaler</h1>
      <div className="space-y-4">
        {sessions.map((s) => (
          <div
            key={s.session_id}
            className="p-4 bg-white rounded shadow flex justify-between items-center"
          >
            <div>
              <div className="font-mono text-sm text-gray-700">
                {s.session_id}
              </div>
              <div
                className={`text-sm mt-1 ${
                  s.status === 'finished' ? 'text-green-600' : 'text-blue-600'
                }`}
              >
                {s.status}
              </div>
            </div>

            <div className="flex gap-2">
              {s.status === 'finished' && (
                <button
                  onClick={() =>
                    navigate('/recap', { state: { sessionId: s.session_id } })
                  }
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Se opsummering
                </button>
              )}
              <button
                onClick={() => navigate('/')} // Could replace with resume if you support it
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Åbn
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Tilbage
        </button>
      </div>
    </div>
  )
}

export default AllSessions
