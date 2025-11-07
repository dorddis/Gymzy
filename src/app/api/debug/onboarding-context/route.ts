import { NextRequest, NextResponse } from 'next/server';
import { OnboardingContextService } from '@/services/data/onboarding-context-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const context = await OnboardingContextService.getOnboardingContext(userId);

    return NextResponse.json({
      exists: !!context,
      hasPreferences: !!context?.preferences,
      preferences: context?.preferences || null,
      goals: context?.fitnessGoals || null,
      experience: context?.experienceLevel || null
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
