import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { isSeededIdentifier } from './demo-id.util';
import { findDemoRule } from './demo-policy';
import { DEMO_EMAIL_DOMAIN, PRIMARY_STUDENT_EMAIL, SEEDED_NUMERIC_IDS } from './demo-seed.data';

@Injectable()
export class DemoPolicyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    const rule = findDemoRule(context.getClass().name, context.getHandler().name);
    if (!rule) return next.handle();

    const blocked =
      rule.when === 'always' ||
      (rule.when === 'demo-email' && this.changesDemoEmail(request)) ||
      (rule.when === 'seeded-target' && this.targetsSeed(request)) ||
      (rule.when === 'primary-student' && request.user?.email === PRIMARY_STUDENT_EMAIL);

    if (blocked) {
      throw new AppException(
        403,
        ErrorCodes.DEMO_READ_ONLY,
        'This demo resets every 6 hours, so that change is locked. Records you create yourself can still be deleted.',
      );
    }
    return next.handle();
  }

  private changesDemoEmail(request: { user?: { email?: string }; body?: { email?: string } }): boolean {
    const current = String(request.user?.email ?? '');
    const nextEmail = request.body?.email;
    if (!current.endsWith(DEMO_EMAIL_DOMAIN) || typeof nextEmail !== 'string' || !nextEmail.trim()) return false;
    return nextEmail.trim().toLowerCase() !== current.toLowerCase();
  }

  private targetsSeed(request: { params?: Record<string, string> }): boolean {
    const params = request.params ?? {};
    return [params.id, params.bookId, params.studentId].some((value) => isSeededIdentifier(value, SEEDED_NUMERIC_IDS));
  }
}
