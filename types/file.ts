export interface File {
  name: string
  size: number
  type?: string
  arrayBuffer(): Promise<ArrayBuffer>
}
