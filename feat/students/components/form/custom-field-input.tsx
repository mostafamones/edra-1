"use client"

import type { FieldPath, UseFormReturn } from "react-hook-form"

import { DateInput, NumberInput, PhoneInput, TextInput } from "@/components/ui/app-input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import type { StudentField } from "@/lib/types"

import type { StudentFormValues } from "../../utils/student-form"

interface CustomFieldInputProps {
  field: StudentField
  form: UseFormReturn<StudentFormValues>
}

export function CustomFieldInput({ field, form }: CustomFieldInputProps) {
  const name = `fields.${field.id}` as FieldPath<StudentFormValues>

  switch (field.field_type) {
    case "boolean":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field: formField }) => (
            <FormItem>
              <div className="flex flex-row items-center justify-between gap-3 rounded-lg border border-input p-3">
                <FormLabel required={!!field.is_required}>
                  {field.name}
                </FormLabel>
                <FormControl>
                  <Switch checked={!!formField.value} onCheckedChange={formField.onChange} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case "number":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel required={!!field.is_required}>
                {field.name}
              </FormLabel>
              <FormControl>
                <NumberInput
                  {...formField}
                  value={formField.value ?? ""}
                  onChange={formField.onChange}
                  label={undefined}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                  required={!!field.is_required}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case "date":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel required={!!field.is_required}>
                {field.name}
              </FormLabel>
              <FormControl>
                <DateInput
                  ref={formField.ref}
                  name={formField.name}
                  value={
                    formField.value instanceof Date ||
                    typeof formField.value === "string" ||
                    formField.value == null
                      ? formField.value
                      : undefined
                  }
                  onBlur={formField.onBlur}
                  onSelect={formField.onChange}
                  label={undefined}
                  required={!!field.is_required}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case "phone":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel required={!!field.is_required}>
                {field.name}
              </FormLabel>
              <FormControl>
                <PhoneInput
                  {...formField}
                  value={formField.value ?? ""}
                  label={undefined}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                  required={!!field.is_required}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    default:
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel required={!!field.is_required}>
                {field.name}
              </FormLabel>
              <FormControl>
                <TextInput
                  ref={formField.ref}
                  name={formField.name}
                  value={typeof formField.value === "string" ? formField.value : ""}
                  onBlur={formField.onBlur}
                  onChange={formField.onChange}
                  label={undefined}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                  required={!!field.is_required}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
  }
}

