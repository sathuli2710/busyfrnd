import { BadRequestException, Controller, Get, Headers, NotFoundException, Param, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { boundingBox, DEFAULT_RADIUS_KM, haversineKm, MAX_RADIUS_KM } from '@busyfrnd/shared';
import { Public } from '../common/auth';
import { PrismaService } from '../common/prisma.service';
import { itemDto, storePage, storeSummary } from '../common/mappers';

class NearQuery {
  @Type(() => Number) @IsNumber() lat: number;
  @Type(() => Number) @IsNumber() lng: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(MAX_RADIUS_KM) radius?: number;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() category?: string;
}

const channelWhere = (channel?: string) =>
  channel === 'app' ? { publishApp: true } : channel === 'web' ? { publishWeb: true } : {};

@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  private async nearbyStores(q: NearQuery, channel?: string) {
    const radius = q.radius ?? DEFAULT_RADIUS_KM;
    const bb = boundingBox(q, radius);
    const stores = await this.prisma.store.findMany({
      where: {
        status: 'PUBLISHED', ...channelWhere(channel),
        lat: { gte: bb.minLat, lte: bb.maxLat }, lng: { gte: bb.minLng, lte: bb.maxLng },
        ...(q.category ? { category: q.category } : {}),
      },
    });
    return stores
      .map((s) => ({ s, d: haversineKm(q, s) }))
      .filter((x) => x.d <= radius)
      .sort((a, b) => a.d - b.d);
  }

  @Get('stores')
  async stores(@Query() q: NearQuery, @Headers('x-channel') channel?: string) {
    const needle = q.q?.trim().toLowerCase();
    let rows = await this.nearbyStores(q, channel);
    if (needle) rows = rows.filter(({ s }) => [s.name, s.nameLocal, s.category, s.description, s.village].some((f) => f?.toLowerCase().includes(needle)));
    return rows.map(({ s, d }) => storeSummary(s, d));
  }

  /** Search products/services across all stores in range, plus matching stores. */
  @Get('search')
  async search(@Query() q: NearQuery, @Headers('x-channel') channel?: string) {
    const needle = q.q?.trim();
    if (!needle) throw new BadRequestException('q is required');
    const near = await this.nearbyStores(q, channel);
    const byId = new Map(near.map((x) => [x.s.id, x]));
    const items = await this.prisma.item.findMany({
      where: { storeId: { in: [...byId.keys()] }, archived: false, name: { contains: needle, mode: 'insensitive' } },
      take: 60,
    });
    const lower = needle.toLowerCase();
    return {
      stores: near.filter(({ s }) => [s.name, s.category, s.description].some((f) => f?.toLowerCase().includes(lower))).map(({ s, d }) => storeSummary(s, d)),
      items: items
        .map((i) => ({ ...itemDto(i), storeName: byId.get(i.storeId)!.s.name, distanceKm: Math.round(byId.get(i.storeId)!.d * 10) / 10 }))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    };
  }

  @Get('stores/:id')
  async store(@Param('id') id: string, @Headers('x-channel') channel?: string, @Query('lat') lat?: string, @Query('lng') lng?: string) {
    const s = await this.prisma.store.findFirst({ where: { id, status: 'PUBLISHED', ...channelWhere(channel) }, include: { items: { orderBy: { createdAt: 'asc' } } } });
    if (!s) throw new NotFoundException('Store not found');
    const d = lat && lng ? haversineKm({ lat: +lat, lng: +lng }, s) : undefined;
    return storePage(s, d);
  }
}
