export const VERSION_CONFIG = {
  version: "latest",
  fullVersion: "latest",
  releaseDate: "2024-12-06",
  apiVersion: "vLatest",
  buildHash: "94a1b2c3",
  environment: "production",
}

export function getVersionString(): string {
  return `v${VERSION_CONFIG.version}`
}

export function getFullVersionInfo() {
  return {
    ...VERSION_CONFIG,
    userAgent: `CallCenterAnalytics/${VERSION_CONFIG.fullVersion}`,
    timestamp: new Date().toISOString(),
  }
}

export function isLatestVersion(): boolean {
  // In a real app, this would check against a remote version API
  return true
}
