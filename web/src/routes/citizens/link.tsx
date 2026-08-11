import { FormEvent } from "react";
import { useLinkCitizen } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { FormActions, FormField, FormGrid, FormInput } from "@/components/ui/form";
import { Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

export default function LinkCitizenPage() {
  const linkCitizen = useLinkCitizen();

  async function onLinkCitizen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result = await linkCitizen.mutateAsync({
        username: String(fd.get("username")),
        donor_id: String(fd.get("donor_id")),
      });
      showSuccessToast("Citizen linked", `${result.username} → ${result.donor_name}`);
      e.currentTarget.reset();
    } catch {
      /* errors toasted by api client */
    }
  }

  return (
    <div className="space-y-3">
      <Panel
        title="Link citizen login"
        description="Connect a citizen username to an existing donor profile for wallet and camp bookings."
      >
        <form onSubmit={onLinkCitizen} className="space-y-3">
          <FormGrid>
            <FormField label="Citizen username" htmlFor="username" required>
              <FormInput id="username" name="username" placeholder="citizen_ajay" required />
            </FormField>
            <FormField label="Donor ID (UUID)" htmlFor="donor_id" required>
              <FormInput id="donor_id" name="donor_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
            </FormField>
          </FormGrid>
          <FormActions>
            <Button type="submit" disabled={linkCitizen.isPending}>
              {linkCitizen.isPending ? "Linking…" : "Link account"}
            </Button>
          </FormActions>
        </form>
      </Panel>

      <Panel title="Notes">
        <ul className="list-disc space-y-1 pl-4 text-[13px] text-slate-600">
          <li>Citizen must already have a login with role <code className="text-[12px]">citizen</code>.</li>
          <li>Donor profile must exist and not already be linked to another user.</li>
          <li>Find donor IDs from the Donors list or donor detail page.</li>
        </ul>
      </Panel>
    </div>
  );
}
