import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface RuleViolation {
  ruleId: string;
  ruleCode: string;
  description: string;
  actualCount: number;
  maxCount: number;
}

/**
 * Meghívja a DB oldali `validate_choreography_rules` RPC-t, és a megszegett
 * szabályokat kamelCase formában adja vissza a kliens/Server Action rétegnek.
 *
 * Használat: elem hozzáadása UTÁN (vagy dry-run számítással előtte) hívjuk
 * meg, és ha a visszatérési tömb nem üres, a Server Action elutasítja a
 * módosítást és visszaadja a pontos szabály-azonosítót + leírást a kliensnek.
 */
export async function validateChoreographyRules(choreographyId: string): Promise<RuleViolation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_choreography_rules", {
    _choreography_id: choreographyId,
  });

  if (error) {
    throw new Error(`Rule engine validáció sikertelen: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ruleId: row.rule_id,
    ruleCode: row.rule_code,
    description: row.rule_description,
    actualCount: row.actual_count,
    maxCount: row.max_count,
  }));
}
