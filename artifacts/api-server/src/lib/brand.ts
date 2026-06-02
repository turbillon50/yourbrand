/**
 * White-label brand configuration for the API server.
 * Set these env vars in your hosting environment to customize:
 *
 *   BRAND_NAME          Display name            (e.g. "Castores")
 *   BRAND_FULL_NAME     Legal / full name       (e.g. "Castores Estructuras y Construcciones")
 *   BRAND_SLUG          Lowercase slug          (e.g. "castores")
 *   BRAND_SUPPORT_EMAIL Support / VAPID email   (e.g. "soporte@castores.info")
 *   BRAND_DOMAIN        Public domain           (e.g. "castores.info")
 */
export const brand = {
  name:         process.env["BRAND_NAME"]          ?? "YourBrand",
  fullName:     process.env["BRAND_FULL_NAME"]     ?? "YourBrand Company",
  slug:         process.env["BRAND_SLUG"]          ?? "yourbrand",
  supportEmail: process.env["BRAND_SUPPORT_EMAIL"] ?? "soporte@yourbrand.com",
  domain:       process.env["BRAND_DOMAIN"]        ?? "yourbrand.com",
} as const;
