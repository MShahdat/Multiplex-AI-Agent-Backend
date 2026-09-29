import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
import { IMeta } from '../../interface/index.js';


@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(<T>(res: { message?: string, data: T, meta?: IMeta }) => ({
        success: true,
        message: res.message,
        data: res.data,
        meta: res.meta
      }))
    );
  }
}
