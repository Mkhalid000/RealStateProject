import {Body, Controller, Delete, Get, Param, Patch, Post} from '@nestjs/common';
import {SearchesService} from './searches.service';
import {CreateSavedSearchDto, UpdateSavedSearchDto} from './dto/search.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';

/** Saved searches belong to the signed-in user, so every route is authenticated. */
@Controller('searches')
export class SearchesController {
  constructor(private searches: SearchesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.searches.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSavedSearchDto) {
    return this.searches.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    return this.searches.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.searches.remove(userId, id);
  }
}
