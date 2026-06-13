"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Eye, EyeOff, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerAction } from "./actions";
import { validateUsername } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? "Creating account..." : "Create Account"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const formatError = username ? validateUsername(username) : null;
    setUsernameError(formatError);
    setUsernameAvailable(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username || formatError) { setCheckingUsername(false); return; }

    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("is_username_available", {
        p_username: username.toLowerCase().trim(),
      });
      setCheckingUsername(false);
      setUsernameAvailable(data === true);
    }, 500);
  }, [username]);

  useEffect(() => {
    if (!password) { setPasswordStrength(0); return; }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-600"][passwordStrength];

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Enter your username"
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={usernameError ? "border-destructive" : ""}
          required
        />
        {usernameError && (
          <p className="text-sm text-destructive">{usernameError}</p>
        )}
        {!usernameError && username && (
          <p className="text-sm flex items-center gap-1.5">
            {checkingUsername && (
              <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking...</span></>
            )}
            {!checkingUsername && usernameAvailable === true && (
              <><CheckCircle className="h-3 w-3 text-primary" /><span className="text-primary font-medium">{username.toLowerCase()}</span></>
            )}
            {!checkingUsername && usernameAvailable === false && (
              <><XCircle className="h-3 w-3 text-destructive" /><span className="text-destructive">Username already taken.</span></>
            )}
          </p>
        )}
        <p className="text-xs text-muted-foreground">3–20 characters, letters, numbers, underscores.</p>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Choose a strong password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1 h-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColor : "bg-border"}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{strengthLabel}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground border border-border rounded-md px-3 py-2">
        There is no password reset. If you forget your password, your account cannot be recovered.
      </p>

      <SubmitButton disabled={usernameAvailable === false || checkingUsername} />
    </form>
  );
}
