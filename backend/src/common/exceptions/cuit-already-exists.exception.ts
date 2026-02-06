import { HttpException, HttpStatus } from '@nestjs/common';

export class CuitAlreadyExistsException extends HttpException {
  public readonly errorCode: string;

  constructor(cuit: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `Sujeto with CUIT ${cuit} already exists`,
        errorCode: 'CUIT_ALREADY_EXISTS',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    this.errorCode = 'CUIT_ALREADY_EXISTS';
  }
}
