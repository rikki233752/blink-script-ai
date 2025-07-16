import { createClient } from "@supabase/supabase-js"

export interface AdminFilter {
  id: string
  admin_user_id: string
  filter_name: string
  filter_type:
    | "agent_name"
    | "publisher_name"
    | "campaign_status"
    | "call_duration"
    | "keyword"
    | "date_range"
    | "custom"
  filter_value: any
  operator: "equals" | "contains" | "greater_than" | "less_than" | "between" | "in" | "not_in"
  is_active: boolean
  applies_to: string[] // Which endpoints/views this filter applies to
  created_at: string
  updated_at: string
}

export interface FilterCondition {
  field: string
  operator: string
  value: any
  table?: string
}

export class AdminFilterService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  /**
   * Get active admin filters for a specific context
   */
  async getActiveFilters(adminUserId: string, context: string): Promise<AdminFilter[]> {
    try {
      const { data, error } = await this.supabase
        .from("admin_filters")
        .select("*")
        .eq("admin_user_id", adminUserId)
        .eq("is_active", true)
        .contains("applies_to", [context])
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching admin filters:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("❌ Error in getActiveFilters:", error)
      return []
    }
  }

  /**
   * Apply admin filters to a Supabase query
   */
  async applyFiltersToQuery(query: any, adminUserId: string, context: string): Promise<any> {
    try {
      const filters = await this.getActiveFilters(adminUserId, context)

      if (filters.length === 0) {
        return query
      }

      console.log(`🔍 Applying ${filters.length} admin filters for context: ${context}`)

      let filteredQuery = query

      for (const filter of filters) {
        filteredQuery = this.applyFilter(filteredQuery, filter)
      }

      return filteredQuery
    } catch (error) {
      console.error("❌ Error applying filters to query:", error)
      return query
    }
  }

  /**
   * Apply a single filter to a query
   */
  private applyFilter(query: any, filter: AdminFilter): any {
    const { filter_type, filter_value, operator } = filter

    try {
      switch (filter_type) {
        case "agent_name":
          return this.applyAgentNameFilter(query, filter_value, operator)

        case "publisher_name":
          return this.applyPublisherNameFilter(query, filter_value, operator)

        case "campaign_status":
          return this.applyCampaignStatusFilter(query, filter_value, operator)

        case "call_duration":
          return this.applyCallDurationFilter(query, filter_value, operator)

        case "keyword":
          return this.applyKeywordFilter(query, filter_value, operator)

        case "date_range":
          return this.applyDateRangeFilter(query, filter_value, operator)

        case "custom":
          return this.applyCustomFilter(query, filter_value, operator)

        default:
          console.warn(`⚠️ Unknown filter type: ${filter_type}`)
          return query
      }
    } catch (error) {
      console.error(`❌ Error applying filter ${filter.filter_name}:`, error)
      return query
    }
  }

  /**
   * Apply agent name filter
   */
  private applyAgentNameFilter(query: any, value: string | string[], operator: string): any {
    switch (operator) {
      case "equals":
        return query.eq("agent_name", value)
      case "contains":
        return query.ilike("agent_name", `%${value}%`)
      case "in":
        return query.in("agent_name", Array.isArray(value) ? value : [value])
      case "not_in":
        return query.not("agent_name", "in", `(${Array.isArray(value) ? value.join(",") : value})`)
      default:
        return query
    }
  }

  /**
   * Apply publisher name filter
   */
  private applyPublisherNameFilter(query: any, value: string | string[], operator: string): any {
    switch (operator) {
      case "equals":
        return query.eq("publisher_name", value)
      case "contains":
        return query.ilike("publisher_name", `%${value}%`)
      case "in":
        return query.in("publisher_name", Array.isArray(value) ? value : [value])
      case "not_in":
        return query.not("publisher_name", "in", `(${Array.isArray(value) ? value.join(",") : value})`)
      default:
        return query
    }
  }

  /**
   * Apply campaign status filter
   */
  private applyCampaignStatusFilter(query: any, value: string | string[], operator: string): any {
    switch (operator) {
      case "equals":
        return query.eq("campaign_status", value)
      case "in":
        return query.in("campaign_status", Array.isArray(value) ? value : [value])
      case "not_in":
        return query.not("campaign_status", "in", `(${Array.isArray(value) ? value.join(",") : value})`)
      default:
        return query
    }
  }

  /**
   * Apply call duration filter
   */
  private applyCallDurationFilter(query: any, value: number | { min?: number; max?: number }, operator: string): any {
    switch (operator) {
      case "greater_than":
        return query.gt("call_duration", value)
      case "less_than":
        return query.lt("call_duration", value)
      case "equals":
        return query.eq("call_duration", value)
      case "between":
        if (typeof value === "object" && value.min !== undefined && value.max !== undefined) {
          return query.gte("call_duration", value.min).lte("call_duration", value.max)
        }
        return query
      default:
        return query
    }
  }

  /**
   * Apply keyword filter (searches in transcript or analysis)
   */
  private applyKeywordFilter(query: any, value: string | string[], operator: string): any {
    const keywords = Array.isArray(value) ? value : [value]

    switch (operator) {
      case "contains":
        // Search in transcript text and key topics
        return query.or(
          keywords.map((keyword) => `transcript_text.ilike.%${keyword}%,key_topics.cs.{${keyword}}`).join(","),
        )
      case "equals":
        return query.contains("key_topics", keywords)
      default:
        return query
    }
  }

  /**
   * Apply date range filter
   */
  private applyDateRangeFilter(
    query: any,
    value: { start?: string; end?: string; field?: string },
    operator: string,
  ): any {
    const field = value.field || "created_at"

    if (value.start && value.end) {
      return query.gte(field, value.start).lte(field, value.end)
    } else if (value.start) {
      return query.gte(field, value.start)
    } else if (value.end) {
      return query.lte(field, value.end)
    }

    return query
  }

  /**
   * Apply custom filter with raw SQL conditions
   */
  private applyCustomFilter(query: any, value: { conditions: FilterCondition[] }, operator: string): any {
    if (!value.conditions || !Array.isArray(value.conditions)) {
      return query
    }

    let filteredQuery = query

    for (const condition of value.conditions) {
      const { field, operator: conditionOperator, value: conditionValue } = condition

      switch (conditionOperator) {
        case "equals":
          filteredQuery = filteredQuery.eq(field, conditionValue)
          break
        case "contains":
          filteredQuery = filteredQuery.ilike(field, `%${conditionValue}%`)
          break
        case "greater_than":
          filteredQuery = filteredQuery.gt(field, conditionValue)
          break
        case "less_than":
          filteredQuery = filteredQuery.lt(field, conditionValue)
          break
        case "in":
          filteredQuery = filteredQuery.in(field, Array.isArray(conditionValue) ? conditionValue : [conditionValue])
          break
        case "not_in":
          filteredQuery = filteredQuery.not(
            field,
            "in",
            `(${Array.isArray(conditionValue) ? conditionValue.join(",") : conditionValue})`,
          )
          break
      }
    }

    return filteredQuery
  }

  /**
   * Create a new admin filter
   */
  async createFilter(
    adminUserId: string,
    filterName: string,
    filterType: AdminFilter["filter_type"],
    filterValue: any,
    operator: AdminFilter["operator"],
    appliesTo: string[],
  ): Promise<{ success: boolean; filterId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from("admin_filters")
        .insert({
          admin_user_id: adminUserId,
          filter_name: filterName,
          filter_type: filterType,
          filter_value: filterValue,
          operator: operator,
          applies_to: appliesTo,
          is_active: true,
        })
        .select("id")
        .single()

      if (error) {
        console.error("❌ Error creating admin filter:", error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Created admin filter: ${filterName}`)
      return { success: true, filterId: data.id }
    } catch (error) {
      console.error("❌ Error in createFilter:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Update an admin filter
   */
  async updateFilter(filterId: string, updates: Partial<AdminFilter>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("admin_filters")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", filterId)

      if (error) {
        console.error("❌ Error updating admin filter:", error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Updated admin filter: ${filterId}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error in updateFilter:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Delete an admin filter
   */
  async deleteFilter(filterId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.from("admin_filters").delete().eq("id", filterId)

      if (error) {
        console.error("❌ Error deleting admin filter:", error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Deleted admin filter: ${filterId}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error in deleteFilter:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Toggle filter active status
   */
  async toggleFilter(filterId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateFilter(filterId, { is_active: isActive })
  }

  /**
   * Get all filters for an admin user
   */
  async getAdminFilters(adminUserId: string): Promise<AdminFilter[]> {
    try {
      const { data, error } = await this.supabase
        .from("admin_filters")
        .select("*")
        .eq("admin_user_id", adminUserId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching admin filters:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("❌ Error in getAdminFilters:", error)
      return []
    }
  }

  /**
   * Check if user is admin and get their user ID
   */
  async getAdminUserId(authId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.from("users").select("id, role").eq("auth_id", authId).single()

      if (error || !data || data.role !== "admin") {
        return null
      }

      return data.id
    } catch (error) {
      console.error("❌ Error checking admin status:", error)
      return null
    }
  }
}

// Export singleton instance
export const adminFilterService = new AdminFilterService()
