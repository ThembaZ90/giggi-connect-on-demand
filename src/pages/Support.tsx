import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Phone, Mail, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create my first gig?",
          answer: "To create a gig, go to your dashboard and click 'Post a Gig'. Fill in the details including title, description, budget, and requirements. Make sure to be specific about what you need done."
        },
        {
          question: "How do I apply for gigs?",
          answer: "Browse available gigs on the main page, click on one that interests you, and click 'Apply'. Include a personalized message and your proposed rate if different from the posted budget."
        },
        {
          question: "What verification do I need?",
          answer: "For security, we require SA ID verification, phone verification, and optional document uploads. Higher verification levels increase your trustworthiness on the platform."
        }
      ]
    },
    {
      category: "Payments & Credits",
      questions: [
        {
          question: "How does the payment system work?",
          answer: "Grafty uses a credit-based system. Gig posters purchase credits and pay workers upon completion. We charge a 3% service fee. Payments are instant and secure."
        },
        {
          question: "How do I withdraw my earnings?",
          answer: "Go to your wallet and click 'Withdraw Funds'. You can withdraw to your bank account or other payment methods. There may be a small processing fee."
        },
        {
          question: "What if a payment dispute occurs?",
          answer: "Contact our support team immediately. We'll review the gig details, communications, and evidence to resolve disputes fairly. Keep records of all work completed."
        }
      ]
    },
    {
      category: "Safety & Security",
      questions: [
        {
          question: "How do you verify users?",
          answer: "We use SA ID verification, phone verification, and document checks. Users get trust scores based on their verification level and platform activity."
        },
        {
          question: "What should I do if I encounter suspicious behavior?",
          answer: "Report users immediately using our report feature. Provide evidence and details. We take safety seriously and investigate all reports promptly."
        },
        {
          question: "Is my personal information safe?",
          answer: "Yes, we use enterprise-grade security and only share necessary information for gig completion. Your personal details are encrypted and protected."
        }
      ]
    },
    {
      category: "Account Issues",
      questions: [
        {
          question: "I can't log into my account",
          answer: "Try resetting your password first. If that doesn't work, check if your account might be temporarily locked for security reasons. Contact support if issues persist."
        },
        {
          question: "How do I update my profile information?",
          answer: "Go to your profile settings to update personal information, skills, and verification documents. Keep your profile current for better gig opportunities."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, contact support to request account deletion. Note that this action is permanent and you'll lose access to all gig history and earnings."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the contact form to your backend
    toast({
      title: "Message Sent",
      description: "We'll get back to you within 24 hours.",
    });
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Help & Support</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support team
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQs Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
            </div>

            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                      <Badge variant="secondary">{category.questions.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No FAQs found matching your search.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Need More Help?
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Contact our support team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">support@grafty.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">+27 11 123 4567</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  We typically respond within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Describe your issue or question..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Emergency Support</CardTitle>
                <CardDescription>
                  For urgent safety or security issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
                  Report Emergency
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Available 24/7 for serious incidents
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;