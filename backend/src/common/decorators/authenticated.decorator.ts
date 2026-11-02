import { SetMetadata } from '@nestjs/common';

/** Any signed-in user. Distinct from @Roles(), which names specific roles, and from @Public(). */
export const AUTHENTICATED_KEY = 'authenticated';
export const Authenticated = () => SetMetadata(AUTHENTICATED_KEY, true);
