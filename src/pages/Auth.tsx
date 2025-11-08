import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Users, Zap, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showAuthForms, setShowAuthForms] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const fullName = formData.get("fullName") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully!");
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const { error } = await resetPassword(email);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent!");
      setShowReset(false);
    }

    setLoading(false);
  };

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReset(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showAuthForms) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background with image and pastel gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="QuickPace workspace background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 animate-gradient-shift"></div>
        </div>

        {/* Top Navigation */}
        <nav className="relative z-10 flex justify-between items-center px-8 py-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            QuickPace
          </h2>
          <div className="flex gap-3">
            <Button 
              variant="ghost"
              onClick={() => setShowAuthForms(true)}
              className="hover:bg-background/50"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setShowAuthForms(true)}
            >
              Sign Up
            </Button>
          </div>
        </nav>

        {/* Main Content - Left Aligned */}
        <div className="relative z-10 px-8 lg:px-16 py-12 max-w-3xl min-h-[calc(100vh-200px)] flex flex-col justify-between">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-sm font-semibold tracking-wide uppercase text-primary bg-primary/10 px-4 py-2 rounded-full backdrop-blur-sm">
                  Project Management Simplified
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  QuickPace
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-foreground leading-relaxed max-w-xl">
                Transform the way your team collaborates. Streamline workflows, track progress in real-time, and deliver projects faster than ever before.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background/40 backdrop-blur-sm border border-border/50">
                <CheckCircle2 className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground text-base">Intuitive Task Management</h3>
                  <p className="text-sm text-muted-foreground">Organize, prioritize, and track tasks with drag-and-drop simplicity</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background/40 backdrop-blur-sm border border-border/50">
                <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground text-base">Seamless Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">Connect your team with role-based access and real-time updates</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background/40 backdrop-blur-sm border border-border/50">
                <Zap className="h-6 w-6 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground text-base">Built for Speed</h3>
                  <p className="text-sm text-muted-foreground">Lightning-fast interface designed to keep your team moving</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Get Started Button */}
          <div className="mt-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 group shadow-lg"
              onClick={() => setShowAuthForms(true)}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              QuickPace
            </CardTitle>
          </div>
          <CardDescription className="text-base">Welcome! Let's get you organized</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => setShowReset(true)}
                >
                  Forgot password?
                </Button>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => setShowAuthForms(false)}
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
