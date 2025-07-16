export class ChunkedUploadManager {
  private static readonly CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks

  static async uploadLargeFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    if (file.size <= this.CHUNK_SIZE) {
      // Small file - direct upload
      return await this.directUpload(file)
    }

    // Large file - chunked upload
    return await this.chunkedUpload(file, onProgress)
  }

  private static async directUpload(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()
    return result.url
  }

  private static async chunkedUpload(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const chunks = Math.ceil(file.size / this.CHUNK_SIZE)
    const uploadId = crypto.randomUUID()

    for (let i = 0; i < chunks; i++) {
      const start = i * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("uploadId", uploadId)
      formData.append("chunkIndex", i.toString())
      formData.append("totalChunks", chunks.toString())
      formData.append("fileName", file.name)

      await fetch("/api/upload-chunk", {
        method: "POST",
        body: formData,
      })

      if (onProgress) {
        onProgress(((i + 1) / chunks) * 100)
      }
    }

    // Finalize upload
    const response = await fetch("/api/finalize-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, fileName: file.name }),
    })

    const result = await response.json()
    return result.url
  }
}
