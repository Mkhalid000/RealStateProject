import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {v2 as cloudinary} from 'cloudinary';

@Injectable()
export class UploadsService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Returns params for a signed direct upload from the client. The client POSTs
   * to https://api.cloudinary.com/v1_1/<cloud>/<resource>/upload with these.
   */
  signUpload(folder = 'reels') {
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET') as string;
    const signature = cloudinary.utils.api_sign_request(
      {timestamp, folder},
      apiSecret,
    );
    return {
      timestamp,
      folder,
      signature,
      apiKey: this.config.get<string>('CLOUDINARY_API_KEY'),
      cloudName: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
    };
  }
}
