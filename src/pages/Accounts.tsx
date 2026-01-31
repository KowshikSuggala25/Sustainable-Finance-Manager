import { useState } from "react";
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
  User,
  Send,
} from "lucide-react";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const [accountForm, setAccountForm] = useState({
    account_name: "",
    account_number: "",
    balance: "",
    email: "",
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    description: "",
    recipient_email: "",
  });
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [recipientEmailOtp, setRecipientEmailOtp] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleVerifyEmail = async () => {
    if (!accountForm.email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountForm.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setVerifyingEmail(true);
    try {
      console.log("Verifying email:", accountForm.email);

      // Use rpc function to check if email exists (bypasses RLS)
      // @ts-ignore - RPC function created but types not generated
      const { data, error } = await (supabase.rpc as any)(
        "check_email_exists",
        {
          email_to_check: accountForm.email,
        },
      );

      console.log("Check email response:", { data, error });

      if (error) {
        console.error("Error checking email:", error);
        throw error;
      }

      if (!data) {
        toast({
          title: "Email Not Found",
          description:
            "This email is not registered in the system. Please use a registered email.",
          variant: "destructive",
        });
        return;
      }

      setIsEmailVerified(true);
      toast({
        title: "Email Verified",
        description:
          "Email found in database. You can now create your account.",
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleAddAccount = async () => {
    if (!isEmailVerified) {
      toast({
        title: "Error",
        description: "Please verify your email first",
        variant: "destructive",
      });
      return;
    }

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
        account_name: "",
        account_number: "",
        balance: "",
        email: "",
      });
      setIsEmailVerified(false);
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
      !transferForm.amount ||
      !transferForm.recipient_email
    ) {
      toast({
        title: "Error",
        description:
          "Please fill all required fields including recipient email",
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
      // First verify recipient email exists and send OTP
      const data = await initiateTransfer({
        from_account_id: transferForm.from_account_id,
        to_account_id: transferForm.to_account_id,
        amount,
        description: transferForm.description || undefined,
        recipient_email: transferForm.recipient_email,
      });

      setPendingTransferId(data.transferId);
      setShowTransfer(false);
      setShowEmailVerify(true);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyRecipientEmail = async () => {
    if (!pendingTransferId || recipientEmailOtp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyTransferOTP(
        pendingTransferId,
        recipientEmailOtp,
      );

      if (result.success) {
        setShowEmailVerify(false);
        setRecipientEmailOtp("");
        toast({
          title: "Email Verified",
          description:
            "Recipient email verified. Enter your OTP to complete transfer.",
        });
        setShowOTPVerify(true);
      }
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
        setTransferForm({
          from_account_id: "",
          to_account_id: "",
          amount: "",
          description: "",
          recipient_email: "",
        });
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="glass-card p-6 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center aspect-square gap-3 hover:scale-105"
              onClick={() => {
                setSelectedAccount(account);
                setTransferForm((prev) => ({
                  ...prev,
                  to_account_id: account.id,
                  recipient_email: account.associated_email || "",
                  amount: "",
                  from_account_id: "",
                }));
              }}
            >
              <div className="flex w-full justify-end absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAccount(account.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 rounded-full bg-primary/10">
                <User className="w-8 h-8 text-primary" />
              </div>

              <h3 className="font-semibold text-xl text-center">
                {account.account_name}
              </h3>
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
      <Dialog
        open={showAddAccount}
        onOpenChange={(open) => {
          setShowAddAccount(open);
          if (!open) {
            setAccountForm({
              account_name: "",
              account_number: "",
              balance: "",
              email: "",
            });
            setIsEmailVerified(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Verify your email and create a new account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Email Verification Section */}
            <div className="space-y-2">
              <Label htmlFor="account_email">Email Address *</Label>
              <div className="flex gap-2">
                <Input
                  id="account_email"
                  type="email"
                  placeholder="your@email.com"
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      email: e.target.value,
                    })
                  }
                  disabled={isEmailVerified}
                />
                <Button
                  onClick={handleVerifyEmail}
                  disabled={
                    verifyingEmail || isEmailVerified || !accountForm.email
                  }
                  className={
                    isEmailVerified ? "bg-success" : "gradient-primary"
                  }
                >
                  {verifyingEmail
                    ? "Verifying..."
                    : isEmailVerified
                      ? "Verified"
                      : "Verify"}
                </Button>
              </div>
              {isEmailVerified && (
                <p className="text-xs text-success flex items-center gap-1">
                  <span>✓</span> Email verified successfully
                </p>
              )}
            </div>

            {/* Account Details - Only show after email verification */}
            {isEmailVerified && (
              <>
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
                      setAccountForm({
                        ...accountForm,
                        balance: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
              Cancel
            </Button>
            {isEmailVerified && (
              <Button
                onClick={handleAddAccount}
                disabled={isSubmitting}
                className="gradient-primary"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
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
              <Label htmlFor="recipient_email">Recipient Email *</Label>
              <Input
                id="recipient_email"
                type="email"
                placeholder="recipient@example.com"
                value={transferForm.recipient_email}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    recipient_email: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter the email of the account holder to verify their identity
              </p>
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

      {/* Email Verification Dialog */}
      <Dialog open={showEmailVerify} onOpenChange={setShowEmailVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Recipient Email</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to the recipient's email:{" "}
              {transferForm.recipient_email}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <InputOTP
              maxLength={6}
              value={recipientEmailOtp}
              onChange={setRecipientEmailOtp}
            >
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
                setShowEmailVerify(false);
                setRecipientEmailOtp("");
                setPendingTransferId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyRecipientEmail}
              disabled={isSubmitting || recipientEmailOtp.length !== 6}
              className="gradient-primary"
            >
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Details & Transfer Dialog */}
      <Dialog
        open={!!selectedAccount}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAccount(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {selectedAccount?.account_name}
            </DialogTitle>
            <DialogDescription>
              {selectedAccount?.associated_email ||
                "No email linked to this contact"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Recent Transactions for this Account */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Recent Transactions
              </h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {transfers
                  .filter(
                    (t) =>
                      t.from_account_id === selectedAccount?.id ||
                      t.to_account_id === selectedAccount?.id,
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="text-sm flex justify-between items-center p-2 rounded bg-muted/20"
                    >
                      <span className="text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`font-bold ${
                          t.to_account_id === selectedAccount?.id
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {t.to_account_id === selectedAccount?.id ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                {transfers.filter(
                  (t) =>
                    t.from_account_id === selectedAccount?.id ||
                    t.to_account_id === selectedAccount?.id,
                ).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No recent transactions
                  </p>
                )}
              </div>
            </div>

            {/* Send Money Section */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold mb-3">Send Money</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Pay From</Label>
                  <Select
                    value={transferForm.from_account_id}
                    onValueChange={(value) =>
                      setTransferForm({
                        ...transferForm,
                        from_account_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Source Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.id !== selectedAccount?.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.account_name} ({formatCurrency(a.balance)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={transferForm.amount}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  className="w-full gradient-primary gap-2"
                  onClick={handleInitiateTransfer}
                  disabled={
                    isSubmitting ||
                    !transferForm.amount ||
                    !transferForm.from_account_id
                  }
                >
                  <Send className="w-4 h-4" />
                  Send Money
                </Button>
              </div>
            </div>
          </div>
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
