import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtendedDatabase } from "@/types/database.coach.types";
import type { Json } from "@/types/database.types";

type Client = SupabaseClient<ExtendedDatabase, "public">;

/**
 * Audit naplózás az `audit_logs` táblába.
 * A naplózás hibája sosem akadályozza meg a fő műveletet.
 */
export async function logAudit(
  supabase: Client,
  changedBy: string | null,
  action: string,
  tableName: string,
  recordId: string,
  oldData?: unknown,
  newData?: unknown
) {
  try {
    await supabase.from("audit_logs").insert({
      action,
      table_name: tableName,
      record_id: recordId,
      changed_by: changedBy,
      old_data: (oldData as Json) ?? null,
      new_data: (newData as Json) ?? null,
    });
  } catch {
    // szándékosan elnyeljük – az audit napló nem blokkolhatja a műveletet
  }
}
