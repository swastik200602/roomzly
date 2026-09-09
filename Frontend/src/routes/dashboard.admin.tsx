import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Ban, Building2, Crown, FileText, Flag, History, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { adminApi, type AdminAuditLog, type AdminProperty, type AdminReport, type AdminUser, type AdminVerificationDocument } from "@/lib/api/admin";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin - Roomzly" }] }),
  component: AdminPage,
});

function statusPill(active: boolean) {
  return active ? "border-accent/30 text-accent bg-accent/10" : "border-destructive/30 text-destructive bg-destructive/10";
}

function AdminPage() {
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "properties" | "bookings" | "verification" | "reports" | "audit">("users");
  const [adminSearch, setAdminSearch] = useState("");
  const [phoneVerifiedFilter, setPhoneVerifiedFilter] = useState<"" | "true" | "false">("");
  const [reportStatus, setReportStatus] = useState<AdminReport["status"] | "">("");
  const [auditAction, setAuditAction] = useState("");
  const debouncedAdminSearch = useDebouncedValue(adminSearch.trim(), 300);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      toast.error("Admin access is required");
      navigate({ to: "/dashboard" });
    }
  }, [navigate, user]);

  const enabled = user?.role === "ADMIN";
  const overviewQuery = useQuery({ queryKey: ["admin", "overview"], queryFn: adminApi.overview, enabled });
  const usersQuery = useQuery({
    queryKey: ["admin", "users", debouncedAdminSearch, phoneVerifiedFilter],
    queryFn: () => adminApi.users({ q: debouncedAdminSearch, phoneVerified: phoneVerifiedFilter === "" ? undefined : phoneVerifiedFilter === "true", limit: 50 }),
    enabled
  });
  const propertiesQuery = useQuery({ queryKey: ["admin", "properties", debouncedAdminSearch], queryFn: () => adminApi.properties({ q: debouncedAdminSearch, limit: 50 }), enabled });
  const bookingsQuery = useQuery({ queryKey: ["admin", "bookings", debouncedAdminSearch], queryFn: () => adminApi.bookings({ q: debouncedAdminSearch, limit: 50 }), enabled });
  const auditQuery = useQuery({ queryKey: ["admin", "audit", debouncedAdminSearch, auditAction], queryFn: () => adminApi.auditLogs({ q: debouncedAdminSearch, action: auditAction || undefined, limit: 50 }), enabled });
  const verificationQuery = useQuery({ queryKey: ["admin", "verification"], queryFn: adminApi.verificationDocuments, enabled });
  const propertyVerificationQuery = useQuery({ queryKey: ["admin", "property-verification"], queryFn: adminApi.propertyVerificationDocuments, enabled });
  const reportsQuery = useQuery({ queryKey: ["admin", "reports", debouncedAdminSearch, reportStatus], queryFn: () => adminApi.reports({ q: debouncedAdminSearch, status: reportStatus || undefined, limit: 50 }), enabled });

  const userMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { active?: boolean; verified?: boolean; phoneVerified?: boolean; role?: "RESIDENT" | "OWNER" } }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update user"),
  });

  const propertyMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { active?: boolean; verified?: boolean; premium?: boolean } }) =>
      adminApi.updateProperty(id, payload),
    onSuccess: () => {
      toast.success("Property updated");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update property"),
  });

  const verificationMutation = useMutation({
    mutationFn: ({ id, property, payload }: { id: string; property?: boolean; payload: { status: AdminVerificationDocument["status"]; rejectionReason?: string } }) =>
      property ? adminApi.reviewPropertyVerificationDocument(id, payload) : adminApi.reviewVerificationDocument(id, payload),
    onSuccess: () => {
      toast.success("Verification updated");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update verification"),
  });

  const reportMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: AdminReport["status"]; resolution?: string } }) => adminApi.updateReport(id, payload),
    onSuccess: () => {
      toast.success("Report updated");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update report"),
  });

  if (!enabled) return null;

  const overview = overviewQuery.data;
  const users = usersQuery.data?.data ?? [];
  const properties = propertiesQuery.data?.data ?? [];
  const bookings = bookingsQuery.data?.data ?? [];
  const auditLogs = auditQuery.data?.data ?? [];
  const verificationDocs = verificationQuery.data ?? [];
  const propertyVerificationDocs = propertyVerificationQuery.data ?? [];
  const reports = reportsQuery.data?.data ?? [];

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Admin Control</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">Operations panel</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Secure moderation for users, listings, bookings, and verification work.
          </p>
        </div>
        <Link
          to="/dashboard/settings"
          className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi"
        >
          <Shield className="size-3.5" />
          Admin account
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-px bg-border border border-border">
        {[
          { label: "Users", value: overview?.users.total ?? 0, icon: Users },
          { label: "Active users", value: overview?.users.active ?? 0, icon: BadgeCheck },
          { label: "Owners", value: overview?.users.owners ?? 0, icon: Crown },
          { label: "Verified listings", value: overview?.properties.verified ?? 0, icon: Building2 },
          { label: "Open reports", value: overview?.reports ?? 0, icon: Flag },
          { label: "Revenue", value: formatCurrency(overview?.revenue ?? 0), icon: BadgeCheck },
        ].map((stat) => (
          <div key={stat.label} className="bg-background p-4 min-h-24">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <stat.icon className="size-3.5 text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-bold tracking-tighter mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["users", "properties", "bookings", "verification", "reports", "audit"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "px-3 py-2 border rounded-sm font-mono text-[10px] uppercase tracking-widest",
              tab === item ? "border-foreground bg-foreground text-background" : "border-border hover:bg-surface-hi",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={adminSearch}
          onChange={(event) => setAdminSearch(event.target.value)}
          placeholder="Search admin data"
          className="w-full sm:w-72 bg-surface-hi border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
        />
        {tab === "reports" && (
          <select
            value={reportStatus}
            onChange={(event) => setReportStatus(event.target.value as AdminReport["status"] | "")}
            className="bg-surface-hi border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
          >
            <option value="">All reports</option>
            <option value="PENDING">Pending</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        )}
        {tab === "users" && (
          <select
            value={phoneVerifiedFilter}
            onChange={(event) => setPhoneVerifiedFilter(event.target.value as "" | "true" | "false")}
            className="bg-surface-hi border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
          >
            <option value="">All mobile statuses</option>
            <option value="true">Mobile verified</option>
            <option value="false">Mobile unverified</option>
          </select>
        )}
        {tab === "audit" && (
          <select
            value={auditAction}
            onChange={(event) => setAuditAction(event.target.value)}
            className="bg-surface-hi border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
          >
            <option value="">All actions</option>
            <option value="USER_BAN">User ban</option>
            <option value="USER_UNBAN">User unban</option>
            <option value="PROPERTY_APPROVAL">Property approval</option>
            <option value="PROPERTY_REJECTION">Property rejection</option>
            <option value="REPORT_RESOLUTION">Report resolution</option>
            <option value="ADMIN_LOGIN">Admin login</option>
            <option value="ADMIN_LOGOUT">Admin logout</option>
          </select>
        )}
      </div>

      {tab === "users" && (
        <AdminUsers users={users} loading={usersQuery.isLoading} pending={userMutation.isPending} onUpdate={userMutation.mutate} />
      )}
      {tab === "properties" && (
        <AdminProperties
          properties={properties}
          loading={propertiesQuery.isLoading}
          pending={propertyMutation.isPending}
          onUpdate={propertyMutation.mutate}
        />
      )}
      {tab === "bookings" && (
        <div className="border border-border rounded-sm overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.1fr_1.4fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <div>Guest</div>
              <div>Property</div>
              <div>Dates</div>
              <div>Total</div>
              <div>Status</div>
            </div>
            {bookingsQuery.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading bookings</p>}
            {bookings.map((booking) => (
              <div key={booking.id} className="grid grid-cols-[1.1fr_1.4fr_1fr_0.8fr_0.8fr] gap-4 px-5 py-4 border-b border-border text-sm">
                <div>
                  <p className="font-medium">{booking.guest.firstName} {booking.guest.lastName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{booking.guest.email}</p>
                </div>
                <div>
                  <p className="truncate">{booking.property.title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{booking.property.city}</p>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
                </div>
                <div className="font-mono font-bold">{formatCurrency(booking.total)}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest">{booking.status.toLowerCase()}</div>
              </div>
            ))}
            {!bookingsQuery.isLoading && bookings.length === 0 && <p className="p-5 text-sm text-muted-foreground">No bookings found.</p>}
          </div>
        </div>
      )}
      {tab === "verification" && (
        <AdminVerification
          documents={verificationDocs}
          propertyDocuments={propertyVerificationDocs}
          loading={verificationQuery.isLoading || propertyVerificationQuery.isLoading}
          pending={verificationMutation.isPending}
          onReview={verificationMutation.mutate}
        />
      )}
      {tab === "reports" && (
        <AdminReports reports={reports} loading={reportsQuery.isLoading} pending={reportMutation.isPending} onUpdate={reportMutation.mutate} />
      )}
      {tab === "audit" && <AdminAudit logs={auditLogs} loading={auditQuery.isLoading} />}
    </div>
  );
}

function AdminUsers({
  users,
  loading,
  pending,
  onUpdate,
}: {
  users: AdminUser[];
  loading: boolean;
  pending: boolean;
  onUpdate: (input: { id: string; payload: { active?: boolean; verified?: boolean; phoneVerified?: boolean; role?: "RESIDENT" | "OWNER" } }) => void;
}) {
  return (
    <div className="border border-border rounded-sm overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[1.4fr_0.6fr_0.65fr_0.75fr_0.9fr_0.85fr_1.1fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>User</div>
          <div>Role</div>
          <div>Status</div>
          <div>Verified</div>
          <div>Mobile</div>
          <div>Activity</div>
          <div>Actions</div>
        </div>
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading users</p>}
        {users.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.4fr_0.6fr_0.65fr_0.75fr_0.9fr_0.85fr_1.1fr] gap-4 px-5 py-4 border-b border-border text-sm items-center">
            <div className="min-w-0">
              <p className="font-medium truncate">{item.firstName} {item.lastName}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{item.email}</p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest">{item.role.toLowerCase()}</div>
            <div>
              <span className={cn("inline-flex px-2 py-1 border rounded-sm font-mono text-[10px] uppercase tracking-widest", statusPill(item.active))}>
                {item.active ? "active" : "disabled"}
              </span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest">{item.verified ? "verified" : "pending"}</div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest">{item.phoneVerified ? "mobile verified" : "unverified"}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{item.phoneNumber ?? item.phone ?? "No phone"}</p>
              {item.phoneVerifiedAt && <p className="font-mono text-[10px] text-muted-foreground">{new Date(item.phoneVerifiedAt).toLocaleDateString()}</p>}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {item._count.properties} listings / {item._count.bookings} bookings
            </div>
            <div className="flex flex-wrap gap-2">
              {item.role !== "ADMIN" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onUpdate({ id: item.id, payload: { role: item.role === "OWNER" ? "RESIDENT" : "OWNER" } })}
                  className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
                >
                  Make {item.role === "OWNER" ? "resident" : "owner"}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => onUpdate({ id: item.id, payload: { verified: !item.verified } })}
                className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
              >
                {item.verified ? "Unverify" : "Verify"}
              </button>
              {item.role === "OWNER" && (
                <button
                  type="button"
                  disabled={pending || !(item.phoneNumber ?? item.phone)}
                  onClick={() => onUpdate({ id: item.id, payload: { phoneVerified: !item.phoneVerified } })}
                  className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
                >
                  {item.phoneVerified ? "Unverify mobile" : "Verify mobile"}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => onUpdate({ id: item.id, payload: { active: !item.active } })}
                className="px-2 py-1 border border-destructive/30 text-destructive rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 disabled:opacity-50"
              >
                <Ban className="inline size-3 mr-1" />
                {item.active ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
        {!loading && users.length === 0 && <p className="p-5 text-sm text-muted-foreground">No users found.</p>}
      </div>
    </div>
  );
}

function AdminProperties({
  properties,
  loading,
  pending,
  onUpdate,
}: {
  properties: AdminProperty[];
  loading: boolean;
  pending: boolean;
  onUpdate: (input: { id: string; payload: { active?: boolean; verified?: boolean; premium?: boolean } }) => void;
}) {
  return (
    <div className="border border-border rounded-sm overflow-x-auto">
      <div className="min-w-[1040px]">
        <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.7fr_0.8fr_1.2fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>Listing</div>
          <div>Owner</div>
          <div>Status</div>
          <div>Flags</div>
          <div>Activity</div>
          <div>Actions</div>
        </div>
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading properties</p>}
        {properties.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.5fr_1fr_0.7fr_0.7fr_0.8fr_1.2fr] gap-4 px-5 py-4 border-b border-border text-sm items-center">
            <div className="min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{item.city} / {formatCurrency(item.price)}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate">{item.owner.firstName} {item.owner.lastName}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{item.owner.email}</p>
            </div>
            <div>
              <span className={cn("inline-flex px-2 py-1 border rounded-sm font-mono text-[10px] uppercase tracking-widest", statusPill(item.active))}>
                {item.active ? "active" : "hidden"}
              </span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest">
              {item.verified ? "verified" : "unverified"} / {item.premium ? "premium" : "standard"}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {item.viewCount} views / {item._count.bookings} bookings
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onUpdate({ id: item.id, payload: { verified: !item.verified } })}
                className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
              >
                {item.verified ? "Unverify" : "Verify"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onUpdate({ id: item.id, payload: { premium: !item.premium } })}
                className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
              >
                {item.premium ? "Standard" : "Premium"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onUpdate({ id: item.id, payload: { active: !item.active } })}
                className="px-2 py-1 border border-destructive/30 text-destructive rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 disabled:opacity-50"
              >
                {item.active ? "Hide" : "Restore"}
              </button>
            </div>
          </div>
        ))}
        {!loading && properties.length === 0 && <p className="p-5 text-sm text-muted-foreground">No properties found.</p>}
      </div>
    </div>
  );
}

function AdminVerification({
  documents,
  propertyDocuments,
  loading,
  pending,
  onReview,
}: {
  documents: AdminVerificationDocument[];
  propertyDocuments: AdminVerificationDocument[];
  loading: boolean;
  pending: boolean;
  onReview: (input: { id: string; property?: boolean; payload: { status: AdminVerificationDocument["status"]; rejectionReason?: string } }) => void;
}) {
  const [resubmitTarget, setResubmitTarget] = useState<{ id: string; property: boolean } | null>(null);
  const [resubmitReason, setResubmitReason] = useState("");

  const all = [
    ...documents.map((document) => ({ ...document, scope: "Owner" as const })),
    ...propertyDocuments.map((document) => ({ ...document, scope: "Property" as const })),
  ];
  return (
    <div className="border border-border rounded-sm overflow-x-auto">
      <Dialog
        open={!!resubmitTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResubmitTarget(null);
            setResubmitReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Request Document Resubmission</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide a clear reason why this document needs resubmission (e.g. illegible photo, expired utility bill).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              value={resubmitReason}
              onChange={(e) => setResubmitReason(e.target.value)}
              placeholder="Enter reason for resubmission request..."
              rows={3}
              className="w-full bg-surface-hi border border-border rounded-sm p-2.5 text-sm outline-none focus:border-accent text-foreground resize-none"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setResubmitTarget(null);
                setResubmitReason("");
              }}
              className="px-3 py-1.5 border border-border rounded-sm font-mono text-xs uppercase tracking-wider hover:bg-surface-hi"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!resubmitReason.trim() || pending}
              onClick={() => {
                if (resubmitTarget && resubmitReason.trim()) {
                  onReview({
                    id: resubmitTarget.id,
                    property: resubmitTarget.property,
                    payload: { status: "RESUBMISSION_REQUESTED", rejectionReason: resubmitReason.trim() },
                  });
                  setResubmitTarget(null);
                  setResubmitReason("");
                }
              }}
              className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-sm font-mono text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              Request Resubmission
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-w-[980px]">
        <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1.2fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>Subject</div>
          <div>Document</div>
          <div>Scope</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading verification queue</p>}
        {all.map((document) => (
          <div key={`${document.scope}-${document.id}`} className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1.2fr] gap-4 px-5 py-4 border-b border-border text-sm items-center">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {document.scope === "Property"
                  ? document.property?.title
                  : `${document.user?.firstName ?? ""} ${document.user?.lastName ?? ""}`}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">
                {document.scope === "Property" ? document.property?.owner.email : document.user?.email ?? document.id}
              </p>
            </div>
            <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:underline">
              <FileText className="size-4" />
              {document.type}
            </a>
            <div className="font-mono text-[10px] uppercase tracking-widest">{document.scope}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest">{document.status.toLowerCase().replaceAll("_", " ")}</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onReview({ id: document.id, property: document.scope === "Property", payload: { status: "UNDER_REVIEW" } })}
                className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
              >
                Review
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onReview({ id: document.id, property: document.scope === "Property", payload: { status: "VERIFIED" } })}
                className="px-2 py-1 border border-accent/30 text-accent rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-accent/10 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setResubmitTarget({ id: document.id, property: document.scope === "Property" })}
                className="px-2 py-1 border border-destructive/30 text-destructive rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 disabled:opacity-50"
              >
                Resubmit
              </button>
            </div>
          </div>
        ))}
        {!loading && all.length === 0 && <p className="p-5 text-sm text-muted-foreground">No verification documents waiting.</p>}
      </div>
    </div>
  );
}

function AdminReports({
  reports,
  loading,
  pending,
  onUpdate,
}: {
  reports: AdminReport[];
  loading: boolean;
  pending: boolean;
  onUpdate: (input: { id: string; payload: { status: AdminReport["status"]; resolution?: string } }) => void;
}) {
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  return (
    <div className="border border-border rounded-sm overflow-x-auto">
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolutionNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Resolve User Report</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add resolution notes detailing the outcome of the investigation or actions taken.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Enter resolution notes (e.g. Warning issued to owner, listing details corrected)..."
              rows={3}
              className="w-full bg-surface-hi border border-border rounded-sm p-2.5 text-sm outline-none focus:border-accent text-foreground resize-none"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setResolveTarget(null);
                setResolutionNote("");
              }}
              className="px-3 py-1.5 border border-border rounded-sm font-mono text-xs uppercase tracking-wider hover:bg-surface-hi"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!resolutionNote.trim() || pending}
              onClick={() => {
                if (resolveTarget && resolutionNote.trim()) {
                  onUpdate({ id: resolveTarget, payload: { status: "RESOLVED", resolution: resolutionNote.trim() } });
                  setResolveTarget(null);
                  setResolutionNote("");
                }
              }}
              className="px-3 py-1.5 bg-accent text-accent-foreground rounded-sm font-mono text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              Resolve Report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-w-[980px]">
        <div className="grid grid-cols-[0.8fr_1.2fr_1fr_0.8fr_1.1fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>Type</div>
          <div>Target</div>
          <div>Reporter</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading reports</p>}
        {reports.map((report) => (
          <div key={report.id} className="grid grid-cols-[0.8fr_1.2fr_1fr_0.8fr_1.1fr] gap-4 px-5 py-4 border-b border-border text-sm items-center">
            <div className="font-mono text-[10px] uppercase tracking-widest">{report.type.toLowerCase().replaceAll("_", " ")}</div>
            <div className="min-w-0">
              <p className="truncate">{report.property?.title ?? report.reportedUser?.email ?? report.targetId}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate">{report.reporter.firstName} {report.reporter.lastName}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{report.reporter.email}</p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest">{report.status.toLowerCase()}</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onUpdate({ id: report.id, payload: { status: "INVESTIGATING" } })}
                className="px-2 py-1 border border-border rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-surface-hi disabled:opacity-50"
              >
                Investigate
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setResolveTarget(report.id)}
                className="px-2 py-1 border border-accent/30 text-accent rounded-sm font-mono text-[10px] uppercase tracking-widest hover:bg-accent/10 disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
        {!loading && reports.length === 0 && <p className="p-5 text-sm text-muted-foreground">No reports found.</p>}
      </div>
    </div>
  );
}

function AdminAudit({ logs, loading }: { logs: AdminAuditLog[]; loading: boolean }) {
  return (
    <div className="border border-border rounded-sm overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-4 px-5 py-3 bg-surface-hi border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>Action</div>
          <div>Admin</div>
          <div>Target</div>
          <div>Time</div>
          <div>Device</div>
        </div>
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading audit logs</p>}
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-4 px-5 py-4 border-b border-border text-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest">{log.action.toLowerCase().replaceAll("_", " ")}</div>
            <div className="min-w-0">
              <p className="truncate">{log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : "System"}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{log.admin?.email}</p>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">{log.targetType} / {log.targetId ?? "none"}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-muted-foreground truncate">{log.ipAddress ?? "unknown ip"}</p>
              <p className="text-xs text-muted-foreground truncate">{log.userAgent ?? "unknown device"}</p>
            </div>
          </div>
        ))}
        {!loading && logs.length === 0 && (
          <div className="p-5 text-sm text-muted-foreground flex items-center gap-2">
            <History className="size-4" />
            No audit entries yet.
          </div>
        )}
      </div>
    </div>
  );
}
