// POST /api/payment/preference
// Creates a MercadoPago Checkout Pro preference for the customer's cart.
// See: specs/001-festival-order-flow/contracts/api.md

import { serverSupabaseClient } from "#supabase/server";
import { mpPreference } from "~~/server/utils/mercadopago";
import { supabaseAdmin } from "~~/server/utils/supabaseAdmin";

interface PreferenceRequestItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  name: string;
}

interface PreferenceRequestBody {
  vendorId: string;
  items: PreferenceRequestItem[];
  notes?: string;
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const config = useRuntimeConfig();

  // 1. Validate session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "UNAUTHORIZED" });
  }

  const body = await readBody<PreferenceRequestBody>(event);

  // 2. Verify vendor exists and is active
  const { data: vendor, error: vendorErr } = await supabaseAdmin
    .from("vendors")
    .select("id, name, status, festival_id, requires_prep")
    .eq("id", body.vendorId)
    .single();

  if (vendorErr || !vendor) {
    throw createError({ statusCode: 404, statusMessage: "VENDOR_NOT_FOUND" });
  }
  if (vendor.status === "paused") {
    throw createError({ statusCode: 409, statusMessage: "VENDOR_PAUSED" });
  }

  // 3. Check FR-016a: no active order for this vendor
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("customer_id", user.id)
    .eq("vendor_id", body.vendorId)
    .not("status", "in", '("collected","cancelled")')
    .maybeSingle();

  if (existingOrder) {
    throw createError({
      statusCode: 409,
      statusMessage: "ORDER_ALREADY_ACTIVE",
    });
  }

  // 4. Verify all menu items belong to vendor and are available; recalculate total server-side
  const menuItemIds = body.items.map((i) => i.menuItemId);
  const { data: menuItems, error: menuErr } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, is_available, vendor_id")
    .in("id", menuItemIds);

  if (menuErr || !menuItems || menuItems.length !== menuItemIds.length) {
    throw createError({ statusCode: 422, statusMessage: "INVALID_ITEMS" });
  }

  for (const mi of menuItems) {
    if (mi.vendor_id !== body.vendorId || !mi.is_available) {
      throw createError({ statusCode: 422, statusMessage: "INVALID_ITEMS" });
    }
  }

  // Build server-authoritative items and total
  const serverItems = body.items.map((reqItem) => {
    const dbItem = menuItems.find((m) => m.id === reqItem.menuItemId)!;
    return {
      menuItemId: reqItem.menuItemId,
      quantity: reqItem.quantity,
      unitPrice: dbItem.price,
      nameSnapshot: dbItem.name,
    };
  });

  const totalAmount = serverItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );

  const appUrl = config.public.appUrl;

  // 5. Create MercadoPago preference
  const preference = await mpPreference.create({
    body: {
      items: serverItems.map((i) => ({
        id: i.menuItemId,
        title: i.nameSnapshot,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        currency_id: "UYU",
      })),
      back_urls: {
        success: `${appUrl}/orders`,
        failure: `${appUrl}/checkout`,
        pending: `${appUrl}/orders`,
      },
      ...(appUrl.startsWith("http://localhost")
        ? {}
        : { auto_return: "approved" }),
      notification_url: `${appUrl}/api/payment/webhook`,
      metadata: {
        customerId: user.id,
        vendorId: body.vendorId,
        festivalId: vendor.festival_id,
        items: JSON.stringify(serverItems),
        notes: body.notes ?? null,
      },
    },
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
  };
});
