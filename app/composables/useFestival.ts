import type { Festival, VendorWithFeaturedItems } from "~~/shared/types";

export function useFestival() {
  const supabase = useSupabaseClient();

  const festival = ref<Festival | null>(null);
  const vendors = ref<VendorWithFeaturedItems[]>([]);
  const pending = ref(true);
  const error = ref<string | null>(null);

  async function fetchFestival() {
    pending.value = true;
    error.value = null;

    try {
      // TODO: Festival id from config.
      const { data: festivalData, error: festErr } = await supabase
        .from("festivals")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (festErr) throw festErr;
      if (!festivalData) {
        error.value = "No active festival found";
        return;
      }
      festival.value = festivalData;

      // Fetch vendors with their featured menu items
      const { data: vendorData, error: vendErr } = await supabase
        .from("vendors")
        .select(
          `
          *,
          menu_items!inner(*)
        `,
        )
        .eq("festival_id", festivalData.id)
        .eq("menu_items.is_featured", true)
        .order("name", { ascending: true });

      if (vendErr) throw vendErr;

      // Also get vendors with no featured items (they still appear, just empty)
      const { data: allVendors, error: allErr } = await supabase
        .from("vendors")
        .select("*")
        .eq("festival_id", festivalData.id)
        .order("name", { ascending: true });

      if (allErr) throw allErr;

      // Merge: each vendor gets its featured items (max 5)
      vendors.value = (allVendors ?? []).map((v) => ({
        ...v,
        menu_items: (vendorData ?? [])
          .filter((vd) => vd.id === v.id)
          .flatMap((vd) => vd.menu_items ?? [])
          .slice(0, 5),
      }));
    } catch (err: unknown) {
      console.error("TEST: ", err);
      error.value =
        err instanceof Error ? err.message : "Failed to load festival data";
    } finally {
      pending.value = false;
    }
  }

  onMounted(() => fetchFestival());

  return { festival, vendors, pending, error, refresh: fetchFestival };
}
