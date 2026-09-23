import LawyerProfile from '../models/LawyerProfile.js';

/**
 * Normalizes a name string into an SEO-friendly URL slug.
 * Strips common advocate honorifics (Adv, Advocate, Dr, Mr, etc.).
 * Example: "Adv. Mahesh Gour" -> "mahesh-gour"
 */
export const generateSlug = (name) => {
  if (!name || typeof name !== 'string') return 'counsel';

  let cleaned = name.trim().toLowerCase();
  
  // Strip common prefixes
  const prefixRegex = /^(?:advocate|adv|dr|doctor|mr|mrs|ms|shri|shree|smt|prof|professor)\.?\s+/i;
  while (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }

  // Remove non-alphanumeric characters and replace with hyphens
  let slug = cleaned
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'counsel';
};

/**
 * Generates a unique slug in the database, appending a numeric suffix if needed.
 * Example: "mahesh-gour", "mahesh-gour-2", etc.
 */
export const generateUniqueSlug = async (name, excludeProfileId = null) => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeProfileId) {
      query._id = { $ne: excludeProfileId };
    }

    const existing = await LawyerProfile.findOne(query);
    if (!existing) {
      break;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};
