import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthMe } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { FormActions, FormField, FormInput } from "@/components/ui/form";
import { Panel } from "@/components/ui/panel";
import { ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { showSuccessToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/utils";

export default function ProfilePage() {
  const { logout } = useAuth();
  const { data, isLoading, error } = useAuthMe();
  const [displayName, setDisplayName] = useState("");

  if (isLoading) return <p className="text-[13px] text-muted-foreground">Loading profile…</p>;
  if (error || !data) return <p className="text-[13px] text-destructive">Could not load profile.</p>;

  const role = data.role as UserRole;

  function onSave(e: FormEvent) {
    e.preventDefault();
    showSuccessToast("Profile noted", "Display name is managed by administrators for now.");
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Account"
        actions={
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        }
      >
        <dl className="grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[11px] text-muted-foreground">Username</dt>
            <dd className="font-medium">{data.username}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Display name</dt>
            <dd>{data.display_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Role</dt>
            <dd>{ROLE_LABELS[role] ?? data.role}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Email</dt>
            <dd>{data.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Phone</dt>
            <dd>{data.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Facility</dt>
            <dd className="font-mono text-[12px]">{data.facility_id || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Last login</dt>
            <dd>{data.last_login_at ? formatDateTime(data.last_login_at) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Member since</dt>
            <dd>{formatDateTime(data.created_at)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Preferences" description="Local display preference (admin can change role).">
        <form onSubmit={onSave} className="space-y-4">
          <FormField label="Preferred display name" htmlFor="display_name" className="max-w-sm">
            <FormInput
              id="display_name"
              value={displayName || data.display_name || ""}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={data.display_name || data.username}
            />
          </FormField>
          <FormActions flush>
            <Button type="submit" variant="outline">
              Save
            </Button>
          </FormActions>
        </form>
      </Panel>

      {role === "organizer" && (
        <Panel title="Organizer workspace">
          <p className="text-[13px] text-muted-foreground">
            Manage camp applications and view your organization profile from Camps.
          </p>
          <div className="mt-3 flex gap-2">
            <Link to="/camps">
              <Button size="sm">My camps</Button>
            </Link>
            <Link to="/camps/apply">
              <Button size="sm" variant="outline">
                Apply
              </Button>
            </Link>
          </div>
        </Panel>
      )}

      {role === "citizen" && (
        <Panel title="Citizen portal">
          <Link to="/my-account" className="text-[13px] text-primary hover:underline">
            Open citizen account →
          </Link>
        </Panel>
      )}
    </div>
  );
}
