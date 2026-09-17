import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login as apiLogin, registerUser } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";
import type { AuthMode, LoginModalProps } from "@nipponic/shared";

export type { AuthMode, LoginModalProps };

export function LoginModal({ isOpen, onClose, initialMode = "login" }: LoginModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "register") {
        if (!username.trim()) {
          setError("Username is required");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        // 1. Create user
        await registerUser({
          username: username.trim(),
          email: email.trim(),
          password,
        });

        // 2. Auto-login upon registration
        const authResponse = await apiLogin({
          email: email.trim(),
          password,
        });

        if (authResponse?.access_token) {
          await login(authResponse.access_token);
          onClose();
        }
      } else {
        const response = await apiLogin({ email: email.trim(), password });
        if (response?.access_token) {
          await login(response.access_token);
          onClose();
        }
      }
    } catch (err: any) {
      console.error(`Error in ${mode}:`, err);
      const rawMsg = err?.message || `Failed to ${mode === "register" ? "register" : "sign in"}`;
      const hasTryAgain = rawMsg.toLowerCase().includes("try again");
      const finalMsg = hasTryAgain
        ? rawMsg
        : rawMsg.endsWith(".")
        ? `${rawMsg} Please try again.`
        : `${rawMsg}. Please try again.`;

      setError(finalMsg);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === "login"
              ? "Access your saved notes, flashcard decks, and study progress."
              : "Start organizing your Japanese study notes and decks today."}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-muted/60 rounded-lg border border-border/70 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === "login"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === "register"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && (
          <div
            data-testid="server-waking-notice"
            className="p-3 rounded-lg bg-muted/60 text-muted-foreground text-xs flex items-start gap-2.5 border border-border/80 animate-in fade-in"
          >
            <Loader2 size={15} className="animate-spin text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                Connecting to server...
              </p>
              <p className="leading-relaxed">
                The free cloud server may still be waking up. This request can take up to 1 minute or more. Please wait...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. kenji"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            data-testid="login-submit-button"
            className="w-full cursor-pointer font-semibold"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
            {isLoading
              ? mode === "register"
                ? "Creating account..."
                : "Signing in..."
              : mode === "register"
              ? "Create Account"
              : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/50">
          {mode === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline cursor-pointer ml-1"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline cursor-pointer ml-1"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}