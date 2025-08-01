import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, DollarSign } from 'lucide-react';

interface GigApplicationDialogProps {
  gigId: string;
  gigTitle: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  onApplicationSubmitted?: () => void;
}

export function GigApplicationDialog({ 
  gigId, 
  gigTitle, 
  budgetMin, 
  budgetMax,
  onApplicationSubmitted 
}: GigApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to apply for gigs.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please include a message with your application.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const applicationData: any = {
        gig_id: gigId,
        worker_id: user.id,
        message: message.trim(),
      };

      if (proposedRate && !isNaN(Number(proposedRate))) {
        applicationData.proposed_rate = Number(proposedRate);
      }

      const { error } = await supabase
        .from('gig_applications')
        .insert([applicationData]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Applied",
            description: "You have already applied for this gig.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Application Submitted!",
          description: "Your application has been sent to the gig poster.",
        });
        
        setMessage('');
        setProposedRate('');
        setOpen(false);
        onApplicationSubmitted?.();
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBudgetRange = () => {
    if (budgetMin && budgetMax) return `$${budgetMin} - $${budgetMax}`;
    if (budgetMin) return `From $${budgetMin}`;
    if (budgetMax) return `Up to $${budgetMax}`;
    return 'Budget not specified';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Apply
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply for Gig</DialogTitle>
          <DialogDescription>
            Send your application for "{gigTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">Application Message *</Label>
            <Textarea
              id="message"
              placeholder="Tell the poster why you're perfect for this gig..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="proposedRate" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Proposed Rate (optional)
            </Label>
            <Input
              id="proposedRate"
              type="number"
              placeholder="Enter your rate"
              value={proposedRate}
              onChange={(e) => setProposedRate(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Budget range: {formatBudgetRange()}
            </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}