
'use client';

import { type ReactNode } from "react";
import { useLanguage } from "@/hooks/use-language";

type PageHeaderProps = {
  title: string;
  description?: string;
  isi18n?: boolean;
  children?: ReactNode;
};

export function PageHeader({ title, description, children, isi18n = true }: PageHeaderProps) {
  const { t } = useLanguage();

  const headerTitle = isi18n ? t(title) : title;
  const headerDescription = description ? (isi18n ? t(description) : description) : undefined;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{headerTitle}</h1>
        {headerDescription && <p className="text-muted-foreground max-w-xl">{headerDescription}</p>}
      </div>
      {children && <div className="flex-shrink-0 self-end md:self-center">{children}</div>}
    </div>
  );
}
