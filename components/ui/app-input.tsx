import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { IconCalendar, IconMinus, IconPlus } from "@tabler/icons-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";
import { DateRange } from "react-day-picker";
import { ButtonGroup } from "./button-group";
import { cva } from "class-variance-authority";

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  required?: boolean;
  variant?: "sm" | "md" | "lg" | "xl";
}

const inputVariants = cva(
  {
    base: "h-8",
    variants: {
      variant: {
        sm: "h-6",
        md: "h-10",
        lg: "h-12",
        xl: "h-14",
      },
    },
    defaultVariants: {
      variant: "md",
    },
  }
)

export const TextInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, className, containerClassName, required, variant, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && <Label className={cn(error && "text-destructive")}>{label}{required && <span className="text-destructive -ml-1.5">*</span>}</Label>}
        <Input ref={ref} className={cn(inputVariants({ variant }), error && "border-destructive", className)} {...props} />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }
);
TextInput.displayName = "TextInput";

export const PhoneInput = React.forwardRef<HTMLInputElement, AppInputProps & { country?: string }>(
  ({ label, country = "+20", error, className, containerClassName, required, variant, ...props }, ref) => {
    function trimCode(code: string) {
      if (code.endsWith("0")) return code.slice(0, -1);
      return code;
    }

    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && <Label className={cn(error && "text-destructive")}>{label}{required && <span className="text-destructive -ml-1.5">*</span>}</Label>}
        <InputGroup className={cn(inputVariants({ variant }))}>
          <InputGroupAddon className={cn(error && "border-destructive text-destructive" )}>
            {trimCode(country)}
          </InputGroupAddon>
          <InputGroupInput ref={ref} className={cn(error && "border-destructive", className)} {...props} />
        </InputGroup>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export const NumberInput = React.forwardRef<HTMLInputElement, AppInputProps & { min?: number; max?: number; step?: number }>(
  (
    {
      label,
      error,
      variant,
      className,
      containerClassName,
      required,
      min,
      max,
      step,
      value,
      defaultValue,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const stepNum = step !== undefined ? Number(step) : 1;
    const minNum = min !== undefined ? Number(min) : undefined;
    const maxNum = max !== undefined ? Number(max) : undefined;

    const clampAndStep = React.useCallback(
      (delta: number) => {
        const el = innerRef.current;
        if (!el || disabled) return;

        const controlled = value !== undefined;
        let current: number;
        if (controlled) {
          if (value === "" || value === null) {
            current = minNum !== undefined && !Number.isNaN(minNum) ? minNum : 0;
          } else {
            current = typeof value === "number" ? value : parseFloat(String(value));
          }
        } else {
          current = parseFloat(el.value);
        }
        if (Number.isNaN(current)) {
          current = minNum !== undefined && !Number.isNaN(minNum) ? minNum : 0;
        }

        let next = current + delta * stepNum;
        if (minNum !== undefined && !Number.isNaN(minNum)) next = Math.max(minNum, next);
        if (maxNum !== undefined && !Number.isNaN(maxNum)) next = Math.min(maxNum, next);

        const str = String(next);

        if (controlled && onChange) {
          onChange({
            target: { ...el, value: str, name: el.name },
            currentTarget: el,
          } as React.ChangeEvent<HTMLInputElement>);
          return;
        }

        el.value = str;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      [value, disabled, stepNum, minNum, maxNum, onChange]
    );

    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && (
          <Label className={cn(error && "text-destructive")}>
            {label}
            {required && <span className="text-destructive -ml-1.5">*</span>}
          </Label>
        )}
        <ButtonGroup
          className={cn(
            variant === "sm" ? "h-6" : variant === "md" ? "h-8" : variant === "lg" ? "h-10" : variant === "xl" ? "h-12" : "h-10", "w-full",
            error && "border-destructive has-[[data-slot=input-group-control]:focus-visible]:border-destructive"
          )}
        >
          <Input
            ref={innerRef}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              "h-full",
              "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              error && "text-destructive",
              className
            )}
            {...props}
          />
            {[{label: "Decrease value", icon: <IconMinus className="size-3.5" />, onClick: () => clampAndStep(-1)}, {label: "Increase value", icon: <IconPlus className="size-3.5" />, onClick: () => clampAndStep(1)}].map((button) => (
              <Button
                key={button.label}
                type="button"
                variant="outline"
                size="icon"
                className={cn("aspect-square h-full min-w-10")}
                disabled={disabled}
                aria-label={button.label}
                onClick={(e) => {
                  e.preventDefault();
                  button.onClick();
                }}
              >
                {button.icon}
              </Button>
            ))}
        </ButtonGroup>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export type DateInputProps = {
  label?: string;
  value?: Date | string | null;
  onSelect: (date: Date | undefined) => void;
  /** When used with react-hook-form, map `field.onChange` to `onSelect` or pass both. */
  onChange?: (date: Date | undefined) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  containerClassName?: string;
  /** Matches TextInput / NumberInput sizing (trigger uses button + input styles). */
  variant?: "sm" | "md" | "lg" | "xl";
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type" | "children" | "value"
>;

export const DateInput = React.forwardRef<HTMLButtonElement, DateInputProps>(
  (
    {
      label,
      value,
      onSelect,
      onChange,
      error,
      placeholder = "Pick a date",
      required,
      variant,
      className,
      containerClassName,
      disabled,
      name,
      ...buttonProps
    },
    ref
  ) => {
    const dateValue = value ? new Date(value) : undefined;

    const handleSelect = (date: Date | undefined) => {
      onSelect(date);
      onChange?.(date);
    };

    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && (
          <Label className={cn(error && "text-destructive")}>
            {label}
            {required && <span className="text-destructive -ml-1.5">*</span>}
          </Label>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              type="button"
              name={name}
              disabled={disabled}
              className={cn(
                inputVariants({ variant }),
                "w-full justify-start text-left font-medium px-3 gap-2 text-base",
                !dateValue && "text-muted-foreground",
                error && "border-destructive text-destructive",
                className
              )}
              {...buttonProps}
            >
              <IconCalendar className={variant === "sm" ? "size-3" : variant === "md" ? "size-3.5" : variant === "lg" ? "size-4" : "size-4.5"} />
              {dateValue ? format(dateValue, "MMM d, yyyy") : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelect}
              initialFocus
              captionLayout={"dropdown"}
            />
          </PopoverContent>
        </Popover>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export interface DateRangeInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'value'> {
  label?: string;
  value?: DateRange | undefined;
  onSelect: (date: DateRange | undefined) => void;
  error?: string;
  placeholder?: string;
  numberOfMonths?: number;
  required?: boolean;
}

export function DateRangeInput({
  label,
  value,
  onSelect,
  error,
  placeholder = "Pick a date range",
  numberOfMonths = 2,
  className,
  required,
  ...props
}: DateRangeInputProps) {
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)} {...props}>
      {label && <Label className={cn(error && "text-destructive")}>{label}{required && <span className="text-destructive -ml-1.5">*</span>}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal px-3",
              !value && "text-muted-foreground",
              error && "border-destructive text-destructive"
            )}
            id="date_range"
          >
            <IconCalendar className="mr-2 size-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "MMM d, yyyy")} - {format(value.to, "MMM d, yyyy")}
                </>
              ) : (
                format(value.from, "MMM d, yyyy")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onSelect}
            numberOfMonths={numberOfMonths}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}