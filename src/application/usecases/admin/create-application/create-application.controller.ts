import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { CreateApplicationUsecase } from './create-application.usecase';
import { CreateApplicationDto } from './create-application.dto';
import { AdminGuard } from '../../../../infrastructure/guards/admin.guard';

@Controller('admin')
@ApiTags('Admin')
export class CreateApplicationController {
  constructor(
    private readonly createApplicationUsecase: CreateApplicationUsecase,
  ) {}

  @Post('applications')
  @UseGuards(AdminGuard)
  @ApiSecurity('x-admin-pass-key')
  @ApiOperation({
    summary: 'Create new Application',
    description:
      'Creates a new Application with automatically generated clientId and clientSecret. Requires admin pass key in header.',
  })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        name: 'My Application',
        clientId: 'abc123def456',
        clientSecret: 'def456ghi789',
        scopes: [],
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async createApplication(@Body() dto: CreateApplicationDto) {
    const application = await this.createApplicationUsecase.execute(dto);

    return {
      id: application._id,
      name: application.name,
      clientId: application.clientId,
      clientSecret: application.clientSecret,
      scopes: application.scopes,
      isActive: application.isActive,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }
}
