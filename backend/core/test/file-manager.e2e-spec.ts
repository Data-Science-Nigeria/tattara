import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { ConfigModule } from '@nestjs/config';

describe('FileManagerController (e2e)', () => {
  let app: INestApplication;
  let fileId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('should upload a file', async () => {
    const res = await request(app.getHttpServer())
      .post('/files')
      .attach('file', Buffer.from('hello world'), 'test.txt')
      .expect(201);

    const body = res.body as { id: string };
    expect(body).toHaveProperty('id');
    fileId = body.id;
  });

  it('should list all files', async () => {
    const res = await request(app.getHttpServer()).get('/files').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should switch provider', async () => {
    await request(app.getHttpServer())
      .post('/files/provider')
      .send({ provider: 'local' })
      .expect(200);
  });

  it('should delete a file', async () => {
    await request(app.getHttpServer()).delete(`/files/${fileId}`).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
