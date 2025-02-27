import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

export const swaggerConfigInit = (app: INestApplication) => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('gym-management-nestjs')
    .setVersion('0.0.1')
    .addServer('/api/v1')
    .addBearerAuth(swaggerAuthConfig(), 'Authorization')
    .build();

  const theme = new SwaggerTheme();
  const darkThemeCss = theme.getBuffer(SwaggerThemeNameEnum.DRACULA);

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: true,
  });

  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
    customCss: darkThemeCss,
  });
};

function swaggerAuthConfig(): SecuritySchemeObject {
  return {
    scheme: 'bearer',
    type: 'http',
    in: 'header',
    bearerFormat: 'JWT',
  };
}
