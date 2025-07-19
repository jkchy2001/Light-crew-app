
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useTheme } from "next-themes";
import { Loader } from "@/components/shared/loader";
import { useMemo } from "react";
import type { Shift, Project } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";
import { subMonths, startOfMonth, endOfMonth, format, parseISO, isWithinInterval } from "date-fns";

const chartConfig = {
  earnings: {
    label: "Earnings (₹)",
  },
} satisfies {
  [key: string]: {
    label: string;
    icon?: React.ComponentType;
  }
}

// Define glowing gradient colors
const gradientColors = [
    { id: 'grad1', start: '#00c6ff', end: '#0072ff' }, // Blue
    { id: 'grad2', start: '#a8ff78', end: '#78ffd6' }, // Green
    { id: 'grad3', start: '#f7797d', end: '#FBD786' }, // Peach/Yellow
    { id: 'grad4', start: '#8A2387', end: '#E94057' }, // Pink/Purple
    { id: 'grad5', start: '#ff9a9e', end: '#fecfef' }, // Light Pink
    { id: 'grad6', start: '#f6d365', end: '#fda085' }, // Orange/Yellow
];


export function EarningsBarChart({ shifts }: { shifts?: Shift[] | null; }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))';

  const chartData = useMemo(() => {
    if (!shifts) return [];
    
    const today = new Date();
    const last6Months: { month: string; earnings: number }[] = [];
    const earningsByMonth: { [key: string]: number } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthKey = format(monthDate, 'MMM-yyyy');
      earningsByMonth[monthKey] = 0;
    }

    const sixMonthsAgo = startOfMonth(subMonths(today, 5));
    const relevantShifts = shifts.filter(s => isWithinInterval(parseISO(s.date), { start: sixMonthsAgo, end: new Date() }));
    
    relevantShifts.forEach(shift => {
        const monthKey = format(parseISO(shift.date), 'MMM-yyyy');
        if (monthKey in earningsByMonth) {
            earningsByMonth[monthKey] += shift.earnedAmount;
        }
    });

    for (const monthKey in earningsByMonth) {
        last6Months.push({
            month: monthKey,
            earnings: earningsByMonth[monthKey]
        });
    }

    return last6Months;
      
  }, [shifts]);
  
  const dynamicChartConfig = useMemo(() => {
    const config = { ...chartConfig };
    chartData.forEach((item, index) => {
      const key = item.month.replace(/[^a-zA-Z0-9]/g, '');
      config[key] = {
        label: item.month,
        color: `url(#${gradientColors[index % gradientColors.length].id})`
      }
    });
    return config;
  }, [chartData]);


  if (shifts === null) {
      return (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                <Loader text={t('loading_chart_text')} />
            </div>
      );
  }
  
  if (chartData.length === 0) {
      return (
           <div className="w-full min-h-[400px] flex items-center justify-center text-muted-foreground">
              {t('no_project_earnings_text')}
           </div>
      )
  }

  return (
      <ChartContainer config={dynamicChartConfig} className="min-h-[450px] w-full">
        <BarChart
          accessibilityLayer 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }} // Increased bottom margin for angled labels
        >
          <defs>
             {gradientColors.map((color) => (
                <linearGradient key={color.id} id={color.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color.start} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color.end} stopOpacity={1} />
                </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis 
            dataKey="month"
            tickLine={false}
            axisLine={true}
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            angle={-45} // Angle the labels
            textAnchor="end" // Anchor them correctly
            height={70} // Provide space for angled labels
          />
          <YAxis
            stroke={tickColor}
            axisLine={true}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickFormatter={(value) => `₹${(Number(value) / 1000)}k`}
          />
          <ChartTooltip
            cursor={{fill: 'hsl(var(--muted) / 0.2)'}}
            content={<ChartTooltipContent 
                formatter={(value) => `₹${Number(value).toLocaleString()}`} 
                labelClassName="font-bold"
            />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="earnings" radius={[4, 4, 0, 0]} barSize={40}>
            {chartData.map((entry, index) => (
               <Cell key={`cell-${index}`} fill={`url(#${gradientColors[index % gradientColors.length].id})`} />
            ))}
             <LabelList
                dataKey="earnings"
                position="top"
                offset={8}
                className="fill-foreground font-semibold text-xs"
                formatter={(value: number) => `₹${value.toLocaleString()}`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
  )
}
