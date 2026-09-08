import { verifyAuth0JWT } from '../utils.js';
import { ApiError, errorResponse } from '../http.js';
import { managementRequest, managementToken } from '../management.js';

// D1 changes are atomic. Auth0 is a separate service: retain the login until
// D1 succeeds, and report Auth0 failures so a user can retry the deletion.
export async function deleteAccountData(env, userId) {
  const token = await managementToken(env);
  const tables = ['api_keys', 'device_display_settings', 'devices', 'user_settings'];
  const results = await env.DB.batch(tables.map(table =>
    env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId)
  ));
  await managementRequest(env, token, `users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  return Object.fromEntries(tables.map((table, index) => [table, results[index].meta?.changes ?? 0]));
}

export async function handleDeleteAccount(request, env) {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) throw new ApiError(401, 'Unauthorized');
    const payload = await verifyAuth0JWT(auth.slice(7), env);
    const deleted = await deleteAccountData(env, payload.sub);
    return Response.json({ success: true, deleted });
  } catch (error) {
    return errorResponse(error);
  }
}
