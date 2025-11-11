import {
  CityResponse,
  CreateCityRequest,
  createCitySchema,
} from '@/app/types/city';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(
  request: NextRequest
): Promise<NextResponse<CityResponse>> {
  try {
    const body: CreateCityRequest = await request.json();
    const validatedData = createCitySchema.parse(body);

    let city = await prisma.city.findUnique({
      where: { id: validatedData.id },
    });

    if (!city) {
      city = await prisma.city.create({
        data: {
          id: validatedData.id,
          name: validatedData.name,
          country: validatedData.country,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: city,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // 에러 상세 정보 로깅 (Vercel 로그에서 확인 가능)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Error';

    console.error('❌ Error creating/retrieving city:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      // Prisma 관련 에러인지 확인
      isPrismaError:
        errorMessage.includes('Prisma') || errorName.includes('Prisma'),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create/retrieve city',
        // Vercel에서도 에러 타입은 확인 가능하도록
        errorType: errorName,
      },
      { status: 500 }
    );
  }
}
