/**
 * One-time backfill: generate unique slugs for existing case studies missing one.
 * Usage: node scripts/backfill-case-study-slugs.js
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const envPath = path.join(__dirname, '..', '.env');
const productionEnvPath = path.join(__dirname, '..', '.env.production');
if (process.env.NODE_ENV === 'production' && fs.existsSync(productionEnvPath)) {
  dotenv.config({ path: productionEnvPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const CaseStudy = require('../models/CaseStudy');

  const missing = await CaseStudy.find({ $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] });
  console.log(`Found ${missing.length} case studies missing slugs`);

  let updated = 0;
  for (const doc of missing) {
    const base = slugify(doc.title) || 'case-study';
    let slug = base;
    let counter = 1;
    while (await CaseStudy.findOne({ slug, _id: { $ne: doc._id } })) {
      counter++;
      slug = `${base}-${counter}`;
    }
    doc.slug = slug;
    await doc.save();
    updated++;
    console.log(`Updated ${doc._id} -> ${slug}`);
  }

  console.log(`Done. Updated ${updated} case studies.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
