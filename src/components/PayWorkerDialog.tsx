import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard } from 'lucide-react';

interface PayWorkerDialogProps {
  applicationId: string;
  workerName: string;
  gigTitle: string;
  proposedRate?: number;
  onPaymentComplete?: () => void;
}

export function PayWorkerDialog({ 
  applicationId, 
  workerName, 
  gigTitle, 
  proposedRate,
  onPaymentComplete 
}: PayWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(proposedRate?.toString() || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-gig-payment', {
        body: {
          applicationId,
          amount: paymentAmount
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Payment Successful!",
        description: `Paid ${workerName} R${data.netAmount} (after 3% service fee of R${data.serviceFee})`,
      });
      
      setOpen(false);
      onPaymentComplete?.();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = () => {
    const paymentAmount = parseFloat(amount) || 0;
    const serviceFee = Math.round(paymentAmount * 0.03 * 100) / 100;
    const netAmount = paymentAmount - serviceFee;
    return { serviceFee, netAmount, grossAmount: paymentAmount };
  };

  const { serviceFee, netAmount, grossAmount } = calculateFees();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Pay Worker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay Worker</DialogTitle>
          <DialogDescription>
            Process payment for {workerName} for "{gigTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <Label htmlFor="amount">Payment Amount (ZAR) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter payment amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
            {proposedRate && (
              <p className="text-sm text-muted-foreground mt-1">
                Proposed rate: R${proposedRate}
              </p>
            )}
          </div>

          {grossAmount > 0 && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium">Payment Breakdown:</h4>
              <div className="flex justify-between text-sm">
                <span>Payment Amount:</span>
                <span>R{grossAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service Fee (3%):</span>
                <span>-R{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Worker Receives:</span>
                <span>R{netAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount}>
              {loading ? 'Processing...' : `Pay R${grossAmount.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}