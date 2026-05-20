"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { LogoutButton } from "../logout-button";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

interface AccountEditorProps {
  userId: string;
  email: string;
  emailVerified: boolean;
  profile: Profile;
}

export function AccountEditor({
  userId,
  email,
  emailVerified,
  profile,
}: AccountEditorProps) {
  // ── Profile state ──
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Email verification state ──
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [resending, setResending] = useState(false);

  // ── Password state ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Avatar upload ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Helpers ──
  function getInitials(name: string): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }

  // ── Profile save ──
  async function handleProfileSave() {
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          company: company || null,
          phone: phone || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", userId);

      if (error) {
        setProfileMessage({ type: "error", text: error.message });
      } else {
        setProfileMessage({ type: "success", text: "Profile updated successfully." });
      }
    } catch {
      setProfileMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Avatar upload ──
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("siteId", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await res.json();
      setAvatarUrl(url);

      // Immediately persist the new avatar URL
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", userId);

      if (error) {
        setProfileMessage({ type: "error", text: error.message });
      } else {
        setProfileMessage({ type: "success", text: "Avatar updated." });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Failed to upload avatar." });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Resend verification ──
  async function handleResendVerification() {
    setResendMessage(null);
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setResendMessage({ type: "error", text: error.message });
      } else {
        setResendMessage({
          type: "success",
          text: "Verification email sent. Check your inbox.",
        });
      }
    } catch {
      setResendMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setResending(false);
    }
  }

  // ── Change password ──
  async function handlePasswordSave() {
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordMessage({ type: "error", text: error.message });
      } else {
        setPasswordMessage({ type: "success", text: "Password updated successfully." });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ─── Profile ─── */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="font-heading">Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover ring-1 ring-gray-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-600 ring-1 ring-gray-200">
                {getInitials(fullName)}
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-1 size-4" />
                {avatarUploading ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="border-gray-200 bg-white"
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              className="border-gray-200 bg-white"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="border-gray-200 bg-white"
            />
          </div>

          {/* Save */}
          <div className="space-y-1">
            <Button onClick={handleProfileSave} disabled={profileSaving}>
              {profileSaving ? "Saving…" : "Save profile"}
            </Button>
            {profileMessage && (
              <p
                className={`text-sm ${
                  profileMessage.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {profileMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Email ─── */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="font-heading">Email</CardTitle>
          <CardDescription>Your email address and verification status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input
              value={email}
              readOnly
              className="border-gray-200 bg-gray-50 text-gray-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            {emailVerified ? (
              <Badge className="bg-green-50 text-green-700 border-green-200 border">
                Verified
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border">
                Not Verified
              </Badge>
            )}
          </div>

          {!emailVerified && (
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                disabled={resending}
                onClick={handleResendVerification}
              >
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
              {resendMessage && (
                <p
                  className={`text-sm ${
                    resendMessage.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {resendMessage.text}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Change Password ─── */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="font-heading">Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="border-gray-200 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="border-gray-200 bg-white"
            />
          </div>

          <div className="space-y-1">
            <Button onClick={handlePasswordSave} disabled={passwordSaving}>
              {passwordSaving ? "Updating…" : "Update password"}
            </Button>
            {passwordMessage && (
              <p
                className={`text-sm ${
                  passwordMessage.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Danger Zone ─── */}
      <Card className="border-red-200 bg-white">
        <CardHeader>
          <CardTitle className="font-heading text-red-700">Danger Zone</CardTitle>
          <CardDescription>Sign out of your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
