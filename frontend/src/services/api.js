import axios from 'axios'

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

export default api
