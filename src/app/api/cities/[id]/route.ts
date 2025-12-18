import { CityResponse } from '@/app/types/city';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cities/[id]
 * ID로 도시 정보 조회
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
): Promise<NextResponse<CityResponse>> {
  try {
    const { id } = await params;

    const city = await prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'City not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: city,
    });
  } catch (error) {
    console.error('Error fetching city:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch city',
      },
      { status: 500 }
    );
  }
}
