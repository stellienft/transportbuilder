"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
  company: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormData) {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            company: data.company ?? null,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Insert into profiles table — use upsert to handle RLS edge cases
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            company: data.company ?? null,
          });

        if (profileError) {
          console.error("Failed to create profile:", profileError.message);
          // Non-fatal — profile can be created later via trigger or admin
        }
      }

      // Show verification toast
      toast.success("Account created! 🎉", {
        description: "Please check your email to verify your account before logging in.",
        duration: 8000,
      });

      // Redirect to login after a short delay so the toast is visible
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-sm">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-heading font-bold text-gray-900">
            Create Account
          </CardTitle>
          <CardDescription className="text-gray-500 text-base">
            Get started with your free Transport Builder account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2.5">
              <Label htmlFor="full_name" className="text-gray-700 text-sm">
                Full Name
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="company" className="text-gray-700 text-sm">
                Company <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="Acme Transport Ltd"
                className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                {...register("company")}
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-gray-700 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-gray-700 text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5 pt-4">
            <Button
              type="submit"
              className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-gray-900 hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
