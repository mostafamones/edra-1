/**
 * Centralized constants for the Edra application.
 * This file contains all magic strings, numbers, and configuration values.
 */

import {
  IconSchool, IconBook, IconPencil, IconChalkboard, IconCertificate,
  IconTrophy, IconMicroscope, IconBriefcase, IconGlobe, IconHeart,
  IconStar, IconUsers, IconBrain, IconBulb, IconCode,
  IconMath, IconPalette, IconMusic, IconVideo, IconDeviceLaptop,
  IconBuildingBank, IconBuildingSkyscraper, IconLeaf, IconRocket, IconBooks
} from "@tabler/icons-react"

// ============================================================================
// ACADEMY DETAILS
// ============================================================================

export const ACADEMY_ICONS = [
  { id: 'school', icon: IconSchool }, { id: 'book', icon: IconBook }, { id: 'pencil', icon: IconPencil }, { id: 'chalkboard', icon: IconChalkboard }, { id: 'certificate', icon: IconCertificate },
  { id: 'trophy', icon: IconTrophy }, { id: 'microscope', icon: IconMicroscope }, { id: 'briefcase', icon: IconBriefcase }, { id: 'globe', icon: IconGlobe }, { id: 'heart', icon: IconHeart },
  { id: 'star', icon: IconStar }, { id: 'users', icon: IconUsers }, { id: 'brain', icon: IconBrain }, { id: 'bulb', icon: IconBulb }, { id: 'code', icon: IconCode },
  { id: 'math', icon: IconMath }, { id: 'palette', icon: IconPalette }, { id: 'music', icon: IconMusic }, { id: 'video', icon: IconVideo }, { id: 'laptop', icon: IconDeviceLaptop },
  { id: 'bank', icon: IconBuildingBank }, { id: 'skyscraper', icon: IconBuildingSkyscraper }, { id: 'leaf', icon: IconLeaf }, { id: 'rocket', icon: IconRocket }, { id: 'books', icon: IconBooks }
]

export const ACADEMY_SUBJECTS = [
  "Technology & Coding",
  "Languages",
  "Science",
  "Mathematics",
  "Arts & Design",
  "Business & Finance",
  "Health & Fitness"
]

export const GENERIC_ACADEMY_WORDS = [
  "academy", "school", "university", "institute", "college", 
  "center", "centre", "hub", "lab", "studio"
]

// ============================================================================
// API ROUTE PATHS
// ============================================================================

export const API_ROUTES = {
  ACADEMY: "/api/academy",
  FIELDS: "/api/fields",
  INSTRUCTORS: "/api/instructors",
  STUDENTS: "/api/students",
  STUDENTS_BULK: "/api/students/bulk",
  SCHEDULES: "/api/schedules",
  SESSIONS: "/api/sessions",
  LEVELS: "/api/levels",
  BRANCHES: "/api/branches",
} as const;

export const API_ROUTE_BY_ID = (resource: string, id: string | number) =>
  `/api/${resource}/${id}`;

export const AUTH_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CALLBACK: "/auth/callback",
} as const;

export const DASHBOARD_ROUTES = {
  HOME: "/dashboard",
  STUDENTS: "/students",
  INSTRUCTORS: "/instructors",
  SCHEDULES: "/schedules",
  SESSIONS: "/sessions",
  ASSIGNMENTS: "/assignments",
} as const;

export const SETTINGS_ROUTES = {
  ACCOUNT: "/settings/account",
  NOTIFICATIONS: "/settings/notifications",
  ACADEMY: "/settings/academy",
  ACADEMY_STRUCTURE: "/settings/academy/structure",
  ACADEMY_FORM: "/settings/academy/form",
  TEAM: "/settings/team",
  INTEGRATIONS: "/settings/integrations",
} as const;

// ============================================================================
// STATUS VALUES
// ============================================================================

export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ARCHIVED: "archived",
} as const;

export const STATUS_DISPLAY: Record<keyof typeof STATUS, string> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ARCHIVED: "archived",
};

export const isInactive = (status: string | boolean | null | undefined): boolean => {
  return status === false || status === STATUS.INACTIVE;
};

export const isActive = (status: string | boolean | null | undefined): boolean => {
  return status === true || status === STATUS.ACTIVE;
};

// ============================================================================
// USER ROLES
// ============================================================================

export const ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
} as const;

export const ROLE_ORDER: Record<string, number> = {
  [ROLE.OWNER]: 0,
  [ROLE.ADMIN]: 1,
  [ROLE.INSTRUCTOR]: 2,
};

export const getRoleOrder = (role: string): number => {
  return ROLE_ORDER[role as keyof typeof ROLE_ORDER] ?? 99;
};

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

export const SCHEDULE_TYPE = {
  RECURRING: "recurring",
  ONE_OFF: "one_off",
} as const;

export const isRecurring = (type: string): boolean => {
  return type === SCHEDULE_TYPE.RECURRING;
};

// ============================================================================
// SCHEDULE PROPERTIES
// ============================================================================

export const SCHEDULE_FLAGS = {
  IS_ACTIVE: "is_active",
  IS_MANDATORY: "is_mandatory",
  SHOW_ON_FORM: "show_on_form",
} as const;

// ============================================================================
// ENROLLMENT TYPES
// ============================================================================

export const ENROLLMENT_TYPE = {
  MANDATORY: "mandatory",
  OPTIONAL: "optional",
} as const;

// ============================================================================
// ATTENDANCE STATUS
// ============================================================================

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  EXCUSED: "excused",
  LATE: "late",
} as const;

// ============================================================================
// STUDENT STATUS
// ============================================================================

export const STUDENT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

// ============================================================================
// FIELD TYPES
// ============================================================================

export const FIELD_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  SELECT: "select",
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ACADEMY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
} as const;

export const validateEmail = (email: string): boolean => {
  return VALIDATION.EMAIL.PATTERN.test(email);
};

export const validatePasswordLength = (password: string): boolean => {
  return password.length >= VALIDATION.PASSWORD.MIN_LENGTH;
};

export const validateNameLength = (name: string): boolean => {
  return name.length >= VALIDATION.NAME.MIN_LENGTH && name.length <= VALIDATION.NAME.MAX_LENGTH;
};

// ============================================================================
// ERROR MESSAGES (i18n keys)
// ============================================================================

export const ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  VALIDATION_ERROR: "validation_error",
  INTERNAL_ERROR: "internal_error",
  NETWORK_ERROR: "network_error",
  SESSION_EXPIRED: "session_expired",
} as const;

export const ERROR_MESSAGES = {
  ACADEMY_ID_REQUIRED: "error.academyIdRequired",
  ID_REQUIRED: "error.idRequired",
  UNAUTHORIZED: "error.unauthorized",
  NOT_FOUND: "error.notFound",
  VALIDATION_FAILED: "error.validationFailed",
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  LOCALE: "edra-locale",
  THEME: "edra-theme",
  SIDEBAR_COLLAPSED: "edra-sidebar-collapsed",
} as const;

// ============================================================================
// TABLE COLUMN KEYS
// ============================================================================

export const TABLE_COLUMNS = {
  STUDENTS: ["id", "full_name", "level", "branch", "email", "status"],
  INSTRUCTORS: ["id", "name", "email", "role", "status"],
  SCHEDULES: ["id", "name", "type", "level", "branch", "is_active", "is_mandatory"],
  SESSIONS: ["id", "date", "schedule", "level", "branch", "status"],
} as const;

// ============================================================================
// DAYS OF WEEK
// ============================================================================

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAYS_OF_WEEK_SHORT = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export const getDayName = (dayIndex: number): string => {
  return DAYS_OF_WEEK[dayIndex];
};

export const getDayIndex = (dayName: typeof DAYS_OF_WEEK[number]): number => {
  return DAYS_OF_WEEK.indexOf(dayName);
};

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_FORMATS: ["csv", "json"],
  CSV_REQUIRED_COLUMNS: ["full_name", "level"],
  CSV_OPTIONAL_COLUMNS: ["branch", "schedule", "email"],
} as const;

export const MAX_FILE_SIZE = FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024; // Convert to bytes

// ============================================================================
// TOAST DURATIONS
// ============================================================================

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
} as const;

// ============================================================================
// SUPABASE QUERY PARAMS
// ============================================================================

export const SUPABASE_QUERIES = {
  ACADEMY_ID_PARAM: "academyId",
  ID_PARAM: "id",
  LIMIT_PARAM: "limit",
  OFFSET_PARAM: "offset",
  PAGE_PARAM: "page",
} as const;

// ============================================================================
// DEBOUNCE DELAYS
// ============================================================================

export const DEBOUNCE = {
  SEARCH: 300, // milliseconds
  INPUT: 200,
} as const;

// ============================================================================
// LOCALIZATION / RTL
// ============================================================================

export const RTL_LOCALES = ["ar"] as const;
export const LTR_LOCALES = ["en"] as const;
export const DEFAULT_LOCALE = "en";

export const isRTL = (locale: string): boolean => {
  return RTL_LOCALES.includes(locale as any);
};

export const getDirection = (locale: string): "rtl" | "ltr" => {
  return isRTL(locale) ? "rtl" : "ltr";
};

// ============================================================================
// EXPORT HELPER FUNCTIONS
// ============================================================================

/**
 * Get the localized status text for display
 */
export const getStatusText = (status: string): string => {
  return capitalize(status);
};

/**
 * Format a full name with proper capitalization
 */
export const formatFullName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return "";
  if (!lastName) return capitalize(firstName);
  if (!firstName) return capitalize(lastName);
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
};

function capitalize(str?: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// ============================================================================
// LEVEL COLORS
// ============================================================================

export const LEVEL_COLOR_PRESETS = [
  { id: "rose", swatchClass: "bg-rose-500" },
  { id: "orange", swatchClass: "bg-orange-500" },
  { id: "amber", swatchClass: "bg-amber-500" },
  { id: "lime", swatchClass: "bg-lime-500" },
  { id: "emerald", swatchClass: "bg-emerald-500" },
  { id: "sky", swatchClass: "bg-sky-500" },
  { id: "blue", swatchClass: "bg-blue-500" },
  { id: "violet", swatchClass: "bg-violet-500" },
  { id: "fuchsia", swatchClass: "bg-fuchsia-500" },
] as const

export const LEVEL_COLOR_BORDER_CLASS = [
  { id: "rose", borderClass: "border-l-rose-500" },
  { id: "orange", borderClass: "border-l-orange-500" },
  { id: "amber", borderClass: "border-l-amber-500" },
  { id: "lime", borderClass: "border-l-lime-500" },
  { id: "emerald", borderClass: "border-l-emerald-500" },
  { id: "sky", borderClass: "border-l-sky-500" },
  { id: "blue", borderClass: "border-l-blue-500" },
  { id: "violet", borderClass: "border-l-violet-500" },
  { id: "fuchsia", borderClass: "border-l-fuchsia-500" },
] as const

export const DEFAULT_LEVEL_COLOR_ID = LEVEL_COLOR_PRESETS[5].id
export const MAX_EXPANDED_LEVELS = 2

