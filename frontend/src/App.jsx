import React, { useState, useEffect } from 'react'
import DropZone from './components/DropZone'
import ConversionSettings from './components/ConversionSettings'
import FileList from './components/FileList'
import { checkHealth } from './services/api'

const DEFAULT_SETTINGS = {
  format: 'mp3',
  bitrate: '192k',
  sampleRate: '44100',
  channels: '2',
}

export default function App() {
  const [files, setFiles] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'))
  }, [])

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

  const statusDot = {
    checking: { color: 'var(--warning)', label: 'connecting…' },
    ok: { color: 'var(--success)', label: 'backend online' },
    error: { color: 'var(--error)', label: 'backend offline' },
  }[backendStatus]

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

        {/* Drop zone */}
        <div style={{ marginBottom: 24 }}>
          <DropZone onFiles={addFiles} />
        </div>

        {/* File list */}
        {files.length > 0 && (
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

        {/* Settings */}
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

        {/* Convert button */}
        <button
          disabled={files.length === 0 || backendStatus !== 'ok'}
          style={{
            width: '100%',
            padding: '14px',
            background: files.length > 0 && backendStatus === 'ok'
              ? 'var(--accent)' : 'var(--border)',
            color: files.length > 0 && backendStatus === 'ok'
              ? '#fff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: 15,
            cursor: files.length > 0 && backendStatus === 'ok' ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {files.length === 0
            ? 'Select files to convert'
            : `Convert ${files.length} file${files.length !== 1 ? 's' : ''} → ${settings.format.toUpperCase()}`}
        </button>

      </div>
    </div>
  )
}
