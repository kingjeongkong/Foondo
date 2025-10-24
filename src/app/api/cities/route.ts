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

    const city = await prisma.city.upsert({
      where: { id: validatedData.mapboxId },
      update: {},
      create: {
        id: validatedData.mapboxId,
        name: validatedData.name,
        country: validatedData.country,
      },
    });

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

    console.error('Error creating/retrieving city:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create/retrieve city',
      },
      { status: 500 }
    );
  }
}
