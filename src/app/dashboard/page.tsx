
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, Briefcase, CalendarDays } from 'lucide-react';
import { PaymentPieChart } from '@/components/dashboard/payment-pie-chart';
import { EarningsBarChart } from '@/components/dashboard/earnings-bar-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/auth-provider';
import { PageHeader } from '@/components/shared/page-header';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CrewMember, Project, Shift, UserProfile } from '@/lib/types';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, format, isWithinInterval, parseISO } from 'date-fns';
import { Loader } from '@/components/shared/loader';
import { useLanguage } from '@/hooks/use-language';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [filterType, setFilterType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth()).toString()); 
  const [selectedProjectId, setSelectedProject] = useState('');

  const [userMobile, setUserMobile] = useState<string | null>(null);
  const [isUserMobileLoading, setIsUserMobileLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const fetchUserMobile = async () => {
        setIsUserMobileLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserMobile((docSnap.data() as UserProfile).mobile);
        }
        setIsUserMobileLoading(false);
      };
      fetchUserMobile();
    } else {
      setIsUserMobileLoading(false);
    }
  }, [user]);

  const userCrewProfilesQuery = useMemo(() => {
    if (!userMobile) return null;
    return query(collection(db, 'crew'), where('mobile', '==', userMobile));
  }, [userMobile]);

  const { data: userCrewProfiles, isLoading: crewProfilesLoading } = useFirestoreQuery<CrewMember>(userCrewProfilesQuery);

  const shiftsQuery = useMemo(() => {
    if (!userCrewProfiles || userCrewProfiles.length === 0) return null;
    const crewProfileIds = userCrewProfiles.map(p => p.id);
    if (crewProfileIds.length === 0) return null;
    return query(collection(db, 'shifts'), where('crewId', 'in', crewProfileIds));
  }, [userCrewProfiles]);

  const { data: unsortedShifts, isLoading: shiftsLoading } = useFirestoreQuery<Shift>(shiftsQuery);
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(collection(db, "projects"));

  const allShifts = useMemo(() => {
    if (!unsortedShifts) return [];
    return [...unsortedShifts].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [unsortedShifts]);
  
  const filteredShifts = useMemo(() => {
    if (!allShifts) return [];
    
    if (filterType === 'project-wise') {
      if (!selectedProjectId) return [];
      return allShifts.filter(s => s.projectId === selectedProjectId);
    }

    let interval: Interval;
    const year = parseInt(selectedYear);
    if (filterType === 'yearly') {
      interval = { start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 11, 31)) };
    } else { // monthly
      const month = parseInt(selectedMonth);
      interval = { start: startOfMonth(new Date(year, month, 1)), end: endOfMonth(new Date(year, month, 1)) };
    }

    return allShifts.filter(s => isWithinInterval(parseISO(s.date), interval));
  }, [allShifts, filterType, selectedYear, selectedMonth, selectedProjectId]);

  const stats = useMemo(() => {
    if (!filteredShifts) return { totalShifts: 0, totalEarning: 0, totalPaid: 0, balance: 0, workingDays: 0 };
    const totalShifts = filteredShifts.reduce((acc, s) => acc + s.shiftDuration, 0);
    const totalEarning = filteredShifts.reduce((acc, s) => acc + s.earnedAmount, 0);
    const totalPaid = filteredShifts.reduce((acc, s) => acc + s.paidAmount, 0);
    const balance = totalEarning - totalPaid;
    const workingDays = new Set(filteredShifts.map(s => s.date)).size;
    return { totalShifts, totalEarning, totalPaid, balance, workingDays };
  }, [filteredShifts]);


  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i.toString(), label: format(new Date(0, i), 'MMMM') }));

  const isLoading = projectsLoading || isUserMobileLoading || shiftsLoading || crewProfilesLoading;
  
  const renderSecondaryFilter = () => {
    switch (filterType) {
      case 'monthly':
        return (
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('select_month_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
               <SelectTrigger className="w-full">
                <SelectValue placeholder={t('select_year_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'yearly':
        return (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                 <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('select_year_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
      case 'project-wise':
        return (
             <Select value={selectedProjectId} onValueChange={setSelectedProject} disabled={projectsLoading}>
                <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder={t('select_project_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    {projects?.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
            <Loader text={t('loading_dashboard_text')} />
        </div>
    );
  }
  
  if (!userMobile && !isUserMobileLoading) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold text-muted-foreground">{t('welcome_prefix')}, {user?.displayName || t('crew_member_fallback')}!</h2>
              <p className="text-muted-foreground mt-2">{t('no_crew_profile_linked')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('ensure_mobile_matches')}</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <PageHeader 
          title={`${t('welcome_prefix')}, ${user?.displayName || t('crew_member_fallback')}!`}
          description={t('personal_dashboard_description')}
          isi18n={false}
        />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('filter_data_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">{t('monthly_filter')}</SelectItem>
              <SelectItem value="yearly">{t('yearly_filter')}</SelectItem>
              <SelectItem value="project-wise">{t('project_wise_filter')}</SelectItem>
            </SelectContent>
          </Select>
          {renderSecondaryFilter()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_earnings_label')}</CardTitle>
            <Wallet className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalEarning.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('for_selected_period')}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('amount_paid_label')}</CardTitle>
            <Wallet className="h-5 w-5" style={{color: 'hsl(var(--chart-1))'}} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.totalEarning > 0 ? `${Math.round((stats.totalPaid / stats.totalEarning) * 100)}% ${t('of_total')}` : 'N/A'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('balance_label')}</CardTitle>
            <Wallet className="h-5 w-5" style={{color: 'hsl(var(--chart-3))'}} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('to_be_paid')}</p>
          </CardContent>
        </Card>
         <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_shifts_label')}</CardTitle>
            <Briefcase className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShifts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('for_selected_period')}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('working_days_label')}</CardTitle>
            <CalendarDays className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workingDays}</div>
            <p className="text-xs text-muted-foreground">{t('unique_days_with_shifts')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t('payment_status_title')}</CardTitle>
                <CardDescription>{t('payment_status_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="pl-2 flex justify-center items-center h-auto min-h-[300px]">
                <PaymentPieChart shifts={filteredShifts || []} projects={projects} />
              </CardContent>
            </Card>
             <RecentActivity shifts={allShifts} projects={projects} />
          </div>
          <div className="lg:col-span-2">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle>Last 6 Months Earnings</CardTitle>
                <CardDescription>A look at your earnings over the past half year.</CardDescription>
              </CardHeader>
              <CardContent>
                  <EarningsBarChart shifts={allShifts || []} />
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
