import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, Building, CreditCard, DollarSign } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  bank_name?: string;
  account_number?: string;
  card_last_four?: string;
  card_brand?: string;
  paypal_email?: string;
  is_verified: boolean;
}

interface WithdrawFundsDialogProps {
  currentBalance: number;
  onWithdrawalComplete?: () => void;
}

export function WithdrawFundsDialog({ currentBalance, onWithdrawalComplete }: WithdrawFundsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchPaymentMethods();
    }
  }, [open, user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_verified', true) // Only verified methods for withdrawals
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is R10.00",
        variant: "destructive",
      });
      return;
    }

    if (withdrawalAmount > currentBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Withdrawal amount exceeds your current balance",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a verified payment method",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
      
      // Calculate withdrawal fee (e.g., R5 flat fee or 2%, whichever is higher)
      const feeFlat = 5.00;
      const feePercentage = withdrawalAmount * 0.02;
      const withdrawalFee = Math.max(feeFlat, feePercentage);
      const netAmount = withdrawalAmount - withdrawalFee;

      // Create withdrawal request
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user?.id,
          payment_method_id: selectedPaymentMethod,
          amount: withdrawalAmount,
          withdrawal_fee: withdrawalFee,
          net_amount: netAmount,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Requested",
        description: `Withdrawal of R${withdrawalAmount} submitted. Processing typically takes 1-3 business days.`,
      });

      setAmount('');
      setSelectedPaymentMethod('');
      setOpen(false);
      onWithdrawalComplete?.();
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodDisplay = (pm: PaymentMethod) => {
    switch (pm.type) {
      case 'bank_account':
        return (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{pm.bank_name} - ...{pm.account_number?.slice(-4)}</span>
          </div>
        );
      case 'card':
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{pm.card_brand} ending in {pm.card_last_four}</span>
            <span className="text-xs text-muted-foreground">(Card refunds only)</span>
          </div>
        );
      case 'paypal':
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>{pm.paypal_email}</span>
          </div>
        );
      default:
        return 'Unknown payment method';
    }
  };

  const withdrawalAmount = parseFloat(amount) || 0;
  const feeFlat = 5.00;
  const feePercentage = withdrawalAmount * 0.02;
  const withdrawalFee = withdrawalAmount > 0 ? Math.max(feeFlat, feePercentage) : 0;
  const netAmount = withdrawalAmount - withdrawalFee;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Withdraw Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your bank account or payment method
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">Available Balance: R{currentBalance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleWithdrawal} className="space-y-4">
          <div>
            <Label htmlFor="amount">Withdrawal Amount (ZAR) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
              max={currentBalance}
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum withdrawal: R10.00 | Maximum: R{currentBalance.toFixed(2)}
            </p>
          </div>

          {withdrawalAmount > 0 && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium">Withdrawal Summary:</h4>
              <div className="flex justify-between text-sm">
                <span>Withdrawal Amount:</span>
                <span>R{withdrawalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Processing Fee:</span>
                <span>-R{withdrawalFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>You'll Receive:</span>
                <span>R{Math.max(0, netAmount).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Fee: R5 minimum or 2% of withdrawal amount
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="paymentMethod">Withdrawal Method *</Label>
            {paymentMethods.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border rounded-md">
                No verified payment methods found. Please add and verify a payment method first.
              </div>
            ) : (
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {getPaymentMethodDisplay(pm)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-md">
            <h4 className="font-medium text-amber-900 mb-2">Withdrawal Information:</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Processing time: 1-3 business days</li>
              <li>• Bank transfers: Same day if before 2 PM</li>
              <li>• International (PayPal): 3-5 business days</li>
              <li>• You'll receive email confirmation</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount || !selectedPaymentMethod || paymentMethods.length === 0 || netAmount <= 0}
            >
              {loading ? 'Processing...' : `Withdraw R${withdrawalAmount.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}