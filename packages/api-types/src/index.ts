/**
 * Shared API contract types for Repose.
 *
 * The endpoint-specific request/response types are generated from the live
 * OpenAPI spec into `schema.ts` (run `pnpm --filter @repose/api-types generate`
 * after the API is running). The hand-maintained types below are the stable
 * cross-cutting contract (envelope, enums) that both API and web depend on and
 * that must stay identical across the wire.
 */

// ─────────────────────────── Response envelope ───────────────────────────

export interface ApiMeta {
  nextCursor?: string | null;
  resultCount?: number;
  unreadCount?: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  error: {
    statusCode: number;
    message: string;
    errorCode: string;
    details?: Record<string, unknown>;
  };
}

// ─────────────────────────────── Enums ───────────────────────────────
// Kept identical to the Prisma enums in apps/api/prisma/schema.prisma.

export type UserRole = "USER" | "ADMIN" | "SUPPORT";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type OtpPurpose = "SIGNUP" | "LOGIN" | "RESET_PASSWORD";

export type ListingCondition =
  | "NEW_WITH_TAGS"
  | "NEW_WITHOUT_TAGS"
  | "VERY_GOOD"
  | "GOOD"
  | "SATISFACTORY";

export type ListingStatus = "DRAFT" | "ACTIVE" | "SOLD" | "REMOVED" | "FLAGGED";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID_HELD"
  | "SHIPPED"
  | "DELIVERED"
  | "RELEASED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED";

export type PaymentStatus =
  | "REQUIRES_ACTION"
  | "AUTHORIZED"
  | "CAPTURED"
  | "RELEASED"
  | "FAILED"
  | "REFUNDED";

export type WalletTxType =
  | "SALE_CREDIT"
  | "WITHDRAWAL"
  | "COMMISSION_DEBIT"
  | "ADJUSTMENT";

export type NotificationType =
  | "NEW_MESSAGE"
  | "OFFER_RECEIVED"
  | "ITEM_SOLD"
  | "ORDER_UPDATE"
  | "SYSTEM";

// ───────────────────────── Shared list item shapes ─────────────────────────
// The single ProductCard-facing shape used across search, feed, seller listings.

export interface ProductCardItem {
  id: string;
  title: string;
  priceAed: string;
  condition: ListingCondition;
  mainImageUrl: string | null;
  isFeatured?: boolean;
  status?: ListingStatus;
}
