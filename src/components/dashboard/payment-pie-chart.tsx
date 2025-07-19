
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Loader } from "@/components/shared/loader";
import type { Shift, Project } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";

interface PaymentPieChartProps {
    shifts: Shift[];
    projects?: Project[] | null;
}

type DetailsType = "Paid" | "Balance";

const chartConfig = {
  amount: {
    label: "Amount (₹)",
  },
  paid: {
    label: "Paid",
    color: "hsl(120 70% 45%)", // Leaf Green
  },
  balance: {
    label: "Balance",
    color: "hsl(0 84% 60%)", // Blood Red
  },
} satisfies {
  [key: string]: {
    label: string;
    icon?: React.ComponentType;
    color?: string;
  }
}

export function PaymentPieChart({ shifts, projects }: PaymentPieChartProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsType, setDetailsType] = React.useState<DetailsType | null>(null);

  const chartData = React.useMemo(() => {
    const totalEarning = shifts.reduce((acc, s) => acc + s.earnedAmount, 0);
    const totalPaid = shifts.reduce((acc, s) => acc + s.paidAmount, 0);
    const balance = totalEarning - totalPaid;
    
    if (totalEarning === 0) return [];
    
    return [
      { name: "paid", value: totalPaid, fill: "var(--color-paid)" },
      { name: "balance", value: balance, fill: "var(--color-balance)" },
    ].filter(d => d.value > 0);
  }, [shifts]);

  const detailedData = React.useMemo(() => {
    if (!detailsType || !projects || !shifts) return [];
    
    const relevantShifts = detailsType === 'Paid'
        ? shifts.filter(s => s.paidAmount > 0)
        : shifts.filter(s => (s.earnedAmount - s.paidAmount) > 0);

    const dataByProject: Record<string, { total: number, designation: string }> = {};

    relevantShifts.forEach(shift => {
        const key = `${shift.projectId}-${shift.designation}`;
        const amount = detailsType === 'Paid' ? shift.paidAmount : (shift.earnedAmount - shift.paidAmount);
        
        if (!dataByProject[key]) {
            dataByProject[key] = { total: 0, designation: shift.designation };
        }
        dataByProject[key].total += amount;
    });

    return Object.entries(dataByProject).map(([key, value]) => {
        const [projectId] = key.split('-');
        const project = projects.find(p => p.id === projectId);
        return {
            projectName: project?.name || 'Unknown Project',
            designation: value.designation,
            amount: value.total,
        }
    }).filter(item => item.amount > 0);
  }, [detailsType, projects, shifts]);


  const totalAmount = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData]);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [shifts]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const onPieClick = (_: any, index: number) => {
      const type = chartData[index].name === 'paid' ? 'Paid' : 'Balance';
      setDetailsType(type);
      setDetailsOpen(true);
  }

  if (loading) {
    return (
      <div className="mx-auto aspect-square w-full h-full flex items-center justify-center">
        <Loader text={t('loading_chart_text')} />
      </div>
    );
  }

  if (chartData.length === 0) {
      return (
          <div className="mx-auto flex flex-col items-center justify-center w-full h-full text-muted-foreground">
              {t('no_financial_data_period')}
          </div>
      )
  }

  return (
    <>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-full w-full"
      >
        <PieChart onMouseLeave={onPieLeave}>
          <ChartTooltip
            cursor={true}
            content={<ChartTooltipContent 
                formatter={(value, name, props) => {
                    const percentage = totalAmount > 0 ? Math.round((Number(value) / totalAmount) * 100) : 0;
                    const label = chartConfig[name as keyof typeof chartConfig]?.label || name;
                    const color = name === 'paid' ? chartConfig.paid.color : chartConfig.balance.color;
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 shrink-0 rounded-[2px]" style={{backgroundColor: color}} />
                            <div className="flex flex-1 justify-between">
                                <span>{label}</span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                    {`₹${Number(value).toLocaleString()} (${percentage}%)`}
                                </span>
                            </div>
                        </div>
                    )
                }}
                labelClassName="font-bold"
                wrapperStyle={{
                  padding: "8px",
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                }}
                labelFormatter={() => null}
            />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            activeIndex={activeIndex}
            onMouseEnter={onPieEnter}
            onClick={onPieClick}
            paddingAngle={2}
            style={{
                filter: `drop-shadow(0px 4px 8px hsl(var(--primary) / 0.2))`
            }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} 
                style={{
                  transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </Pie>
           <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            wrapperStyle={{
                paddingTop: '20px'
            }}
          />
        </PieChart>
      </ChartContainer>
       <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{detailsType} Details</DialogTitle>
                <DialogDescription>
                    Breakdown of {detailsType?.toLowerCase()} amounts by project and role.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-72 mt-4 pr-6">
                <div className="space-y-3">
                {detailedData?.length ? detailedData.map((item, index) => (
                    <Card key={index} className="bg-muted/50">
                        <CardHeader className="p-3">
                            <CardTitle className="text-base">{item.projectName}</CardTitle>
                            <CardDescription>{item.designation}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-3 bg-background/50 rounded-b-lg">
                            <Badge variant={detailsType === 'Paid' ? 'default' : 'destructive'}>
                                {detailsType}: ₹{item.amount.toLocaleString()}
                            </Badge>
                        </CardFooter>
                    </Card>
                )) : <p className="text-muted-foreground text-center py-8">No details available.</p>}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
