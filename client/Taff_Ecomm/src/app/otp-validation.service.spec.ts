import { TestBed } from '@angular/core/testing';

import { OtpValidationService } from '../services/otp-validation.service';

describe('OtpValidationService', () => {
  let service: OtpValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OtpValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
