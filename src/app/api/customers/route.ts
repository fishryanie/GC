import { getAuthSession, normalizeEmail } from 'lib/auth';
import { connectToDatabase } from 'lib/mongodb';
import { Customer } from 'models/customer';
import { NextResponse } from 'next/server';

function badRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return badRequest('Unauthorized', 401);
    }

    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      email?: string;
      notes?: string;
    };

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = normalizeEmail(String(body.email || ''));
    const notes = String(body.notes || '')
      .trim()
      .slice(0, 500);

    if (!name) {
      return badRequest('Customer name is required.');
    }

    if (!phone) {
      return badRequest('Customer phone is required.');
    }

    await connectToDatabase();

    const customer = await Customer.create({
      name,
      phone,
      email,
      notes,
      isActive: true,
    });

    return NextResponse.json({
      ok: true,
      customer: {
        id: String(customer._id),
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
        notes: customer.notes ?? '',
      },
    });
  } catch (error) {
    console.error('[api/customers:POST]', error);
    return badRequest('Unable to create customer.', 500);
  }
}
