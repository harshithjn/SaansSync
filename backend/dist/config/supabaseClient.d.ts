import 'dotenv/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabase: SupabaseClient | null;
export declare const supabaseAdmin: SupabaseClient | null;
export declare function requireAdminClient(): SupabaseClient;
export declare function requireClient(): SupabaseClient;
declare const _default: {
    supabase: SupabaseClient<any, "public", "public", any, any> | null;
    supabaseAdmin: SupabaseClient<any, "public", "public", any, any> | null;
    requireAdminClient: typeof requireAdminClient;
    requireClient: typeof requireClient;
};
export default _default;
//# sourceMappingURL=supabaseClient.d.ts.map