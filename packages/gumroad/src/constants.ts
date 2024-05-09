/**
 * Default API base url
 */
export const DEFAULT_API_BASE_URL = "https://api.gumroad.com/v2/";

/**
 * A list of resource names currently supported by gumroad
 */
export const RESOURCE_SUBSCRIPTION_NAMES = [
	"sale",
	"refund",
	"dispute",
	"dispute_won",
	"cancellation",
	"subscription_updated",
	"subscription_ended",
	"subscription_restarted"
] as const;

/**
 * A list of supported update names
 */
export const UPDATE_NAMES = [...RESOURCE_SUBSCRIPTION_NAMES, "ping"] as const;
