import { PrismaClient } from '@prisma/client';
import { SEED_RULES, SEED_PRODUCTS } from '../src/data/seed-data';

const prisma = new PrismaClient();

export { SEED_RULES, SEED_PRODUCTS };

export async function main() {
  console.log('Seeding PackCheck compliance rules...');
  for (const rule of SEED_RULES) {
    await prisma.rule.upsert({
      where: { id: rule.id },
      update: rule,
      create: rule
    });
  }

  console.log(`Seeding ${SEED_PRODUCTS.length} PackCheck products...`);
  for (const p of SEED_PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { barcodeGtIN: p.barcodeGtIN }
    });

    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            brand: p.brand,
            category: p.category,
            manufacturer: p.manufacturer,
            packSize: p.packSize,
            price: p.price,
            imageUrl: p.imageUrl,
            countryOfOrigin: p.countryOfOrigin,
            sourceType: p.sourceType,
            sourceName: p.sourceName
          }
        })
      : await prisma.product.create({
          data: {
            name: p.name,
            brand: p.brand,
            category: p.category,
            manufacturer: p.manufacturer,
            barcodeGtIN: p.barcodeGtIN,
            packSize: p.packSize,
            price: p.price,
            imageUrl: p.imageUrl,
            countryOfOrigin: p.countryOfOrigin,
            sourceType: p.sourceType,
            sourceName: p.sourceName
          }
        });

    // Upsert Nutrition
    await prisma.nutrition.upsert({
      where: { productId: product.id },
      update: { ...p.nutrition, productId: product.id },
      create: { ...p.nutrition, productId: product.id }
    });

    // Upsert Ingredient
    await prisma.ingredient.upsert({
      where: { productId: product.id },
      update: {
        ingredientText: p.ingredient.ingredientText,
        allergensJson: p.ingredient.allergens
      },
      create: {
        productId: product.id,
        ingredientText: p.ingredient.ingredientText,
        allergensJson: p.ingredient.allergens
      }
    });

    // Upsert Verification Evidence
    if (p.verification) {
      const existingEvidence = await prisma.verificationEvidence.findFirst({
        where: { productId: product.id, authority: p.verification.authority }
      });
      if (existingEvidence) {
        await prisma.verificationEvidence.update({
          where: { id: existingEvidence.id },
          data: {
            identifier: p.verification.identifier,
            status: p.verification.status,
            evidenceType: p.verification.evidenceType,
            sourceUrl: p.verification.sourceUrl,
            details: p.verification.details
          }
        });
      } else {
        await prisma.verificationEvidence.create({
          data: {
            productId: product.id,
            authority: p.verification.authority,
            identifier: p.verification.identifier,
            status: p.verification.status,
            evidenceType: p.verification.evidenceType,
            sourceUrl: p.verification.sourceUrl,
            details: p.verification.details
          }
        });
      }
    }

    // Certifications
    if (p.certifications && p.certifications.length > 0) {
      for (const cert of p.certifications) {
        const existingCert = await prisma.certification.findFirst({
          where: { productId: product.id, identifier: cert.identifier }
        });
        if (!existingCert) {
          await prisma.certification.create({
            data: {
              productId: product.id,
              type: cert.type,
              identifier: cert.identifier,
              status: cert.status,
              source: cert.source
            }
          });
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
