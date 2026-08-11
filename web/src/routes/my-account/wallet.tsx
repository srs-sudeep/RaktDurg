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
      {disabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Wallet is currently disabled. It can be enabled later by the blood bank admin.
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Current balance</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">{data?.wallet.balance ?? "—"}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
        <div className="mt-4 space-y-3">
          {(data?.transactions ?? []).map((txn) => (
            <div key={txn.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="font-medium text-gray-900">{txn.type.toUpperCase()}</p>
                <p className="text-sm text-gray-500">{formatDate(txn.recorded_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{txn.amount}</p>
                <p className="text-xs text-gray-500">Balance after: {txn.balance_after}</p>
              </div>
            </div>
          ))}
          {!disabled && data?.transactions?.length === 0 && (
            <p className="text-sm text-gray-500">No wallet transactions yet.</p>
          )}
        </div>
      </div>
    </CitizenShell>
  );
}
