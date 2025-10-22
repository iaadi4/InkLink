"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { loginUserSchema } from "@repo/common/types";

type LoginUserInput = z.infer<typeof loginUserSchema>;

export default function InkLinkLogin() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginUserInput>({
    resolver: zodResolver(loginUserSchema),
  });

  async function onSubmit(data: LoginUserInput) {
    setApiError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.success === "false") {
        throw new Error(
          result.message || "Login failed. Please check your credentials."
        );
      }

      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      setApiError(errorMessage);
      console.error("Login error:", errorMessage);
    }
  }

  return (
    <div className="font-jakarta bg-gray-50 text-gray-800 min-h-screen flex flex-col relative overflow-hidden">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .font-jakarta {
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        @keyframes pan-dots {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <header className="relative z-10 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 8.5C15.5 9.33 14.83 10 14 10C13.17 10 12.5 9.33 12.5 8.5C12.5 7.67 13.17 7 14 7C14.83 7 15.5 7.67 15.5 8.5ZM8.5 15.5C8.5 16.33 7.83 17 7 17C6.17 17 5.5 16.33 5.5 15.5C5.5 14.67 6.17 14 7 14C7.83 14 8.5 14.67 8.5 15.5ZM12 17.5C10.5 17.5 9 17 7.5 16.5C7.3 16.4 7.1 16.2 6.9 16C6.7 15.8 6.5 15.6 6.3 15.4C5.7 14.7 5.2 13.9 4.9 13.1C4.6 12.3 4.5 11.5 4.5 10.7C4.5 8.6 6.1 7 8.2 7H15.8C17.9 7 19.5 8.6 19.5 10.7C19.5 11.5 19.4 12.3 19.1 13.1C18.8 13.9 18.3 14.7 17.7 15.4C17.5 15.6 17.3 15.8 17.1 16C16.9 16.2 16.7 16.4 16.5 16.5C15 17 13.5 17.5 12 17.5Z"
                  fill="#4F46E5" // Indigo-600
                />
              </svg>

              <span className="text-2xl font-bold text-gray-900">InkLink</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                className="hidden sm:inline-flex text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Link href="/">Home</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md shadow-xl border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-extrabold text-gray-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to continue to your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {apiError && (
                <p className="text-sm text-red-600 text-center mt-2">
                  {apiError}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-6">
              <Button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
