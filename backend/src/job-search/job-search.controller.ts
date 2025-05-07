import { Controller, Get, Query } from '@nestjs/common';
import { JobSearchService } from './job-search.service';

@Controller('job-search')
export class JobSearchController {
  constructor(private readonly jobSearchService: JobSearchService) {}

  @Get()
  getJobSearch(@Query('jobType') jobType: Array<string>, @Query('remote') remote: boolean, @Query('countries') countries: Array<string>, @Query('datePosted') datePosted: number) {
    return this.jobSearchService.getJobSearch(jobType, remote, countries, datePosted);
  }
}