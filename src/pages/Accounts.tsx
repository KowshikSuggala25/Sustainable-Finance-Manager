import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Trash2,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";

export const Accounts = () => {
  const {
    accounts,
    transfers,
    loading,
    addAccount,
    initiateTransfer,
    verifyTransferOTP,
    deleteAccount,
  } = useAccounts();
  const { toast } = useToast();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showOTPVerify, setShowOTPVerify] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState<string | null>(
    null,
  );
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [addAccountStep, setAddAccountStep] = useState(1);

  const [accountForm, setAccountForm] = useState({
    email: "",
    account_name: "",
    account_number: "",
    balance: "",
  });

  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    description: "",
  });

  const handleVerifyEmail = async () => {
    if (!accountForm.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingEmail(true);
    try {
      // @ts-ignore
      const { data, error } = await supabase.rpc("check_email_exists", {
        email_to_check: accountForm.email,
      });

      if (error) throw error;

      if (data) {
        setAddAccountStep(2);
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with this email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      toast({
        title: "Error",
        description: "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.account_name) {
      toast({
        title: "Error",
        description: "Account name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addAccount({
        account_name: accountForm.account_name,
        account_number: accountForm.account_number || undefined,
        balance: parseFloat(accountForm.balance) || 0,
        associated_email: accountForm.email,
      });

      setShowAddAccount(false);
      setAccountForm({
        email: "",
        account_name: "",
        account_number: "",
        balance: "",
      });
      setAddAccountStep(1);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (
      !transferForm.from_account_id ||
      !transferForm.to_account_id ||
      !transferForm.amount
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (transferForm.from_account_id === transferForm.to_account_id) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same account",
        variant: "destructive",
      });
      return;
    }

    const fromAccount = accounts.find(
      (a) => a.id === transferForm.from_account_id,
    );
    const amount = parseFloat(transferForm.amount);

    if (fromAccount && fromAccount.balance < amount) {
      toast({
        title: "Insufficient Balance",
        description: "The source account doesn't have enough balance.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await initiateTransfer({
        from_account_id: transferForm.from_account_id,
        to_account_id: transferForm.to_account_id,
        amount,
        description: transferForm.description || undefined,
      });

      setPendingTransferId(data.transferId);

      // For testing purposes - display OTP on UI if returned by backend
      if (data.debugOtp) {
        toast({
          title: "🧪 Test Mode OTP",
          description: `Your verification code is: ${data.debugOtp}`,
          duration: 10000,
        });
        // Auto-fill for convenience
        setOtp(data.debugOtp);
      }

      setShowTransfer(false);
      setShowOTPVerify(true);
      setTransferForm({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        description: "",
      });
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!pendingTransferId || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyTransferOTP(pendingTransferId, otp);

      if (result.success) {
        setShowOTPVerify(false);
        setPendingTransferId(null);
        setOtp("");
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success/20 text-success">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/20 text-destructive">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAccountName = (accountId: string) => {
    return (
      accounts.find((a) => a.id === accountId)?.account_name ||
      "Unknown Account"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            Accounts & Transfers
          </h1>
          <p className="text-muted-foreground">
            Manage your accounts and transfer money securely
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowAddAccount(true)}
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>

          <Button
            className="gradient-primary glow-primary gap-2"
            onClick={() => setShowTransfer(true)}
            disabled={accounts.length < 2}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Money
          </Button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <Card className="glass-card p-8 col-span-full text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No accounts yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first account to get started
            </p>
            <Button
              onClick={() => setShowAddAccount(true)}
              className="gradient-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card
              key={account.id}
              className="glass-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAccount(account.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <h3 className="font-semibold text-lg mb-1">
                {account.account_name}
              </h3>
              {account.account_number && (
                <p className="text-sm text-muted-foreground mb-3">
                  •••• {account.account_number.slice(-4)}
                </p>
              )}

              <div className="flex items-center gap-1 text-2xl font-bold text-foreground">
                <IndianRupee className="w-5 h-5" />
                {account.balance.toLocaleString("en-IN")}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Recent Transfers */}
      {transfers.length > 0 && (
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transfers</h3>
          <div className="space-y-3">
            {transfers.slice(0, 10).map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {getAccountName(transfer.from_account_id)} →{" "}
                      {getAccountName(transfer.to_account_id)}
                    </p>
                    {transfer.description && (
                      <p className="text-sm text-muted-foreground">
                        {transfer.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(transfer.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    {formatCurrency(transfer.amount)}
                  </span>
                  {getStatusBadge(transfer.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addAccountStep === 1
                ? "Verify Email"
                : "Add New Account Details"}
            </DialogTitle>
            <DialogDescription>
              {addAccountStep === 1
                ? "Enter the email associated with the account"
                : "Enter the account details"}
            </DialogDescription>
          </DialogHeader>
          {addAccountStep === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  placeholder="e.g., Savings Account"
                  value={accountForm.account_name}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      account_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">
                  Account Number (Optional)
                </Label>
                <Input
                  id="account_number"
                  placeholder="e.g., 1234567890"
                  value={accountForm.account_number}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      account_number: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="0.00"
                  value={accountForm.balance}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, balance: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddAccount(false);
                setAddAccountStep(1);
              }}
            >
              Cancel
            </Button>
            {addAccountStep === 1 ? (
              <Button onClick={handleVerifyEmail} disabled={isVerifyingEmail}>
                {isVerifyingEmail ? "Verifying..." : "Next"}
              </Button>
            ) : (
              <Button
                onClick={handleAddAccount}
                disabled={isSubmitting}
                className="gradient-primary"
              >
                {isSubmitting ? "Adding..." : "Add Account"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
            <DialogDescription>
              Transfer funds between your accounts. You'll receive an OTP for
              verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>From Account *</Label>
              <Select
                value={transferForm.from_account_id}
                onValueChange={(value) =>
                  setTransferForm({ ...transferForm, from_account_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({formatCurrency(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Account *</Label>
              <Select
                value={transferForm.to_account_id}
                onValueChange={(value) =>
                  setTransferForm({ ...transferForm, to_account_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== transferForm.from_account_id)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} (
                        {formatCurrency(account.balance)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={transferForm.amount}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Monthly savings"
                value={transferForm.description}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInitiateTransfer}
              disabled={isSubmitting}
              className="gradient-primary"
            >
              {isSubmitting ? "Sending OTP..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPVerify} onOpenChange={setShowOTPVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Transfer</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to your email
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOTPVerify(false);
                setOtp("");
                setPendingTransferId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOTP}
              disabled={isSubmitting || otp.length !== 6}
              className="gradient-primary"
            >
              {isSubmitting ? "Verifying..." : "Verify & Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
