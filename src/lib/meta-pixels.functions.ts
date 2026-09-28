import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const passwordSchema = z.string().min(1).max(80);
const pixelIdSchema = z.string().regex(/^\d{8,25}$/, "Pixel ID inválido");

function passwordMatches(input: string) {
  const expected = process.env["PAINEL_SENHA"];
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= input.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export type ManagedMetaPixel = {
  id: string;
  name: string;
  pixelId: string;
  isActive: boolean;
  createdAt: string;
};

export const getPublicMetaPixelIds = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("meta_pixels").select("pixel_id").eq("is_active", true);
  return (data ?? []).map((pixel) => pixel.pixel_id);
});

export const getManagedMetaPixels = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ password: passwordSchema }).parse(input))
  .handler(async ({ data }) => {
    if (!passwordMatches(data.password)) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pixels, error } = await supabaseAdmin
      .from("meta_pixels")
      .select("id, name, pixel_id, is_active, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Não foi possível carregar os Pixels");
    return {
      ok: true as const,
      pixels: (pixels ?? []).map((pixel) => ({
        id: pixel.id,
        name: pixel.name,
        pixelId: pixel.pixel_id,
        isActive: pixel.is_active,
        createdAt: pixel.created_at,
      })),
    };
  });

export const addManagedMetaPixel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      password: passwordSchema,
      name: z.string().trim().min(2).max(60),
      pixelId: pixelIdSchema,
      token: z.string().trim().min(20).max(1000),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!passwordMatches(data.password)) return { ok: false as const, reason: "password" as const };
    const { encryptMetaToken, isBuiltInMetaPixel } = await import("@/lib/meta-pixels.server");
    if (isBuiltInMetaPixel(data.pixelId)) return { ok: false as const, reason: "duplicate" as const };
    const encrypted = await encryptMetaToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("meta_pixels").insert({
      name: data.name,
      pixel_id: data.pixelId,
      token_ciphertext: encrypted.tokenCiphertext,
      token_iv: encrypted.tokenIv,
    });
    if (error?.code === "23505") return { ok: false as const, reason: "duplicate" as const };
    if (error) throw new Error("Não foi possível salvar o Pixel");
    return { ok: true as const };
  });

export const setManagedMetaPixelActive = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: passwordSchema, id: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!passwordMatches(data.password)) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("meta_pixels").update({ is_active: data.isActive }).eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o Pixel");
    return { ok: true as const };
  });

export const removeManagedMetaPixel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ password: passwordSchema, id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    if (!passwordMatches(data.password)) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("meta_pixels").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível remover o Pixel");
    return { ok: true as const };
  });