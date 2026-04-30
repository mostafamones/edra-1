"use client"

import type { UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TextInput } from "@/components/ui/app-input"
import { cn } from "@/lib/utils"
import type { Group, Level, StudentField } from "@/lib/types"
import { swatchClassForColorId } from "@/components/helpers/academy-utils"

import type { StudentFormValues } from "../../utils/student-form"
import { CustomFieldInput } from "./custom-field-input"
import { FormSectionTitle } from "@/components/ui/form"

interface StudentFormContentProps {
  availableGroups: Group[]
  form: UseFormReturn<StudentFormValues>
  initialStudentId?: number
  levelId: string
  levels: Level[]
  onCancel?: () => void
  optionalFields: StudentField[]
  requiredFields: StudentField[]
  saving: boolean
}

export function StudentFormContent({
  availableGroups,
  form,
  initialStudentId,
  levelId,
  levels,
  onCancel,
  optionalFields,
  requiredFields,
  saving,
}: StudentFormContentProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 lg:px-6">
      <div className="w-full min-w-xl space-y-4">
        <div className="space-y-4">
          <FormSectionTitle>Personal Information</FormSectionTitle>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>
                  Full Name
                </FormLabel>
                <FormControl>
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    label={undefined}
                    placeholder="e.g. Mostafa Ahmed"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {requiredFields.map((field) => (
            <CustomFieldInput key={field.id} field={field} form={form} />
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <FormSectionTitle>Academic Assignment</FormSectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>
                    Level
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue("group_id", "")
                      form.setValue("enrolledScheduleIds", [], { shouldDirty: true })
                    }}
                  >
                    <FormControl>
                      <SelectTrigger id="student-level" className="w-full !h-10">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="p-1">
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()} className="h-9">
                          <>
                            <div
                              className={cn(
                                "ml-1 size-1.5 rounded-full",
                                swatchClassForColorId(level.color)
                              )}
                            />
                            {level.name}
                          </>
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
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                    disabled={!levelId || availableGroups.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger id="student-group" className="w-full !h-10">
                        <SelectValue
                          placeholder={
                            availableGroups.length === 0 ? "No groups" : "Select group"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="p-1">
                      <SelectItem value="__none__">None</SelectItem>
                      {availableGroups.map((group) => (
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
        </div>

        {optionalFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <FormSectionTitle>Optional Information</FormSectionTitle>
              {optionalFields.map((field) => (
                <CustomFieldInput key={field.id} field={field} form={form} />
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Saving..." : initialStudentId ? "Save Changes" : "Add Student"}
          </Button>
        </div>
      </div>
    </div>
  )
}

