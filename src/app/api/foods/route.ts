import { FoodResponse } from '@/app/types/food';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest
): Promise<NextResponse<FoodResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      return NextResponse.json(
        {
          success: false,
          error: 'CITY_ID_REQUIRED',
          message: 'City ID is required',
        },
        { status: 400 }
      );
    }

    const foods = await prisma.food.findMany({
      where: { cityId },
    });

    return NextResponse.json({
      success: true,
      data: foods,
    });
  } catch (error) {
    console.error('Error fetching foods:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch foods',
      },
      { status: 500 }
    );
  }
}
