import { City, citySchema } from '@/app/types/city';
import { FoodResponse } from '@/app/types/food';
import { prisma } from '@/lib/prisma';
import { generateAndFormatLocalFoods } from '@/lib/services/aiFoodService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest
): Promise<NextResponse<FoodResponse>> {
  try {
    const body: City = await request.json();
    const validatedCityData = citySchema.parse(body);

    // 1. 먼저 DB에서 기존 음식 데이터 확인
    const existingFoods = await prisma.food.findMany({
      where: { cityId: validatedCityData.id },
    });

    // 2. 기존 데이터가 있으면 그대로 반환
    if (existingFoods.length > 0) {
      console.log(
        `✅ 기존 음식 데이터 반환: ${validatedCityData.id} (${existingFoods.length}개)`
      );
      return NextResponse.json({
        success: true,
        data: existingFoods,
        message: 'Existing food data retrieved',
      });
    }

    // 3. AI로 음식 데이터 생성
    console.log(
      `🤖 AI 음식 데이터 생성 시작: ${validatedCityData.name}, ${validatedCityData.country}`
    );
    const aiGeneratedFoods =
      await generateAndFormatLocalFoods(validatedCityData);

    // 4. 생성된 데이터를 DB에 저장하고 실제 ID 반환
    console.log(`💾 DB에 음식 데이터 저장 중: ${aiGeneratedFoods.length}개`);
    const savedFoods = await prisma.$transaction(
      aiGeneratedFoods.map((foodData) => prisma.food.create({ data: foodData }))
    );

    console.log(
      `✅ AI 생성 및 저장 완료: ${validatedCityData.id} (${savedFoods.length}개)`
    );
    return NextResponse.json({
      success: true,
      data: savedFoods,
      message: 'Food data generated and saved',
    });
  } catch (error) {
    console.error('❌ 음식 데이터 조회/생성 실패:', error);

    // AI 관련 에러인지 확인
    if (error instanceof Error && error.message.includes('AI')) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI_GENERATION_FAILED',
          message: 'Failed to generate food data using AI',
        },
        { status: 503 }
      );
    }

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
