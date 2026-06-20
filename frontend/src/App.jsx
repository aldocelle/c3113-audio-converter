import React, { useState, useEffect, useRef } from 'react'
import DropZone from './components/DropZone'
import ConversionSettings from './components/ConversionSettings'
import FileList from './components/FileList'
import ResultsList from './components/ResultsList'
import { checkHealth, uploadFiles, queueBatch, getBatch } from './services/api'

const DEFAULT_SETTINGS = {
  format: 'mp3',
  bitrate: '192k',
  sampleRate: '44100',
  channels: '2',
}

// phase: 'idle' | 'uploading' | 'converting' | 'done' | 'error'
export default function App() {
  const [files, setFiles] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [backendVersion, setBackendVersion] = useState('')

  const [phase, setPhase] = useState('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [batch, setBatch] = useState(null)        // latest batch status from API
  const [idToName, setIdToName] = useState({})    // file_id -> original filename
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    checkHealth()
      .then((res) => {
        setBackendStatus('ok')
        setBackendVersion(res.data?.version || '')
      })
      .catch(() => setBackendStatus('error'))
  }, [])

  // Clean up polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), [])

  const addFiles = (newFiles) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      const unique = newFiles.filter((f) => !existing.has(f.name + f.size))
      return [...prev, ...unique]
    })
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const reset = () => {
    clearInterval(pollRef.current)
    setPhase('idle')
    setUploadPct(0)
    setBatch(null)
    setIdToName({})
    setErrorMsg('')
    setFiles([])
  }

  const handleConvert = async () => {
    setErrorMsg('')
    setPhase('uploading')
    setUploadPct(0)
    try {
      // 1. Upload
      const up = await uploadFiles(files, (e) => {
        if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100))
      })

      if (!up.uploaded || up.uploaded.length === 0) {
        const reason = up.rejected?.[0]?.reason || 'No files accepted'
        throw new Error(`Upload rejected: ${reason}`)
      }

      // map file_id -> original name for the results display
      const names = {}
      up.uploaded.forEach((f) => { names[f.file_id] = f.original_name })
      setIdToName(names)

      // 2. Queue batch
      const fileIds = up.uploaded.map((f) => f.file_id)
      const queued = await queueBatch(fileIds, settings)
      setBatch(queued)
      setPhase('converting')

      // 3. Poll until terminal
      pollRef.current = setInterval(async () => {
        try {
          const b = await getBatch(queued.batch_id)
          setBatch(b)
          if (b.status === 'completed' || b.status === 'failed' || b.status === 'partial_failure') {
            clearInterval(pollRef.current)
            setPhase('done')
          }
        } catch (err) {
          clearInterval(pollRef.current)
          setErrorMsg('Lost connection while checking progress.')
          setPhase('error')
        }
      }, 1000)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = (detail && (detail.message || detail)) || err.message || 'Conversion failed'
      setErrorMsg(typeof msg === 'string' ? msg : 'Conversion failed')
      setPhase('error')
    }
  }

  const statusDot = {
    checking: { color: 'var(--warning)', label: 'connecting…' },
    ok: { color: 'var(--success)', label: 'backend online' },
    error: { color: 'var(--error)', label: 'backend offline' },
  }[backendStatus]

  const busy = phase === 'uploading' || phase === 'converting'
  const showResults = phase === 'converting' || phase === 'done'

  const buttonLabel = () => {
    if (phase === 'uploading') return `Uploading… ${uploadPct}%`
    if (phase === 'converting') {
      const done = batch?.completed_count ?? 0
      const total = batch?.total_files ?? files.length
      return `Converting… ${done}/${total}`
    }
    if (files.length === 0) return 'Select files to convert'
    return `Convert ${files.length} file${files.length !== 1 ? 's' : ''} → ${settings.format.toUpperCase()}`
  }

  const canConvert = files.length > 0 && backendStatus === 'ok' && !busy

  return (
    <div style={{ minHeight: '100vh', padding: '36px 24px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Waveform />
            <div>
              <h1 className="gradient-text" style={{
                fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                C3113
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 3, fontSize: 12 }}>
                Audio Converter · batch convert via FFmpeg
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 999, padding: '5px 12px',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: statusDot.color, display: 'inline-block',
              boxShadow: `0 0 8px ${statusDot.color}`,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ color: 'var(--text-muted)' }}>{statusDot.label}</span>
              {backendVersion && <span style={{ color: 'var(--text-muted)', fontSize: 10, opacity: 0.7 }}>v{backendVersion}</span>}
            </div>
          </div>
        </div>

        {/* Drop zone (hidden once a conversion is underway) */}
        {!showResults && (
          <div style={{ marginBottom: 24 }}>
            <DropZone onFiles={addFiles} />
          </div>
        )}

        {/* File list (selection phase) */}
        {!showResults && files.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setFiles([])}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            </div>
            <FileList files={files} onRemove={removeFile} />
          </div>
        )}

        {/* Settings (selection phase) */}
        {!showResults && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Conversion Settings
              </div>
            </div>
            <ConversionSettings settings={settings} onChange={setSettings} />
          </div>
        )}

        {/* Results (converting / done) */}
        {showResults && batch && (
          <div style={{ marginBottom: 24 }}>
            <ResultsList batch={batch} idToName={idToName} format={settings.format} />
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255,77,79,0.1)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            marginBottom: 24,
            color: 'var(--error)',
            fontSize: 13,
          }}>
            {errorMsg}
          </div>
        )}

        {/* Action button */}
        {phase === 'done' || phase === 'error' ? (
          <button
            onClick={reset}
            style={{
              width: '100%', padding: '15px',
              background: 'var(--gradient)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(124,92,255,0.35)',
            }}
          >
            Convert more files
          </button>
        ) : (
          <button
            onClick={handleConvert}
            disabled={!canConvert}
            style={{
              width: '100%', padding: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: canConvert ? 'var(--gradient)' : 'var(--surface-2)',
              color: canConvert ? '#fff' : 'var(--text-dim)',
              border: canConvert ? 'none' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontWeight: 700, fontSize: 15,
              cursor: canConvert ? 'pointer' : 'not-allowed',
              boxShadow: canConvert ? '0 8px 24px rgba(124,92,255,0.35)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            {buttonLabel()}
            {canConvert && phase === 'idle' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        )}

        {/* Feature footer */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)',
        }}>
          <Feature
            title="Secure & Private"
            desc="Files processed, then auto-deleted"
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          />
          <Feature
            title="Fast Conversion"
            desc="Powered by FFmpeg"
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          />
          <Feature
            title="Batch Processing"
            desc="Convert multiple files at once"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </div>

      </div>
    </div>
  )
}

function Waveform() {
  const bars = [10, 18, 28, 16, 24, 12, 20, 30, 14, 22]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 32 }}>
      {bars.map((h, i) => (
        <span key={i} style={{
          width: 3, height: h, borderRadius: 2,
          background: 'linear-gradient(180deg, var(--accent-2), var(--accent))',
          opacity: 0.85,
        }} />
      ))}
    </div>
  )
}

function Feature({ title, desc, d }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 30, height: 30, flexShrink: 0, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.25)',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}
