"use client";

import { useState } from "react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { Select as SelectPrimitive } from "radix-ui";
import { IconCalendarEvent, IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ScheduleFormValues } from "@/lib/schemas";
import type { Group, Level } from "@/lib/types";

import { Card } from "@/components/ui/card";

import { DAYS_OF_WEEK, DEFAULT_ONE_OFF_INSTANCE, DEFAULT_RECURRING_SLOT } from "../constants";

function DaySelectItem({
  day,
  shortcut,
  selected,
}: {
  day: (typeof DAYS_OF_WEEK)[number];
  shortcut: number;
  selected: boolean;
}) {
  return (
    <SelectPrimitive.Item
      value={day.value.toString()}
      className={cn(
        "relative flex h-9 w-full cursor-default items-center rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-highlighted:bg-foreground/10 data-disabled:pointer-events-none data-disabled:opacity-50"
      )}
    >
      <SelectPrimitive.ItemText>{day.label}</SelectPrimitive.ItemText>
      <span className="pointer-events-none absolute right-2 flex min-w-4 items-center justify-center">
        {selected ? (
          <SelectPrimitive.ItemIndicator>
            <IconCheck className="size-4" />
          </SelectPrimitive.ItemIndicator>
        ) : (
          <Kbd className="h-4 min-w-4 px-1 text-[10px] text-muted-foreground/80">
            {shortcut}
          </Kbd>
        )}
      </span>
    </SelectPrimitive.Item>
  );
}

function RecurringDaySelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={value.toString()}
      onValueChange={(nextValue) => onChange(Number.parseInt(nextValue, 10))}
    >
      <FormControl>
        <SelectTrigger className="!h-9 w-full text-sm mb-0">
          <SelectValue />
        </SelectTrigger>
      </FormControl>
      <SelectContent
        className="p-1"
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
          }

          const nextDay = Number.parseInt(event.key, 10);
          if (Number.isNaN(nextDay) || nextDay < 1 || nextDay > 7) {
            return;
          }

          const nextValue = DAYS_OF_WEEK[nextDay - 1]?.value;
          if (nextValue === undefined) {
            return;
          }

          if (nextValue === value) {
            return;
          }

          event.preventDefault();
          onChange(nextValue);

          requestAnimationFrame(() => {
            setOpen(false);
          });
        }}
      >
        {DAYS_OF_WEEK.map((day, index) => (
          <DaySelectItem
            key={day.value}
            day={day}
            shortcut={index + 1}
            selected={day.value === value}
          />
        ))}
      </SelectContent>
    </Select>
  );
}

export function ScheduleTypeSection({
  form,
}: {
  form: UseFormReturn<ScheduleFormValues>;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="schedule_type"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "recurring",
                  title: "Recurring",
                  description: "Repeats weekly",
                },
                {
                  value: "one_off",
                  title: "One-off",
                  description: "Specific dates",
                },
              ].map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "h-auto flex-col items-center gap-0 rounded-lg px-3 py-3 text-sm cursor-pointer hover:bg-primary/10",
                    field.value === option.value &&
                      "border-primary/40 bg-primary/40 hover:bg-primary/50"
                  )}
                  onClick={() => field.onChange(option.value)}
                >
                  <span className="font-medium text-base">{option.title}</span>
                  <span className="text-[11px] text-muted-foreground">{option.description}</span>
                </Card>
              ))}
            </div>
          </FormItem>
        )}
      />
    </>
  );
}

export function RecurringSlotsSection({
  form,
  recurring,
}: {
  form: UseFormReturn<ScheduleFormValues>;
  recurring: UseFieldArrayReturn<ScheduleFormValues, "recurring_slots">;
}) {
  return (
    <>
      <div className="bg-card rounded-xl">
        <div className="flex items-center justify-between px-3 h-15">
          <h3 className="text-base">Time Slots</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-0.5 px-3 text-xs"
            onClick={() => recurring.append({ ...DEFAULT_RECURRING_SLOT })}
          >
            <IconPlus className="size-3" />
            Add Slot
          </Button>
        </div>

        <Card className="pt-0 rounded-t-none">
          {recurring.fields.map((slot, index) => (
            <div
              key={slot.id}
              className={cn("flex items-end gap-1.5 px-3 pt-4 pb-0.5", index < recurring.fields.length && "border-t")}
            >
              <div className="grid w-full grid-cols-3 items-start gap-1.5">
                <FormField
                  control={form.control}
                  name={`recurring_slots.${index}.day_of_week`}
                  render={({ field }) => (
                    <FormItem className="space-y-1 mb-0">
                      <Label className="text-[11px] text-muted-foreground uppercase">Day</Label>
                      <RecurringDaySelect value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`recurring_slots.${index}.start_time`}
                  render={({ field }) => (
                    <FormItem className="space-y-1 mb-0">
                      <Label className="text-[11px] text-muted-foreground uppercase">Start</Label>
                      <FormControl>
                        <Input type="time" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`recurring_slots.${index}.end_time`}
                  render={({ field }) => (
                    <FormItem className="space-y-1 mb-0">
                      <Label className="text-[11px] text-muted-foreground uppercase">End</Label>
                      <FormControl>
                        <Input type="time" className="h-9 text-xs" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {recurring.fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-7 h-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => recurring.remove(index)}
                >
                  <IconTrash className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ))}
        </Card>
        {form.formState.errors.recurring_slots?.message ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.recurring_slots.message}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function OneOffInstancesSection({
  form,
  oneOff,
}: {
  form: UseFormReturn<ScheduleFormValues>;
  oneOff: UseFieldArrayReturn<ScheduleFormValues, "one_off_instances">;
}) {
  return (
    <>
      <div className="bg-card rounded-xl">
        <div className="flex items-center justify-between px-3 h-15">
          <div className="flex flex-col gap-0" >
          <h3 className="text-base">Instances</h3>
            <p className="text-xs text-muted-foreground -mt-0.5">
              Each instance is a specific date and time this schedule occurs.
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-0.5 px-3 text-xs"
            onClick={() => oneOff.append({ ...DEFAULT_ONE_OFF_INSTANCE })}
          >
            <IconPlus className="size-3" />
            Add Instance
          </Button>
        </div>

        

        <Card className="pt-0 rounded-t-none">
          {oneOff.fields.map((instance, index) => (
            <div
              key={instance.id}
              className={cn("flex items-end gap-1.5 px-3 pt-4 pb-0.5", index < oneOff.fields.length && "border-t")}
            >
              <div className="grid w-full grid-cols-3 items-start gap-1.5">
                <FormField
                  control={form.control}
                  name={`one_off_instances.${index}.instance_date`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground uppercase">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>  
                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 w-full justify-start px-3 text-left text-xs font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <IconCalendarEvent className="ml-auto h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`one_off_instances.${index}.start_time`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Start</Label>
                      <FormControl>
                        <Input type="time" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`one_off_instances.${index}.end_time`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">End</Label>
                      <FormControl>
                        <Input type="time" className="h-9 text-xs" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {oneOff.fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-[1px] w-7 h-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => oneOff.remove(index)}
                >
                  <IconTrash className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ))}
        </Card>
        {form.formState.errors.one_off_instances?.message ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.one_off_instances.message}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function ScheduleTargetingSection({
  form,
  levels,
  filteredGroups,
  levelsLoading,
  groupsLoading,
  selectedLevelId,
}: {
  form: UseFormReturn<ScheduleFormValues>;
  levels: Level[];
  filteredGroups: Group[];
  levelsLoading: boolean;
  groupsLoading: boolean;
  selectedLevelId: string;
}) {
  const groupSelectDisabled = groupsLoading || !selectedLevelId || filteredGroups.length === 0;

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">Targeting</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level_id"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Level</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("group_id", "");
                  }}
                  disabled={levelsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="group_id"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Group</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                  disabled={groupSelectDisabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedLevelId
                            ? "Choose a level first"
                            : filteredGroups.length === 0
                              ? "No groups available"
                              : "All Groups in this level"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">All Groups in this level</SelectItem>
                    {filteredGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          Choose a level, then optionally narrow the schedule to one of that level&apos;s groups.
        </p>
      </div>
      <Separator />
    </>
  );
}

export function ScheduleBehaviorSection({
  form,
}: {
  form: UseFormReturn<ScheduleFormValues>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium uppercase text-muted-foreground">Behavior</h3>

      <FormField
        control={form.control}
        name="auto_assign"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border border-input p-3">
            <div>
              <FormLabel className="text-sm font-medium">Auto-assign</FormLabel>
              <p className="text-[11px] text-muted-foreground">
                Auto-assign matching students to this schedule.
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    form.setValue("show_on_form", false);
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="show_on_form"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border border-input p-3">
            <div>
              <FormLabel className="text-sm font-medium">Show on Form</FormLabel>
              <p className="text-[11px] text-muted-foreground">
                Students can see and choose this during enrollment.
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
