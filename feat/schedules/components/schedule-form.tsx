"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/get-error-message";
import { scheduleFormSchema, type ScheduleFormValues } from "@/lib/schemas";
import type { ScheduleWithRelations } from "@/lib/types";

import { useGroups } from "@/feat/academy/hooks/useGroups";
import { useLevels } from "@/feat/academy/hooks/useLevels";

import { createSchedule, updateSchedule } from "../mutations";
import type { ScheduleFormMode } from "../types";
import {
  getFilteredGroups,
  makeScheduleFormValues,
  scheduleFormValuesToApiPayload,
  scheduleFormValuesToUpdatePayload,
} from "../utils/payload";
import {
  OneOffInstancesSection,
  RecurringSlotsSection,
  ScheduleBehaviorSection,
  ScheduleTargetingSection,
  ScheduleTypeSection,
} from "./schedule-form-sections";

export interface ScheduleFormProps {
  academyId: string;
  initialSchedule?: ScheduleWithRelations | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  formId?: string;
  showInlineActions?: boolean;
  submitLabel?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export function ScheduleForm({
  academyId,
  initialSchedule,
  onSuccess,
  onCancel,
  formId = "schedule-form",
  showInlineActions = true,
  submitLabel,
  onSubmittingChange,
}: ScheduleFormProps) {
  const queryClient = useQueryClient();
  const mode: ScheduleFormMode = initialSchedule ? "edit" : "create";
  const { data: levels = [], isLoading: levelsLoading } = useLevels(academyId);
  const { data: groups = [], isLoading: groupsLoading } = useGroups(academyId);

  const defaultValues = useMemo(
    () => makeScheduleFormValues(initialSchedule),
    [initialSchedule]
  );

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const recurring = useFieldArray({
    control: form.control,
    name: "recurring_slots",
  });
  const oneOff = useFieldArray({
    control: form.control,
    name: "one_off_instances",
  });

  const scheduleType = useWatch({
    control: form.control,
    name: "schedule_type",
  });
  const selectedLevelId = useWatch({
    control: form.control,
    name: "level_id",
  });
  const selectedGroupId = useWatch({
    control: form.control,
    name: "group_id",
  });
  const filteredGroups = useMemo(
    () => getFilteredGroups(groups, selectedLevelId),
    [groups, selectedLevelId]
  );

  useEffect(() => {
    if (!selectedLevelId) {
      if (selectedGroupId) {
        form.setValue("group_id", "");
      }
      return;
    }

    const matchesSelectedGroup = filteredGroups.some(
      (group) => group.id.toString() === selectedGroupId
    );

    if (!matchesSelectedGroup && selectedGroupId) {
      form.setValue("group_id", "");
    }
  }, [filteredGroups, form, selectedGroupId, selectedLevelId]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "edit" && initialSchedule) {
        await updateSchedule(
          initialSchedule.id,
          scheduleFormValuesToUpdatePayload(values, academyId),
          academyId,
          queryClient
        );
        toast.success("Schedule updated");
        onSuccess?.();
      } else {
        await createSchedule(scheduleFormValuesToApiPayload(values, academyId), queryClient);
        toast.success("Schedule created");
        form.reset(makeScheduleFormValues(null));
        onSuccess?.();
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error) ||
          (mode === "edit" ? "Could not update schedule" : "Could not create schedule")
      );
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
    return () => {
      onSubmittingChange?.(false);
    };
  }, [isSubmitting, onSubmittingChange]);

  return (
    <Form {...form}>
      <div className="flex w-full justify-center">
        <form id={formId} onSubmit={onSubmit} className="w-full max-w-xl space-y-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <p>Schedule Name <span className="text-destructive">*</span></p>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id={`${formId}-name`}
                      placeholder="e.g. Morning Class A"
                      className="h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-muted/50 rounded-xl p-3 space-y-4">
            <ScheduleTypeSection form={form} />

            {scheduleType === "one_off" ? (
              <OneOffInstancesSection form={form} oneOff={oneOff} />
            ) : (
              <RecurringSlotsSection form={form} recurring={recurring} />
            )}
          </div>

          <ScheduleTargetingSection
            form={form}
            levels={levels}
            filteredGroups={filteredGroups}
            levelsLoading={levelsLoading}
            groupsLoading={groupsLoading}
            selectedLevelId={selectedLevelId}
          />

          <ScheduleBehaviorSection form={form} />

          {showInlineActions ? (
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              {onCancel ? (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "edit"
                    ? "Saving..."
                    : "Creating..."
                  : submitLabel ?? (mode === "edit" ? "Save Changes" : "Create Schedule")}
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </Form>
  );
}
