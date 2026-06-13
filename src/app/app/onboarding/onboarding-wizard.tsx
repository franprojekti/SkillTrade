"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SkillSelector } from "@/components/ui/skill-selector";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { createClient } from "@/lib/supabase/client";
import { formatConnectionPref } from "@/lib/format";
import type { Skill } from "@/types/database";

interface OnboardingWizardProps {
  userId: string;
  username: string;
  allSkills: Skill[];
}

const STEPS = [
  { title: "About You", subtitle: "Tell others a little about yourself" },
  { title: "Your Location", subtitle: "Where are you based?" },
  { title: "Skills I Offer", subtitle: "What can you teach or help with?" },
  { title: "Skills I Want to Learn", subtitle: "What do you want to get better at?" },
  { title: "All Done!", subtitle: "Review your profile" },
];

type ConnectionPref = "in-person" | "online" | "both";

export function OnboardingWizard({ userId, username, allSkills }: OnboardingWizardProps) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [yearsExp, setYearsExp] = useState("");

  // Step 2 state
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [connectionPref, setConnectionPref] = useState<ConnectionPref>("both");

  // Step 3 & 4 state
  const [offeredSkillIds, setOfferedSkillIds] = useState<string[]>([]);
  const [wantedSkillIds, setWantedSkillIds] = useState<string[]>([]);

  const [localSkills, setLocalSkills] = useState<Skill[]>(allSkills);

  const STORAGE_KEY = `onboarding_progress_${userId}`;

  // Restore progress on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.step === "number") setStep(d.step);
        if (typeof d.displayName === "string") setDisplayName(d.displayName);
        if (typeof d.role === "string") setRole(d.role);
        if (typeof d.yearsExp === "string") setYearsExp(d.yearsExp);
        if (typeof d.country === "string") setCountry(d.country);
        if (typeof d.city === "string") setCity(d.city);
        if (typeof d.area === "string") setArea(d.area);
        if (d.connectionPref) setConnectionPref(d.connectionPref);
        if (Array.isArray(d.offeredSkillIds)) setOfferedSkillIds(d.offeredSkillIds);
        if (Array.isArray(d.wantedSkillIds)) setWantedSkillIds(d.wantedSkillIds);
      }
    } catch {}
    setLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress whenever state changes (only after initial restore)
  useEffect(() => {
    if (!loaded) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      step, displayName, role, yearsExp, country, city, area, connectionPref, offeredSkillIds, wantedSkillIds,
    }));
  }, [loaded, step, displayName, role, yearsExp, country, city, area, connectionPref, offeredSkillIds, wantedSkillIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  async function handleSuggestSkill(name: string): Promise<{ skill?: Skill; error?: string }> {
    const supabase = createClient();
    const category = "Other";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { data: existingSkill } = await supabase
      .from("skills")
      .select("*")
      .eq("slug", slug)
      .single();

    if (existingSkill) {
      return { skill: existingSkill as Skill };
    }

    await supabase.from("skill_suggestions").insert({
      suggested_by: userId,
      raw_name: name,
      category,
    });

    const { data: newSkill, error } = await supabase
      .from("skills")
      .insert({
        canonical_name: name.trim(),
        slug,
        category,
        aliases: [],
        status: "pending_review",
      })
      .select()
      .single();

    if (error || !newSkill) {
      return { error: "Failed to add skill. Please try again." };
    }

    setLocalSkills((prev) => [...prev, newSkill as Skill]);
    return { skill: newSkill as Skill };
  }

  async function handleComplete() {
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

      // Insert offered skills
      if (offeredSkillIds.length > 0) {
        const { error: offeredError } = await supabase.from("user_skills").insert(
          offeredSkillIds.map((skill_id) => ({
            user_id: userId,
            skill_id,
            skill_type: "offered" as const,
          }))
        );
        if (offeredError) throw offeredError;
      }

      // Insert wanted skills
      if (wantedSkillIds.length > 0) {
        const { error: wantedError } = await supabase.from("user_skills").insert(
          wantedSkillIds.map((skill_id) => ({
            user_id: userId,
            skill_id,
            skill_type: "wanted" as const,
          }))
        );
        if (wantedError) throw wantedError;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/app/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  function canProceed(): boolean {
    if (step === 2 && offeredSkillIds.length === 0) return false;
    if (step === 3 && wantedSkillIds.length === 0) return false;
    return true;
  }

  const offeredSkills = localSkills.filter((s) => offeredSkillIds.includes(s.id));
  const wantedSkills = localSkills.filter((s) => wantedSkillIds.includes(s.id));

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{STEPS[step].title}</h1>
        <p className="text-muted-foreground mt-1">{STEPS[step].subtitle}</p>
      </div>

      {/* Step content */}
      <div className="space-y-5">
        {step === 0 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="display_name">
                Display Name <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder=""
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This is shown to other users instead of your username. Leave blank to use your username.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">
                Role <span className="text-muted-foreground text-xs">(optional)</span>
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
                Years of experience <span className="text-muted-foreground text-xs">(optional)</span>
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
          </>
        )}

        {step === 1 && (
          <>
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
              <p className="text-xs text-muted-foreground">Ovo je preferencija, ne filter — i dalje ćeš vidjeti sve matcheve.</p>
              <div className="grid grid-cols-3 gap-2">
                {(["in-person", "online", "both"] as ConnectionPref[]).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setConnectionPref(pref)}
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
          </>
        )}

        {step === 2 && (
          <SkillSelector
            allSkills={localSkills}
            selectedSkillIds={offeredSkillIds}
            onChange={setOfferedSkillIds}
            placeholder="Enter a skill you can teach..."
            maxSelected={10}
            onSuggest={handleSuggestSkill}
          />
        )}

        {step === 3 && (
          <SkillSelector
            allSkills={localSkills}
            selectedSkillIds={wantedSkillIds}
            onChange={setWantedSkillIds}
            placeholder="Enter a skill you want to learn..."
            maxSelected={10}
            onSuggest={handleSuggestSkill}
          />
        )}

        {step === 4 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <InitialsAvatar username={username} displayName={displayName || null} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{displayName || username}</p>
                {role && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {role}{yearsExp ? ` · ${yearsExp} yrs` : ""}
                  </p>
                )}
                {city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {[area, city, country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {offeredSkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Teaches you:</p>
                  <div className="flex flex-wrap gap-1">
                    {offeredSkills.map((s) => (
                      <Badge key={s.id} className="bg-muted text-foreground hover:bg-muted/80 border-0 text-xs">
                        {s.canonical_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {wantedSkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Learns from you:</p>
                  <div className="flex flex-wrap gap-1">
                    {wantedSkills.map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {s.canonical_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">
              <span className="text-xs text-muted-foreground">Meets: {formatConnectionPref(connectionPref)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step 2 & 3 required notice */}
      {(step === 2 || step === 3) && !canProceed() && (
        <p className="mt-3 text-sm text-amber-600">
          Please enter at least one skill to continue.
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={saving}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            {step === 0 ? "Continue" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving}>
            {saving ? "Saving..." : "Complete Profile"}
          </Button>
        )}
      </div>
    </div>
  );
}
