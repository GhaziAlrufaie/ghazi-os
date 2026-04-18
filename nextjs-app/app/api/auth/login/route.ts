import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    // التحقق من كلمة المرور فقط — من environment variable
    const validPass = process.env.LOGIN_PASSWORD;

    if (!validPass) {
      return NextResponse.json(
        { error: 'خطأ في إعداد الخادم — LOGIN_PASSWORD غير محددة' },
        { status: 500 }
      );
    }

    if (password !== validPass) {
      // تأخير بسيط لمنع brute force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // إنشاء الجلسة
    const session = await getSession();
    session.isLoggedIn = true;
    session.loginAt = new Date().toISOString();
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
