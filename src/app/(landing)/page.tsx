

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Settings2, BrainCircuit, Tractor, UserPlus, CalendarCheck, Lightbulb, TrendingUp, Users, Mail, Phone, MapPin, Link as LinkIcon, LayoutList, DownloadCloud, LifeBuoy, HelpCircle, Handshake, GitFork, Building, LandPlot, HandHelping, UserCog, DollarSign } from 'lucide-react';

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
      title: "Register Your Account",
      description: "Create your free, secure, and private user account in a few simple steps.",
    },
    {
      icon: GitFork,
      title: "Choose Your Path",
      description: "Set up your private farm workspace as an Admin or configure your profile as an Agric Extension Officer (AEO).",
    },
    {
      icon: Tractor,
      title: "Manage Operations",
      description: "Log all farm and livestock activities—from planting and harvesting to animal health—in a central, cloud-based system.",
    },
    {
      icon: Users,
      title: "Collaborate With Your Team",
      description: "Invite your team members to your farm or manage your directory of farmers as an AEO.",
    },
    {
      icon: BrainCircuit,
      title: "Gain Key Insights",
      description: "Use the financial dashboard, budgeting tools, and AI-powered advice to make smarter, data-driven decisions.",
    },
  ];
  
  const targetGroups = [
      {
          icon: Building,
          title: "Commercial Farms & Agribusinesses",
          description: "Ideal for medium-to-large scale farms needing multi-user collaboration, role-based permissions, financial dashboards, and detailed operational tracking.",
      },
      {
          icon: HandHelping,
          title: "Agric Extension Officers (AEOs) & NGOs",
          description: "A dedicated suite of tools to manage a directory of farmers, log support interactions, track progress, and provide targeted advice.",
      },
      {
          icon: LandPlot,
          title: "Farmer Associations & Cooperatives",
          description: "Manage member data, provide extension services, aggregate production information, and streamline group operations and reporting.",
      }
  ];

  return (
    <>
      <div className="container mx-auto px-4 flex flex-col items-center">
        <header className="mb-12 text-center pt-8">
            <Link href="/" className="flex justify-center mb-4">
              <Image
                src="/agrifaas-logo.png"
                alt="AgriFAAS Connect Logo"
                width={200}
                height={67}
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
                <Link href="/auth/signin">
                  <Button size="lg" className="w-full text-lg py-3 sm:py-4">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/register">
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
          <h2 className="text-3xl font-semibold text-foreground/90 mb-10 font-headline">Who is AgriFAAS Connect For?</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {targetGroups.map((point, index) => (
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

        <div className="text-center max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-semibold text-foreground/90 mb-10 font-headline">Information & Support</h2>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Find out more about our features, how to install the app, and get support.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/features">
              <Button variant="secondary" size="lg">
                <LayoutList className="mr-2 h-4 w-4" />
                Explore Features
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                <DollarSign className="mr-2 h-4 w-4" />
                View Pricing
              </Button>
            </Link>
            <Link href="/installation-guide">
              <Button variant="secondary" size="lg">
                <DownloadCloud className="mr-2 h-4 w-4" />
                Installation Guide
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="secondary" size="lg">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Help Center
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="secondary" size="lg">
                <HelpCircle className="mr-2 h-4 w-4" />
                View FAQ
              </Button>
            </Link>
            <Link href="/partners">
              <Button variant="secondary" size="lg">
                <Handshake className="mr-2 h-4 w-4" />
                Our Partners
              </Button>
            </Link>
             <Link href="/roles-permissions">
              <Button variant="secondary" size="lg">
                <UserCog className="mr-2 h-4 w-4" />
                Roles & Permissions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer id="contact-us" className="bg-muted/50 dark:bg-muted/20 py-12 text-center border-t border-border/50">
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
              <a href="tel:+233277118442" className="hover:text-primary hover:underline ml-1">+233 27 711 8442</a> /
              <a href="tel:+233203721037" className="hover:text-primary hover:underline ml-1">+233 20 372 1037</a>
            </p>
             <p className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
               WhatsApp:
              <a href="https://wa.me/233249499338" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline ml-1">+233 24 949 9338</a> /
              <a href="https://wa.me/447309342040" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline ml-1">+44 7309 342040</a>
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
          
          <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-6">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-primary">Features</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link>
            <Link href="/partners" className="text-sm text-muted-foreground hover:text-primary">Partners</Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary">FAQ</Link>
            <Link href="/help" className="text-sm text-muted-foreground hover:text-primary">Help Center</Link>
             <Link href="/roles-permissions" className="text-sm text-muted-foreground hover:text-primary">Roles</Link>
          </div>

          <p className="text-xs text-muted-foreground/80">
            Copyright ©2025 Cure Technologies Support Group (CTSG Ventures)
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Creating Impactful Solutions for Africa.
          </p>
        </div>
      </footer>
    </>
  );
}
