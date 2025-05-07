import { Controller, Get } from '@nestjs/common';
import { JobSearchService } from './job-search.service';

@Controller('job-search')
export class JobSearchController {
  constructor(private readonly jobSearchService: JobSearchService) {}

  @Get()
  getJobSearch() {
    return this.jobSearchService.getJobSearch();
  }
}
