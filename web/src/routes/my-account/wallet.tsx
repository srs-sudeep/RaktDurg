import { CitizenShell } from "@/components/CitizenShell";
import { useCitizenWallet } from "@/api/citizen";
import { formatDate } from "@/lib/utils";

export default function CitizenWalletPage() {
  const { data, error } = useCitizenWallet();
  const disabled = (error as { response?: { status?: number } } | null)?.response?.status === 503;

  return (
    <CitizenShell
      title="Blood credit wallet"
      subtitle="Review your available credits and transaction history."
    >
      <div className="space-y-8">
        {disabled && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Wallet is currently disabled. It can be enabled later by the blood bank admin.
          </div>
        )}

        <div>
          <p className="text-[12px] font-medium text-muted-foreground">Current balance</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">
            {data?.wallet.balance ?? "—"}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
          <div className="space-y-3">
            {(data?.transactions ?? []).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{txn.type.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(txn.recorded_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-foreground">{txn.amount}</p>
                  <p className="text-xs text-muted-foreground">Balance after: {txn.balance_after}</p>
                </div>
              </div>
            ))}
            {!disabled && data?.transactions?.length === 0 && (
              <p className="text-sm text-muted-foreground">No wallet transactions yet.</p>
            )}
          </div>
        </section>
      </div>
    </CitizenShell>
  );
}
