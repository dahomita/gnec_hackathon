import { Injectable } from '@nestjs/common';
import { request } from 'undici';

@Injectable()
export class JobSearchService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.JOB_SEARCH_KEY;
    if (!apiKey) {
      throw new Error('JOB_SEARCH_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  async getJobSearch() {
    const { statusCode, body } = await request('https://api.theirstack.com/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        page: 0,
        limit: 25,
        job_country_code_or: ['US'],
        posted_at_max_age_days: 7
      })
    });
    if (statusCode !== 200) {
      throw new Error('Failed to get job search');
    }
    // Parse the response body
    const result = await body.json();
    return result;
  }
}
