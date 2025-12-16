// Force dynamic to ensure env vars are read at runtime
export const dynamic = 'force-dynamic';

import { handlers } from "@/lib/auth-next"
export const { GET, POST } = handlers
