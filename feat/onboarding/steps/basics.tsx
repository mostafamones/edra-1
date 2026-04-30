"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ACADEMY_ICONS,
  ACADEMY_SUBJECTS,
  GENERIC_ACADEMY_WORDS,
} from "@/lib/constants"
import { IconHolder } from "../components/icon-holder"
import { cn } from "@/lib/utils"

interface BasicsStepProps {
  initialData: {
    name: string
    slug: string
    icon?: string
    subject?: string
  }
  onUpdate: (data: { name: string; slug: string; icon?: string; subject?: string }) => void
}

export function BasicsStep({ initialData, onUpdate }: BasicsStepProps) {
  const [data, setData] = useState({
    ...initialData,
    subject: initialData.subject || "",
  })
  const [selectedIconId, setSelectedIconId] = useState<string>(initialData.icon || "school")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isSlugManual, setIsSlugManual] = useState(false)
  const [isOtherSubject, setIsOtherSubject] = useState(
    !ACADEMY_SUBJECTS.includes(initialData.subject || "") && !!initialData.subject
  )

  const CurrentIcon =
    ACADEMY_ICONS.find((icon) => icon.id === selectedIconId)?.icon ?? ACADEMY_ICONS[0].icon

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const nextData = { ...data, [name]: value }

    if (name === "name" && !isSlugManual) {
      nextData.slug = value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
    }

    if (name === "slug") {
      setIsSlugManual(true)
      nextData.slug = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    }

    setData(nextData)
    onUpdate({ ...nextData, icon: selectedIconId })
  }

  const applySuggestion = (suggestion: string) => {
    setIsSlugManual(true)
    const nextData = { ...data, slug: suggestion }
    setData(nextData)
    onUpdate({ ...nextData, icon: selectedIconId })
  }

  const getSuggestions = () => {
    const suggestions: string[] = []
    if (!data.name.trim()) return suggestions

    const trimmedName = data.name.trim()
    const slug = trimmedName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    if (slug && slug.length > 2) suggestions.push(slug)

    const compressed = trimmedName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
    if (compressed && compressed !== slug && compressed.length > 2) suggestions.push(compressed)

    const words = trimmedName.split(/\s+/).filter((word) => word.length > 0)

    if (words.length >= 2) {
      const secondWord = words[1].toLowerCase().replace(/[^a-z0-9]/g, "")
      if (
        secondWord &&
        !GENERIC_ACADEMY_WORDS.includes(secondWord) &&
        secondWord.length > 2 &&
        !suggestions.includes(secondWord)
      ) {
        suggestions.push(secondWord)
      }
    }

    if (words.length >= 2) {
      const firstWord = words[0].toLowerCase().replace(/[^a-z0-9]/g, "")
      if (
        firstWord &&
        !GENERIC_ACADEMY_WORDS.includes(firstWord) &&
        firstWord.length > 2 &&
        !suggestions.includes(firstWord)
      ) {
        suggestions.push(firstWord)
      }
    }

    return Array.from(new Set(suggestions)).slice(0, 3)
  }

  const handleIconSelect = (iconId: string) => {
    setSelectedIconId(iconId)
    onUpdate({ ...data, icon: iconId })
    setIsPopoverOpen(false)
  }

  return (
    <>
      <CardHeader className="text-left">
        <CardTitle className="text-2xl font-semibold">Academy Details</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Enter your academy details
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-6 space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Academy Name</FieldLabel>
            <div className="flex w-full items-center gap-2">
              <IconHolder selectedIconId={selectedIconId} onIconSelect={handleIconSelect} size="xl" selector />

              <div className="w-full">
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Acme Code School"
                  value={data.name}
                  onChange={handleChange}
                  className="h-9"
                  maxLength={50}
                />
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>

            <div className="flex w-full items-center gap-2">
              <Select
                value={isOtherSubject ? "Other" : data.subject || ""}
                onValueChange={(value) => {
                  if (value === "Other") {
                    setIsOtherSubject(true)
                    const nextData = { ...data, subject: "" }
                    setData(nextData)
                    onUpdate({ ...nextData, icon: selectedIconId })
                    return
                  }

                  setIsOtherSubject(false)
                  const nextData = { ...data, subject: value }
                  setData(nextData)
                  onUpdate({ ...nextData, icon: selectedIconId })
                }}
              >
                <SelectTrigger className={cn(isOtherSubject ? "w-[20%] shrink-0" : "w-full", "!h-9")}>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>

                <SelectContent>
                  {ACADEMY_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other...</SelectItem>
                </SelectContent>
              </Select>

              {isOtherSubject && (
                <div className="w-full">
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Enter custom subject..."
                    value={data.subject}
                    onChange={handleChange}
                    maxLength={50}
                    autoFocus
                    className="!h-9"
                  />
                </div>
              )}
            </div>
          </Field>

          <FieldSeparator className="-mb-3 mt-0">Technicals</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="slug">Academy Link</FieldLabel>

            <InputGroup className="!h-9">
              <InputGroupInput
                id="slug"
                name="slug"
                placeholder="acme"
                value={data.slug}
                onChange={handleChange}
                className="text-lg"
                maxLength={50}
              />

              <InputGroupAddon align="inline-start">
                <InputGroupText className="-mr-1 font-normal">edra.academy/</InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            {getSuggestions().length > 0 && data.slug !== getSuggestions()[0] ? (
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestions().map((suggestion) => {
                    if (suggestion === data.slug) return null

                    return (
                      <Badge
                        key={suggestion}
                        variant="secondary"
                        className="cursor-pointer transition-colors hover:bg-secondary/80"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ) : (
              <FieldDescription>
                This is your academy&apos;s unique address on the web.
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>
      </CardContent>
    </>
  )
}
