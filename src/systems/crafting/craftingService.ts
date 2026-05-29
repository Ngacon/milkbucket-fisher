import recipes from '../../database/seed-data/recipes.json';
import { prisma } from '../../database/prisma';

export type Recipe = {
  id: string;
  name: string;
  outputItem: string;
  outputQuantity: number;
  coins: number;
  ingredients: Array<{ type: 'fish' | 'item'; id: string; quantity: number }>;
};

export function listRecipes(): Recipe[] {
  return recipes as Recipe[];
}

export async function craft(userId: string, recipeId: string, quantity: number): Promise<Recipe> {
  const recipe = listRecipes().find((entry) => entry.id === recipeId);
  if (!recipe) throw new Error('RECIPE_NOT_FOUND');
  const cleanQuantity = Math.max(1, Math.min(50, Math.floor(quantity)));

  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUniqueOrThrow({ where: { userId } });
    const coinCost = recipe.coins * cleanQuantity;
    if (profile.coins < coinCost) throw new Error('INSUFFICIENT_FUNDS');

    for (const ingredient of recipe.ingredients) {
      const need = ingredient.quantity * cleanQuantity;
      if (ingredient.type === 'fish') {
        const fish = await tx.userFish.findUnique({
          where: { userId_fishId: { userId, fishId: ingredient.id } },
        });
        if (!fish || fish.inventoryCount < need) throw new Error('NOT_ENOUGH_INGREDIENTS');
      } else {
        const item = await tx.userItem.findUnique({
          where: { userId_itemId: { userId, itemId: ingredient.id } },
        });
        if (!item || item.quantity < need) throw new Error('NOT_ENOUGH_INGREDIENTS');
      }
    }

    await tx.profile.update({ where: { userId }, data: { coins: { decrement: coinCost } } });
    for (const ingredient of recipe.ingredients) {
      const need = ingredient.quantity * cleanQuantity;
      if (ingredient.type === 'fish') {
        await tx.userFish.update({
          where: { userId_fishId: { userId, fishId: ingredient.id } },
          data: { inventoryCount: { decrement: need } },
        });
        const records = await tx.catchRecord.findMany({
          where: { userId, fishId: ingredient.id, sold: false, listed: false },
          select: { id: true },
          take: need,
        });
        if (records.length < need) throw new Error('NOT_ENOUGH_INGREDIENTS');
        await tx.catchRecord.updateMany({
          where: { id: { in: records.map((record) => record.id) } },
          data: { sold: true },
        });
      } else {
        await tx.userItem.update({
          where: { userId_itemId: { userId, itemId: ingredient.id } },
          data: { quantity: { decrement: need } },
        });
      }
    }

    await tx.userItem.upsert({
      where: { userId_itemId: { userId, itemId: recipe.outputItem } },
      update: { quantity: { increment: recipe.outputQuantity * cleanQuantity } },
      create: {
        userId,
        itemId: recipe.outputItem,
        quantity: recipe.outputQuantity * cleanQuantity,
      },
    });
  });

  return recipe;
}

export async function consumeBait(userId: string, bait?: string): Promise<void> {
  if (!bait || bait === 'none') return;
  const item = await prisma.userItem.findUnique({
    where: { userId_itemId: { userId, itemId: bait } },
  });
  if (!item || item.quantity <= 0) throw new Error('BAIT_MISSING');
  await prisma.userItem.update({
    where: { userId_itemId: { userId, itemId: bait } },
    data: { quantity: { decrement: 1 } },
  });
}
