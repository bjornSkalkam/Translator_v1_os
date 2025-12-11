import { useEffect, useMemo, useState, useCallback } from 'react'
import { FixedSizeList } from 'react-window'
import { VoiceInfo, fetchVoices } from '../lib/fetchVoices'
import { groupVoicesByLocale } from '../lib/groupVoices'
import {
  LanguageSetting,
  fetchLanguageSettings,
  bulkUpdateLanguageSettings,
  seedLanguages,
} from '../lib/fetchLanguageSettings'
import AutoSizer from 'react-virtualized-auto-sizer'

/* ──────────────────────────────────────────────────────────
   Available model names (matching backend config)
   ────────────────────────────────────────────────────────── */
const TRANSCRIPTION_MODELS = ['azure_speech', 'promte_whisper']
const TRANSLATION_MODELS = ['gpt4o-mini', 'promte_4o']
const SUMMARY_MODELS = ['gpt4o-mini', 'promte_4o']

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
export default function VoiceSettings() {
  /* Raw data from back-end */
  const [allVoices, setAllVoices] = useState<VoiceInfo[]>([])
  const [dbSettings, setDbSettings] = useState<LanguageSetting[]>([])

  /* Local UI state */
  const [search, setSearch] = useState('')
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [voiceForLang, setVoiceForLang] = useState<Record<string, string>>({})
  const [transcriptionForLang, setTranscriptionForLang] = useState<
    Record<string, string>
  >({})
  const [translationForLang, setTranslationForLang] = useState<
    Record<string, string>
  >({})
  const [summaryForLang, setSummaryForLang] = useState<Record<string, string>>(
    {}
  )

  /* Saving state */
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  /* Load data on mount */
  useEffect(() => {
    Promise.all([fetchVoices(), fetchLanguageSettings()])
      .then(([voices, settings]) => {
        setAllVoices(voices)
        setDbSettings(settings)

        // Populate local state from database settings
        const enabledMap: Record<string, boolean> = {}
        const voiceMap: Record<string, string> = {}
        const transcribeMap: Record<string, string> = {}
        const translateMap: Record<string, string> = {}
        const summaryMap: Record<string, string> = {}

        settings.forEach((s) => {
          enabledMap[s.code] = s.enabled
          if (s.voice) voiceMap[s.code] = s.voice
          if (s.transcribe_model) transcribeMap[s.code] = s.transcribe_model
          if (s.translation_model) translateMap[s.code] = s.translation_model
          if (s.summary_model) summaryMap[s.code] = s.summary_model
        })

        setEnabled(enabledMap)
        setVoiceForLang(voiceMap)
        setTranscriptionForLang(transcribeMap)
        setTranslationForLang(translateMap)
        setSummaryForLang(summaryMap)
      })
      .catch((err) => {
        console.error('Failed to load settings:', err)
        setMessage('Failed to load settings')
      })
  }, [])

  /* Group voices by full locale code (e.g., "nl-NL") */
  const languages = useMemo(
    () => groupVoicesByLocale(allVoices),
    [allVoices]
  )

  /* Filter by search */
  const filtered = useMemo(
    () =>
      languages.filter(
        (l) =>
          l.english.toLowerCase().includes(search.toLowerCase()) ||
          l.native.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase())
      ),
    [languages, search]
  )

  /* Save all settings */
  const handleSave = useCallback(async () => {
    setSaving(true)
    setMessage(null)

    try {
      const updates = languages.map((lang) => ({
        code: lang.code,
        enabled: enabled[lang.code] ?? false,
        voice: voiceForLang[lang.code] || lang.voices[0]?.short_name || null,
        transcribe_model: transcriptionForLang[lang.code] || 'azure_speech',
        translation_model: translationForLang[lang.code] || 'gpt4o-mini',
        summary_model: summaryForLang[lang.code] || 'gpt4o-mini',
      }))

      const result = await bulkUpdateLanguageSettings(updates)
      setMessage(`Saved ${result.updated} language settings`)

      // Refresh settings from server
      const settings = await fetchLanguageSettings()
      setDbSettings(settings)
    } catch (err) {
      console.error('Failed to save:', err)
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [
    languages,
    enabled,
    voiceForLang,
    transcriptionForLang,
    translationForLang,
    summaryForLang,
  ])

  /* Seed database from Azure voices */
  const handleSeed = useCallback(async () => {
    setSeeding(true)
    setMessage(null)

    try {
      const result = await seedLanguages()
      setMessage(`Created ${result.created} new languages (${result.total_locales} total)`)

      // Refresh settings from server
      const settings = await fetchLanguageSettings()
      setDbSettings(settings)
    } catch (err) {
      console.error('Failed to seed:', err)
      setMessage('Failed to seed languages')
    } finally {
      setSeeding(false)
    }
  }, [])

  /* ───────── Row rendered by react-window ───────── */
  const Row = ({
    index,
    style,
  }: {
    index: number
    style: React.CSSProperties
  }) => {
    const lang = filtered[index]
    const code = lang.code
    const disabled = !enabled[code]

    const selectClasses =
      'w-full border rounded px-2 py-1 disabled:bg-gray-100 text-sm'

    return (
      <div
        style={style}
        className="grid grid-cols-[2fr_auto_2fr_2fr_2fr_2fr] items-center gap-4 px-3 py-2 border-b last:border-b-0"
      >
        {/* ── language names ───────────────────── */}
        <div>
          <div className="font-medium">{lang.english}</div>
          <div className="text-xs text-gray-500">
            {lang.native} ({code})
          </div>
        </div>

        {/* ── enable/disable switch ────────────── */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!enabled[code]}
            onChange={(e) =>
              setEnabled((s) => ({ ...s, [code]: e.target.checked }))
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-checked:bg-indigo-600 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-indigo-500" />
          <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
        </label>

        {/* ── VOICE ────────────────────────────── */}
        <select
          className={selectClasses}
          value={voiceForLang[code] ?? ''}
          onChange={(e) =>
            setVoiceForLang((s) => ({ ...s, [code]: e.target.value }))
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Voice
          </option>
          {lang.voices.map((v) => (
            <option key={v.short_name} value={v.short_name}>
              {v.local_name} - {v.gender}
            </option>
          ))}
        </select>

        {/* ── TRANSCRIPTION MODEL ──────────────── */}
        <select
          className={selectClasses}
          value={transcriptionForLang[code] ?? ''}
          onChange={(e) =>
            setTranscriptionForLang((s) => ({ ...s, [code]: e.target.value }))
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Transcribe
          </option>
          {TRANSCRIPTION_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* ── TRANSLATION MODEL ──────────────── */}
        <select
          className={selectClasses}
          value={translationForLang[code] ?? ''}
          onChange={(e) =>
            setTranslationForLang((s) => ({ ...s, [code]: e.target.value }))
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Translate
          </option>
          {TRANSLATION_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* ── SUMMARY MODEL ─────────────────────── */}
        <select
          className={selectClasses}
          value={summaryForLang[code] ?? ''}
          onChange={(e) =>
            setSummaryForLang((s) => ({ ...s, [code]: e.target.value }))
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Recap
          </option>
          {SUMMARY_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    )
  }

  /* ──────────────────────────────────────────── */
  return (
    <section className="p-6 space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search language..."
          className="flex-1 border rounded px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {seeding ? 'Seeding...' : 'Seed Languages'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded ${
            message.includes('Failed')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Info about database */}
      <div className="text-sm text-gray-600">
        {dbSettings.length} languages in database |{' '}
        {dbSettings.filter((s) => s.enabled).length} enabled
      </div>

      {/* Virtualized list */}
      <div style={{ height: '80vh' }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={filtered.length}
              itemSize={64}
            >
              {Row}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </section>
  )
}
