/**
 * This file previously exported the Supabase client.
 * It now re-exports the custom API client that connects to the Express backend.
 * All existing code that imports `supabase` from this path continues to work unchanged.
 */
import apiClient from "@/lib/api-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = apiClient as any;
export default apiClient;
