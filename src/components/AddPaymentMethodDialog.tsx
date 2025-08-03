import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard, Building, DollarSign } from 'lucide-react';

interface AddPaymentMethodDialogProps {
  onPaymentMethodAdded?: () => void;
}

// Major South African banks
const SA_BANKS = [
  'Standard Bank',
  'ABSA Bank',
  'First National Bank (FNB)',
  'Nedbank',
  'Capitec Bank',
  'African Bank',
  'Investec',
  'Bidvest Bank',
  'Discovery Bank',
  'TymeBank',
  'Other'
];

export function AddPaymentMethodDialog({ onPaymentMethodAdded }: AddPaymentMethodDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bank');
  const { user } = useAuth();
  const { toast } = useToast();

  // Bank account form state
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'savings'
  });

  // Card form state
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // PayPal form state
  const [paypalForm, setPaypalForm] = useState({
    email: ''
  });

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          type: 'bank_account',
          provider: 'manual_eft',
          bank_name: bankForm.bankName,
          account_holder_name: bankForm.accountHolderName,
          account_number: bankForm.accountNumber,
          branch_code: bankForm.branchCode,
          account_type: bankForm.accountType,
          is_verified: false
        });

      if (error) throw error;

      toast({
        title: "Bank Account Added",
        description: "Your bank account has been added successfully. It will be verified within 1-2 business days.",
      });

      setBankForm({
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        branchCode: '',
        accountType: 'savings'
      });
      
      setOpen(false);
      onPaymentMethodAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add bank account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, you'd tokenize the card with PayFast or similar
      // For now, we'll just store the last 4 digits
      const lastFour = cardForm.cardNumber.slice(-4);
      const cardBrand = getCardBrand(cardForm.cardNumber);

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          type: 'card',
          provider: 'payfast',
          card_last_four: lastFour,
          card_brand: cardBrand,
          card_token: `temp_token_${Date.now()}`, // In real implementation, use actual token
          is_verified: false
        });

      if (error) throw error;

      toast({
        title: "Card Added",
        description: "Your card has been added successfully.",
      });

      setCardForm({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      });
      
      setOpen(false);
      onPaymentMethodAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add card",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          type: 'paypal',
          provider: 'paypal',
          paypal_email: paypalForm.email,
          is_verified: false
        });

      if (error) throw error;

      toast({
        title: "PayPal Added",
        description: "Your PayPal account has been added successfully.",
      });

      setPaypalForm({ email: '' });
      setOpen(false);
      onPaymentMethodAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add PayPal account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCardBrand = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    return 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a payment method for purchasing credits and receiving withdrawals
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Bank Account
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              PayPal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4">
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Select value={bankForm.bankName} onValueChange={(value) => setBankForm(prev => ({ ...prev, bankName: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Full name as per bank records"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Account number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="branchCode">Branch Code *</Label>
                  <Input
                    id="branchCode"
                    value={bankForm.branchCode}
                    onChange={(e) => setBankForm(prev => ({ ...prev, branchCode: e.target.value }))}
                    placeholder="6-digit branch code"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <Select value={bankForm.accountType} onValueChange={(value) => setBankForm(prev => ({ ...prev, accountType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add Bank Account'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="card" className="space-y-4">
            <form onSubmit={handleCardSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Visa and Mastercard accepted</p>
              </div>

              <div>
                <Label htmlFor="cardholderName">Cardholder Name *</Label>
                <Input
                  id="cardholderName"
                  value={cardForm.cardholderName}
                  onChange={(e) => setCardForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                  placeholder="Name on card"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    value={cardForm.expiryDate}
                    onChange={(e) => setCardForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add Card'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4">
            <form onSubmit={handlePayPalSubmit} className="space-y-4">
              <div>
                <Label htmlFor="paypalEmail">PayPal Email *</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={paypalForm.email}
                  onChange={(e) => setPaypalForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be a verified PayPal account
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add PayPal Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}