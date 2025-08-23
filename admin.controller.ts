import { Controller, Delete, Get, Param, UseGuards, Headers, UnauthorizedException, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Response } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Delete('user/:email')
  async deleteUser(@Param('email') email: string, @Headers('x-admin-secret') adminSecret: string) {
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret || adminSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    const deleted = await this.prisma.user.delete({
      where: { email: email.toLowerCase() }
    });

    return { deleted: true, email: deleted.email };
  }

  @Get('database-viewer')
  async getDatabaseViewer(@Headers('x-admin-secret') adminSecret: string, @Res() res: Response) {
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret || adminSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const blobs = await this.prisma.blob.findMany({
      select: {
        id: true,
        key: true,
        userId: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .table th { background-color: #f8f9fa; font-weight: bold; }
            .table tr:hover { background-color: #f5f5f5; }
            .count { color: #666; font-size: 14px; }
            .timestamp { font-size: 12px; color: #888; }
            @media (max-width: 768px) {
                .table { font-size: 14px; }
                .table th, .table td { padding: 8px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🗄️ Database Viewer</h1>
                <p>Production Database - E2EE Server</p>
            </div>
            
            <div class="card">
                <h2>👥 Users <span class="count">(${users.length})</span></h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>ID</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td><strong>${user.email}</strong></td>
                                <td><code>${user.id.substring(0, 8)}...</code></td>
                                <td class="timestamp">${new Date(user.createdAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>📦 Encrypted Blobs <span class="count">(${blobs.length})</span></h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>User ID</th>
                            <th>Version</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${blobs.map(blob => `
                            <tr>
                                <td><strong>${blob.key}</strong></td>
                                <td><code>${blob.userId.substring(0, 8)}...</code></td>
                                <td>${blob.version}</td>
                                <td class="timestamp">${new Date(blob.createdAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
