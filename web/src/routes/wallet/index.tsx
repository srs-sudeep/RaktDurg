import { useState } from "react";
import { useWallet } from "@/api/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function WalletPage() {
  const [donorId, setDonorId] = useState("");
  const [lookup, setLookup] = useState("");
  const { data, error, isFetching, refetch } = useWallet(lookup);

  const disabled = (error as { response?: { status?: number } })?.response?.status === 503;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blood Credit Wallet</h1>
        <p className="text-sm text-gray-500">Look up donor wallet balance (feature-flagged).</p>
      </div>

      {disabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Wallet is currently disabled. Enable <code>wallet_enabled</code> in Admin to use this feature.
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-white p-4">
        <div className="min-w-[280px] flex-1">
          <Label>Donor ID</Label>
          <Input value={donorId} onChange={(e) => setDonorId(e.target.value)} placeholder="UUID" />
        </div>
        <Button
          onClick={() => {
            setLookup(donorId.trim());
            void refetch();
          }}
          disabled={!donorId.trim() || isFetching}
        >
          Lookup
        </Button>
      </div>

      {lookup && data && (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Balance</div>
          <div className="text-3xl font-bold text-red-700">{data.balance}</div>
        </div>
      )}
      {lookup && error && !disabled && (
        <p className="text-sm text-red-600">Could not load wallet for this donor.</p>
      )}
    </div>
  );
}
