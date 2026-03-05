import { createClient } from "@supabase/supabase-js";

export async function checkRechnerbindung(
  benutzerId: number,
  deviceHash: string,
  lizenzId: number
): Promise<{ ok: boolean }> {

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: benutzer } = await supabase
    .from("benutzer")
    .select("id, istadmin")
    .eq("id", benutzerId)
    .single();

  if (!benutzer) return { ok: false };

  // ✅ Admin immer erlauben
  if (benutzer.istadmin) return { ok: true };

  // 🔒 Normale Benutzer: NUR wenn Gerät freigegeben
  const { data: geraet } = await supabase
    .from("lizenz_geraete")
    .select("id")
    .eq("lizenz_id", lizenzId)
    .eq("device_hash", deviceHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (!geraet) {
    return { ok: false };
  }

  return { ok: true };
}
