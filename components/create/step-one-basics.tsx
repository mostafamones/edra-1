"use client"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { ACADEMY_ICONS, ACADEMY_SUBJECTS, GENERIC_ACADEMY_WORDS } from "@/lib/constants"

interface StepOneBasicsProps {
  initialData: {
    name: string
    slug: string
    icon?: string
    subject?: string
  }
  onUpdate: (data: { name: string; slug: string; icon?: string; subject?: string }) => void
}

export function StepOneBasics({ initialData, onUpdate }: StepOneBasicsProps) {
  const [data, setData] = useState({ ...initialData, subject: initialData.subject || "" })
  const [selectedIconId, setSelectedIconId] = useState<string>(initialData.icon || 'school')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isSlugManual, setIsSlugManual] = useState(false)
  const [isOtherSubject, setIsOtherSubject] = useState(!ACADEMY_SUBJECTS.includes(initialData.subject || "") && !!initialData.subject)

  const CurrentIcon = ACADEMY_ICONS.find(i => i.id === selectedIconId)?.icon || ACADEMY_ICONS[0].icon

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newData = { ...data, [name]: value }

    if (name === "name") {
      // Auto-generate slug from name if user hasn't explicitly typed one yet
      if (!isSlugManual) {
        newData.slug = value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
      }
    }

    if (name === "slug") {
      setIsSlugManual(true)
      // Sanitize slug: only lowercase letters, numbers, and hyphens
      newData.slug = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    }

    setData(newData)
    onUpdate({ ...newData, icon: selectedIconId }) // Pass state up to parent instantly
  }

  const applySuggestion = (suggestion: string) => {
    setIsSlugManual(true)
    const newData = { ...data, slug: suggestion }
    setData(newData)
    onUpdate({ ...newData, icon: selectedIconId })
  }

  const getSuggestions = () => {
    const suggestions: string[] = []
    if (!data.name.trim()) return suggestions

    const name = data.name.trim()

    // Suggestion 1: Full name with hyphens
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    if (slug && slug.length > 2) suggestions.push(slug)

    // Suggestion 2: Compressed name (no spaces)
    const compressed = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
    if (compressed && compressed !== slug && compressed.length > 2) suggestions.push(compressed)

    // Suggestion 3: Second word logic
    const words = name.split(/\s+/).filter(w => w.length > 0)
    if (words.length >= 2) {
      const secondWord = words[1].toLowerCase().replace(/[^a-z0-9]/g, "")
      if (secondWord && !GENERIC_ACADEMY_WORDS.includes(secondWord) && secondWord.length > 2) {
        if (!suggestions.includes(secondWord)) {
          suggestions.push(secondWord)
        }
      }
    }

    // Suggestion 4: First word logic
    if (words.length >= 2) {
      const firstWord = words[0].toLowerCase().replace(/[^a-z0-9]/g, "")
      if (firstWord && !GENERIC_ACADEMY_WORDS.includes(firstWord) && firstWord.length > 2) {
        if (!suggestions.includes(firstWord)) {
          suggestions.push(firstWord)
        }
      }
    }

    // Limit to 3 unique suggestions
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
      <CardContent className="space-y-6 mt-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Academy Name</FieldLabel>
            <div className="flex w-full gap-2 items-center">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button size="icon" className="size-9 shrink-0" >
                    <CurrentIcon className="size-4.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <PopoverHeader className="px-1 py-1">
                    <PopoverTitle className="text-sm font-medium">Academy Icon</PopoverTitle>
                  </PopoverHeader>
                  <div className="grid grid-cols-5 gap-2">
                    {ACADEMY_ICONS.map((iconData) => {
                      const IconComponent = iconData.icon
                      const isSelected = selectedIconId === iconData.id
                      return (
                        <Button
                          key={iconData.id}
                          variant={isSelected ? "default" : "ghost"}
                          size="icon"
                          className="size-10"
                          onClick={() => handleIconSelect(iconData.id)}
                        >
                          <IconComponent className="size-5" />
                        </Button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
            <div className="flex w-full gap-2 items-center">
              {isOtherSubject && (
                <div className="w-full">
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Enter custom subject..."
                    value={data.subject}
                    onChange={handleChange}
                    className=""
                    maxLength={50}
                    autoFocus
                  />
                </div>
              )}
              <Select
                value={isOtherSubject ? "Other" : (data.subject || "")}
                onValueChange={(value) => {
                  if (value === "Other") {
                    setIsOtherSubject(true)
                    const newData = { ...data, subject: "" }
                    setData(newData)
                    onUpdate({ ...newData, icon: selectedIconId })
                  } else {
                    setIsOtherSubject(false)
                    const newData = { ...data, subject: value }
                    setData(newData)
                    onUpdate({ ...newData, icon: selectedIconId })
                  }
                }}
              >
                <SelectTrigger className={isOtherSubject ? 'w-[25%] shrink-0' : 'w-full'}>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMY_SUBJECTS.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>

          <FieldSeparator className="-mb-3 mt-0" variant="card">Technicals</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="slug">Academy Link</FieldLabel>
            <InputGroup>
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
                <InputGroupText>
                  edra.academy/
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            {getSuggestions().length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {getSuggestions().map((suggestion) => {

                  if (suggestion === data.slug) return null

                  return (
                    <Badge
                      key={suggestion}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  )
                }
                )}
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
