import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const registerMutation = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerMutation.mutate(
      { data: { name, email, phone, password } },
      {
        onSuccess: (data: any) => {
          setAuth(data.user, data.token ?? "");
          toast.success("Account created!");
          setLocation("/");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error ?? "Registration failed");
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <Link href="/">
              <span className="text-3xl font-bold text-secondary">Rayzan<span className="text-primary">Mart</span></span>
            </Link>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Create Account</h2>
            <p className="text-muted-foreground text-sm mt-1">নতুন অ্যাকাউন্ট তৈরি করুন</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="mt-1" />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white mt-2" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary font-medium hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
