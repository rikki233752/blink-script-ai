export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: "admin" | "agent" | "viewer"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          role: "admin" | "agent" | "viewer"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: "admin" | "agent" | "viewer"
          created_at?: string
          updated_at?: string
        }
      }
      ringba_admins: {
        Row: {
          id: string
          user_id: string
          ringba_account_id: string
          ringba_api_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ringba_account_id: string
          ringba_api_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ringba_account_id?: string
          ringba_api_key?: string
          created_at?: string
          updated_at?: string
        }
      }
      ringba_campaigns: {
        Row: {
          id: string
          campaign_id: string
          campaign_name: string
          status: string
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          campaign_name: string
          status: string
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          campaign_name?: string
          status?: string
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ringba_call_logs: {
        Row: {
          id: string
          call_id: string
          campaign_id: string
          caller_number: string | null
          agent_name: string | null
          call_start_time: string | null
          call_duration: number | null
          revenue: number | null
          cost: number | null
          disposition: string | null
          recording_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          call_id: string
          campaign_id: string
          caller_number?: string | null
          agent_name?: string | null
          call_start_time?: string | null
          call_duration?: number | null
          revenue?: number | null
          cost?: number | null
          disposition?: string | null
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          call_id?: string
          campaign_id?: string
          caller_number?: string | null
          agent_name?: string | null
          call_start_time?: string | null
          call_duration?: number | null
          revenue?: number | null
          cost?: number | null
          disposition?: string | null
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transcriptions: {
        Row: {
          id: string
          call_log_id: string
          transcript_text: string
          summary: string | null
          sentiment: string | null
          language: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          call_log_id: string
          transcript_text: string
          summary?: string | null
          sentiment?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          call_log_id?: string
          transcript_text?: string
          summary?: string | null
          sentiment?: string | null
          language?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_analysis: {
        Row: {
          id: string
          transcription_id: string
          intent: string | null
          disposition: string | null
          confidence: number | null
          agent_score: number | null
          empathy_score: number | null
          business_conversion: boolean | null
          follow_up_required: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transcription_id: string
          intent?: string | null
          disposition?: string | null
          confidence?: number | null
          agent_score?: number | null
          empathy_score?: number | null
          business_conversion?: boolean | null
          follow_up_required?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transcription_id?: string
          intent?: string | null
          disposition?: string | null
          confidence?: number | null
          agent_score?: number | null
          empathy_score?: number | null
          business_conversion?: boolean | null
          follow_up_required?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      call_facts: {
        Row: {
          id: string
          transcription_id: string
          dob: string | null
          age: number | null
          city: string | null
          zip_code: string | null
          gender: string | null
          state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transcription_id: string
          dob?: string | null
          age?: number | null
          city?: string | null
          zip_code?: string | null
          gender?: string | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transcription_id?: string
          dob?: string | null
          age?: number | null
          city?: string | null
          zip_code?: string | null
          gender?: string | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
