import { TestBed } from '@angular/core/testing';

import { UiHelperService } from './ui-helper.service';

describe('UiHelperService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UiHelperService = TestBed.get(UiHelperService);
    expect(service).toBeTruthy();
  });
});
