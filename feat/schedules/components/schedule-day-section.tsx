"use client";

import { Badge } from "@/components/ui/badge";

export function ScheduleDaySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary" className="size-5 text-[10px]">
          {count}
        </Badge>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}
