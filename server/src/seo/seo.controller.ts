import {Controller, Get, Header, Query} from '@nestjs/common';
import {SeoService} from './seo.service';
import {Public} from '../common/decorators/public.decorator';

/**
 * Crawler-facing endpoints.
 *
 * The website proxies `/sitemap.xml` to here (see website/vercel.json) so the
 * sitemap is served from the site's own domain — Google ignores sitemaps hosted
 * on a different host.
 */
@Controller()
export class SeoController {
  constructor(private seo: SeoService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  sitemap(@Query('site') site?: string) {
    return this.seo.sitemap(site);
  }

  /**
   * Per-URL metadata for the prerender function, so a crawler that doesn't run
   * JavaScript still gets a real title, description and preview image.
   */
  @Public()
  @Get('meta')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
  meta(@Query('path') path: string, @Query('site') site?: string) {
    return this.seo.metaForPath(path || '/', site);
  }
}
