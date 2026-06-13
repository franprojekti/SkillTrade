import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getDisplayName } from "@/lib/format";
import { requireAuth } from "@/lib/auth-guard";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/ui/count-up";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

interface SkillProfile {
  id: string;
  username: string;
  display_name: string | null;
  is_active: boolean;
}

interface TeachingExchange {
  id: string;
  skill_id: string;
  learner_id: string;
  connection_request_id: string;
  skills: { canonical_name: string } | null;
  profiles: SkillProfile | null;
}

interface LearningExchange {
  id: string;
  skill_id: string;
  teacher_id: string;
  connection_request_id: string;
  skills: { canonical_name: string } | null;
  profiles: SkillProfile | null;
}

interface PersonGroup {
  profile: SkillProfile;
  skills: string[];
  connection_request_id: string;
}

function groupByPerson(
  exchanges: (TeachingExchange | LearningExchange)[],
  personIdKey: "learner_id" | "teacher_id"
): PersonGroup[] {
  const map = new Map<string, PersonGroup>();
  for (const ex of exchanges) {
    const personId = (ex as unknown as Record<string, string>)[personIdKey];
    const profile = ex.profiles;
    if (!profile) continue;
    if (!map.has(personId)) {
      map.set(personId, {
        profile,
        skills: [],
        connection_request_id: ex.connection_request_id,
      });
    }
    const skillName = ex.skills?.canonical_name;
    if (skillName) map.get(personId)!.skills.push(skillName);
  }
  return Array.from(map.values());
}

function EmptySection({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground py-6 text-center">
      No {label} yet. Connect with someone from your matches.
    </p>
  );
}

function PersonCard({
  group,
  convId,
  index,
}: {
  group: PersonGroup;
  convId?: string;
  index: number;
}) {
  const { profile, skills } = group;
  const name = getDisplayName(profile);

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-border last:border-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link href={`/app/matches/${profile.id}`} className="flex-shrink-0">
        <InitialsAvatar username={profile.username} displayName={profile.display_name} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/app/matches/${profile.id}`}
          className="font-medium text-sm text-foreground hover:text-primary transition-colors"
        >
          {name}
        </Link>
        <div className="flex flex-wrap gap-1 mt-1">
          {skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs font-normal">
              {s}
            </Badge>
          ))}
        </div>
      </div>
      {convId && (
        <Link
          href={`/app/chat/${convId}`}
          className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Chat with ${name}`}
        >
          <MessageSquare className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const [teachingResult, learningResult, blockedResult] = await Promise.all([
    supabase
      .from("skill_exchanges")
      .select(
        "id, skill_id, learner_id, connection_request_id, skills(canonical_name), profiles!skill_exchanges_learner_id_fkey(id, username, display_name, is_active)"
      )
      .eq("teacher_id", user.id)
      .eq("status", "active"),
    supabase
      .from("skill_exchanges")
      .select(
        "id, skill_id, teacher_id, connection_request_id, skills(canonical_name), profiles!skill_exchanges_teacher_id_fkey(id, username, display_name, is_active)"
      )
      .eq("learner_id", user.id)
      .eq("status", "active"),
    supabase.rpc("get_blocked_ids", { p_user_id: user.id }),
  ]);

  const blockedSet = new Set<string>(blockedResult.data ?? []);

  const teachingRaw = (teachingResult.data ?? []) as unknown as TeachingExchange[];
  const learningRaw = (learningResult.data ?? []) as unknown as LearningExchange[];

  const filteredTeaching = teachingRaw.filter(
    (e) => e.profiles?.is_active && !blockedSet.has(e.learner_id)
  );
  const filteredLearning = learningRaw.filter(
    (e) => e.profiles?.is_active && !blockedSet.has(e.teacher_id)
  );

  // Build conversation map
  const allRequestIds = [
    ...filteredTeaching.map((e) => e.connection_request_id),
    ...filteredLearning.map((e) => e.connection_request_id),
  ];
  const convMap = new Map<string, string>();
  if (allRequestIds.length > 0) {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, connection_request_id")
      .in("connection_request_id", allRequestIds);
    (convs ?? []).forEach((c) => convMap.set(c.connection_request_id, c.id));
  }

  const teachingGroups = groupByPerson(filteredTeaching, "learner_id");
  const learningGroups = groupByPerson(filteredLearning, "teacher_id");

  const peopleITeach = teachingGroups.length;
  const peopleILearnFrom = learningGroups.length;
  const skillsITeach = new Set(filteredTeaching.map((e) => e.skill_id)).size;
  const skillsILearning = new Set(filteredLearning.map((e) => e.skill_id)).size;

  const hasError = teachingResult.error || learningResult.error;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-in fade-in-0 duration-300">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {hasError ? (
        <p className="text-center text-muted-foreground py-12">
          Something went wrong. Please refresh.
        </p>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-border border border-border rounded-xl mb-8 overflow-hidden">
            {[
              { value: peopleITeach, label: "Teaching" },
              { value: peopleILearnFrom, label: "Learning from" },
              { value: skillsITeach, label: "Skills taught" },
              { value: skillsILearning, label: "Skills learning" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-card px-3 py-4 text-center">
                <div className="text-2xl font-bold text-primary tabular-nums">
                  <CountUp to={value} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {/* Two sections side by side on wider screens, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* I Teach */}
            <div className="rounded-xl border border-border bg-card px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-foreground mb-1">I Teach</h2>
              {teachingGroups.length === 0 ? (
                <EmptySection label="students" />
              ) : (
                teachingGroups.map((g, i) => (
                  <PersonCard
                    key={g.profile.id}
                    group={g}
                    convId={convMap.get(g.connection_request_id)}
                    index={i}
                  />
                ))
              )}
            </div>

            {/* I Learn From */}
            <div className="rounded-xl border border-border bg-card px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-foreground mb-1">I Learn From</h2>
              {learningGroups.length === 0 ? (
                <EmptySection label="teachers" />
              ) : (
                learningGroups.map((g, i) => (
                  <PersonCard
                    key={g.profile.id}
                    group={g}
                    convId={convMap.get(g.connection_request_id)}
                    index={i}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
