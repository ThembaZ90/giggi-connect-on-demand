import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X, Calendar, DollarSign, Clock, MapPin } from 'lucide-react';

const categories = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'moving', label: 'Moving' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'tech_support', label: 'Tech Support' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'pet_care', label: 'Pet Care' },
  { value: 'event_help', label: 'Event Help' },
  { value: 'other', label: 'Other' }
];

const CreateGig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  
  const [gigData, setGigData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    budget_min: '',
    budget_max: '',
    duration_hours: '',
    required_skills: [] as string[],
    contact_phone: '',
    preferred_start_date: '',
    is_urgent: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const updateGigData = (field: string, value: string | boolean | string[]) => {
    setGigData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !gigData.required_skills.includes(skillInput.trim())) {
      updateGigData('required_skills', [...gigData.required_skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateGigData('required_skills', gigData.required_skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Convert empty strings to null for optional numeric fields
      const budget_min = gigData.budget_min ? parseFloat(gigData.budget_min) : null;
      const budget_max = gigData.budget_max ? parseFloat(gigData.budget_max) : null;
      const duration_hours = gigData.duration_hours ? parseInt(gigData.duration_hours) : null;
      const preferred_start_date = gigData.preferred_start_date ? new Date(gigData.preferred_start_date).toISOString() : null;

      const { error } = await supabase
        .from('gigs')
        .insert({
          poster_id: user.id,
          title: gigData.title,
          description: gigData.description,
          category: gigData.category as any,
          location: gigData.location,
          budget_min,
          budget_max,
          duration_hours,
          required_skills: gigData.required_skills.length > 0 ? gigData.required_skills : null,
          contact_phone: gigData.contact_phone || null,
          preferred_start_date,
          is_urgent: gigData.is_urgent
        });

      if (error) throw error;

      toast({
        title: "Gig posted successfully!",
        description: "Your gig is now live and workers can apply."
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error posting gig",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return gigData.title.trim() && 
           gigData.description.trim() && 
           gigData.category && 
           gigData.location.trim();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Create New Gig</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Post a New Gig</CardTitle>
            <CardDescription>
              Tell workers what you need help with and find the perfect person for the job.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Gig Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Help moving furniture"
                      value={gigData.title}
                      onChange={(e) => updateGigData('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={gigData.category} onValueChange={(value) => updateGigData('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you need help with, any specific requirements, and what the worker should expect..."
                    value={gigData.description}
                    onChange={(e) => updateGigData('description', e.target.value)}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., Downtown Seattle, WA"
                      value={gigData.location}
                      onChange={(e) => updateGigData('location', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Budget and Duration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Budget & Duration</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">Min Budget ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="budget_min"
                        type="number"
                        placeholder="50"
                        value={gigData.budget_min}
                        onChange={(e) => updateGigData('budget_min', e.target.value)}
                        className="pl-10"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_max">Max Budget ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="budget_max"
                        type="number"
                        placeholder="100"
                        value={gigData.budget_max}
                        onChange={(e) => updateGigData('budget_max', e.target.value)}
                        className="pl-10"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_hours">Duration (hours)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="duration_hours"
                        type="number"
                        placeholder="2"
                        value={gigData.duration_hours}
                        onChange={(e) => updateGigData('duration_hours', e.target.value)}
                        className="pl-10"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Details</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_start_date">Preferred Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="preferred_start_date"
                        type="datetime-local"
                        value={gigData.preferred_start_date}
                        onChange={(e) => updateGigData('preferred_start_date', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      placeholder="Optional - for direct contact"
                      value={gigData.contact_phone}
                      onChange={(e) => updateGigData('contact_phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" variant="outline" onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {gigData.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {gigData.required_skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_urgent"
                    checked={gigData.is_urgent}
                    onCheckedChange={(checked) => updateGigData('is_urgent', checked)}
                  />
                  <Label htmlFor="is_urgent">Mark as urgent</Label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {loading ? 'Posting...' : 'Post Gig'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateGig;