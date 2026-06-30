"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  User as UserIcon,
  KeyRound,
  CheckCircle2,
  Trash2,
  Sparkles,
  Power,
} from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Your Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account details and your personal AI key.
        </p>
      </div>

      <ProfileCard />
      <UserAiKeyCard />
      <UserOpenRouterKeyCard />
    </div>
  );
}

function ProfileCard() {
  const profile = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [saved, setSaved] = useState(false);

  // Hydrate the form once the profile loads.
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name ?? "");
      setImage(profile.data.image ?? "");
    }
  }, [profile.data]);

  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.profile.get.invalidate();
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const invalidImage =
    image.trim().length > 0 && !/^https?:\/\//i.test(image.trim());
  const dirty =
    profile.data != null &&
    (name.trim() !== (profile.data.name ?? "") ||
      image.trim() !== (profile.data.image ?? ""));

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserIcon className="h-5 w-5 text-primary" /> Account
        </CardTitle>
        <CardDescription>
          Your display name and avatar. Your email is used to sign in and can’t
          be changed here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={name} image={image} />
              <div className="text-sm text-muted-foreground">
                {profile.data?.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Avatar image URL</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
              {invalidImage && (
                <p className="text-sm text-red-400">
                  Enter a valid http(s) image URL, or leave it blank.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={
                  !dirty || !name.trim() || invalidImage || update.isPending
                }
                onClick={() =>
                  update.mutate({ name: name.trim(), image: image.trim() })
                }
              >
                {update.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </span>
              )}
            </div>
            {update.error && (
              <p className="text-sm text-red-400">{update.error.message}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Avatar({ name, image }: { name: string; image: string }) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  if (image.trim() && /^https?:\/\//i.test(image.trim())) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image.trim()}
        alt="Avatar preview"
        className="h-14 w-14 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div className="h-14 w-14 rounded-full border border-border bg-muted flex items-center justify-center text-lg font-semibold text-primary">
      {initial}
    </div>
  );
}

function UserAiKeyCard() {
  const status = trpc.profile.getAiKeyStatus.useQuery();
  const utils = trpc.useUtils();
  const [apiKey, setApiKey] = useState("");

  const save = trpc.profile.setAnthropicKey.useMutation({
    onSuccess: () => {
      setApiKey("");
      utils.profile.getAiKeyStatus.invalidate();
    },
  });
  const remove = trpc.profile.removeAnthropicKey.useMutation({
    onSuccess: () => utils.profile.getAiKeyStatus.invalidate(),
  });
  const toggle = trpc.profile.setAiKeyEnabled.useMutation({
    onSuccess: () => utils.profile.getAiKeyStatus.invalidate(),
  });

  const enabled = status.data?.enabled !== false; // default on
  const invalidFormat =
    apiKey.length > 0 && !apiKey.trim().startsWith("sk-ant-");

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" /> Use your own AI key
        </CardTitle>
        <CardDescription>
          Add your own Anthropic (Claude) API key so AI usage is billed to your
          account. This is your personal default across all workspaces; a
          workspace can override it with its own key. Stored encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            MetroFlow runs{" "}
            <span className="text-primary font-medium">Claude Opus</span> only
            (high-tier models). Your key must have access to{" "}
            <code className="text-primary">claude-opus-4-8</code> — we verify
            this when you save it.
          </span>
        </div>

        {status.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : status.data?.hasKey ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {enabled ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">
                    Using your key{" "}
                    <code className="text-muted-foreground">
                      {status.data.maskedKey}
                    </code>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Power className="h-5 w-5" />
                  <span className="text-sm">
                    Key saved but turned off{" "}
                    <code>{status.data.maskedKey}</code> — workspace/platform
                    key is used.
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove
              </Button>
            </div>

            {/* On/off toggle — keep the key, just stop using it. */}
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="text-sm">
                <p className="font-medium">Use my key for AI</p>
                <p className="text-xs text-muted-foreground">
                  Turn off to fall back to the workspace/platform key without
                  deleting your key.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ enabled: !enabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  enabled ? "bg-primary" : "bg-muted"
                } ${toggle.isPending ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No personal key set — your workspace or the platform key is used.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!apiKey.trim() || invalidFormat || save.isPending}
            onClick={() => save.mutate({ apiKey: apiKey.trim() })}
          >
            {save.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {status.data?.hasKey ? "Replace key" : "Save key"}
          </Button>
        </div>
        {invalidFormat && (
          <p className="text-sm text-red-400">
            Only Anthropic keys are allowed (must start with sk-ant-).
          </p>
        )}
        {save.error && (
          <p className="text-sm text-red-400">{save.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

function UserOpenRouterKeyCard() {
  const status = trpc.profile.getAiKeyStatus.useQuery();
  const utils = trpc.useUtils();
  const [apiKey, setApiKey] = useState("");

  const save = trpc.profile.setOpenRouterKey.useMutation({
    onSuccess: () => {
      setApiKey("");
      utils.profile.getAiKeyStatus.invalidate();
    },
  });
  const remove = trpc.profile.removeOpenRouterKey.useMutation({
    onSuccess: () => utils.profile.getAiKeyStatus.invalidate(),
  });

  const invalidFormat =
    apiKey.length > 0 && !apiKey.trim().startsWith("sk-or-v1-");

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" /> Use your own OpenRouter
          key
        </CardTitle>
        <CardDescription>
          Add your own OpenRouter API key so AI usage (like critic review) is
          billed to your account. Stored encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : status.data?.hasOpenRouterKey ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">
                  Using your key{" "}
                  <code className="text-muted-foreground">
                    {status.data.openRouterMaskedKey}
                  </code>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No personal OpenRouter key set — your workspace or the platform key
            is used.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!apiKey.trim() || invalidFormat || save.isPending}
            onClick={() => save.mutate({ apiKey: apiKey.trim() })}
          >
            {save.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {status.data?.hasOpenRouterKey ? "Replace key" : "Save key"}
          </Button>
        </div>
        {invalidFormat && (
          <p className="text-sm text-red-400">
            OpenRouter keys typically start with sk-or-v1-.
          </p>
        )}
        {save.error && (
          <p className="text-sm text-red-400">{save.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
