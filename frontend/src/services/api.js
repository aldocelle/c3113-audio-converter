import axios from 'axios'
import JSZip from 'jszip'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 120000,
})

export const checkHealth = () => api.get('/health')

// Upload one or more files. Returns { uploaded: [...], rejected: [...] }.
export const uploadFiles = (files, onUploadProgress) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api
    .post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((r) => r.data)
}

// Queue a batch conversion for already-uploaded file ids.
export const queueBatch = (fileIds, settings) =>
  api
    .post('/batch', {
      file_ids: fileIds,
      params: {
        format: settings.format,
        bitrate: settings.bitrate,
        sample_rate: settings.sampleRate,
        channels: settings.channels,
      },
    })
    .then((r) => r.data)

export const getBatch = (batchId) =>
  api.get(`/batch/${batchId}`).then((r) => r.data)

// Absolute download URL for a completed job's output.
export const downloadUrl = (jobId) => `${api.defaults.baseURL}/download/${jobId}`

// Fetch a job's converted output as a Blob.
const fetchOutput = (jobId) =>
  api.get(`/download/${jobId}`, { responseType: 'blob' }).then((r) => r.data)

// Save a Blob to disk with the given filename via a same-origin object URL,
// which the browser honors (unlike the <a download> attr for cross-origin URLs).
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Ensure filenames are unique within a set (e.g. "song.mp3", "song (2).mp3").
const uniqueName = (name, seen) => {
  if (!seen.has(name)) { seen.add(name); return name }
  const dot = name.lastIndexOf('.')
  const base = dot === -1 ? name : name.slice(0, dot)
  const ext = dot === -1 ? '' : name.slice(dot)
  let i = 2
  let candidate = `${base} (${i})${ext}`
  while (seen.has(candidate)) { i += 1; candidate = `${base} (${i})${ext}` }
  seen.add(candidate)
  return candidate
}

// Download a single job's output with the given filename.
export const downloadAs = async (jobId, filename) => {
  const blob = await fetchOutput(jobId)
  saveBlob(blob, filename)
}

// Download many outputs as separate files. `items` = [{ jobId, filename }].
// Spaced out slightly because browsers throttle rapid programmatic downloads.
export const downloadAllSeparate = async (items) => {
  const seen = new Set()
  for (const { jobId, filename } of items) {
    const blob = await fetchOutput(jobId)
    saveBlob(blob, uniqueName(filename, seen))
    await new Promise((r) => setTimeout(r, 300))
  }
}

// Download many outputs bundled into a single ZIP.
export const downloadAllZip = async (items, zipName = 'converted.zip') => {
  const zip = new JSZip()
  const seen = new Set()
  const blobs = await Promise.all(items.map(({ jobId }) => fetchOutput(jobId)))
  items.forEach(({ filename }, i) => {
    zip.file(uniqueName(filename, seen), blobs[i])
  })
  const out = await zip.generateAsync({ type: 'blob' })
  saveBlob(out, zipName)
}

export default api
