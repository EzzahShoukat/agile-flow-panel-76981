import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Users, Zap } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <div className="w-full max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Hero content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  TaskFlow
                </h1>
                <p className="text-xl text-muted-foreground">
                  Streamline your workflow, boost productivity, and collaborate seamlessly with your team.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Organize Tasks Effortlessly</h3>
                    <p className="text-sm text-muted-foreground">Keep track of all your tasks in one intuitive dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Team Collaboration</h3>
                    <p className="text-sm text-muted-foreground">Work together seamlessly with real-time updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Increase Productivity</h3>
                    <p className="text-sm text-muted-foreground">Smart features to help you get more done</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full lg:w-auto text-lg px-8"
                onClick={() => setShowAuthForms(true)}
              >
                Get Started
              </Button>
            </div>

            {/* Right side - Image placeholder */}
            <div className="hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 aspect-square flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="text-8xl">📊</div>
                  <p className="text-2xl font-semibold text-foreground">Your Productivity Hub</p>
                </div>
              </div>
            </div>
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
              TaskFlow
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
