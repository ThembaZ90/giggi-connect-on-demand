import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard, Building, DollarSign } from 'lucide-react';

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

interface PurchaseCreditsDialogProps {
  onPurchaseComplete?: () => void;
}

export function PurchaseCreditsDialog({ onPurchaseComplete }: PurchaseCreditsDialogProps) {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const purchaseAmount = parseFloat(amount);
    if (!purchaseAmount || purchaseAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase amount is R1.00",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
      
      // Create purchase record
      const { error } = await supabase
        .from('credit_purchases')
        .insert({
          user_id: user?.id,
          payment_method_id: selectedPaymentMethod,
          amount: purchaseAmount,
          credits_amount: purchaseAmount, // 1:1 ratio for now
          payment_provider: paymentMethod?.provider || 'manual',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Purchase Initiated",
        description: `Credit purchase of R${purchaseAmount} initiated. You will be redirected to complete payment.`,
      });

      // In a real implementation, redirect to payment gateway here
      // For now, we'll simulate the process
      setTimeout(() => {
        toast({
          title: "Demo Mode",
          description: "In production, you would be redirected to PayFast, Ozow, or your bank for payment.",
        });
      }, 2000);

      setAmount('');
      setSelectedPaymentMethod('');
      setOpen(false);
      onPurchaseComplete?.();
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to initiate credit purchase",
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
            {!pm.is_verified && <span className="text-xs text-orange-600">(Pending verification)</span>}
          </div>
        );
      case 'card':
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{pm.card_brand} ending in {pm.card_last_four}</span>
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

  const bonusCredits = parseFloat(amount) >= 100 ? Math.floor(parseFloat(amount) * 0.05) : 0;
  const totalCredits = parseFloat(amount) + bonusCredits;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Purchase Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Add credits to your wallet to pay for gig services
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (ZAR) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum purchase: R1.00
            </p>
          </div>

          {parseFloat(amount) > 0 && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium">Purchase Summary:</h4>
              <div className="flex justify-between text-sm">
                <span>Credits:</span>
                <span>R{parseFloat(amount).toFixed(2)}</span>
              </div>
              {bonusCredits > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Bonus (5% for R100+):</span>
                  <span>+R{bonusCredits.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total Credits:</span>
                <span>R{totalCredits.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            {paymentMethods.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border rounded-md">
                No payment methods found. Please add a payment method first.
              </div>
            ) : (
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
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

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Supported Payment Methods:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• EFT from all major SA banks</li>
              <li>• Visa & Mastercard via PayFast</li>
              <li>• Instant EFT via Ozow</li>
              <li>• PayPal international payments</li>
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
              disabled={loading || !amount || !selectedPaymentMethod || paymentMethods.length === 0}
            >
              {loading ? 'Processing...' : `Purchase R${parseFloat(amount || '0').toFixed(2)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}