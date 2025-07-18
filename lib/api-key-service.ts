import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_preview: string
  permissions: string[]
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateApiKeyRequest {
  name: string
  permissions: string[]
  expires_at?: string | null
}

export class ApiKeyService {
  static generateApiKey(): { key: string; hash: string; preview: string } {
    // Generate a secure random key
    const keyBytes = randomBytes(32)
    const key = `osk_${keyBytes.toString("hex")}`

    // Create hash for storage (you should use a proper hashing library like bcrypt in production)
    const hash = Buffer.from(key).toString("base64")

    // Create preview (first 8 chars + last 4 chars)
    const preview = `${key.substring(0, 12)}...${key.substring(key.length - 4)}`

    return { key, hash, preview }
  }

  static async createApiKey(userId: string, request: CreateApiKeyRequest): Promise<{ apiKey: ApiKey; key: string }> {
    const { key, hash, preview } = this.generateApiKey()

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: userId,
        name: request.name,
        key_hash: hash,
        key_preview: preview,
        permissions: request.permissions,
        expires_at: request.expires_at,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`)
    }

    return { apiKey: data, key }
  }

  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`)
    }

    return data || []
  }

  static async updateApiKey(
    userId: string,
    keyId: string,
    updates: Partial<Pick<ApiKey, "name" | "permissions" | "is_active" | "expires_at">>,
  ): Promise<ApiKey> {
    const { data, error } = await supabase
      .from("api_keys")
      .update(updates)
      .eq("id", keyId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`)
    }

    return data
  }

  static async deleteApiKey(userId: string, keyId: string): Promise<void> {
    const { error } = await supabase.from("api_keys").delete().eq("id", keyId).eq("user_id", userId)

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`)
    }
  }

  static async validateApiKey(key: string): Promise<ApiKey | null> {
    const hash = Buffer.from(key).toString("base64")

    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", hash)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return null
    }

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    // Update last_used_at
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id)

    return data
  }

  static getAvailablePermissions(): { value: string; label: string; description: string }[] {
    return [
      {
        value: "campaigns:read",
        label: "Read Campaigns",
        description: "View campaign data and metrics",
      },
      {
        value: "campaigns:write",
        label: "Write Campaigns",
        description: "Create and modify campaigns",
      },
      {
        value: "calls:read",
        label: "Read Calls",
        description: "View call logs and recordings",
      },
      {
        value: "calls:write",
        label: "Write Calls",
        description: "Create and modify call data",
      },
      {
        value: "transcripts:read",
        label: "Read Transcripts",
        description: "Access call transcriptions",
      },
      {
        value: "analytics:read",
        label: "Read Analytics",
        description: "View analytics and reports",
      },
      {
        value: "webhooks:manage",
        label: "Manage Webhooks",
        description: "Configure webhook endpoints",
      },
    ]
  }
}
