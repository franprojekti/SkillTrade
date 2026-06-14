"use client";

import { createClient } from "@/lib/supabase/client";
import type { Skill } from "@/types/database";

export async function suggestSkill(
  name: string,
  userId: string
): Promise<{ skill?: Skill; error?: string }> {
  const supabase = createClient();
  const category = "Other";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data: existingSkill } = await supabase
    .from("skills")
    .select("*")
    .eq("slug", slug)
    .single();

  if (existingSkill) return { skill: existingSkill as Skill };

  await supabase.from("skill_suggestions").insert({
    suggested_by: userId,
    raw_name: name,
    category,
  });

  const { data: newSkill, error } = await supabase
    .from("skills")
    .insert({ canonical_name: name.trim(), slug, category, aliases: [], status: "pending_review" })
    .select()
    .single();

  if (error || !newSkill) return { error: "Failed to add skill. Please try again." };
  return { skill: newSkill as Skill };
}
