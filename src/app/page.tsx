'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Tractor, UserPlus, Lightbulb, TrendingUp, Users, Mail, Phone, MapPin, Link as LinkIcon, LayoutList, DownloadCloud, LifeBuoy, HelpCircle, Handshake, GitFork, Building, LandPlot, HandHelping, UserCog, DollarSign } from 'lucide-react';

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
      title: "Register",
      description: "Create your free, secure user account in a few simple steps.",
    },
    {
      icon: GitFork,
      title: "Choose Path",
      description: "Set up your private farm workspace or configure your AEO profile.",
    },
    {
      icon: Tractor,
      title: "Manage",
      description: "Log all farm and livestock activities in a central, cloud-based system.",
    },
    {
      icon: Users,
      title: "Collaborate",
      description: "Invite team members to your farm or manage your directory of farmers.",
    },
    {
      icon: BrainCircuit,
      title: "Gain Insights",
      description: "Use dashboards, budgeting tools, and AI advice to make data-driven decisions.",
    },
  ];
  
  const targetGroups = [
      {
          icon: Building,
          title: "Commercial Farms",
          description: "Ideal for medium-to-large scale farms needing multi-user collaboration, role-based permissions, financial dashboards, and operational tracking.",
      },
      {
          icon: HandHelping,
          title: "Agric Extension Officers & NGOs",
          description: "A dedicated suite of tools to manage a directory of farmers, log support interactions, track progress, and provide targeted advice.",
      },
      {
          icon: LandPlot,
          title: "Farmer Associations & Cooperatives",
          description: "Manage member data, provide extension services, aggregate production information, and streamline group operations.",
      }
  ];

  return (
    <>
      <div className="container mx-auto px-4 flex flex-col items-center">
        <header className="text-center pt-8">
            <Link href="/" className="flex justify-center mb-4">
              <Image
                src="/agrifaas-logo.png"
                alt="AgriFAAS Connect Logo"
                width={200}
                height={67}
                style={{ objectFit: 'contain' }}
                priority
              />
            </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline">
            The Future of Farming is Collaborative
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
            AgriFAAS Connect is a unified platform for modern agribusiness, empowering every stakeholder from the field to the front office.
          </p>
        </header>

        <main className="w-full">
            <section className="py-16 text-center">
                 <div className="grid lg:grid-cols-2 gap-8 items-center">
                     <div className="text-left">
                        <h2 className="text-3xl font-bold text-foreground/90 font-headline mb-4">Your All-in-One Farm Management Hub</h2>
                        <p className="text-muted-foreground mb-6">
                            Stop juggling spreadsheets and disconnected apps. AgriFAAS Connect brings all your farm's data into a single, collaborative workspace. Log activities, manage finances, track tasks, and gain AI-powered insights in real-time.
                        </p>
                         <div className="flex gap-4">
                            <Link href="/auth/register"><Button size="lg">Get Started Free</Button></Link>
                            <Link href="/features"><Button size="lg" variant="outline">Explore Features</Button></Link>
                        </div>
                    </div>
                     <div className="relative aspect-video w-full">
                        <Image src="https://placehold.co/600x400.png" alt="Farm management dashboard" layout="fill" objectFit="cover" className="rounded-lg shadow-xl" data-ai-hint="farming agriculture"/>
                    </div>
                </div>
            </section>
            
            <section className="py-16">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-semibold text-foreground/90 mb-4 font-headline">Why AgriFAAS Connect?</h2>
                <p className="text-muted-foreground mb-10">
                    We empower you to simplify complexity, boost productivity, and foster connection across your entire agricultural operation.
                </p>
              </div>
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
            </section>

             <section className="py-16">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-semibold text-foreground/90 mb-4 font-headline">Built for the Entire Agri-Ecosystem</h2>
                 <p className="text-muted-foreground mb-10">
                    Whether you run a large commercial farm, support local farmers, or manage a cooperative, our platform is designed for you.
                </p>
              </div>
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
            </section>

            <section className="py-16">
               <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-semibold text-foreground/90 mb-4 font-headline">Get Started in Minutes</h2>
                 <p className="text-muted-foreground mb-10">
                    Our streamlined onboarding process gets you from registration to valuable insights in just a few simple steps.
                </p>
              </div>
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
            </section>

             <section className="py-16 text-center">
                <h2 className="text-3xl font-semibold text-foreground/90 mb-4 font-headline">Ready to Transform Your Farm?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                    Join AgriFAAS Connect today and unlock a smarter, more connected way to manage your agricultural business. All plans start with a 20-day free trial.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/auth/register"><Button size="lg">Start Your Free Trial</Button></Link>
                    <Link href="/pricing"><Button size="lg" variant="secondary">View Pricing</Button></Link>
                </div>
            </section>

        </main>
      </div>

      <footer id="contact-us" className="bg-muted/50 dark:bg-muted/20 py-12 text-center border-t border-border/50 w-full mt-12">
        <div className="container mx-auto px-4">
          <p className="text-lg font-semibold text-primary mb-2">AgriFAAS Connect</p>
          <p className="text-sm text-muted-foreground mb-4">A flagship product of Cure Technologies</p>

          <div className="space-y-1 text-sm text-muted-foreground mb-6">
            <p className="flex items-center justify-center gap-2">
              <Mail /> Email: <a href="mailto:support@curetchnologies.org" className="hover:text-primary hover:underline">support@curetchnologies.org</a>
            </p>
             <p className="flex items-center justify-center gap-2 flex-wrap">
              <Phone /> Contact:
              <a href="tel:+233249499338" className="hover:text-primary hover:underline">+233 24 949 9338</a> /
              <a href="tel:+233277118442" className="hover:text-primary hover:underline">+233 27 711 8442</a> /
              <a href="tel:+233203721037" className="hover:text-primary hover:underline">+233 20 372 1037</a>
            </p>
             <p className="flex items-center justify-center gap-2 flex-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
               WhatsApp:
              <a href="https://wa.me/233249499338" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">+233 24 949 9338</a> /
              <a href="https://wa.me/447309342040" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">+44 7309 342040</a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <MapPin /> Office: 4th Floor, 1 Airport Square, Airport City, Accra Ghana.
            </p>
            <p className="flex items-center justify-center gap-2">
              <LinkIcon /> Website (AgriFAAS Connect): <a href="https://www.agrifaasconnect.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">www.agrifaasconnect.com</a>
            </p>
             <p className="flex items-center justify-center gap-2">
              <LinkIcon /> Website (Cure Technologies): <a href="https://www.curetechnologies.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">www.curetechnologies.org</a>
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
            Copyright ©{new Date().getFullYear()} Cure Technologies Support Group (CTSG Ventures)
          </p>
        </div>
      </footer>
    </>
  );
}
