import LawyerProfile from '../models/LawyerProfile.js';
import User from '../models/User.js';
import { generateUniqueSlug } from '../utils/slug.js';

/**
 * Safe, idempotent migration for existing lawyers in the database.
 * Sets profileStatus = 'published' and mustChangePassword = false
 * for all existing lawyer records that do not yet have a profileStatus.
 * Also generates SEO-friendly slugs if missing.
 * Will NEVER overwrite lawyers that already have a profileStatus.
 */
export const migrateExistingLawyers = async () => {
  try {
    const unmigrated = await LawyerProfile.find({
      $or: [
        { profileStatus: { $exists: false } },
        { profileStatus: null },
        { profileStatus: '' }
      ]
    }).populate('userId');

    let migratedCount = 0;

    for (const profile of unmigrated) {
      profile.profileStatus = 'published';
      profile.mustChangePassword = false;
      profile.approvedAt = profile.approvedAt || profile.createdAt || new Date();
      
      if (!profile.slug) {
        const name = profile.userId?.name || profile.title || 'counsel';
        profile.slug = await generateUniqueSlug(name, profile._id);
      }
      
      await profile.save();

      if (profile.userId) {
        await User.findByIdAndUpdate(profile.userId._id || profile.userId, {
          mustChangePassword: false
        });
      }
      migratedCount++;
    }

    // Ensure all existing published profiles have slugs
    const missingSlugs = await LawyerProfile.find({
      profileStatus: 'published',
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }]
    }).populate('userId');

    for (const p of missingSlugs) {
      const name = p.userId?.name || p.title || 'counsel';
      p.slug = await generateUniqueSlug(name, p._id);
      await p.save();
    }

    if (migratedCount > 0) {
      console.log(`✅ [DB Migration]: Migrated ${migratedCount} existing lawyer(s) to 'published' status.`);
    }

    const totalPublished = await LawyerProfile.countDocuments({ profileStatus: 'published' });
    return {
      success: true,
      migratedCount,
      totalPublished,
      message: `Migration completed. ${migratedCount} lawyer(s) migrated. Total published advocates: ${totalPublished}`
    };
  } catch (error) {
    console.error('❌ [DB Migration Error]:', error);
    return {
      success: false,
      migratedCount: 0,
      error: error.message
    };
  }
};
