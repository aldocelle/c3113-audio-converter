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

  const [phase, setPhase] = useState('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [batch, setBatch] = useState(null)        // latest batch status from API
  const [idToName, setIdToName] = useState({})    // file_id -> original filename
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('ok'))
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
    <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                C3113 Audio Converter
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
                Batch convert audio files via FFmpeg
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: statusDot.color,
                display: 'inline-block',
              }} />
              <span style={{ color: 'var(--text-muted)' }}>{statusDot.label}</span>
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
            marginBottom: 24,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 13 }}>
              Conversion Settings
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
              width: '100%', padding: '14px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            Convert more files
          </button>
        ) : (
          <button
            onClick={handleConvert}
            disabled={!canConvert}
            style={{
              width: '100%', padding: '14px',
              background: canConvert ? 'var(--accent)' : 'var(--border)',
              color: canConvert ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 'var(--radius)',
              fontWeight: 600, fontSize: 15,
              cursor: canConvert ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {buttonLabel()}
          </button>
        )}

      </div>
    </div>
  )
}
