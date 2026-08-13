import { FormEvent, useEffect, useRef, useState } from "react";
import { useWallet } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form";
import { Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

export default function WalletPage() {
  const [donorId, setDonorId] = useState("");
  const [lookup, setLookup] = useState("");
  const { data, error, isFetching, isSuccess } = useWallet(lookup);
  const toasted = useRef("");

  const disabled = (error as { response?: { status?: number } })?.response?.status === 503;

  useEffect(() => {
    if (!lookup || isFetching || !isSuccess || !data) return;
    const key = `${lookup}:${data.balance}`;
    if (toasted.current === key) return;
    toasted.current = key;
    showSuccessToast("Wallet loaded", `Balance ${data.balance}`);
  }, [lookup, isFetching, isSuccess, data]);

  function onLookup(e: FormEvent) {
    e.preventDefault();
    const id = donorId.trim();
    if (!id) return;
    toasted.current = "";
    setLookup(id);
  }

  return (
    <div className="space-y-4">
      {disabled && (
        <p className="border border-warning/30 bg-warning/10 px-3 py-2 text-[13px] text-warning">
          Wallet is disabled. Enable <code className="font-mono text-[12px]">wallet_enabled</code> in System.
        </p>
      )}

      <Panel title="Lookup">
        <form className="flex flex-wrap items-end gap-3" onSubmit={onLookup}>
          <FormField label="Donor ID" htmlFor="donor_id" className="min-w-[280px] flex-1">
            <FormInput
              id="donor_id"
              value={donorId}
              onChange={(e) => setDonorId(e.target.value)}
              placeholder="UUID"
            />
          </FormField>
          <Button type="submit" disabled={!donorId.trim() || isFetching}>
            {isFetching ? "Looking up…" : "Lookup"}
          </Button>
        </form>
      </Panel>

      {lookup && data && (
        <Panel title="Balance">
          <div className="text-3xl font-semibold tabular-nums text-primary">{data.balance}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Donor {lookup}</p>
        </Panel>
      )}
    </div>
  );
}
