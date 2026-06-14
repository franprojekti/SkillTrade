"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SkillSelector } from "@/components/ui/skill-selector";
import { createClient } from "@/lib/supabase/client";
import { suggestSkill } from "@/lib/suggest-skill";
import type { Profile, Skill } from "@/types/database";

type ConnectionPref = "in-person" | "online" | "both";

interface EditProfileFormProps {
  userId: string;
  profile: Profile;
  allSkills: Skill[];
  offeredSkillIds: string[];
  wantedSkillIds: string[];
}

export function EditProfileForm({
  userId,
  profile,
  allSkills,
  offeredSkillIds: initialOffered,
  wantedSkillIds: initialWanted,
}: EditProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [role, setRole] = useState(profile.bio ?? "");
  const [yearsExp, setYearsExp] = useState(String(profile.years_experience ?? ""));
  const [country, setCountry] = useState(profile.location_country ?? "");
  const [city, setCity] = useState(profile.location_city ?? "");
  const [area, setArea] = useState(profile.location_area ?? "");
  const [connectionPref, setConnectionPref] = useState<ConnectionPref>(
    (profile.connection_preference as ConnectionPref) ?? "both"
  );
  const [offeredSkillIds, setOfferedSkillIds] = useState<string[]>(initialOffered);
  const [wantedSkillIds, setWantedSkillIds] = useState<string[]>(initialWanted);
  const [localSkills, setLocalSkills] = useState<Skill[]>(allSkills);

  async function handleSuggestSkill(name: string): Promise<{ skill?: Skill; error?: string }> {
    const result = await suggestSkill(name, userId);
    if (result.skill) setLocalSkills((prev) => [...prev, result.skill!]);
    return result;
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: role.trim() || null,
          years_experience: yearsExp ? parseInt(yearsExp) : null,
          location_country: country.trim() || null,
          location_city: city.trim() || null,
          location_area: area.trim() || null,
          connection_preference: connectionPref,
          onboarding_completed: true,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Diff-based skill update: insert added, delete removed (never delete-all-then-insert)
      const addedOffered = offeredSkillIds.filter(id => !initialOffered.includes(id));
      const addedWanted = wantedSkillIds.filter(id => !initialWanted.includes(id));
      const removedOffered = initialOffered.filter(id => !offeredSkillIds.includes(id));
      const removedWanted = initialWanted.filter(id => !wantedSkillIds.includes(id));

      const toInsert = [
        ...addedOffered.map(skill_id => ({ user_id: userId, skill_id, skill_type: "offered" as const })),
        ...addedWanted.map(skill_id => ({ user_id: userId, skill_id, skill_type: "wanted" as const })),
      ];
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from("user_skills").insert(toInsert);
        if (insertError) throw insertError;
      }

      if (removedOffered.length > 0) {
        const { error } = await supabase.from("user_skills").delete()
          .eq("user_id", userId).eq("skill_type", "offered").in("skill_id", removedOffered);
        if (error) throw error;
      }
      if (removedWanted.length > 0) {
        const { error } = await supabase.from("user_skills").delete()
          .eq("user_id", userId).eq("skill_type", "wanted").in("skill_id", removedWanted);
        if (error) throw error;
      }

      toast.success("Profile updated");
      router.push("/app/profile");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="font-semibold text-foreground">About You</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">
              Display Name{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder=""
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">
              Role{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder=""
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              e.g. Student, Freelance Designer, Software Engineer
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="years_exp">
              Years of experience{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="years_exp"
              type="number"
              min="0"
              max="50"
              value={yearsExp}
              onChange={(e) => setYearsExp(e.target.value)}
              placeholder=""
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Location */}
      <section className="space-y-4">
        <h2 className="font-semibold text-foreground">Location</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder=""
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder=""
              maxLength={60}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area">
            Neighborhood / Campus / Area{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder=""
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label>Connection Preference</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["in-person", "online", "both"] as ConnectionPref[]).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setConnectionPref(pref)}
                aria-pressed={connectionPref === pref}
                className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                  connectionPref === pref
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {pref === "in-person" ? "In Person" : pref === "online" ? "Online" : "Both"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Skills I Offer */}
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Skills I Offer</h2>
        <p className="text-sm text-muted-foreground">What can you teach or help others with?</p>
        <SkillSelector
          allSkills={localSkills}
          selectedSkillIds={offeredSkillIds}
          onChange={setOfferedSkillIds}
          placeholder="Enter a skill you can teach..."
          maxSelected={10}
          onSuggest={handleSuggestSkill}
          disabledSkillIds={wantedSkillIds}
        />
      </section>

      <Separator />

      {/* Skills I Want */}
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Skills I Want to Learn</h2>
        <p className="text-sm text-muted-foreground">What do you want to get better at?</p>
        <SkillSelector
          allSkills={localSkills}
          selectedSkillIds={wantedSkillIds}
          onChange={setWantedSkillIds}
          placeholder="Enter a skill you want to learn..."
          maxSelected={10}
          onSuggest={handleSuggestSkill}
          disabledSkillIds={offeredSkillIds}
        />
      </section>

      {/* Save */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none sm:px-8">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/app/profile")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
