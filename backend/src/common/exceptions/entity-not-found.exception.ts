import { NotFoundException } from '@nestjs/common';

export class EntityNotFoundException extends NotFoundException {
  constructor(
    public readonly errorCode: string,
    message: string,
  ) {
    super(message);
  }
}
