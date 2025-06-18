
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Leaf, BarChart, Settings2, Brain, Tractor, UserPlus, CalendarCheck, Lightbulb, TrendingUp, Users, HelpCircle, MessageCircleQuestion, LayoutList, Mail, Phone, MapPin, Link as LinkIcon, DollarSign } from 'lucide-react'; 

export default function LandingPage() {
  const whyAgriFAASPoints = [
    {
      icon: Lightbulb,
      title: "Simplify Complexity",
      description: "Streamline every aspect of your farm management, from planning to harvest, all in one intuitive platform designed for ease of use.",
    },
    {
      icon: TrendingUp,
      title: "Boost Productivity",
      description: "Make smarter decisions with AI-powered insights, real-time data, and precision tools to optimize yields and resources effectively.",
    },
    {
      icon: Users,
      title: "Empower Connection",
      description: "Connect your entire team, manage roles, and access critical information, empowering every stakeholder in the agricultural value chain.",
    }
  ];

  const appSteps = [
    {
      icon: UserPlus,
      title: "Personalized Setup",
      description: "Register easily and tailor your experience based on your unique farming role in the agricultural ecosystem.",
    },
    {
      icon: Tractor,
      title: "Full Farm Management",
      description: "Access a comprehensive suite to manage every stage, from detailed land preparation to efficient harvesting, all in one place.",
    },
    {
      icon: CalendarCheck,
      title: "Precision Planning",
      description: "Organize all your activities effectively with an integrated farm calendar and a robust task management system.",
    },
    {
      icon: Brain,
      title: "Smart Decisions",
      description: "Leverage AI planting advice, location-specific weather forecasts, and resource tracking for optimal results.",
    },
    {
      icon: Settings2,
      title: "Centralized Control",
      description: "Get a clear dashboard overview of key farm aspects, and for admins, access tools for effective user management.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-green-50 dark:from-slate-900 dark:to-green-900/50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/agrifaas-logo.png"
              alt="AgriFAAS Connect Logo"
              width={280}
              height={93}
              objectFit="contain"
              priority
            />
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline">
            Welcome to AgriFAAS Connect
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            Empowering Agriculture, Connecting Futures. Farm Management, Simplified.
          </p>
        </header>

        <div className="grid lg:grid-cols-1 gap-8 lg:gap-12 items-center justify-center mb-16">
          <Card className="w-full max-w-lg mx-auto shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl duration-300 lg:order-first">
            <CardHeader className="p-6 sm:p-8 text-center">
              <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
                Get Started
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 text-base sm:text-lg">
                Join our platform to revolutionize your farming.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-center text-foreground/80">
                Streamline operations, access resources, and unlock new opportunities with our all-in-one solution.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/auth/signin" passHref>
                  <Button size="lg" className="w-full text-lg py-3 sm:py-4">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/register" passHref>
                  <Button variant="secondary" size="lg" className="w-full text-lg py-3 sm:py-4">
                    Register
                  </Button>
                </Link>
              </div>
            </CardContent>
            <CardFooter className="p-6 sm:p-8 justify-center">
              <p className="text-xs text-muted-foreground">
                Transforming agriculture through technology.
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <div className="text-center max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-semibold text-foreground/90 mb-10 font-headline">Why AgriFAAS Connect?</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {whyAgriFAASPoints.map((point, index) => (
              <BenefitCard 
                key={index}
                icon={point.icon}
                title={point.title}
                description={point.description}
              />
            ))}
          </div>
        </div>

        <div className="text-center max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-semibold text-foreground/90 mb-10 font-headline">How AgriFAAS Connect Works For You</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-5 gap-6">
            {appSteps.map((step, index) => (
              <StepCard 
                key={index}
                stepNumber={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>

        {/* Help and FAQ Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 py-8 border-t border-border/50">
          <h2 className="text-2xl font-semibold text-foreground/90 mb-6 font-headline">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Find answers to common questions or learn more about how to use AgriFAAS Connect.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/help" passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <HelpCircle className="mr-2 h-5 w-5" />
                Visit Help Center
              </Button>
            </Link>
            <Link href="/faq" passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <MessageCircleQuestion className="mr-2 h-5 w-5" />
                View FAQs
              </Button>
            </Link>
            <Link href="/features" passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <LayoutList className="mr-2 h-5 w-5" />
                View Features
              </Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <DollarSign className="mr-2 h-5 w-5" />
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-muted/50 dark:bg-muted/20 py-12 text-center border-t border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-lg font-semibold text-primary mb-2">AgriFAAS Connect</p>
          <p className="text-sm text-muted-foreground mb-4">A flagship product of Cure Technologies</p>
          
          <div className="space-y-1 text-sm text-muted-foreground mb-6">
            <p className="flex items-center justify-center">
              <Mail className="mr-2 h-4 w-4" /> Email: <a href="mailto:support@curetchnologies.org" className="hover:text-primary hover:underline ml-1">support@curetchnologies.org</a>
            </p>
            <p className="flex items-center justify-center">
              <Phone className="mr-2 h-4 w-4" /> Contact: 
              <a href="tel:+233249499338" className="hover:text-primary hover:underline ml-1">+233 24 949 9338</a> / 
              <a href="tel:+233277118442" className="hover:text-primary hover:underline ml-1">+233 27 711 8442</a>
            </p>
            <p className="flex items-center justify-center">
              <MapPin className="mr-2 h-4 w-4" /> Office: 4th Floor, 1 Airport Square, Airport City, Accra Ghana.
            </p>
            <p className="flex items-center justify-center">
              <LinkIcon className="mr-2 h-4 w-4" /> Website (AgriFAAS Connect): <a href="https://www.agrifaasconnect.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline ml-1">www.agrifaasconnect.com</a>
            </p>
            <p className="flex items-center justify-center">
              <LinkIcon className="mr-2 h-4 w-4" /> Website (Cure Technologies): <a href="https://www.curetechnologies.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline ml-1">www.curetechnologies.org</a>
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground/80">
            Copyright ©2025 Cure Technologies Support Group (CTSG Ventures)
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Creating Impactful Solutions for Africa.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  return (
    <Card className="bg-card/80 dark:bg-card/60 shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-center flex flex-col items-center h-full">
      <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <CardTitle className="text-xl text-primary mb-2 font-semibold">{title}</CardTitle>
      <CardContent className="p-0 flex-grow">
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  stepNumber: number;
  icon: React.ElementType;
  title: string;
  description: string;
}

function StepCard({ stepNumber, icon: Icon, title, description }: StepCardProps) {
  return (
    <Card className="bg-card/80 dark:bg-card/60 shadow-lg hover:shadow-xl transition-shadow duration-300 p-5 text-center flex flex-col items-center h-full">
      <div className="relative mb-4">
        <div className="p-3 bg-primary/10 rounded-full inline-block">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {stepNumber}
        </div>
      </div>
      <CardTitle className="text-lg text-primary mb-2 font-semibold">{title}</CardTitle>
      <CardContent className="p-0 flex-grow">
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

