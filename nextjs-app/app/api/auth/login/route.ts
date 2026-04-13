import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    // التحقق من بيانات الدخول — من environment variables فقط
    const validUser = process.env.GHAZI_LOGIN_USER;
    const validPass = process.env.GHAZI_LOGIN_PASS;

    if (!validUser || !validPass) {
      return NextResponse.json(
        { error: 'خطأ في إعداد الخادم — GHAZI_LOGIN_USER/PASS غير محددة' },
        { status: 500 }
      );
    }

    if (username !== validUser || password !== validPass) {
      // تأخير بسيط لمنع brute force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
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
