'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutDashboard, CalendarDays, Archive, CloudSun, ListChecks, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { format } from 'date-fns';


interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  href: string;
  color?: string;
  isLoading: boolean;
}

function SummaryCard({ title, value, icon: Icon, href, color, isLoading }: SummaryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color || 'text-primary'}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-7 w-12 bg-muted/20 animate-pulse rounded-md mt-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <Link href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center mt-1">
          View Details <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [summaryData, setSummaryData] = useState({
    upcomingTasks: '0',
    eventsToday: '0',
    totalResources: '0'
  });
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  useEffect(() => {
    if (isProfileLoading || !userProfile?.farmId) {
        if (!isProfileLoading) setIsSummaryLoading(false);
        return;
    }

    const fetchSummaryData = async () => {
        if (!userProfile?.farmId || !db) return;
        setIsSummaryLoading(true);
        try {
            const farmId = userProfile.farmId;

            // Fetch upcoming tasks
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('farmId', '==', farmId),
                where('status', 'in', ['To Do', 'In Progress'])
            );
            const tasksSnapshot = await getCountFromServer(tasksQuery);
            const upcomingTasks = tasksSnapshot.data().count.toString();
            
            // Fetch events today
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const eventsQuery = query(
                collection(db, 'farmEvents'),
                where('farmId', '==', farmId),
                where('date', '==', todayStr)
            );
            const eventsSnapshot = await getCountFromServer(eventsQuery);
            const eventsToday = eventsSnapshot.data().count.toString();

            // Fetch total resources
            const resourcesQuery = query(collection(db, 'resources'), where('farmId', '==', farmId));
            const resourcesSnapshot = await getCountFromServer(resourcesQuery);
            const totalResources = resourcesSnapshot.data().count.toString();

            setSummaryData({
                upcomingTasks,
                eventsToday,
                totalResources
            });

        } catch (error) {
            console.error("Error fetching dashboard summary data:", error);
            // Keep default '0' values on error
        } finally {
            setIsSummaryLoading(false);
        }
    };

    fetchSummaryData();
  }, [userProfile, isProfileLoading]);

  const summaryCards = [
    { title: "Upcoming Tasks", value: summaryData.upcomingTasks, icon: ListChecks, href: "/task-management", color: "text-blue-500", isLoading: isSummaryLoading },
    { title: "Events Today", value: summaryData.eventsToday, icon: CalendarDays, href: "/farm-calendar", color: "text-purple-500", isLoading: isSummaryLoading },
    { title: "Total Resources", value: summaryData.totalResources, icon: Archive, href: "/resource-inventory", color: "text-orange-500", isLoading: isSummaryLoading },
    { title: "Weather Forecast", value: "View", icon: CloudSun, href: "/weather-monitoring", color: "text-yellow-500", isLoading: false },
  ];

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Dashboard"
        icon={LayoutDashboard}
        description="Welcome to AgriFAAS Connect! Here's an overview of your farm."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {summaryCards.map(card => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BrainCircuit className="h-6 w-6 mr-2 text-primary" />
              AI Planting Advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get AI-powered recommendations for optimal planting schedules based on your farm's data.
            </p>
            <Link href="/planting-advice" passHref>
              <Button>
                Get Planting Advice <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/task-management#add" passHref><Button variant="outline" className="w-full justify-start">Add New Task</Button></Link>
            <Link href="/resource-inventory#add" passHref><Button variant="outline" className="w-full justify-start">Log New Resource</Button></Link>
            <Link href="/farm-calendar#add" passHref><Button variant="outline" className="w-full justify-start">Schedule Event</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
