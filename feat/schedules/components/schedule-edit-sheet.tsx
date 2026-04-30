"use client";

import { useState } from "react";
import { IconCalendarEvent } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ScheduleWithRelations } from "@/lib/types";

import { ScheduleForm } from "./schedule-form";

export interface ScheduleEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academyId: string;
  schedule?: ScheduleWithRelations | null;
  onSuccess?: () => void;
}

export function ScheduleEditSheet({
  open,
  onOpenChange,
  academyId,
  schedule,
  onSuccess,
}: ScheduleEditSheetProps) {
  const formId = schedule ? `schedule-edit-form-${schedule.id}` : "schedule-edit-form";
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="right"
        className="flex flex-col overflow-hidden min-w-xl p-0 sm:max-w-[520px]"
        showCloseButton={false}
      >
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <IconCalendarEvent className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Edit Schedule</SheetTitle>
              <SheetDescription className="text-xs">
                Update the schedule details below.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            <ScheduleForm
              academyId={academyId}
              initialSchedule={schedule}
              formId={formId}
              showInlineActions={false}
              onSubmittingChange={setIsSubmitting}
              onSuccess={() => {
                onSuccess?.();
                onOpenChange(false);
              }}
            />
          </div>
        </ScrollArea>

        <div className="mt-auto border-t bg-background px-6 py-4">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form={formId} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
