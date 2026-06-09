import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Info, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PhoneVerificationPanel } from "@/components/auth/PhoneVerificationPanel";
import { ApiError } from "@/lib/api/client";
import { notificationsApi } from "@/lib/api/notifications";
import { usersApi } from "@/lib/api/users";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings - Roomzly" }] }),
  component: SettingsPage,
});

const TABS = ["Profile", "Notifications", "Verification"] as const;
const inputCls =
  "w-full bg-surface-hi border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors disabled:opacity-60";

function SettingsPage() {
  const user = useAuth((state) => state.user);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const showVerification = user?.role === "OWNER" || user?.role === "ADMIN";
  const tabs = showVerification ? TABS : TABS.filter((item) => item !== "Verification");

  useEffect(() => {
    if (!showVerification && tab === "Verification") setTab("Profile");
  }, [showVerification, tab]);

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          06 - Settings
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Workspace settings
        </h1>
      </header>

      <nav className="flex gap-1 border-b border-border overflow-x-auto -mx-2 px-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              "px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest border-b-2 -mb-px transition-colors",
              tab === item
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      {tab === "Profile" && <ProfileTab />}
      {tab === "Notifications" && <NotificationsTab />}
      {tab === "Verification" && showVerification && <VerificationTab />}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function ProfileTab() {
  const user = useAuth((state) => state.user);
  const accessToken = useAuth((state) => state.accessToken);
  const setSession = useAuth((state) => state.setSession);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const updateMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (updated) => {
      if (accessToken) setSession({ user: updated, accessToken });
      toast.success("Profile saved");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Profile could not be saved");
    },
  });
  const avatarMutation = useMutation({
    mutationFn: usersApi.avatar,
    onSuccess: (updated) => {
      if (accessToken) setSession({ user: updated, accessToken });
      toast.success("Avatar updated");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Avatar upload failed");
    },
  });

  if (!user) return null;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "R";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-16 rounded-full object-cover border border-border" />
        ) : (
          <div className="size-16 rounded-full bg-foreground text-background grid place-items-center font-mono font-bold">
            {initials}
          </div>
        )}
        <div>
          <label className="inline-flex cursor-pointer text-xs font-mono uppercase tracking-widest border border-border px-3 py-1.5 rounded-sm hover:bg-surface-hi">
            Upload photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) avatarMutation.mutate(file);
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, or WEBP. Max 4MB.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Field label="First name">
          <input className={inputCls} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </Field>
        <Field label="Last name">
          <input className={inputCls} value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </Field>
        <Field label="Email" hint="Used for login and account notices.">
          <input className={inputCls} value={user.email} disabled />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field label="Bio">
          <textarea rows={3} className={inputCls} value={bio} onChange={(event) => setBio(event.target.value)} />
        </Field>
      </div>

      <PhoneVerificationPanel phoneNumber={phone} />

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => updateMutation.mutate({ firstName, lastName, phone, bio })}
          disabled={updateMutation.isPending}
          className="bg-foreground text-background px-4 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-60"
        >
          {updateMutation.isPending ? "Saving" : "Save changes"}
        </button>
        <button
          onClick={() => {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setPhone(user.phone ?? "");
            setBio(user.bio ?? "");
            toast("Changes discarded");
          }}
          className="px-4 py-2.5 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
  });
  const notifications = notificationsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={async () => {
            await notificationsApi.markAllRead();
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
          className="px-3 py-2 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi"
        >
          Mark all read
        </button>
      </div>
      <div className="border border-border rounded-sm divide-y divide-border">
        {notificationsQuery.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading notifications</p>}
        {!notificationsQuery.isLoading && notifications.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((notification) => (
          <div key={notification.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notification.body}</p>
              </div>
              <span className={cn("text-[10px] font-mono uppercase tracking-widest", notification.readAt ? "text-muted-foreground" : "text-accent")}>
                {notification.readAt ? "Read" : "New"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerificationTab() {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const [type, setType] = useState("Aadhaar");
  const [file, setFile] = useState<File | null>(null);
  const documentsQuery = useQuery({
    queryKey: ["verification-documents"],
    queryFn: usersApi.verificationDocuments,
  });
  const uploadMutation = useMutation({
    mutationFn: usersApi.uploadVerificationDocument,
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["verification-documents"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Verification document submitted");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Document upload failed");
    },
  });
  const documents = documentsQuery.data ?? [];
  const latest = documents[0];
  const status = user?.verified ? "VERIFIED" : latest?.status ?? "MISSING";

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="size-4" />
        <AlertTitle>Identity verification</AlertTitle>
        <AlertDescription>
          Upload an identity document for account review. Submissions are stored securely and updates appear in notifications.
        </AlertDescription>
      </Alert>

      <div className="border border-border rounded-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Document review</h2>
            <p className="text-sm text-muted-foreground mt-1">Current status is based on your latest reviewed document.</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="grid md:grid-cols-[1fr_1.2fr] gap-4">
          <Field label="Document type">
            <select className={inputCls} value={type} onChange={(event) => setType(event.target.value)}>
              <option>Aadhaar</option>
              <option>Passport</option>
              <option>Driving License</option>
              <option>Voter ID</option>
              <option>Selfie Verification</option>
              <option>Property Ownership Proof</option>
            </select>
          </Field>
          <Field label="Document image" hint={file ? file.name : "JPEG, PNG, or WEBP. Max 8MB."}>
            <label className="flex items-center justify-between gap-3 bg-surface-hi border border-border rounded-sm px-3 py-2.5 text-sm cursor-pointer hover:border-foreground transition-colors">
              <span className="truncate">{file ? file.name : "Choose document image"}</span>
              <Upload className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </div>

        <button
          type="button"
          disabled={!file || uploadMutation.isPending}
          onClick={() => {
            if (file) uploadMutation.mutate({ type, file });
          }}
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-60"
        >
          <Upload className="size-3.5" />
          {uploadMutation.isPending ? "Uploading" : "Submit document"}
        </button>
      </div>

      <div className="border border-border rounded-sm divide-y divide-border">
        {documentsQuery.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading verification documents</p>}
        {!documentsQuery.isLoading && documents.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No verification documents submitted yet.</p>
        )}
        {documents.map((document) => (
          <div key={document.id} className="p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{document.type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted {new Date(document.createdAt).toLocaleDateString()}
                {document.reviewedAt ? ` · Reviewed ${new Date(document.reviewedAt).toLocaleDateString()}` : ""}
              </p>
              {document.rejectionReason && <p className="text-xs text-destructive mt-1">{document.rejectionReason}</p>}
            </div>
            <StatusBadge status={document.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "MISSING" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESUBMISSION_REQUESTED" }) {
  if (status === "VERIFIED") {
    return (
      <Badge className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600">
        <CheckCircle2 className="size-3" />
        Verified
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="size-3" />
        Rejected
      </Badge>
    );
  }
  if (status === "UNDER_REVIEW") return <Badge variant="secondary">Under review</Badge>;
  if (status === "RESUBMISSION_REQUESTED") return <Badge variant="destructive">Resubmission requested</Badge>;
  if (status === "PENDING") return <Badge variant="secondary">Pending verification</Badge>;
  return <Badge variant="outline">Not submitted</Badge>;
}
